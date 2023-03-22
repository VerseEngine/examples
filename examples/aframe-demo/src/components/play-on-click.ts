import type { AFrame } from "aframe";
import type Hls from "hls.js";
declare const AFRAME: AFrame;
declare global {
  interface Window {
    Hls: typeof Hls;
  }
}
import { fetchScript } from "./util";

const HLS_JS_URL = "https://cdn.jsdelivr.net/npm/hls.js@1.3.3/dist/hls.min.js";

const isSafari = (() => {
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    ua.includes("safari") && !ua.includes("chrome") && !ua.includes("edge")
  );
})();

AFRAME.registerComponent("play-on-click", {
  _isHlsLoad: false,
  _isPlay: false,
  _hls: undefined as Hls | undefined,
  _currentSrc: "",
  init: function () {
    this.onClick = this.onClick.bind(this);
    this._fetchHlsIfNeeded();
  },
  update: function () {
    this._fetchHlsIfNeeded();
  },
  _fetchHlsIfNeeded: function () {
    if (!this._isHlsLoad && isHls(this.el.getAttribute("material")?.src)) {
      this._isHlsLoad = true;
      fetchScript(HLS_JS_URL);
    }
  },
  play: function () {
    window.addEventListener("click", this.onClick);
    window.addEventListener("touchend", this.onClick);
  },
  pause: function () {
    window.removeEventListener("click", this.onClick);
    window.removeEventListener("touchend", this.onClick);
  },
  remove: function () {
    this.pause();
  },
  onClick: function (_evt: Event) {
    if (this._isPlay) {
      return;
    }

    const videoEl = this.el.getAttribute("material")?.src;
    if (videoEl) {
      const hlsSrc = getHlsSrc(videoEl);
      if (hlsSrc) {
        if (isSafari) {
          videoEl.setAttribute("src", hlsSrc);
        } else {
          if (!window.Hls) {
            return;
          }
          const hls = new window.Hls();
          this._hls;
          hls.loadSource(hlsSrc);
          hls.attachMedia(videoEl);
        }
      }
      this.el.object3D.visible = true;
      videoEl.play();
      this._isPlay = true;
      this._currentSrc = videoEl.src;

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "material"
          ) {
            const videoEl = this.el.getAttribute("material")?.src;
            if (videoEl.src !== this._currentSrc) {
              const hlsSrc = getHlsSrc(videoEl);
              if (hlsSrc) {
                if (isSafari) {
                  videoEl.setAttribute("src", hlsSrc);
                } else {
                  if (!window.Hls) {
                    return;
                  }
                  this._hls?.destroy();
                  const hls = new window.Hls();
                  this._hls = hls;
                  hls.loadSource(hlsSrc);
                  hls.attachMedia(videoEl);
                }
              }
            }
            videoEl.play();
            this._currentSrc = videoEl.src;
          }
        });
      });

      observer.observe(this.el, {
        attributes: true, //configure it to listen to attribute changes
      });
    }
    if (this.el.components["stream-sound"]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.el.components["stream-sound"] as any).playSound?.();
      this._isPlay = true;
    }
    if (this.el.components["sound"]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.el.components["sound"] as any).playSound?.();
      this._isPlay = true;
    }
  },
});

function isHls(el: HTMLElement | undefined): boolean {
  return !!getHlsSrc(el);
}
function getHlsSrc(el: HTMLElement | undefined): string | undefined {
  if (!el) {
    return;
  }
  return el.dataset.hlsSrc;
}
