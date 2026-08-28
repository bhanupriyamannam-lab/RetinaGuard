import React from 'react';

interface RetinalGraphicProps {
  className?: string;
  size?: number;
  showRays?: boolean;
}

export const RetinalGraphic: React.FC<RetinalGraphicProps> = ({
  className = '',
  size = 380,
  showRays = true
}) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer ambient glow */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600/20 via-rose-600/30 to-blue-600/20 blur-2xl animate-pulse"
        style={{ animationDuration: '4s' }}
      />

      {/* Subtle diagnostic rings */}
      {showRays && (
        <>
          <div className="absolute inset-[-12px] rounded-full border border-blue-500/20 border-dashed animate-spin-slow opacity-60" style={{ animationDuration: '40s' }} />
          <div className="absolute inset-[-28px] rounded-full border border-cyan-400/10 opacity-40" />
          <div className="absolute inset-[-48px] rounded-full border border-indigo-500/10 border-dotted" />
        </>
      )}

      {/* Main fundus disc SVG */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full rounded-full shadow-2xl relative z-10 overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 45% 48%, #c83e1c 0%, #9e2a14 45%, #5a1208 80%, #200502 100%)',
          boxShadow: '0 0 50px rgba(220, 38, 38, 0.25), inset 0 0 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        <defs>
          <radialGradient id="opticDisc" cx="68%" cy="52%" r="14%">
            <stop offset="0%" stopColor="#fff2cc" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#f5c26b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
          </radialGradient>
          <radialGradient id="foveaGlow" cx="42%" cy="50%" r="12%">
            <stop offset="0%" stopColor="#2c0803" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#5a1208" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="vesselGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5252" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="vesselGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#450a0a" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Fovea central dark zone */}
        <circle cx="168" cy="200" r="32" fill="url(#foveaGlow)" />
        <circle cx="168" cy="200" r="6" fill="#180402" opacity="0.9" />

        {/* Optic Disc */}
        <circle cx="272" cy="208" r="28" fill="url(#opticDisc)" />
        <ellipse cx="270" cy="208" rx="14" ry="18" fill="#fffbe7" opacity="0.6" />

        {/* Superior Temporal Vascular Arcade */}
        <path
          d="M 272 208 C 265 150, 220 100, 160 90 C 120 84, 80 110, 50 140"
          fill="none"
          stroke="url(#vesselGrad1)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 220 100 C 190 70, 150 60, 110 70"
          fill="none"
          stroke="url(#vesselGrad1)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M 160 90 C 140 120, 120 140, 95 155"
          fill="none"
          stroke="url(#vesselGrad1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Inferior Temporal Vascular Arcade */}
        <path
          d="M 272 208 C 265 265, 225 310, 165 315 C 125 318, 85 295, 55 260"
          fill="none"
          stroke="url(#vesselGrad2)"
          strokeWidth="4.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 225 310 C 195 340, 155 350, 115 340"
          fill="none"
          stroke="url(#vesselGrad2)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M 165 315 C 145 285, 125 265, 100 250"
          fill="none"
          stroke="url(#vesselGrad2)"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Nasal Arcades */}
        <path
          d="M 272 208 C 300 170, 335 150, 370 145"
          fill="none"
          stroke="url(#vesselGrad1)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M 272 208 C 300 245, 335 265, 370 270"
          fill="none"
          stroke="url(#vesselGrad2)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Retinal microvascular capillaries branching towards macula */}
        <path d="M 200 135 C 180 155, 175 170, 170 185" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.4" />
        <path d="M 200 270 C 180 250, 175 235, 170 215" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.4" />

        {/* AI Analysis Diagnostic Markers */}
        <g className="animate-pulse" style={{ animationDuration: '3s' }}>
          {/* Target marker 1 - Inferior Arcade */}
          <circle cx="165" cy="315" r="9" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
          <circle cx="165" cy="315" r="2.5" fill="#38bdf8" />

          {/* Target marker 2 - Macula Perifovea */}
          <circle cx="140" cy="180" r="11" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3,2" />
          <circle cx="140" cy="180" r="2.5" fill="#f43f5e" />

          {/* Target marker 3 - Superior temporal */}
          <circle cx="185" cy="98" r="8" fill="none" stroke="#34d399" strokeWidth="1.5" />
          <circle cx="185" cy="98" r="2" fill="#34d399" />
        </g>

        {/* Scanning laser line overlay */}
        <line
          x1="0"
          y1="200"
          x2="400"
          y2="200"
          stroke="rgba(56, 189, 248, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
      </svg>
    </div>
  );
};
