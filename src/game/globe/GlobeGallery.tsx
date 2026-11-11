import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import * as THREE from "three";
import { TextureLoader } from "three";
import { getGlobeCameraFov, getPanelMotion } from "@/lib/globe-motion";
import image1 from "@/assets/1.png";
import image2 from "@/assets/2.png";
import image3 from "@/assets/3.png";
import image4 from "@/assets/4.png";
import image5 from "@/assets/5.png";
import image6 from "@/assets/6.png";
import image7 from "@/assets/7.png";

const PHOTO_PATHS = [image1, image2, image3, image4, image5, image6, image7];
const SPHERE_RADIUS = 2.08;
const ROWS = 8;

type Panel = {
  index: number;
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
  geometry: THREE.BufferGeometry;
  imageIndex: number;
};

function createPanels(rows = ROWS): Panel[] {
  const panels: Panel[] = [];

  for (let row = 0; row < rows; row += 1) {
    const latitude = -Math.PI / 2 + (Math.PI * (row + 0.5)) / rows;
    const count = Math.max(4, Math.round(14 * Math.cos(latitude)));
    const latitudeStep = Math.PI / rows;
    const longitudeStep = (Math.PI * 2) / count;

    for (let column = 0; column < count; column += 1) {
      const longitude = (column / count) * Math.PI * 2 + (row % 2) * (Math.PI / count);
      const normal = new THREE.Vector3(
        Math.cos(latitude) * Math.sin(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.cos(longitude),
      ).normalize();
      const tangentLongitude = new THREE.Vector3(Math.cos(longitude), 0, -Math.sin(longitude));
      const tangentLatitude = new THREE.Vector3(
        -Math.sin(latitude) * Math.sin(longitude),
        Math.cos(latitude),
        -Math.sin(latitude) * Math.cos(longitude),
      );
      const orientation = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(tangentLongitude, tangentLatitude, normal),
      );
      const halfLatitude = latitudeStep * 0.37;
      const halfLongitude = longitudeStep * 0.37;
      const segments = 6;
      const vertices: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let y = 0; y <= segments; y += 1) {
        const v = y / segments;
        const deltaLatitude = (v * 2 - 1) * halfLatitude;
        for (let x = 0; x <= segments; x += 1) {
          const u = x / segments;
          const deltaLongitude = (u * 2 - 1) * halfLongitude;
          vertices.push(
            SPHERE_RADIUS * Math.cos(latitude + deltaLatitude) * Math.sin(deltaLongitude),
            SPHERE_RADIUS * Math.sin(deltaLatitude),
            SPHERE_RADIUS * (
              Math.sin(latitude) * Math.sin(latitude + deltaLatitude) +
              Math.cos(latitude) * Math.cos(latitude + deltaLatitude) * Math.cos(deltaLongitude) - 1
            ),
          );
          uvs.push(u, v);
        }
      }

      for (let y = 0; y < segments; y += 1) {
        for (let x = 0; x < segments; x += 1) {
          const a = y * (segments + 1) + x;
          const b = a + segments + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      panels.push({
        index: panels.length,
        position: normal.multiplyScalar(SPHERE_RADIUS),
        orientation,
        imageIndex: (row * 3 + column) % PHOTO_PATHS.length,
        geometry,
      });
    }
  }

  return panels;
}

function GalleryPanels({
  progress,
  reducedMotion,
}: {
  progress: MotionValue<number>;
  reducedMotion: RefObject<boolean>;
}) {
  const textures = useLoader(TextureLoader, PHOTO_PATHS);
  const { size } = useThree();
  const rows = size.width <= 768 ? 5 : ROWS;
  const panels = useMemo(() => createPanels(rows), [rows]);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const materials = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
    });
  }, [textures]);

  useFrame(() => {
    panels.forEach((panel) => {
      const mesh = meshes.current[panel.index];
      const material = materials.current[panel.index];
      if (!mesh || !material) return;

      const motion = getPanelMotion(panel.index, reducedMotion.current ? 0 : progress.get());
      mesh.position.set(
        panel.position.x + motion.x,
        panel.position.y + motion.y,
        panel.position.z + motion.z,
      );
      mesh.quaternion.copy(panel.orientation);
      mesh.rotateX(motion.rotationX);
      mesh.rotateY(motion.rotationY);
      mesh.rotateZ(motion.rotationZ);
      material.opacity = motion.opacity;
      material.depthWrite = motion.opacity > 0.8;
    });
  });

  return (
    <group>
      {panels.map((panel) => (
        <mesh
          key={`panel-${rows}-${panel.index}`}
          ref={(mesh) => {
            meshes.current[panel.index] = mesh;
          }}
          position={panel.position}
          quaternion={panel.orientation}
          geometry={panel.geometry}
          renderOrder={2}
        >
          <meshStandardMaterial
            ref={(material) => {
              materials.current[panel.index] = material;
            }}
            map={textures[panel.imageIndex] ?? null}
            roughness={0.48}
            metalness={0.04}
            side={THREE.DoubleSide}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function GlobeMotion({
  globeRef,
  progress,
  drag,
  reducedMotion,
}: {
  globeRef: RefObject<THREE.Group | null>;
  progress: MotionValue<number>;
  drag: RefObject<{ active: boolean; velocity: number }>;
  reducedMotion: RefObject<boolean>;
}) {
  const { size, camera } = useThree();

  useFrame((_, delta) => {
    const globe = globeRef.current;
    if (!globe) return;
    const isMobile = size.width <= 768;
    globe.position.set(0, 0, 0);
    globe.scale.setScalar(isMobile ? 0.9 : 1.32);
    if (isMobile) {
      globe.rotation.x = 0;
      globe.rotation.z = 0;
    }
    const breakup = reducedMotion.current || isMobile ? 0 : progress.get();

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = getGlobeCameraFov(breakup);
      if (Math.abs(camera.fov - targetFov) > 0.02) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    }

    if (reducedMotion.current) return;
    const dt = Math.min(delta, 0.05);

    if (!drag.current.active) {
      globe.rotation.y += (0.11 * (1 - breakup) + drag.current.velocity) * dt;
      drag.current.velocity *= Math.exp(-3.2 * dt);
    }
  });

  return null;
}

type GlobeGalleryProps = {
  scrollTarget: RefObject<HTMLMainElement | null>;
};

export function GlobeGallery({ scrollTarget }: GlobeGalleryProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<THREE.Group>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const reducedMotion = useRef(prefersReducedMotion);
  const [isInView, setIsInView] = useState(true);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  const { scrollYProgress } = useScroll({
    target: scrollTarget as RefObject<HTMLElement | null>,
    offset: ["start start", "end end"],
  });
  const drag = useRef({ active: false, velocity: 0, x: 0, y: 0 });
  const explosionScale = useTransform(scrollYProgress, [0, 0.12, 0.55, 1], [1, 1.28, 2.15, 2.3]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current.active = true;
    drag.current.velocity = 0;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    event.currentTarget.classList.add("is-dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || !globeRef.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    const width = Math.max(event.currentTarget.clientWidth, 1);
    const height = Math.max(event.currentTarget.clientHeight, 1);
    globeRef.current.rotation.y += (dx / width) * Math.PI * 1.4;
    globeRef.current.rotation.x = THREE.MathUtils.clamp(
      globeRef.current.rotation.x + (dy / height) * Math.PI * 1.2,
      -0.72,
      0.72,
    );
    drag.current.velocity = (dx / width) * 2.4;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    event.currentTarget.classList.remove("is-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const updateMobile = () => setIsMobile(media.matches);
    updateMobile();
    media.addEventListener("change", updateMobile);
    return () => media.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = preference.matches;
    setPrefersReducedMotion(preference.matches);
    const updatePreference = (event: MediaQueryListEvent) => {
      reducedMotion.current = event.matches;
      setPrefersReducedMotion(event.matches);
    };
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "120px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`globe-interaction${drag.current.active ? " is-dragging" : ""}`}
      aria-label="Interactive gallery globe"
      role="img"
    >
      <div
        className="globe-drag-hit-area"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-hidden="true"
      />
      <div className="globe-orbit globe-orbit--one" aria-hidden="true" />
      <div className="globe-orbit globe-orbit--two" aria-hidden="true" />
      <motion.div className="globe-canvas-expansion" style={{ scale: prefersReducedMotion || isMobile ? 1 : explosionScale }}>
      <Canvas
        frameloop={isInView ? (prefersReducedMotion ? "demand" : "always") : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7.2], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        className="globe-canvas"
      >
        <ambientLight intensity={1.55} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <directionalLight position={[-4, -2, -3]} intensity={0.6} />
        <group ref={globeRef}>
          <Suspense fallback={null}>
            <GalleryPanels progress={scrollYProgress} reducedMotion={reducedMotion} />
          </Suspense>
        </group>
        <GlobeMotion globeRef={globeRef} progress={scrollYProgress} drag={drag} reducedMotion={reducedMotion} />
      </Canvas>
      </motion.div>
    </div>
  );
}