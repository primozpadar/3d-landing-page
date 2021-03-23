import "./style.css";
import {
  TextureLoader,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  ReinhardToneMapping,
  Group,
  PlaneBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  AmbientLight,
  Vector2,
  Clock,
} from "three";
import { GUI } from "dat.gui";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

// UI
const gui = new GUI();
gui.hide();

// Textures
import displacementSrc from "./static/displacement.png";
import alphaSrc from "./static/alpha.png";
const loader = new TextureLoader();
const displacementMap = loader.load(displacementSrc);
const alphaMap = loader.load(alphaSrc);

// Scene & Camera
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 20);
camera.position.z += 5;

const canvas = document.querySelector("#webgl");
const renderer = new WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("#010203");
renderer.toneMapping = ReinhardToneMapping;
renderer.toneMappingExposure = 2;

// Objects
const group = new Group();
const geometry = new PlaneBufferGeometry(25, 25, 15, 15);

const matSettings = {
  wireframe: true,
  alphaMap,
  transparent: true,
  displacementMap,
  displacementScale: 8,
};

const material = new MeshStandardMaterial({ color: 0xff0000, ...matSettings });
const material2 = new MeshStandardMaterial({ color: 0x00ff7b, opacity: 0.5, ...matSettings });

const planeParams = {
  rotationMultiplier: 4,
  heightMultipiler: 8,
  initialHeight: 3.4,
};

const movementFolder = gui.addFolder("Movement");
movementFolder.add(planeParams, "rotationMultiplier").min(1).max(10);
movementFolder.add(planeParams, "heightMultipiler").min(1).max(20);
movementFolder.add(planeParams, "initialHeight").min(1).max(20);

const plane = new Mesh(geometry, material);
const plane2 = new Mesh(geometry, material2);
group.add(plane, plane2);

plane.position.z -= 1;
plane2.rotation.z += 0.1;

group.position.set(4, -2, -2);
group.rotation.set(-1, 0, -0.4);

const positionFolder = gui.addFolder("Position");
positionFolder.add(group.position, "x").min(-20).max(20);
positionFolder.add(group.position, "y").min(-20).max(20);
positionFolder.add(group.position, "z").min(-20).max(20);

scene.add(group);

let rotationSpeed = 1;
function userInteraction(x, y) {
  rotationSpeed = ((x + 1) * planeParams.rotationMultiplier) / window.innerWidth;

  const scale = (y * planeParams.heightMultipiler) / window.innerHeight + planeParams.initialHeight;
  material.displacementScale = scale;
  material2.displacementScale = scale;
}

window.addEventListener("mousemove", e => userInteraction(e.clientX, e.clientY));

window.addEventListener("touchmove", e => {
  const { clientX, clientY } = e.touches[0];
  userInteraction(clientX, clientY);
});

// Light
const ambientLight = new AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Bloom
const bloomParams = {
  bloomStrength: 3,
  bloomThreshold: 0,
  bloomRadius: 0.2,
};
const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight));
bloomPass.threshold = bloomParams.bloomThreshold;
bloomPass.strength = bloomParams.bloomStrength;
bloomPass.radius = bloomParams.bloomRadius;

const composer = new EffectComposer(renderer);
const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const bloomFolder = gui.addFolder("Bloom");

bloomFolder
  .add(bloomParams, "bloomRadius")
  .min(0)
  .max(1)
  .step(0.01)
  .onChange(value => (bloomPass.radius = Number(value)));

bloomFolder
  .add(bloomParams, "bloomThreshold")
  .min(0)
  .max(1)
  .onChange(value => (bloomPass.threshold = Number(value)));

bloomFolder
  .add(bloomParams, "bloomStrength")
  .min(0)
  .max(3)
  .onChange(value => (bloomPass.strength = Number(value)));

// Window resize handler
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  composer.setSize(w, h);

  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

// Animate
const clock = new Clock();
const tick = () => {
  group.rotation.z += 0.2 * clock.getDelta() * rotationSpeed;
  composer.render();
  requestAnimationFrame(tick);
};
tick();
