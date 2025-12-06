import React from 'react';
import { ShapeType } from '../types';
import { Maximize, Disc, Hexagon, Star, Heart, TreeDeciduous, Zap } from 'lucide-react';

interface UIOverlayProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  currentColor: string;
  setColor: (c: string) => void;
  handStatus: { isDetected: boolean; isOpen: boolean };
}

const shapes = [
  { type: ShapeType.HEART, icon: <Heart size={18} />, label: 'Heart' },
  { type: ShapeType.TREE, icon: <TreeDeciduous size={18} />, label: 'Tree' },
  { type: ShapeType.FLOWER, icon: <Disc size={18} />, label: 'Flower' },
  { type: ShapeType.STAR, icon: <Star size={18} />, label: 'Star' },
  { type: ShapeType.FIREWORKS, icon: <Zap size={18} />, label: 'Fireworks' },
];

const colors = [
  { hex: '#FFD700', name: 'Gold' },
  { hex: '#D4AF37', name: 'Metallic' },
  { hex: '#DC143C', name: 'Christmas Red' },
  { hex: '#2E8B57', name: 'Matte Green' },
  { hex: '#00FFFF', name: 'Cyan' },
  { hex: '#FF00FF', name: 'Magenta' },
];

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  currentShape, 
  setShape, 
  currentColor, 
  setColor, 
  handStatus 
}) => {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl">
           <h1 className="text-white font-bold text-xl tracking-wider mb-1 bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
             MERRY PARTICLES
           </h1>
           <p className="text-gray-400 text-xs uppercase tracking-widest">Interactive Hand Control</p>
           
           <div className="mt-2 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${handStatus.isDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             <span className="text-xs text-gray-300">
               {handStatus.isDetected 
                 ? (handStatus.isOpen ? "Status: OPEN (Scatter)" : "Status: CLOSED (Contract)") 
                 : "No Hand Detected"}
             </span>
           </div>
        </div>

        <button 
          onClick={toggleFullScreen}
          className="bg-black/40 hover:bg-white/10 backdrop-blur-md p-3 rounded-full text-white transition-all active:scale-95 border border-white/10"
        >
          <Maximize size={20} />
        </button>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-end pointer-events-auto">
        
        {/* Shape Selector */}
        <div className="bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl flex gap-2 overflow-x-auto max-w-full">
          {shapes.map((s) => (
            <button
              key={s.type}
              onClick={() => setShape(s.type)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                currentShape === s.type 
                  ? 'bg-white/20 text-white shadow-lg scale-105 border border-white/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s.icon}
              <span className="text-sm font-medium">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Color Selector */}
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl flex gap-2">
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => setColor(c.hex)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                currentColor === c.hex ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent opacity-70'
              }`}
              style={{ backgroundColor: c.hex, color: c.hex }}
              title={c.name}
            />
          ))}
          <input 
            type="color" 
            value={currentColor}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0 opacity-0 absolute"
          />
           <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-white/50 text-xs">
             +
           </div>
        </div>

      </div>
    </div>
  );
};

export default UIOverlay;