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

  camera.position.set(0.0, 1.6, 0);
  const cameraContainer = new THREE.Object3D();
  cameraContainer.add(camera);
  const player = new THREE.Object3D();
  player.add(cameraContainer);
  scene.add(player);

  const collisionObjects = [];
  const teleportTargetObjects = [ground];
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
  ).then(({ tick, adapter, player }) => {
    ticks.push(tick);
    setupTextForm(player, adapter);
  });
}
function setupTextForm(player, adapter) {
  const textOut = document.querySelector("#text-out");
  document.querySelector("input[name='nickname']").value =
    localStorage.nickname || "";

  const outputMessage = (data) => {
    const nickname = data.nickname.trim();
    const message = data.message.trim();
    if (nickname !== "" && message !== "") {
      textOut.value += `${nickname}: ${message}\n`;
    }
  };

  document.querySelector("#text-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    localStorage.nickname = data.nickname;
    player.setTextData(JSON.stringify({ textMessage: data }));
    outputMessage(data);
  });
  adapter.addTextDataChangedListener((otherPerson, textData) => {
    const data = JSON.parse(textData)?.textMessage;
    outputMessage(data);
  });
}

main();
