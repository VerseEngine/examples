import type { AFrame } from "aframe";
declare const AFRAME: AFrame;
import type * as threeTypes from "three";
import type Stats from "three/examples/jsm/libs/stats.module";
declare const THREE: typeof threeTypes;

declare global {
  interface Window {
    Stats: typeof Stats;
  }
}
import { fetchScript } from "./util";

const STATS_URL =
  "https://cdn.jsdelivr.net/npm/super-three@0.147.1/examples/js/libs/stats.min.js";

AFRAME.registerComponent("stats-hud", {
  _stats: undefined as Stats | undefined,
  init: function () {
    (async () => {
      let camera;
      while (!(camera = AFRAME.scenes?.[0]?.camera)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const renderer = AFRAME.scenes[0].renderer;
      const stats = await createStats();
      this._stats = stats.stats;
      document.body.appendChild(stats.stats.dom);
      stats.object3D.position.set(-0.5, -0.3, -1.5);
      stats.object3D.scale.set(0.003, 0.003, 0.003);
      camera.add(stats.object3D);
      stats.object3D.visible = false;
      renderer.xr.addEventListener("sessionstart", () => {
        stats.object3D.visible = true;
      });
      renderer.xr.addEventListener("sessionend", () => {
        stats.object3D.visible = false;
      });
    })();
  },
  tick: function () {
    this._stats?.update();
  },
});

async function createStats() {
  if (!window.Stats) {
    await fetchScript(STATS_URL);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats: Stats = new (window.Stats as any)();
  const canvas = stats.dom.children[0] as HTMLCanvasElement;
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(
      canvas.width * window.devicePixelRatio,
      canvas.height * window.devicePixelRatio
    ),
    new THREE.MeshBasicMaterial()
  );
  panel.name = "stats";
  const textureLoader = new THREE.TextureLoader();

  const updateMesh = () => {
    const img = canvas.toDataURL("image/png");
    textureLoader.load(img, (v) => {
      panel.material.map?.dispose();
      panel.material.map = v;
      panel.material.needsUpdate = true;
    });
  };
  setInterval(updateMesh, 1000);

  return {
    object3D: panel,
    stats,
  };
}
