import React, { useState, useCallback } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import HandTracker from './components/HandTracker';
import { ShapeType, HandData } from './types';

function App() {
  const [shape, setShape] = useState<ShapeType>(ShapeType.TREE);
  const [color, setColor] = useState<string>('#D4AF37'); // Default Metallic Gold
  
  // Hand State
  const [handData, setHandData] = useState<HandData>({
    isDetected: false,
    isOpen: true,
    openness: 1.0,
    position: { x: 0, y: 0 }
  });

  const handleHandUpdate = useCallback((data: HandData) => {
    // Smooth state updates to avoid React jitter if needed, 
    // but here we pass raw data to let the 3D loop handle interpolation
    setHandData(data);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans selection:bg-none">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene 
            shape={shape} 
            color={color} 
            openness={handData.openness}
            isHandDetected={handData.isDetected}
        />
      </div>

      {/* Computer Vision Layer (Invisible/Pip) */}
      <HandTracker onHandUpdate={handleHandUpdate} />

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay 
          currentShape={shape} 
          setShape={setShape} 
          currentColor={color}
          setColor={setColor}
          handStatus={{ isDetected: handData.isDetected, isOpen: handData.isOpen }}
        />
      </div>
      
    </div>
  );
}

export default App;