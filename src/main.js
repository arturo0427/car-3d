import './style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  color,
  fog,
  float,
  positionWorld,
  triNoise3D,
  positionView,
  normalWorld,
  uniform,
} from 'three/tsl';

const scene = new THREE.Scene();
scene.background = new THREE.Color('lightgray');
const canvas = document.getElementById('bg-canvas');

// ─────────────────────────────────────
// 🎥 CAMERA CONFIG
// ─────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// ─────────────────────────────────────
// 🖥️ RENDERER AND CANVAS
// ─────────────────────────────────────

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: false,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// ─────────────────────────────────────
// 🧭 ORBIT CONTROLS
// ─────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// ─────────────────────────────────────
// 💡 LIGHTS
// ─────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 1));

const frontLight = new THREE.DirectionalLight(0xffffff, 15);
frontLight.position.set(0, 5, 10);
scene.add(frontLight);

// ─────────────────────────────────────
// 📦 CARGA DE MODELO GLTF
// ─────────────────────────────────────
const loader = new GLTFLoader();
let model;

loader.load('public/object-3d/bmw/scene.gltf', (gltf) => {
  model = gltf.scene;
  model.scale.set(100, 100, 100);
  scene.add(model);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const min = box.min;
  model.position.y -= min.y;

  // Calculate position camera
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.5;
  camera.position.set(0, 2, cameraZ);
  camera.lookAt(0, 0, 0);

  const helper = new THREE.BoxHelper(model, 0xff0000);
  scene.add(helper);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
});

//HUMO

const skyColor = color(0xf0f5f5);
const groundColor = color(0xd0dee7);
const alpha = 0.98;

const fogNoiseDistance = positionView.z
  .negate()
  .smoothstep(0, camera.far - 300);

const distance = fogNoiseDistance.mul(20).max(4);

const groundFogArea = float(distance)
  .sub(positionWorld.y)
  .div(distance)
  .pow(3)
  .saturate()
  .mul(alpha);

const timer = uniform(0).onFrameUpdate((frame) => frame.time);

const fogNoiseA = triNoise3D(positionWorld.mul(0.005), 0.2, timer);
const fogNoiseB = triNoise3D(positionWorld.mul(0.01), 0.2, timer.mul(1.2));

const fogNoise = fogNoiseA.add(fogNoiseB).mul(groundColor);
scene.fogNode = fog(
  fogNoiseDistance.oneMinus().mix(groundColor, fogNoise),
  groundFogArea
);
scene.backgroundNode = normalWorld.y.max(0).mix(groundColor, skyColor);

// ─────────────────────────────────────
// 🎥 HELPERS
// ─────────────────────────────────────

const size = 5;
const divisions = 15;
const gridHelper = new THREE.GridHelper(size, divisions);
scene.add(gridHelper);

const helper = new THREE.DirectionalLightHelper(frontLight, 5);
scene.add(helper);

// ─────────────────────────────────────
// 🌀 ANIMACIÓN
// ─────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
