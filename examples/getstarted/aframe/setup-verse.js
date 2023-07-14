(() => {
  const { VerseThree, THREE } = window;
  const VERSE_WASM_URL =
    "https://cdn.jsdelivr.net/npm/@verseengine/verse-three@1.0.7/dist/verse_core_bg.wasm";
  const ENTRANCE_SERVER_URL = "https://entrance.verseengine.cloud";
  const ANIMATION_MAP = {
    idle: "../../asset/animation/idle.fbx",
    walk: "../../asset/animation/walk.fbx",
  };
  const range = (n) => [...Array(n).keys()];
  const PRESET_AVATARS = [
    ...range(3).map((i) => `f${i}`),
    ...range(3).map((i) => `m${i}`),
  ].map((n) => ({
    thumbnailURL: `../../asset/avatar/${n}.png`,
    avatarURL: `../../asset/avatar/${n}.vrm`,
  }));
  const DEFAULT_AVATAR_URL =
    PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].avatarURL;
  const ICE_SERVERS = [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
  ];

  async function waitForAframeLoad(scene) {
    if (scene.hasLoaded) {
      return;
    }
    return new Promise((resolve) => scene.addEventListener("loaded", resolve));
  }

  main();

  function main() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", _main);
    } else {
      _main();
    }
  }

  async function _main() {
    const scene = document.querySelector("a-scene");
    await waitForAframeLoad(scene);

    let collisionObjects = [];
    let teleportTargetObjects = [];
    let interactableObjects = [];
    let collisionBoxes = [];

    const updateCollisionBoxes = () => {
      collisionBoxes.length = 0;
      [...collisionObjects, ...teleportTargetObjects].map((el) => {
        el.traverse((c) => {
          if (!c.isMesh) {
            return;
          }
          collisionBoxes.push(new THREE.Box3().setFromObject(c));
        });
      });
    };
    const queryObjects = (q) =>
      [...scene.querySelectorAll(q)]
        .map((v) => v.object3D)
        .filter((v) => v.visible);
    const updateCollisionObjects = () => {
      collisionObjects = queryObjects(".collider,.wall");
      teleportTargetObjects = queryObjects(".ground,.environmentGround");
      interactableObjects = queryObjects(".clickable");
      updateCollisionBoxes();
    };
    scene.object3D.updateMatrixWorld();
    updateCollisionObjects();

    const adapter = new VerseThree.AFrameEnvAdapter(
      scene,
      document.getElementById("headOffset").object3D,
      document.getElementById("player").object3D,
      () => collisionBoxes,
      () => collisionObjects,
      () => teleportTargetObjects,
      {
        getInteractableObjects: () => interactableObjects,
        onSelectDown: (o, _point) => {
          if (!o.el || !o.el.classList.contains("clickable")) {
            return;
          }
          o.el.emit("click", {
            intersectedEl: o.el,
          });
        },
        isLowSpecMode: true,
      }
    );
    const mayBeLowSpecDevice = VerseThree.isLowSpecDevice();
    const res = await VerseThree.start(
      adapter,
      scene.object3D,
      VERSE_WASM_URL,
      ENTRANCE_SERVER_URL,
      DEFAULT_AVATAR_URL,
      ANIMATION_MAP,
      ICE_SERVERS,
      {
        maxNumberOfPeople: mayBeLowSpecDevice ? 8 : 16,
        maxNumberOfParallelFileTransfers: mayBeLowSpecDevice ? 1 : 4,
        presetAvatars: PRESET_AVATARS,
      }
    );

    // @see index.html/extend-animation-loop
    window.__extendAnimationLoop = (_time, timeDelta) => {
      res.tick(timeDelta / 1000);
    };
  }
})();
