import React, { useRef, useState, useEffect } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  MapPin, 
  Compass, 
  User, 
  Building2, 
  Clock, 
  SwitchCamera, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export interface GeotagMetadata {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  siteName: string;
  userName: string;
  compassHeading: number;
  compassDirection: string;
  isoTimestamp: string;
  formattedTimestamp: string;
}

interface GeotagCameraProps {
  onCapture: (base64: string, metadata?: GeotagMetadata) => void;
  onClose: () => void;
  siteName?: string;
  userName?: string;
}

const getCardinalDirection = (deg: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return directions[index];
};

// Haversine distance in meters
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export default function GeotagCamera({ onCapture, onClose, siteName, userName }: GeotagCameraProps) {
  const { user, token } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [heading, setHeading] = useState<number>(225); // default fallback bearing SW
  const [isLiveCompass, setIsLiveCompass] = useState<boolean>(false);
  const [detectedSite, setDetectedSite] = useState<string>(siteName || 'Detecting Site...');
  const [photographerName, setPhotographerName] = useState<string>(userName || user?.full_name || 'Field Operator');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Post-capture review state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedRawMeta, setCapturedRawMeta] = useState<GeotagMetadata | null>(null);
  const [capturedMeta, setCapturedMeta] = useState<{
    timestamp: string;
    locationStr: string;
    siteNameStr: string;
    personStr: string;
    compassStr: string;
  } | null>(null);

  useEffect(() => {
    startCamera(facingMode);
    getCoordsAndDetectSite();
    setupCompass();

    return () => {
      stopCamera();
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, [facingMode]);

  useEffect(() => {
    if (userName) setPhotographerName(userName);
    else if (user?.full_name) setPhotographerName(user.full_name);
  }, [userName, user]);

  useEffect(() => {
    if (siteName) setDetectedSite(siteName);
  }, [siteName]);

  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      setLoading(true);
      setError(null);

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please verify device permissions.');
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const setupCompass = () => {
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  const handleOrientation = (e: any) => {
    let deg: number | null = null;
    if (e.webkitCompassHeading) {
      deg = e.webkitCompassHeading; // iOS Safari
    } else if (e.alpha !== null && e.alpha !== undefined) {
      deg = (360 - e.alpha) % 360; // Standard Android / Web
    }

    if (deg !== null && !isNaN(deg)) {
      setHeading(Math.round(deg));
      setIsLiveCompass(true);
    }
  };

  const getCoordsAndDetectSite = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCoords({ lat: userLat, lng: userLng, accuracy: pos.coords.accuracy });

        // Auto-detect site by matching GPS coordinates against sites list if siteName is not provided
        if (!siteName && token) {
          try {
            const allSites = await api.get('/api/sites', token);
            if (Array.isArray(allSites) && allSites.length > 0) {
              let nearest = allSites[0];
              let minDistance = Infinity;

              allSites.forEach((s) => {
                if (s.latitude && s.longitude) {
                  const dist = getDistanceMeters(userLat, userLng, Number(s.latitude), Number(s.longitude));
                  if (dist < minDistance) {
                    minDistance = dist;
                    nearest = s;
                  }
                }
              });

              if (minDistance < 50000) {
                // within 50km
                const distText = minDistance < 1000 ? `${Math.round(minDistance)}m away` : `${(minDistance / 1000).toFixed(1)}km away`;
                setDetectedSite(`${nearest.name} (${distText})`);
              } else if (nearest?.name) {
                setDetectedSite(nearest.name);
              } else {
                setDetectedSite(`GPS: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`);
              }
            } else {
              setDetectedSite(`GPS: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`);
            }
          } catch (err) {
            console.error('Site auto-detect error:', err);
            setDetectedSite(`GPS: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`);
          }
        } else if (!siteName) {
          setDetectedSite(`GPS: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (!siteName) setDetectedSite('Location Service Disabled');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Prepare metadata
    const now = new Date();
    const timestampStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    const locationStr = coords
      ? `${coords.lat.toFixed(6)}°, ${coords.lng.toFixed(6)}° (±${Math.round(coords.accuracy || 5)}m)`
      : 'GPS Unavailable';
    const siteStr = detectedSite || siteName || 'FlowVerge Site';
    const personStr = photographerName;
    const compassStr = `${heading}° ${getCardinalDirection(heading)}`;

    // Draw Watermark Overlay Bar
    const overlayHeight = Math.max(120, Math.round(canvas.height * 0.18));
    const overlayY = canvas.height - overlayHeight;

    // Gradient background
    const grad = ctx.createLinearGradient(0, overlayY, 0, canvas.height);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, overlayY, canvas.width, overlayHeight);

    // Accent line
    ctx.fillStyle = '#10b981'; // emerald green
    ctx.fillRect(0, overlayY, canvas.width, 4);

    // Watermark Typography
    const fontSizeMain = Math.max(14, Math.round(canvas.width * 0.02));
    const fontSizeTitle = Math.max(16, Math.round(canvas.width * 0.024));

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSizeTitle}px sans-serif`;
    ctx.fillText('FLOWVERGE GEOTAG AUDIT PROOF', 24, overlayY + fontSizeTitle + 10);

    ctx.font = `${fontSizeMain}px sans-serif`;
    ctx.fillStyle = '#e4e4e7'; // zinc-200

    const lineGap = fontSizeMain * 1.35;
    let currentY = overlayY + fontSizeTitle + 15 + lineGap;

    ctx.fillText(`📍 GPS LAT/LNG: ${locationStr}`, 24, currentY);
    currentY += lineGap;

    ctx.fillText(`🏗️ SITE: ${siteStr}`, 24, currentY);
    currentY += lineGap;

    ctx.fillText(`👤 OPERATOR: ${personStr}  |  🧭 COMPASS: ${compassStr}`, 24, currentY);

    // Draw Right-aligned timestamp & compass rose graphics
    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.font = `bold ${fontSizeMain}px sans-serif`;
    ctx.fillText(`🕒 ${timestampStr}`, canvas.width - 24, overlayY + fontSizeTitle + 10);

    ctx.font = `${fontSizeMain}px sans-serif`;
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`BEARING: ${compassStr}`, canvas.width - 24, overlayY + fontSizeTitle + 10 + lineGap);

    // Reset alignment
    ctx.textAlign = 'left';

    const base64 = canvas.toDataURL('image/jpeg', 0.88);

    const rawMeta: GeotagMetadata = {
      latitude: coords ? coords.lat : null,
      longitude: coords ? coords.lng : null,
      accuracy: coords ? coords.accuracy || null : null,
      siteName: siteStr,
      userName: personStr,
      compassHeading: heading,
      compassDirection: getCardinalDirection(heading),
      isoTimestamp: now.toISOString(),
      formattedTimestamp: timestampStr
    };

    setCapturedImage(base64);
    setCapturedRawMeta(rawMeta);
    setCapturedMeta({
      timestamp: timestampStr,
      locationStr,
      siteNameStr: siteStr,
      personStr,
      compassStr,
    });
  };

  const handleConfirmCapturedPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage, capturedRawMeta || undefined);
    }
  };

  const handleDownloadMetadataJSON = () => {
    if (!capturedRawMeta) return;
    const blob = new Blob([JSON.stringify(capturedRawMeta, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geotag_metadata_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedRawMeta(null);
    setCapturedMeta(null);
  };

  const currentCardinal = getCardinalDirection(heading);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">
      {/* Top Bar Navigation */}
      <div className="p-4 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center text-white border-b border-white/10 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Geotag Industrial Camera</h3>
            <p className="text-[10px] text-zinc-400">Live Compass & Metadata Stamping</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-zinc-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-950">
        {capturedImage ? (
          /* Captured Photo Review & Details Overlay */
          <div className="w-full h-full relative flex flex-col justify-between items-center p-4">
            <div className="relative w-full flex-1 max-w-4xl max-h-[70vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black flex items-center justify-center">
              <img src={capturedImage} alt="Captured Audit Proof" className="w-full h-full object-contain" />
              <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Photo Stamped & Ready
              </div>
            </div>

            {/* Structured Metadata Summary Card */}
            {capturedMeta && (
              <div className="w-full max-w-4xl bg-zinc-900 border border-white/15 rounded-2xl p-4 my-3 text-xs space-y-2 text-zinc-200 shadow-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1 border-b border-white/10 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                    Detected Photo Metadata (JSON)
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadMetadataJSON}
                      className="text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Save JSON Attachment
                    </button>
                    <span className="text-zinc-400">{capturedMeta.timestamp}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block font-bold uppercase">📍 Lat / Long</span>
                    <span className="font-semibold text-white truncate block">{capturedMeta.locationStr}</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block font-bold uppercase">🏗️ Site Name</span>
                    <span className="font-semibold text-white truncate block">{capturedMeta.siteNameStr}</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block font-bold uppercase">👤 Operator</span>
                    <span className="font-semibold text-white truncate block">{capturedMeta.personStr}</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block font-bold uppercase">🧭 Compass Heading</span>
                    <span className="font-semibold text-emerald-400 truncate block">{capturedMeta.compassStr}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Live Camera Stream & Live HUD Overlays */
          <>
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 gap-3 text-emerald-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider">Starting Live Camera...</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 p-8 text-center text-white">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <p className="font-bold text-sm mb-4">{error}</p>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  Retry Camera
                </button>
              </div>
            )}

            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

            {/* Live Camera HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              {/* Top HUD Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Live Compass Widget */}
                <div className="bg-black/75 backdrop-blur-md border border-white/15 px-3 py-2 rounded-2xl text-white flex items-center gap-3 shadow-2xl pointer-events-auto">
                  <div className="relative w-9 h-9 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center">
                    {/* Compass Needle */}
                    <div
                      className="absolute w-1 h-7 bg-transparent transition-transform duration-200 flex flex-col justify-between items-center"
                      style={{ transform: `rotate(${heading}deg)` }}
                    >
                      <div className="w-1.5 h-3 bg-rose-500 rounded-t-full" />
                      <div className="w-1.5 h-3 bg-white/40 rounded-b-full" />
                    </div>
                    <span className="text-[8px] font-bold text-zinc-400 z-10">N</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                      <Compass className="w-3 h-3 text-emerald-400" />
                      Compass Heading
                    </div>
                    <div className="text-xs font-extrabold text-white">
                      {heading}° <span className="text-emerald-400 font-bold">{currentCardinal}</span>
                      {!isLiveCompass && <span className="text-[9px] text-zinc-500 ml-1 font-normal">(Sensor Auto)</span>}
                    </div>
                  </div>
                </div>

                {/* GPS Badge */}
                <div className="bg-black/75 backdrop-blur-md border border-white/15 px-3 py-2 rounded-2xl text-white flex items-center gap-2 shadow-2xl">
                  <MapPin className={`w-4 h-4 ${coords ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                  <div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">GPS Position</div>
                    <div className="text-xs font-bold text-white">
                      {coords ? `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°` : 'Acquiring GPS...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom HUD Metadata Banner */}
              <div className="bg-black/80 backdrop-blur-md border border-white/15 p-3 rounded-2xl text-white space-y-1 shadow-2xl max-w-lg">
                <div className="flex items-center justify-between text-[11px] border-b border-white/10 pb-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Site: <span className="text-white font-extrabold">{detectedSite}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    Auditor: <strong className="text-white">{photographerName}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    Realtime Stamping
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Control Dock */}
      <div className="p-6 bg-zinc-950 border-t border-white/10 flex justify-center items-center gap-8 z-20">
        {capturedImage ? (
          <div className="flex items-center justify-center gap-4 w-full max-w-md">
            <button
              onClick={handleRetake}
              className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Photo
            </button>
            <button
              onClick={handleConfirmCapturedPhoto}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Use Photo Proof
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-around w-full max-w-md">
            {/* Manual Compass Adjuster / Refresh */}
            <button
              onClick={() => setHeading((prev) => (prev + 45) % 360)}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xl border border-white/10 transition-all flex flex-col items-center gap-1"
              title="Rotate Compass Heading"
            >
              <Compass className="w-5 h-5 text-emerald-400" />
              <span className="text-[9px] font-bold text-zinc-400">Step Heading</span>
            </button>

            {/* Shutter Button */}
            <button
              onClick={capturePhoto}
              disabled={loading || !!error}
              className="w-20 h-20 rounded-full border-4 border-white/90 bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all disabled:opacity-50 shadow-2xl"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner">
                <div className="w-12 h-12 rounded-full border-2 border-zinc-300" />
              </div>
            </button>

            {/* Flip Camera Button */}
            <button
              onClick={toggleCamera}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xl border border-white/10 transition-all flex flex-col items-center gap-1"
              title="Switch Camera"
            >
              <SwitchCamera className="w-5 h-5 text-zinc-300" />
              <span className="text-[9px] font-bold text-zinc-400">Flip Cam</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
