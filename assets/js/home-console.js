/**
 * ControlForge — Home Control Console Engine
 * Implements cursor-driven 3D parallax tilt, ambient analog gauge,
 * and live tank process loop animation for the physical control room panel.
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const consolePanel = document.getElementById('console-panel');
  const gaugeCanvas = document.getElementById('gauge-canvas');
  const tankWater = document.getElementById('tank-water-level');
  const tankValue = document.getElementById('tank-readout-val');
  const valveValue = document.getElementById('valve-readout-val');

  // --- 1. Cursor-driven 3D Parallax Tilt ---
  if (consolePanel && !prefersReducedMotion) {
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;

    window.addEventListener('mousemove', (e) => {
      const { innerWidth, innerHeight } = window;
      // Map normalized cursor (-1 to +1) to subtle tilt degrees (-6 to +6 deg)
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      targetRotateY = nx * 5.5;
      targetRotateX = -ny * 4.5;
    });

    window.addEventListener('mouseleave', () => {
      targetRotateX = 0;
      targetRotateY = 0;
    });

    function updateParallax() {
      // Smooth lerp
      currentRotateX += (targetRotateX - currentRotateX) * 0.08;
      currentRotateY += (targetRotateY - currentRotateY) * 0.08;

      consolePanel.style.transform = `perspective(1100px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
      requestAnimationFrame(updateParallax);
    }
    requestAnimationFrame(updateParallax);
  }

  // --- 2. Analog Needle Gauge (PT-101 Pressure Gauge) ---
  if (gaugeCanvas) {
    const ctx = gaugeCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    gaugeCanvas.width = 240 * dpr;
    gaugeCanvas.height = 240 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 120;
    const cy = 120;
    const radius = 95;

    let targetPSI = 62.5;
    let currentPSI = 58.0;
    let simTime = 0;

    function renderGauge() {
      simTime += 0.025;
      // Ambient fluctuation
      if (!prefersReducedMotion) {
        targetPSI = 62.5 + Math.sin(simTime * 0.9) * 4.2 + Math.cos(simTime * 2.1) * 1.8;
      }
      currentPSI += (targetPSI - currentPSI) * 0.05;

      ctx.clearRect(0, 0, 240, 240);

      // Outer bezel ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#18150F';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#302B22';
      ctx.stroke();

      // Inner hairline ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#221E17';
      ctx.stroke();

      // Gauge scale ticks (from 135 deg to 405 deg = 270 deg sweep for 0 to 100 PSI)
      const startAngle = (135 * Math.PI) / 180;
      const endAngle = (405 * Math.PI) / 180;
      const totalSweep = endAngle - startAngle;

      for (let psi = 0; psi <= 100; psi += 5) {
        const isMajor = psi % 20 === 0;
        const isMid = psi % 10 === 0 && !isMajor;
        const angle = startAngle + (psi / 100) * totalSweep;

        const tickInner = isMajor ? radius - 24 : (isMid ? radius - 18 : radius - 14);
        const tickOuter = radius - 10;

        const x1 = cx + Math.cos(angle) * tickInner;
        const y1 = cy + Math.sin(angle) * tickInner;
        const x2 = cx + Math.cos(angle) * tickOuter;
        const y2 = cy + Math.sin(angle) * tickOuter;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isMajor ? '#EDE6DA' : (isMid ? '#A79C8A' : '#302B22');
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();

        // Numerals for major ticks
        if (isMajor) {
          const numR = radius - 34;
          const nx = cx + Math.cos(angle) * numR;
          const ny = cy + Math.sin(angle) * numR;
          ctx.fillStyle = '#A79C8A';
          ctx.font = '500 10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(psi.toString(), nx, ny);
        }
      }

      // Dial labels
      ctx.fillStyle = '#FFB000';
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PT-101', cx, cy - 36);

      ctx.fillStyle = '#6B6255';
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillText('PSI · STEAM', cx, cy + 32);

      // Digital readout pill
      ctx.fillStyle = '#1D1A15';
      ctx.strokeStyle = '#302B22';
      ctx.lineWidth = 1;
      ctx.fillRect(cx - 32, cy + 45, 64, 18);
      ctx.strokeRect(cx - 32, cy + 45, 64, 18);

      ctx.fillStyle = '#FFB000';
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillText(`${currentPSI.toFixed(1)}`, cx, cy + 54);

      // Gauge needle
      const needleAngle = startAngle + (currentPSI / 100) * totalSweep;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(needleAngle);

      // Needle body
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(0, -2.5);
      ctx.lineTo(radius - 16, 0);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fillStyle = '#D64550'; // crimson indicator tip
      ctx.fill();

      // Needle center cap (brass rivet)
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#8C6318';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FFB000';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#15130F';
      ctx.fill();

      ctx.restore();
      ctx.restore();

      requestAnimationFrame(renderGauge);
    }
    renderGauge();
  }

  // --- 3. Tank Level & Process Loop Simulation ---
  let loopTime = 0;
  function updateTankLoop() {
    loopTime += 0.03;
    if (!prefersReducedMotion && tankWater) {
      // Simulate level oscillating smoothly around 65% setpoint
      const simulatedLevel = 65 + Math.sin(loopTime * 0.7) * 8.5;
      const simulatedValve = 48 + Math.cos(loopTime * 0.7) * 12.0;

      tankWater.style.height = `${simulatedLevel.toFixed(1)}%`;
      if (tankValue) tankValue.textContent = `${simulatedLevel.toFixed(1)}%`;
      if (valveValue) valveValue.textContent = `${simulatedValve.toFixed(0)}%`;
    }
    requestAnimationFrame(updateTankLoop);
  }
  updateTankLoop();
});
