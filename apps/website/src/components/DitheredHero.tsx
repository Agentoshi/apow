"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const ditherVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const ditherFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform float uDitherScale;
  uniform float uLogoScale;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  float bayer2(vec2 a) {
    a = floor(a);
    return fract(dot(a, vec2(0.5, a.y * 0.75)));
  }

  float bayer4(vec2 a) {
    return bayer2(0.5 * a) * 0.25 + bayer2(a);
  }

  float bayer8(vec2 a) {
    return bayer4(0.5 * a) * 0.25 + bayer2(a);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float diffuse = max(dot(normal, viewDir), 0.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
    float pulse = sin(uTime * 1.5) * 0.1 + 0.9;

    float luminance = diffuse * 0.4 + fresnel * 1.0 + 0.05;
    luminance *= pulse;

    vec2 pixelPos = gl_FragCoord.xy / uDitherScale;
    float threshold = bayer8(pixelPos);
    float dithered = step(threshold, luminance);

    // Scale UV from center for smaller logo
    vec2 centeredUv = (vUv - 0.5) * uLogoScale + 0.5;
    vec4 texColor = texture2D(uTexture, centeredUv);

    vec3 baseColor = mix(uColor * 0.3, texColor.rgb, texColor.a) * dithered;
    vec3 rimGlow = uColor * fresnel * 3.0 * dithered;
    vec3 finalColor = baseColor + rimGlow;

    float edgeFactor = 1.0 - abs(dot(normal, viewDir));
    finalColor += uColor * 0.5 * smoothstep(0.8, 1.0, edgeFactor);
    finalColor += uColor * 0.1 * fresnel;

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;

// Connection line from center to miner
function ConnectionLine({ targetPos }: { targetPos: THREE.Vector3 }) {
  const lineRef = useRef<THREE.Line>(null);
  const points = useMemo(() => [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)], []);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const material = useMemo(() => new THREE.LineBasicMaterial({ color: "#0052FF", opacity: 0.15, transparent: true }), []);
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useFrame(() => {
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position;
      positions.setXYZ(1, targetPos.x, targetPos.y, targetPos.z);
      positions.needsUpdate = true;
    }
  });

  return <primitive object={line} ref={lineRef} />;
}

// Mining particle traveling from center to miner (coin-shaped)
function MiningToken({ targetPos, delay }: { targetPos: THREE.Vector3; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: null },
      uColor: { value: new THREE.Color("#00FFFF") }, // Bright cyan
      uDitherScale: { value: 2.0 },
      uLogoScale: { value: 1.0 },
      uOpacity: { value: 1.0 },
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      const t = (state.clock.elapsedTime + delay) % 3;
      const progress = t / 3;

      meshRef.current.position.lerpVectors(new THREE.Vector3(0, 0, 0), targetPos, progress);

      // Coin shape - wider on X/Z, thinner on Y
      const baseScale = 0.08 * (1 - Math.abs(progress - 0.5) * 0.5);
      meshRef.current.scale.set(baseScale, baseScale * 0.15, baseScale); // Flattened coin

      // Spin the coin as it travels
      meshRef.current.rotation.y = state.clock.elapsedTime * 3 + delay;

      const opacity = Math.sin(progress * Math.PI);
      uniforms.uTime.value = state.clock.elapsedTime;
      uniforms.uOpacity.value = opacity * 1.0;
    }
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[1, 1, 0.2, 32]} />
      <shaderMaterial
        vertexShader={ditherVertexShader}
        fragmentShader={ditherFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

// Miner node
function MinerNode({ angle, radius, speed, index }: { angle: number; radius: number; speed: number; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useMemo(() => new THREE.Vector3(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: null },
      uColor: { value: new THREE.Color("#0052FF") },
      uDitherScale: { value: 2.5 },
      uLogoScale: { value: 1.0 },
      uOpacity: { value: 1.0 },
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed + angle;
      position.x = Math.cos(t) * radius;
      position.y = Math.sin(t * 0.7) * radius * 0.4;
      position.z = Math.sin(t) * radius;
      meshRef.current.position.copy(position);
      uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <shaderMaterial
          vertexShader={ditherVertexShader}
          fragmentShader={ditherFragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <ConnectionLine targetPos={position} />
      <MiningToken targetPos={position} delay={index * 0.4} />
    </group>
  );
}

// Central dithered sphere
function CentralOrb({ onReady }: { onReady?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const firedRef = useRef(false);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: null },
      uColor: { value: new THREE.Color("#0052FF") },
      uDitherScale: { value: 2.5 },
      uLogoScale: { value: 1.0 },
      uOpacity: { value: 1.0 },
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      uniforms.uTime.value = state.clock.elapsedTime;

      if (!firedRef.current) {
        firedRef.current = true;
        onReady?.();
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={ditherVertexShader}
        fragmentShader={ditherFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// Mining network scene
function MiningNetwork({ onReady }: { onReady?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const stableOnReady = useCallback(() => onReady?.(), [onReady]);

  // 10 miner nodes - spread out for better distribution
  const miners = useMemo(() => [
    { angle: (0 * Math.PI) / 5, radius: 2.8, speed: 0.03 },    // 0°
    { angle: (1 * Math.PI) / 5, radius: 2.6, speed: 0.035 },   // 36°
    { angle: (2 * Math.PI) / 5, radius: 2.9, speed: 0.028 },   // 72°
    { angle: (3 * Math.PI) / 5, radius: 2.7, speed: 0.032 },   // 108°
    { angle: 1.28 * Math.PI, radius: 2.5, speed: 0.029 },      // 230°
    { angle: Math.PI, radius: 3.0, speed: 0.033 },             // 180°
    { angle: 1.11 * Math.PI, radius: 2.6, speed: 0.031 },      // 200° - moved from 216° to spread out
    { angle: (7 * Math.PI) / 5, radius: 2.8, speed: 0.034 },   // 252°
    { angle: (8 * Math.PI) / 5, radius: 2.4, speed: 0.027 },   // 288°
    { angle: (9 * Math.PI) / 5, radius: 2.7, speed: 0.036 },   // 324°
  ], []);

  return (
    <group ref={groupRef} position={[2.2, 0, 0]}>
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 3]} intensity={0.6} color="#0052FF" />
        <pointLight position={[-3, -3, 3]} intensity={0.3} color="#0052FF" />

        <CentralOrb onReady={stableOnReady} />

        {miners.map((miner, i) => (
          <MinerNode key={i} {...miner} index={i} />
        ))}
      </group>
  );
}

export default function DitheredHero({ onReady }: { onReady?: () => void }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Zoom out camera on mobile
  const cameraPosition: [number, number, number] = isMobile ? [-3.5, 0, 0.3] : [-2, 0, 0.3];

  return (
    <div className="w-full h-full relative">
      <div
        className="absolute pointer-events-none"
        style={{
          right: "-5%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "55%",
          height: "80%",
          background: "radial-gradient(ellipse at center, rgba(0,82,255,0.2) 0%, rgba(0,82,255,0.08) 30%, rgba(0,82,255,0.03) 50%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent", position: "relative", zIndex: 1, pointerEvents: "auto" }}
        dpr={[1, 2]}
      >
        <MiningNetwork onReady={onReady} />
      </Canvas>
    </div>
  );
}
