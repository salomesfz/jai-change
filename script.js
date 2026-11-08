/**
 * DND — J'AI CHANGÉ ?
 * Expérience interactive du miroir embué
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fogCanvas');
  const ctx = canvas.getContext('2d');
  const mirrorFrame = document.getElementById('mirrorFrame');
  const wipePrompt = document.getElementById('wipePrompt');
  const refogBtn = document.getElementById('refogBtn');
  const cleanAllBtn = document.getElementById('cleanAllBtn');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const openPresaveBtn = document.getElementById('openPresaveBtn');
  const presaveModal = document.getElementById('presaveModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // --- STATE VARIABLES ---
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let hasInteracted = false;
  let soundEnabled = true;
  let audioCtx = null;
  let wipeSoundNode = null;
  let wipeGainNode = null;
  let wipeFilterNode = null;

  // --- AUDIO SYNTHESIS (Bruit de doigt mouillé sur vitre embuée) ---
  function initAudio() {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      // Create white noise buffer
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // Loop white noise
      wipeSoundNode = audioCtx.createBufferSource();
      wipeSoundNode.buffer = noiseBuffer;
      wipeSoundNode.loop = true;

      // Bandpass filter for glass friction frequency
      wipeFilterNode = audioCtx.createBiquadFilter();
      wipeFilterNode.type = 'bandpass';
      wipeFilterNode.frequency.value = 1400;
      wipeFilterNode.Q.value = 3.5;

      // Gain node for volume control
      wipeGainNode = audioCtx.createGain();
      wipeGainNode.gain.value = 0;

      // Connect nodes
      wipeSoundNode.connect(wipeFilterNode);
      wipeFilterNode.connect(wipeGainNode);
      wipeGainNode.connect(audioCtx.destination);
      wipeSoundNode.start(0);
    } catch (e) {
      console.warn('Audio non supporté ou bloqué:', e);
    }
  }

  function startWipeSound(speed) {
    if (!soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const targetGain = Math.min(0.25, Math.max(0.04, speed * 0.008));
    const targetFreq = Math.min(2200, 1100 + speed * 12);
    
    const now = audioCtx.currentTime;
    wipeGainNode.gain.cancelScheduledValues(now);
    wipeGainNode.gain.setTargetAtTime(targetGain, now, 0.05);

    wipeFilterNode.frequency.cancelScheduledValues(now);
    wipeFilterNode.frequency.setTargetAtTime(targetFreq, now, 0.05);
  }

  function stopWipeSound() {
    if (!audioCtx || !wipeGainNode) return;
    const now = audioCtx.currentTime;
    wipeGainNode.gain.cancelScheduledValues(now);
    wipeGainNode.gain.setTargetAtTime(0, now, 0.08);
  }

  // --- CANVAS & FOG INITIALIZATION ---
  function resizeCanvas() {
    const rect = mirrorFrame.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);
    drawRealisticFog(rect.width, rect.height);
  }

  // Render authentic bathroom steam & condensation micro-droplets
  function drawRealisticFog(width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // 1. Base Misty Condensation Gradient
    const baseGradient = ctx.createRadialGradient(
      width * 0.5, height * 0.45, 20,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.8
    );
    baseGradient.addColorStop(0, 'rgba(195, 215, 235, 0.94)');
    baseGradient.addColorStop(0.5, 'rgba(180, 202, 225, 0.96)');
    baseGradient.addColorStop(1, 'rgba(150, 175, 205, 0.98)');

    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Soft Cloud-like Steam Variations
    for (let i = 0; i < 45; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const rRad = 40 + Math.random() * 90;
      const cloudGrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rRad);
      cloudGrad.addColorStop(0, 'rgba(235, 245, 255, 0.12)');
      cloudGrad.addColorStop(1, 'rgba(200, 220, 240, 0)');
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Thousands of Micro Condensation Droplets
    const dropletCount = Math.floor((width * height) / 180);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let i = 0; i < dropletCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() < 0.92 ? Math.random() * 1.5 + 0.5 : Math.random() * 3 + 1.5;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Subtle Water Run Drips on the Glass
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) {
      const startX = Math.random() * width;
      const startY = Math.random() * (height * 0.7);
      const dripLength = 20 + Math.random() * 80;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(
        startX + (Math.random() - 0.5) * 6, startY + dripLength * 0.4,
        startX + (Math.random() - 0.5) * 6, startY + dripLength * 0.7,
        startX + (Math.random() - 0.5) * 3, startY + dripLength
      );
      ctx.stroke();

      // Droplet at bottom of drip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.arc(startX, startY + dripLength, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- WIPING / DEFOGGING BRUSH (Effet doigt qui essuie) ---
  function wipeAt(x, y, radius = 42) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    // Soft feathered radial brush (realistic finger contact)
    const brush = ctx.createRadialGradient(x, y, radius * 0.35, x, y, radius);
    brush.addColorStop(0, 'rgba(0, 0, 0, 1)');
    brush.addColorStop(0.7, 'rgba(0, 0, 0, 0.95)');
    brush.addColorStop(0.9, 'rgba(0, 0, 0, 0.4)');
    brush.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = brush;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Interpolation between points to guarantee smooth continuous stroke
  function wipeBetween(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const step = 6;
    const steps = Math.max(1, Math.floor(dist / step));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      // Slight random wobble for organic hand motion
      wipeAt(x, y, 38 + Math.sin(t * Math.PI) * 5);
    }
  }

  // Get coordinates relative to canvas
  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  // --- INTERACTION EVENT LISTENERS ---
  function onPointerDown(e) {
    isDrawing = true;
    initAudio();

    if (!hasInteracted) {
      hasInteracted = true;
      wipePrompt.classList.add('hidden');
    }

    const { x, y } = getCoordinates(e);
    lastX = x;
    lastY = y;
    wipeAt(x, y, 40);
    startWipeSound(30);
  }

  function onPointerMove(e) {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const speed = Math.hypot(x - lastX, y - lastY);

    wipeBetween(lastX, lastY, x, y);
    startWipeSound(speed);

    lastX = x;
    lastY = y;
  }

  function onPointerUp() {
    if (!isDrawing) return;
    isDrawing = false;
    stopWipeSound();
  }

  // Mouse Events
  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // Touch Events (Mobile Finger Support)
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onPointerDown(e);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    onPointerMove(e);
  }, { passive: false });

  window.addEventListener('touchend', onPointerUp);
  window.addEventListener('touchcancel', onPointerUp);

  // --- CONTROLS ---

  // Re-fog the mirror (Réembuer le miroir)
  refogBtn.addEventListener('click', () => {
    const rect = mirrorFrame.getBoundingClientRect();
    // Smooth fade back in
    canvas.style.transition = 'opacity 0.4s ease';
    canvas.style.opacity = '0';
    setTimeout(() => {
      drawRealisticFog(rect.width, rect.height);
      canvas.style.opacity = '1';
      setTimeout(() => {
        canvas.style.transition = '';
      }, 400);
    }, 400);
  });

  // Clean all steam (Tout nettoyer)
  cleanAllBtn.addEventListener('click', () => {
    canvas.style.transition = 'opacity 0.6s ease';
    canvas.style.opacity = '0';
    wipePrompt.classList.add('hidden');
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.opacity = '1';
      canvas.style.transition = '';
    }, 600);
  });

  // Sound toggle
  audioToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    audioToggleBtn.classList.toggle('muted', !soundEnabled);
    if (!soundEnabled) {
      stopWipeSound();
    }
  });

  // Pre-save Modal Open / Close
  openPresaveBtn.addEventListener('click', () => {
    presaveModal.classList.add('active');
    presaveModal.setAttribute('aria-hidden', 'false');
  });

  closeModalBtn.addEventListener('click', () => {
    presaveModal.classList.remove('active');
    presaveModal.setAttribute('aria-hidden', 'true');
  });

  presaveModal.addEventListener('click', (e) => {
    if (e.target === presaveModal) {
      presaveModal.classList.remove('active');
      presaveModal.setAttribute('aria-hidden', 'true');
    }
  });

  // Escape key closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && presaveModal.classList.contains('active')) {
      presaveModal.classList.remove('active');
      presaveModal.setAttribute('aria-hidden', 'true');
    }
  });

  // Window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Initialize
  resizeCanvas();
});
