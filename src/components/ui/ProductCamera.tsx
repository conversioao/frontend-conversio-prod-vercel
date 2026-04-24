import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Zap, Sparkles, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBlob: Blob, imageUrl: string) => void;
}

export function ProductCamera({ isOpen, onClose, onCapture }: ProductCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetected, setIsDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  // Simulate product detection every few seconds
  useEffect(() => {
    if (stream && !isDetected) {
      const timer = setTimeout(() => {
        setIsDetected(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [stream, isDetected]);

  async function startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Não foi possível aceder à câmara. Verifique as permissões.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsDetected(false);
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          onCapture(blob, url);
          onClose();
        }
        setIsCapturing(false);
      }, 'image/jpeg', 0.9);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Camera Feed */}
        <div className="relative w-full h-full flex items-center justify-center">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />

          {/* Scanner UI Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Detection Frame */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                borderColor: isDetected ? '#FFB800' : 'rgba(255, 255, 255, 0.3)' 
              }}
              className="relative w-72 h-72 sm:w-80 sm:h-80 border-2 rounded-[2rem] transition-colors duration-500"
            >
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#FFB800] rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#FFB800] rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#FFB800] rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#FFB800] rounded-br-2xl" />

              {/* Scanning Line */}
              {!isCapturing && (
                <motion.div 
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent shadow-[0_0_15px_#FFB800]"
                />
              )}

              {/* Detection Points (Visual) */}
              {isDetected && (
                <>
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#FFB800] rounded-full shadow-[0_0_8px_#FFB800]" 
                  />
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
                    className="absolute top-2/3 right-1/3 w-2 h-2 bg-[#FFB800] rounded-full shadow-[0_0_8px_#FFB800]" 
                  />
                </>
              )}
            </motion.div>

            {/* Status Text */}
            <div className="absolute bottom-[20%] left-0 right-0 text-center flex flex-col items-center gap-2">
              <motion.div 
                animate={isDetected ? { scale: [1, 1.1, 1] } : {}}
                className={`px-4 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-2 ${
                  isDetected ? 'bg-[#FFB800]/20 border-[#FFB800] text-[#FFB800]' : 'bg-black/40 border-white/20 text-white/70'
                }`}
              >
                {isDetected ? <Sparkles size={14} /> : <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isDetected ? 'Produto Identificado' : 'A Analisar Ambiente...'}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Controls Overlay */}
          <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
             <button onClick={onClose} className="p-3 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-md">
               <X size={24} />
             </button>
             <div className="flex flex-col items-center">
               <span className="text-[8px] font-black text-[#FFB800] uppercase tracking-[0.3em] mb-1">Conversio</span>
               <span className="text-[10px] font-bold text-white uppercase tracking-widest">UGC Scanner</span>
             </div>
             <button onClick={startCamera} className="p-3 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-md">
               <RefreshCcw size={20} />
             </button>
          </div>

          {/* Capture Button */}
          <div className="absolute inset-x-0 bottom-0 p-10 flex justify-center items-center bg-gradient-to-t from-black/60 to-transparent">
            {error ? (
              <p className="text-red-500 text-xs text-center bg-black/80 px-4 py-2 rounded-xl">{error}</p>
            ) : (
              <button 
                onClick={handleCapture}
                disabled={!isDetected || isCapturing}
                className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  isDetected ? 'border-[#FFB800] scale-110' : 'border-white/30 opacity-50'
                }`}
              >
                <div className={`w-16 h-16 rounded-full transition-all duration-300 ${
                  isDetected ? 'bg-[#FFB800] shadow-[0_0_30px_rgba(255,184,0,0.5)]' : 'bg-white/20'
                }`} />
                {isCapturing ? (
                  <Loader2 size={24} className="absolute text-black animate-spin" />
                ) : (
                  <Camera size={32} className="absolute text-black" />
                )}
              </button>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}

function Loader2(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
