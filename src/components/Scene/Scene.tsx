import { useEffect, useState } from "react";
import * as THREE from "three";
import * as CANNON from "cannon";
import useSound from "use-sound";
import sound from "/song/asd.mp3";

const Scene = () => {
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [playSound] = useSound(sound);

  useEffect(() => {
    let camera: any, scene: any, renderer: any;
    let world: any;
    let lastTime: any;
    let stack: any;
    //@ts-ignore
    let overhangs: any;
    const boxHeight = 3;
    const originalBoxSize = 3;
    let timeNow: any;

    init();

    function init() {
      lastTime = 0;
      stack = [];
      overhangs = [];

      world = new CANNON.World();
      world.gravity.set(0, -10, 0);
      world.broadphase = new CANNON.NaiveBroadphase();
      world.solver.iterations = 40;

      const aspect = window.innerWidth / window.innerHeight;

      camera = new THREE.PerspectiveCamera(45, aspect, 1, 100);

      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);

      scene = new THREE.Scene();

      addLayer(0, 0, originalBoxSize, originalBoxSize, null);
      addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
      dirLight.position.set(10, 20, 0);
      scene.add(dirLight);

      const canvas = document.getElementById("scene");
      //@ts-ignore
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animation);
      document.body.appendChild(renderer.domElement);
    }

    function startGame() {
      lastTime = 0;
      stack = [];
      overhangs = [];

      if (world) {
        while (world.bodies.length > 0) {
          world.remove(world.bodies[0]);
        }
      }

      if (scene) {
        while (scene.children.find((c: any) => c.type == "Mesh")) {
          const mesh = scene.children.find((c: any) => c.type == "Mesh");
          scene.remove(mesh);
        }

        addLayer(0, 0, originalBoxSize, originalBoxSize, null);
        addLayer(-15, 0, originalBoxSize, originalBoxSize, "x");
      }

      if (camera) {
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
      }
    }

    //@ts-ignore
    function addLayer(x, z, width, depth, direction) {
      const y = boxHeight * stack.length;
      const layer = generateBox(x, y, z, width, depth, false);
      //@ts-ignore
      layer.direction = direction;
      //@ts-ignore
      stack.push(layer);
    }

    //@ts-ignore
    function generateBox(x, y, z, width, depth, falls) {
      const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
      let planeTexture;
      if (stack.length % 4 == 0) {
        planeTexture = new THREE.TextureLoader().load("textures/house1.webp");
      } else if (stack.length % 4 == 1) {
        planeTexture = new THREE.TextureLoader().load("textures/house2.jpeg");
      } else if (stack.length % 4 == 2) {
        planeTexture = new THREE.TextureLoader().load("textures/house3.jpeg");
      } else {
        planeTexture = new THREE.TextureLoader().load("textures/house4.jpeg");
      }
      const material = new THREE.MeshLambertMaterial({
        map: planeTexture,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      scene.add(mesh);

      const shape = new CANNON.Box(
        new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
      );
      let mass = falls ? 5 : 0;
      mass *= width / originalBoxSize;
      mass *= depth / originalBoxSize;
      const body = new CANNON.Body({ mass, shape });
      body.position.set(x, y, z);
      world.addBody(body);

      return {
        threejs: mesh,
        cannonjs: body,
        width,
        depth,
      };
    }

    window.addEventListener("mousedown", eventHandler);
    window.addEventListener("touchstart", eventHandler);
    window.addEventListener("keydown", function (event) {
      if (event.key == "ArrowLeft") {
        let y = camera.position.y;
        camera.position.y += 0.08 * (timeNow - lastTime);
        camera.position.x = -10;
        camera.position.z = 15;
        camera.lookAt(0, y - boxHeight * 2.5, 0);
      } else if (event.key == "ArrowRight") {
        let y = camera.position.y;
        camera.position.y += 0.08 * (timeNow - lastTime);
        camera.position.x = 10;
        camera.position.z = 10;
        camera.lookAt(0, y - boxHeight * 2.5, 0);
      }

      if (event.key == " ") {
        event.preventDefault();
        eventHandler();
        return;
      }
      if (event.key == "R" || event.key == "r") {
        event.preventDefault();
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        setGameEnded(false);
        setScore(0);
        startGame();
        return;
      }
    });

    function eventHandler() {
      splitBlockAndAddNextOneIfOverlaps();
    }

    function splitBlockAndAddNextOneIfOverlaps() {
      if (gameEnded) return;

      const topLayer = stack[stack.length - 1];
      const previousLayer = stack[stack.length - 2];

      const direction = topLayer.direction;

      const size = direction == "x" ? topLayer.width : topLayer.depth;
      const delta =
        topLayer.threejs.position[direction] -
        previousLayer.threejs.position[direction];
      const overhangSize = Math.abs(delta);
      const overlap = size - overhangSize;

      if (overlap > 0) {
        const nextX = direction == "x" ? topLayer.threejs.position.x : -15;
        const nextZ = direction == "z" ? topLayer.threejs.position.z : -15;
        const newWidth = topLayer.width;
        const newDepth = topLayer.depth;
        const nextDirection = direction == "x" ? "z" : "x";

        addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
        setScore((score) => score + 1);
      } else {
        missedTheSpot();
      }
    }

    function missedTheSpot() {
      const topLayer = stack[stack.length - 1];
      world.remove(topLayer.cannonjs);
      scene.remove(topLayer.threejs);
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      setGameEnded(true);
    }

    //@ts-ignore
    function animation(time) {
      timeNow = time;
      if (lastTime) {
        const timePassed = time - lastTime;
        let speed = 0.01;
        if (stack.length > 5) {
          speed = 0.015;
        }

        if (stack.length > 10) {
          speed = 0.02;
        }

        if (stack.length > 20) {
          speed = 0.025;
        }

        if (stack.length > 50) {
          speed = 0.035;
        }

        const topLayer = stack[stack.length - 1];

        if (!gameEnded) {
          topLayer.threejs.position[topLayer.direction] += speed * timePassed;
          topLayer.cannonjs.position[topLayer.direction] += speed * timePassed;

          if (topLayer.threejs.position[topLayer.direction] > 10) {
            missedTheSpot();
          }
        }

        if (camera.position.y - 6 < boxHeight * (stack.length - 2) + 4) {
          const y = camera.position.y;
          camera.position.y += speed * timePassed;
          camera.lookAt(0, y - boxHeight * 2.5, 0);
        }

        updatePhysics(timePassed);
        renderer.render(scene, camera);
      }
      lastTime = time;
    }

    //@ts-ignore
    function updatePhysics(timePassed) {
      world.step(timePassed / 1000);
    }
  }, []);

  return (
    <div className="flex flex-row justify-end">
      <>
        <p
          id="score"
          className="absolute font-bold text-3xl text-red-600 m-10 mr-10"
        >
          {!gameEnded ? (
            <div>
              <p>Score: {score}</p>
              <p>Use ← and → to change the view</p>
              <button
                className="text-white border-[1px]"
                onClick={() => playSound()}
              >
                ТЫК
              </button>
            </div>
          ) : (
            <>YOU LOST, PRESS R TO RESTART</>
          )}
        </p>
        <canvas id="scene"></canvas>
      </>
    </div>
  );
};

export default Scene;
