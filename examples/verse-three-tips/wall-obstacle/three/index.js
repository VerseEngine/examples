import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { setupVerse } from "./setup-verse";

function setupScene(ticks) {
  const renderer = new THREE.WebGLRenderer();
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  if ("xr" in navigator) {
    navigator.xr.isSessionSupported("immersive-vr").then(function (supported) {
      if (supported) {
        renderer.xr.enabled = true;

        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape") {
            if (renderer.xr.isPresenting) {
              renderer.xr.getSession()?.end();
            }
          }
        });
        const vrButton = VRButton.createButton(renderer);
        document.body.appendChild(vrButton);
      }
    });
  } else {
    if (window.isSecureContext === false) {
      console.warn("webxr needs https");
    } else {
      console.warn("webxr not available");
    }
  }

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0.0, 1.6, 0);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(0, 10, -10).normalize();
  scene.add(light);

  {
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    const sun = new THREE.Vector3();
    sun.setFromSphericalCoords(
      1,
      THREE.MathUtils.degToRad(60),
      THREE.MathUtils.degToRad(180)
    );
    sky.material.uniforms["sunPosition"].value.copy(sun);
  }
  let ground;
  {
    ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50, 1, 1),
      new THREE.MeshLambertMaterial({
        color: 0x5e5e5e,
      })
    );
    ground.rotation.x = Math.PI / -2;
    scene.add(ground);
  }
  scene.add(new THREE.GridHelper(50, 50));

  ticks ||= [];
  const clock = new THREE.Clock();
  const animate = () => {
    const dt = clock.getDelta();
    ticks.forEach((f) => f(dt));
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(animate);

  return { scene, renderer, camera, ground };
}

function main() {
  const ticks = [];
  const { scene, renderer, camera, ground } = setupScene(ticks);
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(5, 4, 2),
    new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      color: 0xff6347,
    })
  );
  wall.position.set(-2, 0, -5);
  const ground1 = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.5, 2),
    new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      color: 0x9acd32,
    })
  );
  ground1.position.set(2, 0.25, -4);
  const ground2 = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.5, 2),
    new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      color: 0x9acd32,
    })
  );
  ground2.position.set(4, 0.75, -4);
  scene.add(wall, ground1, ground2);

  camera.position.set(0.0, 1.6, 0);
  const cameraContainer = new THREE.Object3D();
  cameraContainer.add(camera);
  const player = new THREE.Object3D();
  player.add(cameraContainer);
  scene.add(player);

  const collisionObjects = [wall];
  const teleportTargetObjects = [ground, ground1, ground2];
  const collisionBoxes = [...collisionObjects, ...teleportTargetObjects].map(
    (o) => new THREE.Box3().setFromObject(o)
  );

  setupVerse(
    scene,
    renderer,
    camera,
    cameraContainer,
    player,
    collisionBoxes,
    collisionObjects,
    teleportTargetObjects
  ).then((tick) => {
    ticks.push(tick);
  });
}

main();
