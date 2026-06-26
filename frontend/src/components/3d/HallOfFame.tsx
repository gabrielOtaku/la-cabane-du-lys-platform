"use client";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls }   from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer }  from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass }      from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass }      from "three/examples/jsm/postprocessing/ShaderPass.js";
import type { Guest, Sector } from "@/types";

// ─── Vignette shader ─────────────────────────────────────────────────────────

const vignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset:   { value: 1.1 },
    darkness: { value: 1.3 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * offset;
      float vign = clamp(1.0 - dot(uv, uv) * darkness, 0.0, 1.0);
      gl_FragColor = vec4(color.rgb * vign, color.a);
    }
  `,
};

// ─── Matériaux partagés ───────────────────────────────────────────────────────

function makeRelicMat() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d4af37"),
    metalness: 0.9,
    roughness: 0.25,
    emissive: new THREE.Color("#b8860b"),
    emissiveIntensity: 1.2,
  });
}

// ─── Géométries de reliques (miroir du JSX R3F d'origine) ────────────────────

function buildRelic(sector: Sector, mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  switch (sector) {
    case "automobile": {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.22, 16, 40), mat);
      torus.rotation.x = Math.PI / 2;
      g.add(torus, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat));
      break;
    }
    case "tech": {
      for (let i = 0; i < 27; i++) {
        const x = (i % 3) - 1, y = (Math.floor(i / 3) % 3) - 1, z = Math.floor(i / 9) - 1;
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), mat);
        c.position.set(x * 0.45, y * 0.45, z * 0.45);
        g.add(c);
      }
      break;
    }
    case "restauration": {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 32), mat);
      cone.position.y = 0.2;
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 32), mat);
      cyl.position.y = -0.35;
      g.add(cone, cyl);
      break;
    }
    case "construction": {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 4), mat);
      cone.position.y = 0.25;
      const box = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25, 1), mat);
      box.position.y = -0.4;
      g.add(cone, box);
      break;
    }
    default:
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), mat));
  }
  return g;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function HallOfFame({ guests }: { guests: Guest[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holoRef   = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>(guests[0]?.id ?? "");
  const activeIdRef = useRef(activeId);

  // Synchronise le ref sans relancer l'effet Three.js
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // ── Scène & caméra ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color("#0d0d0d");
    scene.fog = new THREE.Fog("#0d0d0d", 12, 26);

    const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 100);
    camera.position.set(0, 1.5, 11);

    // ── Lumières ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));

    const spot = new THREE.SpotLight(0xffd9a0, 180);
    spot.position.set(0, 12, 4);
    spot.angle     = 0.45;
    spot.penumbra  = 0.8;
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    scene.add(spot);

    const p1 = new THREE.PointLight(0xffaa00, 40); p1.position.set(-8, 2, 4); scene.add(p1);
    const p2 = new THREE.PointLight(0xd4af37, 40); p2.position.set( 8, 2, 4); scene.add(p2);

    // ── Sol (ombre) ───────────────────────────────────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: "#0d0d0d", roughness: 0.8, metalness: 0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.55;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Vitrines ──────────────────────────────────────────────────────────────
    const GAP   = 3.4;
    const start = -((guests.length - 1) * GAP) / 2;
    const relicMat = makeRelicMat();

    interface Vitrine {
      group:      THREE.Group;
      relicGroup: THREE.Group;
      guestId:    string;
      offset:     number;   // phase d'animation flottante
      clickMeshes: THREE.Mesh[];
    }
    const vitrines: Vitrine[] = [];

    guests.forEach((guest, i) => {
      const group = new THREE.Group();
      group.position.x = start + i * GAP;

      // Socle
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1.15, 0.3, 48),
        new THREE.MeshStandardMaterial({ color: "#1a1a1a", metalness: 0.6, roughness: 0.5 }),
      );
      base.position.y = -1.4;
      base.receiveShadow = true;
      group.add(base);

      // Relique flottante
      const relicGroup = new THREE.Group();
      const relic = buildRelic(guest.sector, relicMat);
      relicGroup.add(relic);
      group.add(relicGroup);

      // Cloche de verre
      const bell = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.05, 2.6, 48, 1, true),
        new THREE.MeshPhysicalMaterial({
          transparent: true, opacity: 0.06, roughness: 0,
          color: new THREE.Color("#ffcf8a"), side: THREE.DoubleSide,
        }),
      );
      bell.position.y = -0.1;
      group.add(bell);

      scene.add(group);

      // Meshes cliquables (pour le raycaster)
      const clickMeshes: THREE.Mesh[] = [];
      relic.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.userData.guestId = guest.id;
          clickMeshes.push(obj);
        }
      });

      vitrines.push({ group, relicGroup, guestId: guest.id, offset: i * 1.3, clickMeshes });
    });

    // ── OrbitControls ─────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan    = false;
    controls.minDistance  = 6;
    controls.maxDistance  = 18;
    controls.maxPolarAngle = Math.PI / 1.9;
    controls.autoRotate   = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableDamping = true;

    // ── Post-Processing ───────────────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.5, 0.4, 0.3);
    composer.addPass(bloom);
    const vgPass = new ShaderPass(vignetteShader);
    composer.addPass(vgPass);

    // ── Raycaster (clics) ─────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    const allClickMeshes = vitrines.flatMap(v => v.clickMeshes);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(allClickMeshes, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.guestId as string | undefined;
        if (id) { activeIdRef.current = id; setActiveId(id); }
      }
    };
    canvas.addEventListener("click", onClick);

    // ── Redimensionnement ─────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
      composer.setSize(W(), H());
    };
    window.addEventListener("resize", onResize);

    // ── Boucle d'animation ────────────────────────────────────────────────────
    let rafId = 0;
    let t = 0;
    const v3 = new THREE.Vector3();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;
      controls.update();

      vitrines.forEach(({ relicGroup, guestId, offset }) => {
        const active = activeIdRef.current === guestId;

        // Float (réplique de <Float speed=1.4 rotationIntensity=0.6 floatIntensity=0.8>)
        relicGroup.position.y  = Math.sin(t * 0.7 + offset) * 0.24;
        relicGroup.rotation.x  = Math.sin(t * 0.4 + offset) * 0.06;
        relicGroup.rotation.z  = Math.cos(t * 0.3 + offset) * 0.05;

        // Scale vers la valeur cible (active = 1.25, default = 1)
        const target = active ? 1.25 : 1;
        relicGroup.scale.x += (target - relicGroup.scale.x) * 0.1;
        relicGroup.scale.y  = relicGroup.scale.x;
        relicGroup.scale.z  = relicGroup.scale.x;
      });

      composer.render();

      // Position de la fiche holographique
      if (holoRef.current) {
        const av = vitrines.find(v => v.guestId === activeIdRef.current);
        if (av) {
          v3.set(av.group.position.x, 1.9, 0);
          v3.project(camera);
          const sx = (v3.x + 1)  / 2 * W();
          const sy = (-v3.y + 1) / 2 * H();
          holoRef.current.style.transform =
            `translate(calc(${sx}px - 50%), calc(${sy}px - 100%)) translateY(-10px)`;
          holoRef.current.style.opacity = "1";
        }
      }
    };
    animate();

    // ── Nettoyage ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      relicMat.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [guests]);

  const activeGuest = guests.find(g => g.id === activeId);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        data-cursor="3d"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      {activeGuest && (
        <div
          ref={holoRef}
          className="holo-card"
          style={{ position: "absolute", top: 0, left: 0, opacity: 0, pointerEvents: "none" }}
        >
          <span className="holo-sector">{activeGuest.sector}</span>
          <h3>{activeGuest.name}</h3>
          <p className="holo-role">{activeGuest.role} · {activeGuest.company}</p>
          <div className="holo-stats">
            <span><b>{activeGuest.revenue}</b>Chiffre d&apos;affaires</span>
            <span><b>{activeGuest.employees}</b>Employés</span>
          </div>
          <p className="holo-lesson">« {activeGuest.lesson} »</p>
        </div>
      )}
    </div>
  );
}
