import type { AFrame } from "aframe";
declare const AFRAME: AFrame;

declare global {
  interface Window {
    __extendAnimationLoop: (time: number, timeDelta: number) => void;
    // Frame rate can be monitored with Chrome's Live Expression, etc.
    _fps: number;
  }
}

if (!window.__extendAnimationLoop) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  window.__extendAnimationLoop = () => {};
  window._fps = 0;
}

let prevTime = performance.now();
let frames = 0;

AFRAME.registerSystem("extend-animation-loop", {
  tick: function (time, timeDelta) {
    window.__extendAnimationLoop(time, timeDelta);

    frames++;
    if (time >= prevTime + 1000) {
      window._fps = (frames * 1000) / (time - prevTime);
      prevTime = time;
      frames = 0;
    }
  },
});
