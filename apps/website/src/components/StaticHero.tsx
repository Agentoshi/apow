"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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

// Static connection line
function ConnectionLine({ targetPos }: { targetPos: THREE.Vector3 }) {
  const lineRef = useRef<THREE.Line>(null);
  const points = useMemo(() => [new THREE.Vector3(0, 0, 0), targetPos.clone()], [targetPos]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const material = useMemo(() => new THREE.LineBasicMaterial({ color: "#0052FF", opacity: 0.15, transparent: true }), []);

  return <primitive object={new THREE.Line(geometry, material)} ref={lineRef} />;
}

// Static miner node (no rotation)
function MinerNode({ position, index }: { position: THREE.Vector3; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

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
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
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
    </group>
  );
}

// Central orb (static)
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

// Static mining network scene
function StaticMiningNetwork({ onReady }: { onReady?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const stableOnReady = useCallback(() => onReady?.(), [onReady]);

  // Static positions for 10 miner nodes (no rotation)
  const miners = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const count = 10;
    const radius = 2.7;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle * 0.7) * radius * 0.4;
      const z = Math.sin(angle) * radius;
      positions.push(new THREE.Vector3(x, y, z));
    }

    return positions;
  }, []);

  return (
    <group ref={groupRef} position={[0.5, 0, 0]}>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} intensity={0.6} color="#0052FF" />
      <pointLight position={[-3, -3, 3]} intensity={0.3} color="#0052FF" />

      <CentralOrb onReady={stableOnReady} />

      {miners.map((position, i) => (
        <MinerNode key={i} position={position} index={i} />
      ))}
    </group>
  );
}

export default function StaticHero({ onReady }: { onReady?: () => void }) {
  return (
    <div className="w-full h-full relative">
      <div
        className="absolute pointer-events-none"
        style={{
          right: "0%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "60%",
          height: "80%",
          background: "radial-gradient(ellipse at center, rgba(0,82,255,0.2) 0%, rgba(0,82,255,0.08) 30%, rgba(0,82,255,0.03) 50%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
      <Canvas
        camera={{ position: [-2, 0, 0.3], fov: 50 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent", position: "relative", zIndex: 1, pointerEvents: "auto" }}
        dpr={[1, 2]}
      >
        <StaticMiningNetwork onReady={onReady} />
      </Canvas>
    </div>
  );
}
