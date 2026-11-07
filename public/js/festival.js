/**
 * DUEL ZONE — Dynamic Festival Theme Engine
 * Automatically detects or lets the user select festival themes (Diwali, Holi, Christmas, Eid, Cyber)
 * with animated canvas fireworks, flickering diyas, hanging lanterns, and rich ambient aesthetics.
 */

(function () {
  'use strict';

  const FESTIVAL_CONFIGS = {
    diwali: {
      id: 'diwali',
      name: 'Diwali',
      icon: '🪔',
      greeting: '✨ 🪔 SHUBH DEEPAWALI • FESTIVAL OF LIGHTS 🪔 ✨',
      subtitle: 'CELEBRATING LIGHT, VICTORY & WARRIORS',
      bgGradient: ['#32093e', '#1c072a', '#0a0312'],
      accent: '#ffaa00',
      secondaryAccent: '#ff3366',
      goldAccent: '#ffd700',
      themeClass: 'theme-diwali'
    },
    holi: {
      id: 'holi',
      name: 'Holi',
      icon: '🎨',
      greeting: '🌈 🎨 HAPPY HOLI • FESTIVAL OF COLORS 🎨 🌈',
      subtitle: 'SPLASH OF VICTORY & COLOR COMBAT',
      bgGradient: ['#2b0a33', '#110b2b', '#060714'],
      accent: '#ff007f',
      secondaryAccent: '#00e5ff',
      goldAccent: '#ffe600',
      themeClass: 'theme-holi'
    },
    christmas: {
      id: 'christmas',
      name: 'Christmas & New Year',
      icon: '🎄',
      greeting: '❄️ 🎄 MERRY CHRISTMAS & HAPPY NEW YEAR 🎄 ❄️',
      subtitle: 'WINTER WONDERLAND CHAMPIONSHIP',
      bgGradient: ['#0b233a', '#061322', '#020810'],
      accent: '#00e676',
      secondaryAccent: '#ff1744',
      goldAccent: '#ffd700',
      themeClass: 'theme-christmas'
    },
    eid: {
      id: 'eid',
      name: 'Eid Mubarak',
      icon: '🌙',
      greeting: '✨ 🌙 EID MUBARAK • PEACE & HARMONY 🌙 ✨',
      subtitle: 'CRESCENT MOON COMBAT ARENA',
      bgGradient: ['#07281f', '#041712', '#010806'],
      accent: '#10b981',
      secondaryAccent: '#38bdf8',
      goldAccent: '#fbbf24',
      themeClass: 'theme-eid'
    },
    cyber: {
      id: 'cyber',
      name: 'Cyber Classic',
      icon: '⚡',
      greeting: '⚡ CYBERPUNK BATTLEZONE ⚡',
      subtitle: 'REAL-TIME MULTIPLAYER COMBAT',
      bgGradient: ['#141424', '#0d0d18', '#07070d'],
      accent: '#00e5ff',
      secondaryAccent: '#ff1744',
      goldAccent: '#ffd700',
      themeClass: 'theme-cyber'
    }
  };

  function autoDetectFestival() {
    const now = new Date();
    const month = now.getMonth(); // 0 = Jan, 11 = Dec

    // Default to Diwali per user request right now!
    // Oct (9) and Nov (10) are traditional Diwali months.
    if (month === 9 || month === 10) return 'diwali';
    if (month === 2) return 'holi'; // March
    if (month === 11 || month === 0) return 'christmas'; // Dec / Jan
    if (month === 3 || month === 4) return 'eid'; // April / May
    return 'diwali'; // Default to Diwali as requested!
  }

  class FestivalThemeEngine {
    constructor() {
      // Locked to Diwali theme as requested
      this.currentThemeId = 'diwali';

      this.canvas = null;
      this.ctx = null;
      this.animId = null;
      this.particles = [];
      this.diyas = [];
      this.fireworks = [];
      this.lanterns = [];
      this.lastTime = 0;
      this.fireworkTimer = 0;
      this.active = true;

      this.init();
    }

    init() {
      this.createCanvas();
      this.createUIElements();
      this.applyTheme('diwali', false);
      this.bindEvents();
      this.startLoop();
    }

    createCanvas() {
      const lobby = document.getElementById('lobby');
      if (!lobby) return;

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'festival-canvas';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '1';

      lobby.insertBefore(this.canvas, lobby.firstChild);
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
    }

    resizeCanvas() {
      if (!this.canvas) return;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.setupDiyas();
      this.setupLanterns();
    }

    createUIElements() {
      const menuScreen = document.getElementById('menu-screen');
      if (!menuScreen) return;

      // Festive Greeting Banner (above logo)
      let banner = document.getElementById('festival-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'festival-banner';
        banner.className = 'festival-banner';
        const logoContainer = menuScreen.querySelector('.logo-container');
        if (logoContainer) {
          logoContainer.insertBefore(banner, logoContainer.firstChild);
        } else {
          menuScreen.insertBefore(banner, menuScreen.firstChild);
        }
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());

      // Listen for game start / end to pause canvas during match
      window.addEventListener('gameStarted', () => {
        this.active = false;
      });
      window.addEventListener('gameEnded', () => {
        this.active = true;
        this.lastTime = performance.now();
      });
    }

    setTheme(themeId) {
      if (!FESTIVAL_CONFIGS[themeId]) return;
      this.currentThemeId = themeId;
      this.applyTheme(themeId, true);
    }

    applyTheme(themeId, triggerBurst = true) {
      const cfg = FESTIVAL_CONFIGS[themeId] || FESTIVAL_CONFIGS.diwali;
      const lobby = document.getElementById('lobby');
      if (!lobby) return;

      // Reset previous classes
      Object.values(FESTIVAL_CONFIGS).forEach(c => lobby.classList.remove(c.themeClass));
      lobby.classList.add(cfg.themeClass);

      // Update Greeting Banner
      const banner = document.getElementById('festival-banner');
      if (banner) {
        banner.innerHTML = `<span class="fest-text">${cfg.greeting}</span>`;
      }

      // Reset particles for theme
      this.particles = [];
      this.fireworks = [];
      this.setupDiyas();
      this.setupLanterns();

      if (triggerBurst) {
        this.spawnBurst(this.width / 2, this.height * 0.35, 75);
      }
    }

    setupDiyas() {
      this.diyas = [];
      if (this.currentThemeId !== 'diwali') return;

      // Evenly space 9 glowing clay Diyas along the bottom edge
      const count = Math.min(11, Math.max(5, Math.floor(this.width / 130)));
      const step = this.width / (count + 1);

      for (let i = 1; i <= count; i++) {
        this.diyas.push({
          x: i * step + (Math.sin(i * 1.5) * 8),
          y: this.height - 24,
          flicker: Math.random() * Math.PI * 2,
          flickerSpeed: 0.08 + Math.random() * 0.06,
          size: 26 + (i % 2 === 0 ? 4 : 0)
        });
      }
    }

    setupLanterns() {
      this.lanterns = [];
      if (this.currentThemeId !== 'diwali' && this.currentThemeId !== 'eid') return;

      // Hanging lanterns at top-left and top-right corners
      const lanternPositions = [
        { x: this.width * 0.09, y: 0, length: 110, swing: 0, speed: 0.02, color: '#f59e0b' },
        { x: this.width * 0.20, y: 0, length: 70,  swing: 1.2, speed: 0.025, color: '#ef4444' },
        { x: this.width * 0.80, y: 0, length: 80,  swing: 2.1, speed: 0.022, color: '#ef4444' },
        { x: this.width * 0.91, y: 0, length: 115, swing: 0.8, speed: 0.019, color: '#f59e0b' }
      ];
      this.lanterns = lanternPositions;
    }

    spawnFirework() {
      if (this.currentThemeId === 'diwali') {
        const x = this.width * (0.15 + Math.random() * 0.7);
        const y = this.height * (0.15 + Math.random() * 0.38);
        const colorPalette = [
          ['#ffd700', '#ff9100', '#ffea00'], // Golden Sparkler
          ['#ff1744', '#ff5252', '#ffd700'], // Fiery Ruby
          ['#00e5ff', '#00b0ff', '#ffffff'], // Electric Cyan
          ['#e040fb', '#ea80fc', '#ffd700'], // Violet Blossom
          ['#00e676', '#69f0ae', '#fff9c4']  // Emerald Green
        ];
        const chosen = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        this.spawnBurst(x, y, 55, chosen);
      } else if (this.currentThemeId === 'holi') {
        const x = this.width * (0.15 + Math.random() * 0.7);
        const y = this.height * (0.2 + Math.random() * 0.45);
        const holiColors = ['#ff007f', '#00e5ff', '#ffe600', '#00e676', '#b026ff', '#ff6d00'];
        this.spawnColorSplash(x, y, 45, holiColors);
      }
    }

    spawnBurst(x, y, count = 50, colors = ['#ffd700', '#ff9100', '#ff1744']) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 5.5;
        this.fireworks.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0,
          decay: 0.012 + Math.random() * 0.018,
          gravity: 0.06,
          size: 1.8 + Math.random() * 2.2,
          sparkle: Math.random() > 0.4
        });
      }
    }

    spawnColorSplash(x, y, count = 40, colors) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 6.0;
        this.fireworks.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.95,
          decay: 0.008 + Math.random() * 0.014,
          gravity: 0.03,
          size: 3.5 + Math.random() * 4.5,
          splash: true
        });
      }
    }

    startLoop() {
      const render = (now) => {
        const delta = Math.min(50, now - (this.lastTime || now));
        this.lastTime = now;

        if (this.active) {
          this.update(delta);
          this.draw();
        }
        this.animId = requestAnimationFrame(render);
      };
      this.animId = requestAnimationFrame(render);
    }

    update(delta) {
      // 1. Spontaneous fireworks/splashes in Diwali & Holi
      if (this.currentThemeId === 'diwali' || this.currentThemeId === 'holi') {
        this.fireworkTimer += delta;
        if (this.fireworkTimer > (this.currentThemeId === 'diwali' ? 1400 : 1800)) {
          this.fireworkTimer = 0;
          this.spawnFirework();
        }
      }

      // 2. Ambient Floating Embers / Snowflakes / Color Pigments
      const maxAmbient = this.currentThemeId === 'christmas' ? 80 : 35;
      if (this.particles.length < maxAmbient && Math.random() < 0.3) {
        if (this.currentThemeId === 'diwali') {
          // Golden floating embers rising from the bottom
          this.particles.push({
            type: 'ember',
            x: Math.random() * this.width,
            y: this.height + 10,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(0.8 + Math.random() * 1.6),
            size: 1.2 + Math.random() * 2.2,
            alpha: 0.8 + Math.random() * 0.2,
            color: Math.random() > 0.4 ? '#ffd700' : '#ff9100'
          });
        } else if (this.currentThemeId === 'christmas') {
          // Gentle falling snowflakes
          this.particles.push({
            type: 'snow',
            x: Math.random() * this.width,
            y: -10,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 0.7 + Math.random() * 1.5,
            size: 1.5 + Math.random() * 3.0,
            alpha: 0.7 + Math.random() * 0.3,
            wobble: Math.random() * Math.PI * 2
          });
        } else if (this.currentThemeId === 'holi') {
          // Colorful floating gulal powder dust
          const colors = ['#ff007f', '#00e5ff', '#ffe600', '#00e676', '#ea80fc'];
          this.particles.push({
            type: 'gulal',
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: 2.0 + Math.random() * 3.5,
            alpha: 0.6,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 200 + Math.random() * 150
          });
        }
      }

      // Update ambient particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'ember') {
          p.alpha -= 0.0035;
          if (p.alpha <= 0 || p.y < -20) this.particles.splice(i, 1);
        } else if (p.type === 'snow') {
          p.wobble += 0.03;
          p.x += Math.sin(p.wobble) * 0.5;
          if (p.y > this.height + 10) this.particles.splice(i, 1);
        } else if (p.type === 'gulal') {
          p.life--;
          p.alpha = Math.max(0, p.life / 250);
          if (p.life <= 0) this.particles.splice(i, 1);
        }
      }

      // Update active fireworks
      for (let i = this.fireworks.length - 1; i >= 0; i--) {
        const f = this.fireworks[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += f.gravity;
        f.vx *= 0.985;
        f.vy *= 0.985;
        f.alpha -= f.decay;

        if (f.alpha <= 0) {
          this.fireworks.splice(i, 1);
        }
      }

      // Update Diya flickers
      this.diyas.forEach(d => {
        d.flicker += d.flickerSpeed;
      });

      // Update Lantern swings
      this.lanterns.forEach(l => {
        l.swing += l.speed;
      });
    }

    draw() {
      const ctx = this.ctx;
      if (!ctx) return;

      ctx.clearRect(0, 0, this.width, this.height);

      const cfg = FESTIVAL_CONFIGS[this.currentThemeId] || FESTIVAL_CONFIGS.diwali;

      // 1. Festive Radial Gradient Background
      const bgGrad = ctx.createRadialGradient(
        this.width / 2, this.height * 0.45, 50,
        this.width / 2, this.height * 0.45, Math.max(this.width, this.height) * 0.75
      );
      bgGrad.addColorStop(0, cfg.bgGradient[0]);
      bgGrad.addColorStop(0.5, cfg.bgGradient[1]);
      bgGrad.addColorStop(1, cfg.bgGradient[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // 2. Specific Theme Background Motifs
      if (this.currentThemeId === 'diwali') {
        this.drawDiwaliMandala(ctx);
        this.drawHangingLanterns(ctx);
      } else if (this.currentThemeId === 'eid') {
        this.drawEidCrescent(ctx);
        this.drawHangingLanterns(ctx);
      } else if (this.currentThemeId === 'cyber') {
        this.drawCyberGrid(ctx);
      }

      // 3. Draw Ambient Particles (Embers / Snow / Gulal)
      this.drawAmbientParticles(ctx);

      // 4. Draw Fireworks Bursts
      this.drawFireworks(ctx);

      // 5. Draw Glowing Clay Diyas at the bottom (Diwali exclusive)
      if (this.currentThemeId === 'diwali') {
        this.drawDiyas(ctx);
      }
    }

    drawDiwaliMandala(ctx) {
      // Golden subtle Rangoli / Mandala watermark in the background
      ctx.save();
      ctx.translate(this.width / 2, this.height * 0.38);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.08)';
      ctx.lineWidth = 1.5;

      const baseR = Math.min(this.width, this.height) * 0.28;

      // Concentric ornamental rings
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, baseR * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, baseR * 0.4, 0, Math.PI * 2);
      ctx.stroke();

      // 12 Petal Lotus Flower Mandala
      const petals = 12;
      for (let i = 0; i < petals; i++) {
        const ang = (i * Math.PI * 2) / petals;
        ctx.save();
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(baseR * 0.35, baseR * 0.35, 0, baseR);
        ctx.quadraticCurveTo(-baseR * 0.35, baseR * 0.35, 0, 0);
        ctx.fillStyle = 'rgba(255, 170, 0, 0.025)';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    drawHangingLanterns(ctx) {
      this.lanterns.forEach(l => {
        ctx.save();
        const angle = Math.sin(l.swing) * 0.08;
        ctx.translate(l.x, l.y);
        ctx.rotate(angle);

        // Hanging thread
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, l.length);
        ctx.stroke();

        // Akash Kandil / Lantern Body (Diamond/Octagon)
        const ly = l.length;
        const lw = 20;
        const lh = 28;

        // Radiant glow
        const glow = ctx.createRadialGradient(0, ly + lh / 2, 2, 0, ly + lh / 2, 45);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.55)');
        glow.addColorStop(0.5, 'rgba(255, 100, 0, 0.25)');
        glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, ly + lh / 2, 45, 0, Math.PI * 2);
        ctx.fill();

        // Lantern polygon
        ctx.fillStyle = l.color || '#ef4444';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(lw, ly + lh * 0.5);
        ctx.lineTo(0, ly + lh);
        ctx.lineTo(-lw, ly + lh * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(0, ly + lh * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Tassels hanging at bottom of lantern
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        for (let t = -12; t <= 12; t += 6) {
          ctx.beginPath();
          ctx.moveTo(t * 0.6, ly + lh);
          ctx.lineTo(t * 0.8, ly + lh + 22);
          ctx.stroke();
        }

        ctx.restore();
      });
    }

    drawEidCrescent(ctx) {
      // Golden glowing crescent moon
      ctx.save();
      const cx = this.width * 0.82;
      const cy = this.height * 0.22;
      const r = 38;

      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 24;

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Mask out inner circle for crescent
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx + 14, cy - 8, r * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    drawCyberGrid(ctx) {
      // Classic neon grid lines
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.lineWidth = 1;

      for (let x = 0; x < this.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
      for (let y = 0; y < this.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawDiyas(ctx) {
      this.diyas.forEach(d => {
        ctx.save();
        const f = Math.sin(d.flicker);
        const flameH = 18 + f * 4;
        const flameW = 8 + f * 1.5;

        // 1. Clay Diya Base (Traditional terracotta pot)
        const dw = d.size;
        const dh = d.size * 0.42;

        // Warm ground glow halo
        const halo = ctx.createRadialGradient(d.x, d.y - 6, 2, d.x, d.y - 6, 42);
        halo.addColorStop(0, 'rgba(255, 170, 0, 0.55)');
        halo.addColorStop(0.4, 'rgba(255, 80, 0, 0.25)');
        halo.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(d.x, d.y - 6, 42, 0, Math.PI * 2);
        ctx.fill();

        // Terracotta clay body
        const clayGrad = ctx.createLinearGradient(d.x - dw, d.y, d.x + dw, d.y + dh);
        clayGrad.addColorStop(0, '#c2410c');
        clayGrad.addColorStop(0.5, '#ea580c');
        clayGrad.addColorStop(1, '#9a3412');
        ctx.fillStyle = clayGrad;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, dw * 0.6, dh * 0.65, 0, 0, Math.PI);
        ctx.fill();

        // Diya rim
        ctx.fillStyle = '#fdba74';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y - dh * 0.1, dw * 0.6, dh * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden oil inside
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y - dh * 0.1, dw * 0.45, dh * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Flickering Golden Flame
        // Outer orange/yellow flame
        const flameGrad = ctx.createRadialGradient(
          d.x, d.y - flameH * 0.4, 1,
          d.x, d.y - flameH * 0.4, flameH
        );
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.2, '#fef08a');
        flameGrad.addColorStop(0.55, '#f59e0b');
        flameGrad.addColorStop(0.85, '#dc2626');
        flameGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(d.x - flameW * 0.6, d.y - 2);
        ctx.quadraticCurveTo(d.x - flameW, d.y - flameH * 0.6, d.x, d.y - flameH);
        ctx.quadraticCurveTo(d.x + flameW, d.y - flameH * 0.6, d.x + flameW * 0.6, d.y - 2);
        ctx.closePath();
        ctx.fill();

        // Inner hot white/yellow core
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y - flameH * 0.35, flameW * 0.28, flameH * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    }

    drawAmbientParticles(ctx) {
      this.particles.forEach(p => {
        ctx.save();
        if (p.type === 'ember') {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'snow') {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'gulal') {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    drawFireworks(ctx) {
      this.fireworks.forEach(f => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, f.alpha);
        ctx.fillStyle = f.color;

        if (f.sparkle) {
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.FestivalEngine = new FestivalThemeEngine();
    });
  } else {
    window.FestivalEngine = new FestivalThemeEngine();
  }
})();

