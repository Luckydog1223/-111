import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType } from '../types';

interface ParticlesProps {
  shape: ShapeType;
  color: string;
  openness: number; // 0 (closed) to 1 (open)
  isHandDetected: boolean;
}

const COUNT = 4000;

// Math Helpers
const randomPointInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

const getShapePositions = (type: ShapeType): Float32Array => {
  const positions = new Float32Array(COUNT * 3);
  const vec = new THREE.Vector3();

  for (let i = 0; i < COUNT; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    if (type === ShapeType.HEART) {
      // Heart Equation
      // x = 16sin^3(t)
      // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      // z = varied depth
      const t = Math.random() * Math.PI * 2;
      const scale = 0.25;
      x = 16 * Math.pow(Math.sin(t), 3);
      y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      z = (Math.random() - 0.5) * 10; 
      
      // Add volume
      const r = Math.random() * 0.5;
      x += (Math.random() - 0.5) * r;
      y += (Math.random() - 0.5) * r;
      
      vec.set(x * scale, y * scale, z * scale);
    } 
    else if (type === ShapeType.FLOWER) {
      // Rose / Flower polar pattern
      const theta = Math.random() * Math.PI * 2;
      const k = 4; // petals
      const r = Math.cos(k * theta) * 3 + 1 + Math.random();
      const depth = (Math.random() - 0.5) * 2;
      x = r * Math.cos(theta);
      y = r * Math.sin(theta);
      z = depth + (Math.sin(r * 2) * 0.5); // curved petals
      vec.set(x, y, z);
    }
    else if (type === ShapeType.STAR) {
      // Star / Planet with rings
      if (i < COUNT * 0.2) {
         // Ring
         const angle = Math.random() * Math.PI * 2;
         const dist = 3.5 + Math.random() * 1.5;
         x = Math.cos(angle) * dist;
         y = (Math.random() - 0.5) * 0.2;
         z = Math.sin(angle) * dist;
      } else {
         // Core sphere
         const p = randomPointInSphere(1.5);
         x = p.x; y = p.y; z = p.z;
         // Spikes
         if (Math.random() > 0.9) {
             const len = 1 + Math.random() * 3;
             x *= len; y *= len; z *= len;
         }
      }
      vec.set(x, y, z);
    }
    else if (type === ShapeType.TREE) {
      // Cone Spiral (Christmas Tree)
      const h = Math.random() * 8 - 4; // Height from -4 to 4
      const normalizedH = (h + 4) / 8; // 0 at bottom, 1 at top
      const radiusAtH = (1 - normalizedH) * 3; // Wider at bottom
      const angle = h * 5 + Math.random() * Math.PI * 2; // Spiral
      const r = Math.random() * radiusAtH;
      
      x = r * Math.cos(angle);
      y = h;
      z = r * Math.sin(angle);
      vec.set(x, y, z);
    }
    else {
       // Fireworks / Sphere default
       const p = randomPointInSphere(4);
       vec.set(p.x, p.y, p.z);
    }

    positions[idx] = vec.x;
    positions[idx + 1] = vec.y;
    positions[idx + 2] = vec.z;
  }
  return positions;
};

const Particles: React.FC<ParticlesProps> = ({ shape, color, openness, isHandDetected }) => {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const pointsRef = useRef<THREE.Points>(null);
  
  // Precompute target positions for all shapes to switch instantly
  const targetPositions = useMemo(() => {
    return {
      [ShapeType.HEART]: getShapePositions(ShapeType.HEART),
      [ShapeType.FLOWER]: getShapePositions(ShapeType.FLOWER),
      [ShapeType.STAR]: getShapePositions(ShapeType.STAR),
      [ShapeType.TREE]: getShapePositions(ShapeType.TREE),
      [ShapeType.FIREWORKS]: getShapePositions(ShapeType.FIREWORKS),
    };
  }, []);

  // Initialize current positions
  const currentPositions = useMemo(() => new Float32Array(COUNT * 3), []);

  useFrame((state) => {
    if (!geomRef.current || !pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = geomRef.current.attributes.position.array as Float32Array;
    const target = targetPositions[shape];

    // Hand interaction logic
    // If hand detected: Openness controls expansion. 
    // Open = 1.0 (Normal size) -> 2.0 (Scattered)
    // Closed = 0.0 -> 0.2 (Contracted/Imploded)
    
    // Smoothly interpolate the "expansion" factor based on hand openness
    // Neutral state is 1.0
    const targetExpansion = isHandDetected 
        ? 0.2 + (openness * 1.8)  // Map 0..1 to 0.2..2.0
        : 1.0 + Math.sin(time * 0.5) * 0.1; // Idle breathing

    // Rotation
    pointsRef.current.rotation.y += 0.002;
    if (shape === ShapeType.STAR) {
        pointsRef.current.rotation.z = Math.sin(time * 0.2) * 0.1;
    } else {
        pointsRef.current.rotation.z = 0;
    }

    // Lerp particles
    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;
      
      // Get target coordinate
      const tx = target[idx];
      const ty = target[idx + 1];
      const tz = target[idx + 2];

      // Apply expansion factor to target
      // Add some noise based on expansion to simulate "Scatter"
      const scatter = Math.max(0, targetExpansion - 1.2) * (Math.random() - 0.5) * 2;
      
      const destX = tx * targetExpansion + scatter;
      const destY = ty * targetExpansion + scatter;
      const destZ = tz * targetExpansion + scatter;

      // Lerp current to dest
      // Speed factor: Fast if scattering, smooth if morphing
      const lerpFactor = 0.05;

      positions[idx] += (destX - positions[idx]) * lerpFactor;
      positions[idx + 1] += (destY - positions[idx]) * lerpFactor;
      positions[idx + 2] += (destZ - positions[idx]) * lerpFactor;
    }

    geomRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
};

export default Particles;