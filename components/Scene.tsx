import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrbitControls } from '@react-three/drei';
import Particles from './Particles';
import { ShapeType } from '../types';

interface SceneProps {
  shape: ShapeType;
  color: string;
  openness: number;
  isHandDetected: boolean;
}

const Scene: React.FC<SceneProps> = ({ shape, color, openness, isHandDetected }) => {
  return (
    <div className="w-full h-full relative bg-gradient-to-b from-gray-900 to-black">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }} gl={{ antialias: false }}>
        <color attach="background" args={['#050505']} />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={color} />

        <Particles 
            shape={shape} 
            color={color} 
            openness={openness} 
            isHandDetected={isHandDetected}
        />

        <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate={!isHandDetected} 
            autoRotateSpeed={0.5}
        />

        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.2} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.4} 
          />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Scene;