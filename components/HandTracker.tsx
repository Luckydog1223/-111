import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let drawingUtils: DrawingUtils | null = null;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (canvasRef.current) {
            drawingUtils = new DrawingUtils(canvasRef.current.getContext("2d")!);
        }

        startWebcam();
      } catch (err) {
        console.error("Error initializing MediaPipe:", err);
        setError("Failed to load AI models.");
        setLoading(false);
      }
    };

    const startWebcam = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: "user" } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setLoading(false);
      } catch (err) {
        console.error("Webcam error:", err);
        setError("Camera permission denied or not available.");
        setLoading(false);
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Match canvas size to video size
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(video, startTimeMs);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let handData: HandData = {
        isDetected: false,
        isOpen: true,
        openness: 1.0,
        position: { x: 0, y: 0 }
      };

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Draw landmarks
        // drawingUtils?.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
        // drawingUtils?.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1 });

        // Calculate Openness: Distance between wrist (0) and middle finger tip (12)
        // Normalized by wrist to middle_mcp (9) to account for distance from camera
        const wrist = landmarks[0];
        const middleTip = landmarks[12];
        const middleMcp = landmarks[9];

        const palmSize = Math.sqrt(
            Math.pow(middleMcp.x - wrist.x, 2) + 
            Math.pow(middleMcp.y - wrist.y, 2)
        );

        const tipDistance = Math.sqrt(
            Math.pow(middleTip.x - wrist.x, 2) + 
            Math.pow(middleTip.y - wrist.y, 2)
        );

        // Heuristic: If tip is far from wrist relative to palm size, it's open
        // Ratio usually ~1.8-2.0 for open, ~0.8-1.0 for closed
        const ratio = tipDistance / palmSize;
        
        // Map 0.8 -> 0 (closed), 1.8 -> 1 (open)
        let openness = (ratio - 0.8) / (1.8 - 0.8);
        openness = Math.max(0, Math.min(1, openness));

        handData = {
            isDetected: true,
            isOpen: openness > 0.5,
            openness: openness,
            position: { x: landmarks[9].x, y: landmarks[9].y }
        };
      }

      onHandUpdate(handData);
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      handLandmarker?.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, [onHandUpdate]);

  return (
    <div className="absolute top-4 right-4 w-32 h-24 rounded-lg overflow-hidden border border-white/20 shadow-lg z-50 bg-black/50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
          Loading AI...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400 text-center p-1">
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-cover opacity-50 transform scale-x-[-1]"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
      />
      <div className="absolute bottom-0 left-0 w-full bg-black/60 text-[10px] text-white text-center py-0.5">
        Hand Tracker
      </div>
    </div>
  );
};

export default HandTracker;