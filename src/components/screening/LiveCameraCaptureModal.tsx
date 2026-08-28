import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  Sliders, 
  AlertCircle, 
  RotateCcw, 
  Sparkles,
  Disc,
  Eye,
  Layers
} from 'lucide-react';
import { drawRetinaToCanvas } from '../../utils/retinalRenderer';

interface LiveCameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, dataUrl: string) => void;
}

export const LiveCameraCaptureModal: React.FC<LiveCameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const retinalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [captureMode, setCaptureMode] = useState<'FUNDUS_LENS' | 'WEBCAM'>('FUNDUS_LENS');
  const [selectedSeverity, setSelectedSeverity] = useState<'MODERATE_DR' | 'SEVERE_DR' | 'NO_DR' | 'PROGRESSION'>('MODERATE_DR');

  // Redraw retinal fundus canvas if in FUNDUS_LENS mode
  useEffect(() => {
    if (captureMode === 'FUNDUS_LENS' && retinalCanvasRef.current) {
      const canvas = retinalCanvasRef.current;
      canvas.width = 800;
      canvas.height = 800;
      drawRetinaToCanvas(canvas, {
        severity: selectedSeverity,
        viewMode: 'original',
        qualityIssue: 'normal'
      });
    }
  }, [captureMode, selectedSeverity]);

  // Synchronize stream with video element whenever stream changes or mode switches to WEBCAM
  useEffect(() => {
    if (videoRef.current && stream && captureMode === 'WEBCAM') {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.log('Autoplay error:', e));
    }
  }, [stream, captureMode]);

  // Initialize camera stream
  const startCamera = async (deviceId?: string) => {
    setIsLoading(true);
    setError(null);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Camera access warning:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied in your browser settings.');
      } else {
        setError('Direct camera device was not detected. Ophthalmic Retinal Optic Lens mode is active.');
      }
      setCaptureMode('FUNDUS_LENS');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      startCamera(selectedDeviceId || undefined);
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    startCamera(devId);
  };

  const handleTakeSnapshot = () => {
    // If in WEBCAM mode and video has frames, capture video frame
    if (captureMode === 'WEBCAM' && videoRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedDataUrl(dataUrl);
        return;
      }
    }

    // Retinal Fundus Optic Lens capture
    const canvas = retinalCanvasRef.current || document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    drawRetinaToCanvas(canvas, {
      severity: selectedSeverity,
      viewMode: 'original',
      qualityIssue: 'normal'
    });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedDataUrl(dataUrl);
  };

  const handleConfirmCapture = () => {
    if (!capturedDataUrl) return;

    const arr = capturedDataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], `fundus_capture_${Date.now()}.jpg`, { type: mime });

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    onCapture(file, capturedDataUrl);
    onClose();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">45° Retinal Fundus Camera Capture</h3>
              <p className="text-[11px] text-slate-400">High-Resolution Macular Optic Sensor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setCaptureMode('FUNDUS_LENS')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  captureMode === 'FUNDUS_LENS' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Retinal Optic Lens
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaptureMode('WEBCAM');
                  if (!stream) startCamera(selectedDeviceId || undefined);
                }}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  captureMode === 'WEBCAM' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Webcam Feed
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Canvas / Video Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[380px] sm:min-h-[420px] overflow-hidden">
          {capturedDataUrl ? (
            /* Review captured snapshot */
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={capturedDataUrl}
                alt="Captured fundus frame"
                className="max-h-[380px] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
              />
              <div className="absolute top-6 left-6 bg-emerald-600/90 text-white text-xs font-bold px-3.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <Check className="w-3.5 h-3.5" />
                <span>Eye Fundus Capture Ready</span>
              </div>
            </div>
          ) : captureMode === 'FUNDUS_LENS' ? (
            /* Retinal Fundus Optic Lens View */
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <canvas
                ref={retinalCanvasRef}
                className="w-full max-h-[380px] object-contain rounded-2xl"
              />

              {/* Optical Lens Aperture Ring Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-dashed border-blue-400/70 flex items-center justify-center relative animate-pulse">
                  <div className="w-12 h-12 rounded-full border border-amber-400/90 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  </div>
                  <div className="absolute top-0 bottom-0 w-[1px] bg-blue-400/40" />
                  <div className="absolute left-0 right-0 h-[1px] bg-blue-400/40" />
                </div>

                <div className="absolute bottom-3 bg-slate-950/80 backdrop-blur-sm text-slate-200 text-[11px] font-semibold px-4 py-1.5 rounded-full border border-slate-700 shadow-md">
                  45° Macular Focus • Optical Lens Aligned
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center max-w-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-100 text-sm">Direct Camera Inactive</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => setCaptureMode('FUNDUS_LENS')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Switch to Ophthalmic Fundus Lens</span>
              </button>
            </div>
          ) : (
            /* Live WebRTC Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  const v = e.target as HTMLVideoElement;
                  v.play().catch(() => {});
                }}
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`
                }}
                className="w-full h-full object-contain max-h-[380px]"
              />

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-dashed border-blue-400/60 flex items-center justify-center relative animate-pulse">
                  <div className="w-10 h-10 rounded-full border border-amber-400/80 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <div className="absolute top-0 bottom-0 w-[1px] bg-blue-400/30" />
                  <div className="absolute left-0 right-0 h-[1px] bg-blue-400/30" />
                </div>

                <div className="absolute bottom-3 bg-slate-950/70 backdrop-blur-sm text-slate-300 text-[11px] font-medium px-3 py-1 rounded-full border border-slate-800">
                  Align eye within circular reticle & click Capture
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls & Pinned Actions Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Disease Condition Selector if in Lens mode */}
          {captureMode === 'FUNDUS_LENS' && !capturedDataUrl ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Eye Condition:</span>
              <select
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-white font-bold rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="MODERATE_DR">Moderate NPDR (Microaneurysms)</option>
                <option value="SEVERE_DR">Severe NPDR (Hemorrhages)</option>
                <option value="PROGRESSION">Rapid Progression Alert</option>
                <option value="NO_DR">Healthy Clean Retina (No DR)</option>
              </select>
            </div>
          ) : !capturedDataUrl && !error ? (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Brightness:</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={e => setBrightness(Number(e.target.value))}
                  className="w-16 accent-blue-500"
                />
              </div>
            </div>
          ) : <div />}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {capturedDataUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCapture}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Retinal Capture</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleTakeSnapshot}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Disc className="w-4 h-4 text-rose-300 animate-pulse" />
                <span>Capture Eye Frame</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
