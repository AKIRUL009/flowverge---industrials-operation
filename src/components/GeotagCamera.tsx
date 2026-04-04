import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, MapPin } from 'lucide-react';

interface GeotagCameraProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export default function GeotagCamera({ onCapture, onClose }: GeotagCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    getCoords();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setLoading(true);
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setLoading(false);
    } catch (err: any) {
      setError('Could not access camera. Please check permissions.');
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const getCoords = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.error('Geolocation error:', err);
      }
    );
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Add Geotag Overlay
    const timestamp = new Date().toLocaleString();
    const locationStr = coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Location unavailable';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`FLOWVERGE PROOF`, 20, canvas.height - 50);
    
    ctx.font = '16px sans-serif';
    ctx.fillText(`${timestamp}`, 20, canvas.height - 25);
    ctx.fillText(`${locationStr}`, canvas.width - 250, canvas.height - 25);

    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(base64);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <MapPin className={`w-4 h-4 ${coords ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Acquiring GPS...'}
          </span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-white font-bold mb-4">{error}</p>
            <button onClick={startCamera} className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold">Retry</button>
          </div>
        )}

        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-8 flex justify-center items-center gap-12 bg-black/50 backdrop-blur-md">
        <button 
          onClick={capture}
          disabled={loading || !!error}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="w-16 h-16 bg-white rounded-full" />
        </button>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
