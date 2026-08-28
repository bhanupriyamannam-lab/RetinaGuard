// High-Precision Procedural Fundus Retinal Engine & Grad-CAM Renderer

export interface DrawRetinaOptions {
  severity: 'NO_DR' | 'MILD_DR' | 'MODERATE_DR' | 'SEVERE_DR' | 'PROGRESSION';
  viewMode: 'original' | 'attention' | 'overlay' | 'findings';
  showMarkers?: boolean;
  highlightRegion?: string | null;
  qualityIssue?: 'blur' | 'dark' | 'normal';
  loadedImage?: HTMLImageElement | null;
}

export function drawRetinaToCanvas(canvas: HTMLCanvasElement, options: DrawRetinaOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.44;

  const discX = centerX - radius * 0.46;
  const discY = centerY - radius * 0.04;
  const discRx = radius * 0.15;
  const discRy = radius * 0.17;

  const maculaX = centerX + radius * 0.24;
  const maculaY = centerY + radius * 0.04;

  ctx.clearRect(0, 0, width, height);

  // Deep clinical darkroom viewport
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, width, height);

  // Aperture clipping
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  // If real uploaded image is provided, draw it into the aperture
  if (options.loadedImage && options.loadedImage.complete && options.loadedImage.naturalWidth > 0) {
    ctx.drawImage(options.loadedImage, centerX - radius, centerY - radius, radius * 2, radius * 2);
  } else {
    // 1. Natural Fundus Background
    let cCenter = '#c2410c'; // Warm orange-red central illumination
    let cMid = '#9a1c09';    // Rich retinal red
    let cEdge = '#450a0a';   // Deep peripheral rim

    if (options.qualityIssue === 'dark') {
      cCenter = '#4a1708';
      cMid = '#2b0902';
      cEdge = '#120200';
    }

    const bgGrad = ctx.createRadialGradient(
      centerX + radius * 0.08, centerY - radius * 0.08, radius * 0.05,
      centerX, centerY, radius
    );
    bgGrad.addColorStop(0, cCenter);
    bgGrad.addColorStop(0.55, cMid);
    bgGrad.addColorStop(1, cEdge);

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle choroidal tessellation grain
    ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
    for (let i = 0; i < 500; i++) {
      const angle = (i * 1.37) % (Math.PI * 2);
      const dist = ((i * 3.71) % (radius * 0.95));
      const px = centerX + Math.cos(angle) * dist;
      const py = centerY + Math.sin(angle) * dist;
      ctx.fillRect(px, py, 1.8, 1.8);
    }

    // 2. Optic Disc (Nasal / Left quadrant in right eye OD)
    // Neuroretinal rim
    const rimGrad = ctx.createRadialGradient(discX, discY, discRx * 0.2, discX, discY, discRx);
    rimGrad.addColorStop(0, '#fffbeb');
    rimGrad.addColorStop(0.45, '#fed7aa');
    rimGrad.addColorStop(0.85, '#ea580c');
    rimGrad.addColorStop(1, '#9a3412');

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(discX, discY, discRx, discRy, 0.04, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.shadowColor = 'rgba(254, 215, 170, 0.35)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    // Physiological optic cup (Cup-to-Disc ratio ~0.3)
    ctx.beginPath();
    ctx.ellipse(discX + 2, discY, discRx * 0.42, discRy * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fffdf5';
    ctx.fill();

    // 3. Macula & Foveal Avascular Zone (Temporal quadrant)
    const maculaGrad = ctx.createRadialGradient(maculaX, maculaY, 2, maculaX, maculaY, radius * 0.26);
    maculaGrad.addColorStop(0, '#2e0500');
    maculaGrad.addColorStop(0.35, '#4c0c05');
    maculaGrad.addColorStop(0.7, '#751a0c');
    maculaGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = maculaGrad;
    ctx.beginPath();
    ctx.arc(maculaX, maculaY, radius * 0.26, 0, Math.PI * 2);
    ctx.fill();

    // Central foveal light reflex
    ctx.fillStyle = 'rgba(255, 235, 205, 0.6)';
    ctx.beginPath();
    ctx.arc(maculaX, maculaY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Retinal Vascular Tree (Arteriolar & Venular Arcades)
    ctx.save();
    ctx.lineCap = 'round';

    // Superior Arcade (Venule - wider, dark crimson)
    ctx.strokeStyle = '#4a0804';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(discX, discY);
    ctx.bezierCurveTo(
      discX + radius * 0.18, discY - radius * 0.46,
      discX + radius * 0.54, discY - radius * 0.42,
      maculaX + radius * 0.42, maculaY - radius * 0.46
    );
    ctx.stroke();

    // Superior Arcade (Arteriole - paired, brighter red with central light reflex)
    ctx.strokeStyle = '#851d0d';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(discX, discY);
    ctx.bezierCurveTo(
      discX + radius * 0.14, discY - radius * 0.40,
      discX + radius * 0.50, discY - radius * 0.36,
      maculaX + radius * 0.38, maculaY - radius * 0.40
    );
    ctx.stroke();

    // Inferior Arcade (Venule)
    ctx.strokeStyle = '#4a0804';
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.moveTo(discX, discY);
    ctx.bezierCurveTo(
      discX + radius * 0.20, discY + radius * 0.46,
      discX + radius * 0.58, discY + radius * 0.44,
      maculaX + radius * 0.44, maculaY + radius * 0.42
    );
    ctx.stroke();

    // Inferior Arcade (Arteriole)
    ctx.strokeStyle = '#851d0d';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(discX, discY);
    ctx.bezierCurveTo(
      discX + radius * 0.16, discY + radius * 0.39,
      discX + radius * 0.53, discY + radius * 0.37,
      maculaX + radius * 0.40, maculaY + radius * 0.34
    );
    ctx.stroke();

    // Nasal branches
    ctx.strokeStyle = '#6e1307';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(discX, discY);
    ctx.quadraticCurveTo(discX - radius * 0.22, discY - radius * 0.18, discX - radius * 0.38, discY - radius * 0.32);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(discX, discY);
    ctx.quadraticCurveTo(discX - radius * 0.22, discY - radius * 0.18, discX - radius * 0.38, discY + radius * 0.30);
    ctx.stroke();

    // Fine perifoveal capillary branches
    ctx.strokeStyle = '#7c1c0c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(maculaX - radius * 0.08, maculaY - radius * 0.22);
    ctx.quadraticCurveTo(maculaX - radius * 0.04, maculaY - radius * 0.10, maculaX - radius * 0.06, maculaY - radius * 0.03);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(maculaX - radius * 0.04, maculaY + radius * 0.20);
    ctx.quadraticCurveTo(maculaX, maculaY + radius * 0.08, maculaX - radius * 0.03, maculaY + radius * 0.04);
    ctx.stroke();

    ctx.restore();
  }

  // 5. Medically Plausible Pathologies
  // NEVER render artificial lesion marks/dots over real images or in Original view mode
  const shouldRenderSyntheticPathology = !options.loadedImage && (options.viewMode === 'findings' || options.showMarkers);

  if (shouldRenderSyntheticPathology) {
    const isModerateOrHigher = options.severity === 'MODERATE_DR' || options.severity === 'SEVERE_DR' || options.severity === 'PROGRESSION';
    const isProgression = options.severity === 'PROGRESSION';
    const isMildOrHigher = options.severity === 'MILD_DR' || isModerateOrHigher;

    // Microaneurysms (Distinct deep crimson pinpoint lesions)
    if (isMildOrHigher) {
      const maCoords = [
        { x: maculaX + radius * 0.14, y: maculaY + radius * 0.16, r: 2.2 },
        { x: maculaX + radius * 0.20, y: maculaY - radius * 0.11, r: 2.0 },
        { x: maculaX - radius * 0.11, y: maculaY + radius * 0.22, r: 2.4 },
      ];

      if (isModerateOrHigher) {
        maCoords.push(
          { x: maculaX + radius * 0.26, y: maculaY + radius * 0.20, r: 2.6 },
          { x: discX + radius * 0.40, y: discY + radius * 0.26, r: 2.4 },
          { x: maculaX + radius * 0.04, y: maculaY + radius * 0.30, r: 2.8 }
        );
      }

      if (isProgression) {
        maCoords.push(
          { x: maculaX + radius * 0.30, y: maculaY - radius * 0.22, r: 2.5 },
          { x: maculaX - radius * 0.04, y: maculaY - radius * 0.26, r: 3.0 },
          { x: discX + radius * 0.26, y: discY + radius * 0.36, r: 2.7 }
        );
      }

      ctx.fillStyle = '#990000';
      for (const ma of maCoords) {
        ctx.beginPath();
        ctx.arc(ma.x, ma.y, ma.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Hemorrhages (Blot & Flame-shaped)
    if (isModerateOrHigher) {
      // Blot hemorrhage
      ctx.fillStyle = '#580404';
      ctx.beginPath();
      ctx.ellipse(maculaX + radius * 0.16, maculaY + radius * 0.23, 6.5, 4.5, 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Flame hemorrhage (feathered along nerve fibers)
      ctx.beginPath();
      ctx.ellipse(discX + radius * 0.36, discY + radius * 0.28, 10, 3.8, -0.55, 0, Math.PI * 2);
      ctx.fill();

      if (isProgression) {
        ctx.beginPath();
        ctx.ellipse(maculaX - radius * 0.12, maculaY + radius * 0.30, 8.5, 5.5, 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(maculaX + radius * 0.32, maculaY + radius * 0.10, 7.5, 3.8, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Hard Exudates (Waxy bright yellow crystalline deposits)
    if (isModerateOrHigher) {
      const exudates = [
        { x: maculaX + radius * 0.13, y: maculaY - radius * 0.16, r: 3.2 },
        { x: maculaX + radius * 0.17, y: maculaY - radius * 0.14, r: 2.6 },
        { x: maculaX + radius * 0.15, y: maculaY - radius * 0.20, r: 2.1 },
      ];

      if (isProgression) {
        exudates.push(
          { x: maculaX + radius * 0.21, y: maculaY - radius * 0.18, r: 3.0 },
          { x: maculaX + radius * 0.24, y: maculaY - radius * 0.15, r: 2.7 },
          { x: maculaX + radius * 0.27, y: maculaY - radius * 0.22, r: 2.4 }
        );
      }

      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = 'rgba(254, 240, 138, 0.7)';
      ctx.shadowBlur = 3;
      for (const ex of exudates) {
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }

  // Motion blur artifact simulation
  if (options.qualityIssue === 'blur') {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.filter = 'blur(6px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }

  // 6. Grad-CAM Attention Heatmap
  if (options.viewMode === 'attention' || options.viewMode === 'overlay') {
    const hCanvas = document.createElement('canvas');
    hCanvas.width = width;
    hCanvas.height = height;
    const hCtx = hCanvas.getContext('2d');

    if (hCtx) {
      if (options.severity === 'NO_DR') {
        // Healthy retina: diffuse, uniform low-intensity physiological attention (no focal disease hotspots)
        const healthySpots = [
          { x: maculaX, y: maculaY, r: radius * 0.35, intensity: 0.35 },
          { x: discX, y: discY, r: radius * 0.30, intensity: 0.30 },
        ];

        for (const sp of healthySpots) {
          const sGrad = hCtx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.r);
          sGrad.addColorStop(0, `rgba(16, 185, 129, ${sp.intensity * 0.6})`);
          sGrad.addColorStop(0.50, `rgba(6, 182, 212, ${sp.intensity * 0.3})`);
          sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          hCtx.fillStyle = sGrad;
          hCtx.beginPath();
          hCtx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
          hCtx.fill();
        }
      } else {
        // Diseased retina: prominent pathological lesion hotspots (superior-temporal lemon-yellow hard exudates & microvascular leaks)
        const lesionSpots = [
          { x: maculaX + radius * 0.16, y: maculaY - radius * 0.20, r: radius * 0.28, intensity: 0.96 }, // Lemon-yellow Hard Exudates Cluster
          { x: maculaX + radius * 0.18, y: maculaY + radius * 0.22, r: radius * 0.26, intensity: 0.75 }, // Inferior temporal microvascular leaks
          { x: discX + radius * 0.42, y: discY + radius * 0.28, r: radius * 0.22, intensity: 0.60 },
        ];

        for (const sp of lesionSpots) {
          const sGrad = hCtx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.r);
          sGrad.addColorStop(0, `rgba(239, 68, 68, ${sp.intensity})`);
          sGrad.addColorStop(0.35, `rgba(245, 158, 11, ${sp.intensity * 0.75})`);
          sGrad.addColorStop(0.65, `rgba(6, 182, 212, ${sp.intensity * 0.45})`);
          sGrad.addColorStop(0.85, `rgba(59, 130, 246, ${sp.intensity * 0.20})`);
          sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          hCtx.fillStyle = sGrad;
          hCtx.beginPath();
          hCtx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
          hCtx.fill();
        }
      }

      ctx.save();
      if (options.viewMode === 'attention') {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(hCanvas, 0, 0);
      } else {
        ctx.globalAlpha = 0.60;
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(hCanvas, 0, 0);
      }
      ctx.restore();
    }
  }

  // 7. Clinical Findings Annotation Markers
  if (options.viewMode === 'findings' || options.showMarkers) {
    ctx.save();

    if (options.severity === 'NO_DR' || options.loadedImage) {
      // Normal findings badge or clean real image indicator
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      const label = options.severity === 'NO_DR'
        ? '✓ Normal Retinal Architecture (0 Lesions Detected)'
        : '✓ Optical Fundus Image (Pristine View)';
      ctx.font = '700 12px Plus Jakarta Sans, system-ui, sans-serif';
      const textW = ctx.measureText(label).width;
      const bX = centerX - textW / 2 - 10;
      const bY = centerY + radius * 0.75;

      ctx.beginPath();
      ctx.roundRect(bX, bY, textW + 20, 24, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, bX + 10, bY + 16);
    } else {
      // Procedural synthetic simulation markers (only when no real image was loaded)
      const markers = [
        {
          x: maculaX + radius * 0.16,
          y: maculaY + radius * 0.23,
          w: radius * 0.26,
          h: radius * 0.20,
          label: 'Microaneurysms & Hemorrhage Cluster',
          color: '#ef4444',
          id: 'inferior'
        },
        {
          x: maculaX + radius * 0.14,
          y: maculaY - radius * 0.18,
          w: radius * 0.22,
          h: radius * 0.16,
          label: 'Hard Exudates (Lipid Residue)',
          color: '#f59e0b',
          id: 'temporal'
        }
      ];

      for (const m of markers) {
        const isHl = options.highlightRegion === m.id;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = isHl ? 2.5 : 1.5;
        ctx.setLineDash(isHl ? [] : [3, 3]);

        ctx.strokeRect(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);

        // Corner reticles
        const corner = 6;
        ctx.setLineDash([]);
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        ctx.moveTo(m.x - m.w / 2, m.y - m.h / 2 + corner);
        ctx.lineTo(m.x - m.w / 2, m.y - m.h / 2);
        ctx.lineTo(m.x - m.w / 2 + corner, m.y - m.h / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(m.x + m.w / 2 - corner, m.y - m.h / 2);
        ctx.lineTo(m.x + m.w / 2, m.y - m.h / 2);
        ctx.lineTo(m.x + m.w / 2, m.y - m.h / 2 + corner);
        ctx.stroke();

        // Badge label
        ctx.fillStyle = m.color;
        const bY = m.y - m.h / 2 - 5;
        ctx.font = '600 10.5px Plus Jakarta Sans, system-ui, sans-serif';
        const textW = ctx.measureText(m.label).width;

        ctx.beginPath();
        ctx.roundRect(m.x - m.w / 2, bY - 13, textW + 10, 16, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(m.label, m.x - m.w / 2 + 5, bY - 1);
      }
    }

    ctx.restore();
  }

  // Restore clipping
  ctx.restore();

  // High-precision circular lens bezel
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Subtle optic center reticle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(centerX - 10, centerY);
  ctx.lineTo(centerX + 10, centerY);
  ctx.moveTo(centerX, centerY - 10);
  ctx.lineTo(centerX, centerY + 10);
  ctx.stroke();
}
