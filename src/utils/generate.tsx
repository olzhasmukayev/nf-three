import * as THREE from "three";
//@ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export const generate = () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  const canvas = document.getElementById("scene");
  //@ts-ignore
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.autoRotate = true;
  orbit.autoRotateSpeed = 3.5;
  orbit.enabled = false;
  orbit.enableZoom = false;

  camera.position.z = 100;
  camera.position.y = 80;
  camera.position.x = 70;
  camera.lookAt(0, 0, 0);

  return { scene, renderer, orbit, camera };
};
