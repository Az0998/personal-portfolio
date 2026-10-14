"use client";

import { useEffect, useRef } from "react";
import type { PhysSceneId } from "@/data/physics-3d";

type Props = {
  sceneId: PhysSceneId;
  params: Record<string, number>;
  paused: boolean;
  resetToken: number;
};

type Pair = { mesh: import("three").Object3D; body: import("cannon-es").Body; kind?: string };

export function PhysicsCanvas({ sceneId, params, paused, resetToken }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  const pausedRef = useRef(paused);
  paramsRef.current = params;
  pausedRef.current = paused;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let controls: {
      dispose: () => void;
      update: () => void;
      target: { set: (x: number, y: number, z: number) => void };
    } | null = null;
    let world: import("cannon-es").World | null = null;
    let cleanupExtras: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      const CANNON = await import("cannon-es");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed || !hostRef.current) return;

      const w0 = host.clientWidth || 640;
      const h0 = host.clientHeight || 480;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w0, h0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, w0 / h0, 0.1, 120);
      camera.position.set(6.5, 5.2, 8.5);

      const orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.target.set(0, 1.2, 0);
      controls = orbit;

      const hemi = new THREE.HemisphereLight(0xffe8f0, 0x1a2030, 0.85);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfff2e0, 1.15);
      sun.position.set(6, 10, 4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 30;
      sun.shadow.camera.left = -10;
      sun.shadow.camera.right = 10;
      sun.shadow.camera.top = 10;
      sun.shadow.camera.bottom = -10;
      scene.add(sun);
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));

      world = new CANNON.World({ gravity: new CANNON.Vec3(0, -12, 0) });
      world.broadphase = new CANNON.NaiveBroadphase();
      world.allowSleep = true;

      const pairs: Pair[] = [];
      const allBodies: import("cannon-es").Body[] = [];
      const matCache = new Map<string, import("three").MeshStandardMaterial>();
      const colorMat = (hex: number, extras?: Partial<import("three").MeshStandardMaterialParameters>) => {
        const key = `${hex}|${extras?.metalness ?? 0}|${extras?.roughness ?? 0.6}|${extras?.transparent ?? false}`;
        let m = matCache.get(key);
        if (!m) {
          m = new THREE.MeshStandardMaterial({
            color: hex,
            metalness: extras?.metalness ?? 0.05,
            roughness: extras?.roughness ?? 0.55,
            transparent: extras?.transparent,
            opacity: extras?.opacity,
            ...extras,
          });
          matCache.set(key, m);
        }
        return m;
      };

      const addGround = (size = 14) => {
        const geo = new THREE.PlaneGeometry(size, size);
        const mesh = new THREE.Mesh(geo, colorMat(0x2a2430, { roughness: 0.95 }));
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add(mesh);
        const body = new CANNON.Body({
          mass: 0,
          shape: new CANNON.Plane(),
          material: new CANNON.Material("ground"),
        });
        body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world!.addBody(body);
        allBodies.push(body);
        return { mesh, body };
      };

      const addBox = (
        sx: number,
        sy: number,
        sz: number,
        pos: [number, number, number],
        mass: number,
        hex: number,
        phys?: { friction?: number; restitution?: number }
      ) => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(sx, sy, sz),
          colorMat(hex, { metalness: 0.15, roughness: 0.45 })
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(...pos);
        scene.add(mesh);
        const mat = new CANNON.Material("box");
        mat.friction = phys?.friction ?? 0.4;
        mat.restitution = phys?.restitution ?? 0.2;
        const body = new CANNON.Body({
          mass,
          shape: new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2)),
          position: new CANNON.Vec3(...pos),
          material: mat,
          linearDamping: 0.05,
          angularDamping: 0.08,
        });
        world!.addBody(body);
        allBodies.push(body);
        pairs.push({ mesh, body, kind: "box" });
        return { mesh, body };
      };

      const addSphere = (
        r: number,
        pos: [number, number, number],
        mass: number,
        hex: number,
        phys?: { friction?: number; restitution?: number }
      ) => {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(r, 28, 20),
          colorMat(hex, { metalness: 0.25, roughness: 0.35 })
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(...pos);
        scene.add(mesh);
        const mat = new CANNON.Material("ball");
        mat.friction = phys?.friction ?? 0.3;
        mat.restitution = phys?.restitution ?? 0.5;
        const body = new CANNON.Body({
          mass,
          shape: new CANNON.Sphere(r),
          position: new CANNON.Vec3(...pos),
          material: mat,
          linearDamping: 0.02,
          angularDamping: 0.04,
        });
        world!.addBody(body);
        allBodies.push(body);
        pairs.push({ mesh, body, kind: "sphere" });
        return { mesh, body, r };
      };

      const clearWorld = () => {
        for (const p of pairs) {
          scene.remove(p.mesh);
          if (p.mesh instanceof THREE.Mesh) p.mesh.geometry.dispose();
        }
        pairs.length = 0;
        for (const b of allBodies) world!.removeBody(b);
        allBodies.length = 0;
      };

      let waterMesh: import("three").Mesh | null = null;
      let waterLevel = 1.4;
      let buoyancyBodies: { body: import("cannon-es").Body; volume: number; r?: number }[] = [];
      let magnetCore: import("cannon-es").Body | null = null;
      let magnetSatellites: import("cannon-es").Body[] = [];
      let fountainPool: {
        body: import("cannon-es").Body;
        mesh: import("three").Mesh;
        born: number;
      }[] = [];
      let fountainAcc = 0;
      let constraints: import("cannon-es").Constraint[] = [];
      let onClick: ((x: number, y: number) => void) | null = null;

      const clearConstraints = () => {
        for (const c of constraints) world!.removeConstraint(c);
        constraints = [];
      };

      const build = () => {
        clearConstraints();
        clearWorld();
        buoyancyBodies = [];
        magnetCore = null;
        magnetSatellites = [];
        fountainPool = [];
        fountainAcc = 0;
        onClick = null;
        if (waterMesh) {
          scene.remove(waterMesh);
          waterMesh.geometry.dispose();
          (waterMesh.material as import("three").Material).dispose();
          waterMesh = null;
        }
        // remove static leftovers except lights
        [...scene.children].forEach((ch) => {
          if ((ch as import("three").Light).isLight) return;
          scene.remove(ch);
          if (ch instanceof THREE.Mesh) {
            ch.geometry.dispose();
          }
        });

        const p = paramsRef.current;
        const friction = p.friction ?? 0.4;
        const restitution = p.restitution ?? 0.4;
        const gravity = p.gravity ?? 12;
        world!.gravity.set(0, -gravity, 0);

        if (sceneId === "collide") {
          addGround(16);
          // walls
          const wallH = 2.2;
          const wallT = 0.25;
          const room = 4.2;
          for (const [x, z, sx, sz] of [
            [0, -room, room * 2, wallT],
            [0, room, room * 2, wallT],
            [-room, 0, wallT, room * 2],
            [room, 0, wallT, room * 2],
          ] as const) {
            addBox(sx, wallH, sz, [x, wallH / 2, z], 0, 0x3a3240, { friction, restitution: 0.1 });
          }
          const n = Math.floor(p.count ?? 18);
          const palette = [0xe44c65, 0x2ec4b6, 0xf4a261, 0x7bdff2, 0xc4b5fd, 0xff9aab];
          for (let i = 0; i < n; i++) {
            const r = 0.28 + Math.random() * 0.22;
            addSphere(
              r,
              [(Math.random() - 0.5) * 5, 3 + i * 0.55, (Math.random() - 0.5) * 5],
              (4 / 3) * Math.PI * r * r * r * 2.2,
              palette[i % palette.length],
              { friction, restitution }
            );
          }
          camera.position.set(7, 5.5, 8);
          controls!.target.set(0, 1.2, 0);
        } else if (sceneId === "incline") {
          addGround(18);
          const ang = ((p.angle ?? 22) * Math.PI) / 180;
          const ramp = addBox(7, 0.2, 3.2, [0, 1.6, 0], 0, 0x4a5568, { friction, restitution: 0.05 });
          ramp.body.quaternion.setFromEuler(0, 0, -ang);
          ramp.mesh.quaternion.copy(ramp.body.quaternion as unknown as import("three").Quaternion);
          // stop wall
          addBox(0.3, 1.2, 3.2, [3.6, 0.6, 0], 0, 0x3a3240, { friction: 0.8, restitution: 0.1 });
          addBox(0.55, 0.35, 0.45, [-2.6, 3.4, 0.3], 1.2, 0xe44c65, { friction, restitution: 0.1 });
          addSphere(0.32, [-2.4, 3.6, -0.55], 0.8, 0x2ec4b6, { friction: friction * 0.6, restitution: 0.2 });
          addBox(0.5, 0.3, 0.4, [-2.2, 3.9, 0.9], 0.9, 0xf4a261, { friction, restitution: 0.05 });
          camera.position.set(6, 4.5, 7);
          controls!.target.set(0.5, 1.5, 0);
        } else if (sceneId === "water") {
          addGround(16);
          // tank walls
          const tw = 5.5;
          const th = 2.4;
          const tt = 0.18;
          addBox(tw, th, tt, [0, th / 2, -tw / 2], 0, 0x334155, { friction: 0.2 });
          addBox(tw, th, tt, [0, th / 2, tw / 2], 0, 0x334155, { friction: 0.2 });
          addBox(tt, th, tw, [-tw / 2, th / 2, 0], 0, 0x334155, { friction: 0.2 });
          addBox(tt, th, tw, [tw / 2, th / 2, 0], 0, 0x334155, { friction: 0.2 });
          waterLevel = 1.35;
          const waterGeo = new THREE.PlaneGeometry(tw - 0.3, tw - 0.3, 48, 48);
          waterMesh = new THREE.Mesh(
            waterGeo,
            new THREE.MeshPhysicalMaterial({
              color: 0x2ec4b6,
              transparent: true,
              opacity: 0.42,
              roughness: 0.15,
              metalness: 0.05,
              transmission: 0.35,
              thickness: 0.6,
              side: THREE.DoubleSide,
            })
          );
          waterMesh.rotation.x = -Math.PI / 2;
          waterMesh.position.y = waterLevel;
          waterMesh.receiveShadow = true;
          scene.add(waterMesh);

          const palette = [0xe44c65, 0xf4a261, 0xc4b5fd, 0xff9aab, 0x7bdff2];
          for (let i = 0; i < 10; i++) {
            const r = 0.25 + Math.random() * 0.2;
            const { body } = addSphere(
              r,
              [(Math.random() - 0.5) * 3.5, 2.5 + i * 0.35, (Math.random() - 0.5) * 3.5],
              (4 / 3) * Math.PI * r * r * r * 1.6,
              palette[i % palette.length],
              { friction: 0.15, restitution: 0.25 }
            );
            buoyancyBodies.push({ body, volume: (4 / 3) * Math.PI * r * r * r, r });
          }
          // a wood-like box
          const box = addBox(0.7, 0.45, 0.55, [0.8, 3.2, -0.4], 1.1, 0xd4a574, {
            friction: 0.3,
            restitution: 0.1,
          });
          buoyancyBodies.push({ body: box.body, volume: 0.7 * 0.45 * 0.55 });
          camera.position.set(7, 5, 7.5);
          controls!.target.set(0, 1.2, 0);
        } else if (sceneId === "domino") {
          addGround(18);
          const gap = p.gap ?? 0.12;
          const n = 16;
          const startX = -4.2;
          for (let i = 0; i < n; i++) {
            addBox(0.18, 1.1, 0.55, [startX + i * (0.18 + gap), 0.55, 0], 0.35, i % 2 ? 0xe44c65 : 0xff9aab, {
              friction: 0.55,
              restitution: restitution,
            });
          }
          const striker = addBox(0.45, 0.45, 0.45, [startX - 1.3, 0.45, 0], 1.4, 0x7bdff2, {
            friction: 0.3,
            restitution: 0.05,
          });
          striker.body.velocity.set(p.impulse ?? 7, 0, 0);
          camera.position.set(2, 4, 9);
          controls!.target.set(0, 0.8, 0);
        } else if (sceneId === "chain") {
          addGround(14);
          const n = Math.floor(p.links ?? 10);
          const damp = p.damping ?? 0.06;
          const r = 0.22;
          const spacing = r * 2.15;
          const anchorY = 4.2;
          const anchor = addSphere(0.18, [0, anchorY, 0], 0, 0xfff1f5, {
            friction: 0.2,
            restitution: 0.1,
          });
          let prev = anchor.body;
          const links: import("cannon-es").Body[] = [];
          for (let i = 0; i < n; i++) {
            const y = anchorY - (i + 1) * spacing;
            const { body } = addSphere(
              r * (i === n - 1 ? 1.35 : 1),
              [0.02 * i, y, 0],
              i === n - 1 ? 1.4 : 0.45,
              i === n - 1 ? 0xe44c65 : i % 2 ? 0xfbbf24 : 0xfde68a,
              { friction: 0.25, restitution: 0.15 }
            );
            body.linearDamping = damp;
            body.angularDamping = damp * 1.4;
            const dist = new CANNON.DistanceConstraint(prev, body, spacing);
            world!.addConstraint(dist);
            constraints.push(dist);
            prev = body;
            links.push(body);
          }
          const tip = links[links.length - 1];
          tip.velocity.set(p.impulse ?? 5, 0, 1.2);
          camera.position.set(6, 3.5, 7);
          controls!.target.set(0, 2.2, 0);
        } else if (sceneId === "magnet") {
          addGround(16);
          world!.gravity.set(0, -2.5, 0);
          const core = addSphere(0.55, [0, 2.4, 0], 0, 0xf87171, {
            friction: 0.1,
            restitution: 0.2,
          });
          magnetCore = core.body;
          const n = Math.floor(p.count ?? 12);
          const orbit = p.orbit ?? 3.2;
          const palette = [0x7bdff2, 0xc4b5fd, 0xf4a261, 0x2ec4b6, 0xff9aab];
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const rad = 2.4 + (i % 3) * 0.35;
            const x = Math.cos(a) * rad;
            const z = Math.sin(a) * rad;
            const { body } = addSphere(
              0.22 + (i % 3) * 0.04,
              [x, 2.4 + (i % 2) * 0.4, z],
              0.55,
              palette[i % palette.length],
              { friction: 0.15, restitution: 0.55 }
            );
            body.velocity.set(-Math.sin(a) * orbit, 0.2, Math.cos(a) * orbit);
            magnetSatellites.push(body);
          }
          camera.position.set(7, 5, 8);
          controls!.target.set(0, 2.2, 0);
        } else if (sceneId === "fountain") {
          addGround(16);
          const room = 4.5;
          for (const [x, z, sx, sz] of [
            [0, -room, room * 2, 0.25],
            [0, room, room * 2, 0.25],
            [-room, 0, 0.25, room * 2],
            [room, 0, 0.25, room * 2],
          ] as const) {
            addBox(sx, 1.2, sz, [x, 0.6, z], 0, 0x1e293b, { friction: 0.2, restitution: 0.1 });
          }
          // decorative nozzle
          addBox(0.35, 0.5, 0.35, [0, 0.25, 0], 0, 0x38bdf8, { friction: 0.2 });
          camera.position.set(6.5, 4.5, 7.5);
          controls!.target.set(0, 1.5, 0);
        } else {
          // sandbox
          addGround(16);
          const room = 5;
          for (const [x, z, sx, sz] of [
            [0, -room, room * 2, 0.3],
            [0, room, room * 2, 0.3],
            [-room, 0, 0.3, room * 2],
            [room, 0, 0.3, room * 2],
          ] as const) {
            addBox(sx, 1.6, sz, [x, 0.8, z], 0, 0x3a3240, { friction, restitution: 0.1 });
          }
          addSphere(0.4, [0, 2, 0], 1, 0xe44c65, { friction, restitution });
          addBox(0.6, 0.6, 0.6, [1.2, 2.5, -0.8], 1.2, 0x2ec4b6, { friction, restitution });
          camera.position.set(8, 6, 8);
          controls!.target.set(0, 1, 0);

          const raycaster = new THREE.Raycaster();
          const pointer = new THREE.Vector2();
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hit = new THREE.Vector3();
          onClick = (clientX: number, clientY: number) => {
            const rect = renderer!.domElement.getBoundingClientRect();
            pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            if (!raycaster.ray.intersectPlane(plane, hit)) return;
            const size = paramsRef.current.size ?? 0.35;
            const fr = paramsRef.current.friction ?? 0.4;
            const re = paramsRef.current.restitution ?? 0.55;
            const palette = [0xe44c65, 0xf4a261, 0x2ec4b6, 0xc4b5fd, 0x7bdff2];
            const hex = palette[Math.floor(Math.random() * palette.length)];
            if (Math.random() > 0.45) {
              addSphere(size, [hit.x, 2.8, hit.z], size * size * size * 8, hex, {
                friction: fr,
                restitution: re,
              });
            } else {
              addBox(size * 1.4, size * 1.4, size * 1.4, [hit.x, 2.8, hit.z], size * 6, hex, {
                friction: fr,
                restitution: re,
              });
            }
          };
        }
      };

      build();

      let downX = 0;
      let downY = 0;
      const onPointerDown = (e: PointerEvent) => {
        downX = e.clientX;
        downY = e.clientY;
      };
      const onPointerUp = (e: PointerEvent) => {
        if (sceneId !== "sandbox" || !onClick) return;
        const dx = e.clientX - downX;
        const dy = e.clientY - downY;
        if (dx * dx + dy * dy > 36) return; // 拖拽旋转不生成
        onClick(e.clientX, e.clientY);
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointerup", onPointerUp);

      const onResize = () => {
        if (!hostRef.current || !renderer) return;
        const w = hostRef.current.clientWidth;
        const h = hostRef.current.clientHeight;
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(host);

      let last = performance.now();
      let paramSig = JSON.stringify(paramsRef.current);

      const tick = (now: number) => {
        if (disposed) return;
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        const sig = JSON.stringify(paramsRef.current);
        // rebuild when structural params change (scene-dependent)
        if (sig !== paramSig) {
          const prev = JSON.parse(paramSig) as Record<string, number>;
          const cur = paramsRef.current;
          const structural =
            sceneId === "collide"
              ? cur.count !== prev.count
              : sceneId === "incline"
                ? cur.angle !== prev.angle
                : sceneId === "domino"
                  ? cur.gap !== prev.gap || cur.impulse !== prev.impulse
                  : sceneId === "chain"
                    ? cur.links !== prev.links || cur.impulse !== prev.impulse
                    : sceneId === "magnet"
                      ? cur.count !== prev.count || cur.orbit !== prev.orbit
                      : false;
          if (structural) build();
          else {
            if (sceneId !== "magnet") world!.gravity.set(0, -(cur.gravity ?? 12), 0);
            for (const pair of pairs) {
              if (pair.body.material) {
                if (cur.friction != null) pair.body.material.friction = cur.friction;
                if (cur.restitution != null) pair.body.material.restitution = cur.restitution;
              }
              if (sceneId === "chain" && cur.damping != null) {
                pair.body.linearDamping = cur.damping;
                pair.body.angularDamping = cur.damping * 1.4;
              }
            }
          }
          paramSig = sig;
        }

        if (!pausedRef.current) {
          // buoyancy
          if (sceneId === "water") {
            const density = paramsRef.current.density ?? 1.15;
            const drag = paramsRef.current.drag ?? 2.5;
            const g = Math.abs(world!.gravity.y);
            for (const item of buoyancyBodies) {
              const y = item.body.position.y;
              const half = item.r ?? 0.3;
              const submerged = Math.max(0, Math.min(1, (waterLevel + half - y) / (2 * half)));
              if (submerged > 0) {
                const force = density * item.volume * submerged * g;
                item.body.applyForce(new CANNON.Vec3(0, force, 0), item.body.position);
                item.body.velocity.x *= 1 - drag * 0.015 * submerged;
                item.body.velocity.z *= 1 - drag * 0.015 * submerged;
                item.body.velocity.y *= 1 - drag * 0.01 * submerged;
              }
            }
            // animate water surface
            if (waterMesh) {
              const wave = paramsRef.current.wave ?? 0.08;
              const pos = waterMesh.geometry.attributes.position as import("three").BufferAttribute;
              for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const z = pos.getY(i); // plane before rotation uses y as z after
                const y =
                  Math.sin(x * 1.6 + now * 0.002) * wave +
                  Math.cos(z * 1.3 - now * 0.0017) * wave * 0.7;
                pos.setZ(i, y);
              }
              pos.needsUpdate = true;
              waterMesh.geometry.computeVertexNormals();
            }
          }

          if (sceneId === "magnet" && magnetCore) {
            const strength = paramsRef.current.strength ?? 28;
            const cx = magnetCore.position.x;
            const cy = magnetCore.position.y;
            const cz = magnetCore.position.z;
            for (const body of magnetSatellites) {
              const dx = cx - body.position.x;
              const dy = cy - body.position.y;
              const dz = cz - body.position.z;
              const d2 = dx * dx + dy * dy + dz * dz + 0.35;
              const f = strength / d2;
              body.applyForce(new CANNON.Vec3(dx * f, dy * f, dz * f), body.position);
            }
          }

          if (sceneId === "fountain") {
            const rate = paramsRef.current.rate ?? 6;
            const speed = paramsRef.current.speed ?? 8;
            const spread = paramsRef.current.spread ?? 0.45;
            const rest = paramsRef.current.restitution ?? 0.55;
            fountainAcc += dt * rate;
            while (fountainAcc >= 1 && fountainPool.length < 48) {
              fountainAcc -= 1;
              const ang = Math.random() * Math.PI * 2;
              const sp = spread * (0.4 + Math.random());
              const r = 0.12 + Math.random() * 0.08;
              const hex = [0x38bdf8, 0x7dd3fc, 0xa5f3fc, 0xe0f2fe][Math.floor(Math.random() * 4)];
              const { body, mesh } = addSphere(r, [0, 0.7, 0], r * r * r * 40, hex, {
                friction: 0.05,
                restitution: rest,
              });
              body.velocity.set(
                Math.cos(ang) * sp * speed * 0.35,
                speed * (0.85 + Math.random() * 0.25),
                Math.sin(ang) * sp * speed * 0.35
              );
              fountainPool.push({ body, mesh, born: now });
            }
            fountainAcc = Math.min(fountainAcc, 2);
            const keep: typeof fountainPool = [];
            for (const item of fountainPool) {
              if (now - item.born > 4200 || item.body.position.y < -1) {
                scene.remove(item.mesh);
                if (item.mesh instanceof THREE.Mesh) item.mesh.geometry.dispose();
                world!.removeBody(item.body);
                const pi = pairs.findIndex((p) => p.body === item.body);
                if (pi >= 0) pairs.splice(pi, 1);
                const bi = allBodies.indexOf(item.body);
                if (bi >= 0) allBodies.splice(bi, 1);
              } else keep.push(item);
            }
            fountainPool = keep;
          }

          world!.step(1 / 60, dt, 3);
          for (const pair of pairs) {
            pair.mesh.position.set(
              pair.body.position.x,
              pair.body.position.y,
              pair.body.position.z
            );
            pair.mesh.quaternion.set(
              pair.body.quaternion.x,
              pair.body.quaternion.y,
              pair.body.quaternion.z,
              pair.body.quaternion.w
            );
          }
        }

        controls?.update();
        renderer!.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanupExtras = () => {
        renderer?.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer?.domElement.removeEventListener("pointerup", onPointerUp);
        ro.disconnect();
        clearConstraints();
        clearWorld();
        matCache.forEach((m) => m.dispose());
        if (waterMesh) {
          waterMesh.geometry.dispose();
          (waterMesh.material as import("three").Material).dispose();
        }
        renderer?.dispose();
        if (renderer?.domElement.parentElement === host) host.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      controls?.dispose();
      cleanupExtras?.();
      world = null;
    };
  }, [sceneId, resetToken]);

  return <div ref={hostRef} className="phys-canvas" role="img" aria-label="三维物理场景" />;
}
