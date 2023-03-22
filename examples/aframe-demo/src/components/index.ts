import type { Scene } from "aframe";

import "./extend-animation-loop";
import "./stream-sound";
import "./play-on-click";
import "./stats-hud";

import { lazyLoadAframeObjects } from "./util";

(() => {
  const f = async () => {
    const scene = document.querySelector("a-scene") as Scene;

    scene.setAttribute("vr-mode-ui", {
      // WebVR will be unstable, so only WebXR will be supported.
      enabled: !!navigator.xr,
    });
    await lazyLoadAframeObjects(scene);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", f);
  } else {
    f();
  }
})();
