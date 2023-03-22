import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
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

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0.0, 1.6, 0);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 1.0));

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

  camera.position.set(0.0, 1.6, 0);
  const cameraContainer = new THREE.Object3D();
  cameraContainer.add(camera);
  const player = new THREE.Object3D();
  player.add(cameraContainer);
  scene.add(player);

  const teleportTargetObjects = [ground];
  const collisionBoxes = [new THREE.Box3().setFromObject(ground)];

  setupVerse(
    scene,
    renderer,
    camera,
    cameraContainer,
    player,
    collisionBoxes,
    teleportTargetObjects
  ).then((tick) => {
    ticks.push(tick);
  });
}

main();
