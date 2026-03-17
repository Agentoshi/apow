"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDitherScale;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  // Bayer dithering via recursive mathematical formulation
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

    // Lambertian diffuse
    float diffuse = max(dot(normal, viewDir), 0.0);

    // Fresnel rim glow — strong for holographic look
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

    // Pulsing energy
    float pulse = sin(uTime * 1.5) * 0.1 + 0.9;

    // Combined luminance
    float luminance = diffuse * 0.4 + fresnel * 1.0 + 0.05;
    luminance *= pulse;

    // Ordered dithering (8x8 Bayer)
    vec2 pixelPos = gl_FragCoord.xy / uDitherScale;
    float threshold = bayer8(pixelPos);
    float dithered = step(threshold, luminance);

    // Output color — exceeds 1.0 for bloom pickup
    vec3 baseColor = uColor * dithered;
    vec3 rimGlow = uColor * fresnel * 3.5 * dithered;
    vec3 finalColor = baseColor + rimGlow;

    // Wireframe edge hint via normal discontinuity
    float edgeFactor = 1.0 - abs(dot(normal, viewDir));
    finalColor += uColor * 0.5 * smoothstep(0.8, 1.0, edgeFactor);

    // Inner core glow — always visible even without dither
    finalColor += uColor * 0.08 * fresnel;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function DitheredIcosahedron() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#0052FF") },
      uDitherScale: { value: 2.5 },
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.004;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.08;
      uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[2.2, 0, 0]}>
      <icosahedronGeometry args={[1.8, 5]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        toneMapped={false}
        transparent={false}
      />
    </mesh>
  );
}

export default function DitheredHero() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      gl={{ antialias: false, alpha: true }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <DitheredIcosahedron />
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.3}
          radius={0.4}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
