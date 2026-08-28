import React, { useState, useRef, useEffect, useCallback } from 'react';
import { drawRetinaToCanvas } from '../../utils/retinalRenderer';
import { 
  SlidersHorizontal, 
  Columns, 
  Zap, 
  Calendar, 
  TrendingUp, 
  MoveHorizontal 
} from 'lucide-react';

interface RetinalComparisonSliderProps {
  previousDate?: string;
  currentDate?: string;
  previousSeverity?: 'NO_DR' | 'MILD_DR' | 'MODERATE_DR' | 'SEVERE_DR';
  currentSeverity?: 'PROGRESSION' | 'SEVERE_DR' | 'MODERATE_DR';
}

export const RetinalComparisonSlider: React.FC<RetinalComparisonSliderProps> = ({
  previousDate = 'Jan 14, 2026',
  currentDate = 'Jul 15, 2026',
  previousSeverity = 'MODERATE_DR',
  currentSeverity = 'PROGRESSION'
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'blink'>('slider');
  const [sliderPos, setSliderPos] = useState(50);
  const [blinkCurrent, setBlinkCurrent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasPrevRef = useRef<HTMLCanvasElement>(null);
  const canvasCurrRef = useRef<HTMLCanvasElement>(null);

  // Blink interval
  useEffect(() => {
    if (viewMode !== 'blink') return;
    const interval = setInterval(() => {
      setBlinkCurrent(prev => !prev);
    }, 700);
    return () => clearInterval(interval);
  }, [viewMode]);

  // Redraw canvases
  const redrawCanvases = useCallback(() => {
    if (canvasPrevRef.current) {
      const pCanvas = canvasPrevRef.current;
      pCanvas.width = 700;
      pCanvas.height = 700;
      drawRetinaToCanvas(pCanvas, {
        severity: previousSeverity,
        viewMode: 'original'
      });
    }

    if (canvasCurrRef.current) {
      const cCanvas = canvasCurrRef.current;
      cCanvas.width = 700;
      cCanvas.height = 700;
      drawRetinaToCanvas(cCanvas, {
        severity: currentSeverity,
        viewMode: 'original'
      });
    }
  }, [previousSeverity, currentSeverity]);

  useEffect(() => {
    redrawCanvases();
  }, [redrawCanvases, viewMode]);

  // Mouse & Touch Drag Handlers
  const handleMouseDown = () => setIsDragging(true);

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, [isDragging]);

  const handleTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    const handleGlobalMove = (e: MouseEvent) => {
      if (isDragging) handleMouseMove(e);
    };

    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('mousemove', handleGlobalMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('mousemove', handleGlobalMove);
    };
  }, [isDragging, handleMouseMove]);

  return (
    <div className="bg-slate-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-md text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-300">Baseline: {previousDate}</span>
            <span className="text-slate-600 font-bold">vs</span>
            <span className="font-bold text-amber-400">Current: {currentDate}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>6-Month Longitudinal Diff</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'slider'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setViewMode('blink')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'blink'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Blink Diff</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Canvas View */}
      {viewMode === 'slider' && (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchMove={handleTouchMove}
          className="relative w-full h-80 sm:h-[480px] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-slate-900 border border-slate-800"
        >
          {/* Current Scan (Background) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <canvas ref={canvasCurrRef} className="w-full h-full object-contain" />
            <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-xs font-bold text-amber-300">
              Current ({currentDate})
            </div>
          </div>

          {/* Previous Scan (Clipped foreground via CSS clipPath) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <canvas ref={canvasPrevRef} className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300">
              Baseline ({previousDate})
            </div>
          </div>

          {/* Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md z-20"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-brand-600">
              <MoveHorizontal className="w-4 h-4 text-brand-700" />
            </div>
          </div>
        </div>
      )}

      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            <canvas ref={canvasPrevRef} className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300">
              Baseline ({previousDate})
            </div>
          </div>

          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            <canvas ref={canvasCurrRef} className="w-full h-full object-contain" />
            <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-rose-500/50 text-xs font-bold text-rose-300">
              Current ({currentDate}) — Progression
            </div>
          </div>
        </div>
      )}

      {viewMode === 'blink' && (
        <div className="relative h-80 sm:h-[480px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
          <canvas
            ref={blinkCurrent ? canvasCurrRef : canvasPrevRef}
            className="w-full h-full object-contain transition-opacity duration-100"
          />
          <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${blinkCurrent ? 'bg-rose-500' : 'bg-brand-400'}`} />
            <span className="text-xs font-bold">
              Showing: {blinkCurrent ? `CURRENT (${currentDate})` : `BASELINE (${previousDate})`}
            </span>
          </div>
        </div>
      )}

      {viewMode === 'slider' && (
        <div className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <MoveHorizontal className="w-3.5 h-3.5" />
          <span>Drag divider handle horizontally across retina to reveal microvascular progression</span>
        </div>
      )}
    </div>
  );
};
