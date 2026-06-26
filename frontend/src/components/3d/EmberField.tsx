"use client";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function makeEmberTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,226,170,1)");
  grd.addColorStop(0.25, "rgba(255,170,0,0.85)");
  grd.addColorStop(0.6, "rgba(255,106,43,0.30)");
  grd.addColorStop(1, "rgba(255,90,30,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/**
 * Champ de braises 3D — Three.js impératif, sans @react-three/fiber.
 * R3F accède aux internals React (ReactCurrentOwner) qui ne survivent pas
 * aux chunks dynamiques Turbopack ; cette version évite complètement ce problème.
 */
export default function EmberField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const COUNT  = reduced ? 60 : window.innerWidth < 700 ? 110 : 240;
    const SPREAD = 46;
    const HEIGHT = 34;

    // Renderer WebGL attaché directement au <canvas> DOM
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 24);

    // Géométrie des particules
    const positions = new Float32Array(COUNT * 3);
    const speeds    = new Float32Array(COUNT);
    const sway      = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * SPREAD;
      positions[i * 3 + 1] = (Math.random() - 0.5) * HEIGHT;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
      speeds[i] = 0.012 + Math.random() * 0.035;
      sway[i]   = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    const posAttr  = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute("position", posAttr);

    const material = new THREE.PointsMaterial({
      map:        makeEmberTexture(),
      size:       window.innerWidth < 700 ? 0.95 : 0.8,
      transparent: true,
      opacity:    0.9,
      depthWrite: false,
      blending:   THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Parallaxe souris (cahier des charges §2.3)
    let px = 0, py = 0;
    const onPointerMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth)  *  2 - 1;
      py = (e.clientY / window.innerHeight) * -2 + 1;
    };
    window.addEventListener("pointermove", onPointerMove);

    // Redimensionnement
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Boucle d'animation
    let rafId = 0;
    let t     = 0;

    const animate = () => {
      t += 0.016;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < COUNT; i++) {
        arr[i * 3 + 1] += speeds[i];
        arr[i * 3]     += Math.sin(t + sway[i]) * 0.006;
        if (arr[i * 3 + 1] > HEIGHT / 2) {
          arr[i * 3 + 1] = -HEIGHT / 2;
          arr[i * 3]     = (Math.random() - 0.5) * SPREAD;
        }
      }
      posAttr.needsUpdate = true;
      // Parallaxe caméra
      camera.position.x += (px * 3 - camera.position.x) * 0.04;
      camera.position.y += (-py * 2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      points.rotation.y = px * 0.12;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    // Rendu statique initial, puis boucle complète si mouvement autorisé
    renderer.render(scene, camera);
    if (!reduced) {
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        0,
        pointerEvents: "none",
        width:         "100%",
        height:        "100%",
      }}
    />
  );
}
