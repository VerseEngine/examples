(() => {
  const { VerseThree, THREE } = window;
  const VERSE_WASM_URL =
    "https://cdn.jsdelivr.net/npm/@verseengine/verse-three@1.0.6/dist/verse_core_bg.wasm";
  const ENTRANCE_SERVER_URL = "https://entrance.verseengine.cloud";
  const ANIMATION_MAP = {
    idle: "../asset/animation/idle.fbx",
    walk: "../asset/animation/walk.fbx",
  };
  const ICE_SERVERS = [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
  ];
  const PRESET_AVATARS = [
    ...[...Array(3).keys()].map((i) => `f${i}`),
    ...[...Array(3).keys()].map((i) => `m${i}`),
  ].map((n) => ({
    thumbnailURL: `../asset/avatar/${n}.png`,
    avatarURL: `../asset/avatar/${n}.vrm`,
  }));
  const DEFAULT_AVATAR_URL =
    PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].avatarURL;

  async function waitForAframeLoad(scene) {
    if (scene.hasLoaded) {
      return;
    }
    return new Promise((resolve) =>
      scene.addEventListener("loaded", () => {
        resolve();
      })
    );
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
    // scene.renderer.debug.checkShaderErrors = false;
    await Promise.all([
      (async () => {
        const scene = document.querySelector("a-scene");
        console.log("wait for scene loaded...");
        await waitForAframeLoad(scene);
        console.log("scene loaded");

        let collisionObjects = [];
        let teleportTargetObjects = [];
        let interactableObjects = [];
        let collisionBoxes = [];

        const adapter = new VerseThree.AFrameEnvAdapter(
          scene,
          document.getElementById("headOffset").object3D,
          document.getElementById("cameraRig").object3D,
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
            isLowSpecMode: VerseThree.isLowSpecDevice(),
          }
        );

        const updateCollisionBoxes = () => {
          collisionBoxes = [];
          [...collisionObjects, ...teleportTargetObjects].map((el) => {
            el.traverse((c) => {
              if (!c.isMesh) {
                return;
              }
              collisionBoxes.push(new THREE.Box3().setFromObject(c));
            });
          });
        };
        const updateCollisionObjects = () => {
          collisionObjects = Array.from(
            scene.querySelectorAll(".collider,.wall")
          )
            .map((v) => v.object3D)
            .filter((v) => v.visible);
          teleportTargetObjects = Array.from(
            scene.querySelectorAll(".ground,.environmentGround")
          )
            .map((v) => v.object3D)
            .filter((v) => v.visible);
          interactableObjects = Array.from(scene.querySelectorAll(".clickable"))
            .map((v) => v.object3D)
            .filter((v) => v.visible);
          updateCollisionBoxes();
        };
        scene.object3D.updateMatrixWorld();
        updateCollisionObjects();

        const setBgmVolumeOne = (el, volume) => {
          if (el.components["stream-sound"]) {
            el.setAttribute("stream-sound", "volume", volume);
          }
          if (el.components["sound"]) {
            el.setAttribute("sound", "volume", volume);
          }
        };
        const setBgmVolume = (value) => {
          // value = value ** 3 * 0.3;
          document
            .querySelectorAll("[stream-sound],[sound]")
            .forEach((el) => setBgmVolumeOne(el, value));
        };

        const res = await VerseThree.start(
          adapter,
          scene.object3D,
          VERSE_WASM_URL,
          ENTRANCE_SERVER_URL,
          DEFAULT_AVATAR_URL,
          ANIMATION_MAP,
          ICE_SERVERS,
          {
            maxNumberOfPeople: adapter.isLowSpecMode() ? 5 : 10,
            maxNumberOfParallelFileTransfers: adapter.isLowSpecMode() ? 2 : 4,
            setBgmVolume,
            isCrossOriginBGM: true,
            presetAvatars: PRESET_AVATARS,
          }
        );
        window._debugVerse = res;
        const guiHandlers = res.guiHandlers;
        setBgmVolume(guiHandlers.getBgmVolume());

        // @see src/components/extend-animation-loop.ts
        window.__extendAnimationLoop = (_time, timeDelta) => {
          res.tick(timeDelta / 1000);
        };

        const observer = new MutationObserver((mutationList) => {
          scene.object3D.updateMatrixWorld();
          updateCollisionObjects();

          mutationList.forEach((mutation) => {
            if (mutation.type !== "childList") {
              return;
            }
            mutation.addedNodes.forEach((v) => {
              const el = v;
              if (!el.object3D) {
                return;
              }
              if (el.isPlaying) {
                setBgmVolumeOne(el, guiHandlers.getBgmVolume());
              } else {
                el.addEventListener("play", () => {
                  setBgmVolumeOne(el, guiHandlers.getBgmVolume());
                });
              }
            });
          });
        });
        observer.observe(scene, {
          childList: true,
          attributes: true,
          subtree: true,
        });
      })(),
    ]);
  }
})();
