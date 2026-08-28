import React, { useRef, useEffect, useState } from 'react';
import { drawRetinaToCanvas } from '../../utils/retinalRenderer';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Eye, 
  Sparkles, 
  Target, 
  RefreshCw,
  Download
} from 'lucide-react';

interface RetinalCanvasViewerProps {
  severity?: 'NO_DR' | 'MILD_DR' | 'MODERATE_DR' | 'SEVERE_DR' | 'PROGRESSION';
  initialMode?: 'original' | 'attention' | 'overlay' | 'findings';
  height?: string;
  showControls?: boolean;
  highlightRegion?: string | null;
  qualityIssue?: 'blur' | 'dark' | 'normal';
  title?: string;
  badge?: string;
  imageUrl?: string | null;
}

export const RetinalCanvasViewer: React.FC<RetinalCanvasViewerProps> = ({
  severity = 'MODERATE_DR',
  initialMode = 'original',
  height = 'h-96 sm:h-[480px]',
  showControls = true,
  highlightRegion = null,
  qualityIssue = 'normal',
  title,
  badge,
  imageUrl
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'original' | 'attention' | 'overlay' | 'findings'>(initialMode);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Load uploaded/captured image if provided
  useEffect(() => {
    const effectiveUrl = imageUrl || localStorage.getItem('retinaguard_last_uploaded_retina_image');
    if (effectiveUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedImage(img);
      };
      img.src = effectiveUrl;
    } else {
      setLoadedImage(null);
    }
  }, [imageUrl]);

  // Redraw canvas whenever props, view mode, or loaded image changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 600) * dpr;
    canvas.height = (rect.height || 600) * dpr;

    drawRetinaToCanvas(canvas, {
      severity,
      viewMode: mode,
      showMarkers: mode === 'findings',
      highlightRegion,
      qualityIssue,
      loadedImage
    });
  }, [severity, mode, highlightRegion, qualityIssue, rotation, loadedImage]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `retina_scan_${title ? title.replace(/[^a-zA-Z0-9]/g, '_') : 'capture'}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 shadow-md ${height} ${
        isFullscreen ? 'p-6 fixed inset-0 z-50 rounded-none h-screen' : ''
      }`}
    >
      {/* Top Header / Mode Bar */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        {/* Title or Lens Info */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-white shadow-xs text-xs">
          <span className="w-2 h-2 rounded-full bg-brand-400" />
          <span className="font-semibold tracking-tight">{title || 'Fundus OD 45°'}</span>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {badge}
            </span>
          )}
        </div>

        {/* Layer Mode Switcher */}
        {showControls && (
          <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xs">
            <button
              onClick={() => setMode('original')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'original'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>

            <button
              onClick={() => setMode('attention')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'attention'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Attention</span>
            </button>

            <button
              onClick={() => setMode('overlay')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'overlay'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overlay</span>
            </button>

            <button
              onClick={() => setMode('findings')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'findings'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Findings</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas Area with Pan/Zoom Transforms */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain transition-transform duration-150 ease-out"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
        />

        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Floating Bottom Control Bar */}
      {showControls && (
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Zoom Level Indicator */}
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
            {Math.round(zoom * 100)}% • {rotation}°
          </div>

          {/* Quick Zoom & Rotate Actions */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xs">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset view (1:1)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDownloadImage}
              className="p-1.5 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Save / Download Captured Retina Image"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-800 mx-0.5" />
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
