/**
 * DUEL ZONE - Phaser 3 Game Engine
 * 
 * Features:
 *   - Custom Hero Face Avatar (Curly hair, glasses) on player characters
 *   - Voice audio clips: "Tum mujhe gussa mat dilao!" on match entry & on bullet hit
 *   - Local 2-Player (Same Keyboard / PC) with P1: WASD+F/Mouse Left Click, P2: Arrows+0/+/Enter
 *   - Single Player VS Combat AI Bot
 *   - Real-time Online Multiplayer via Socket.IO
 * 
 * Exposes window.startGame() and window.destroyGame() as globals.
 */

// ============================================================
// CONSTANTS
// ============================================================

const ARENA_W = 1200;
const ARENA_H = 600;
const GRAVITY = 900;
const PLAYER_SPEED = 250;
const JUMP_VEL = -500;
const BULLET_SPEED = 700;
const SHOOT_COOLDOWN = 400;
const DAMAGE_COOLDOWN = 800;
const MAX_HP = 100;

const SPAWN = {
  1: { x: 150, y: 450 },
  2: { x: 1050, y: 450 }
};

const PLATFORMS = [
  { x: 600, y: 584, w: 1200, h: 32, isGround: true },
  { x: 200, y: 440, w: 200, h: 16 },
  { x: 1000, y: 440, w: 200, h: 16 },
  { x: 600, y: 370, w: 280, h: 16 },
  { x: 280, y: 290, w: 180, h: 16 },
  { x: 920, y: 290, w: 180, h: 16 },
  { x: 600, y: 210, w: 200, h: 16 }
];

const CRATES = [
  { x: 380, y: 552 },
  { x: 820, y: 552 },
  { x: 540, y: 338 },
  { x: 660, y: 338 }
];

// ============================================================
// BOOT SCENE — Preloads photo & audio, bakes custom animations
// ============================================================

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load custom face photo & voice audio for DIP, SANKET, SUSHRUTO, AHIL & KESHAV
    this.load.image('player-face-raw', '/assets/player_face.jpg');
    this.load.image('sanket-face-raw', '/assets/sanket_face.jpg');
    this.load.image('sushruto-face-raw', '/assets/sushruto_face.png');
    this.load.image('ahil-face-raw', '/assets/ahil_face.jpg');
    this.load.image('keshav-face-raw', '/assets/keshav_face.jpg');
    this.load.audio('voice-dip', ['/assets/voice_dip.ogg', '/assets/voice_dip.mp4', '/assets/voice_dip.m4a']);
    this.load.audio('voice-sanket', '/assets/voice_sanket.ogg');
    this.load.audio('voice-sushruto', '/assets/voice_sushruto.ogg');
    this.load.audio('voice-ahil', '/assets/voice_ahil.ogg');
    this.load.audio('voice-keshav', '/assets/voice_keshav.ogg');
    this.load.audio('voice-gussa', '/assets/voice_gussa.ogg');
  }

  create() {
    // Helper: draw on HTML5 Canvas and add to Phaser texture manager
    const makeCanvasTexture = (key, w, h, drawFn) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      drawFn(ctx);
      this.textures.addCanvas(key, canvas);
    };

    // Helper: graphics baking for environment tiles & bullets
    const makeGraphicsTexture = (key, w, h, drawFn) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      drawFn(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // ----------------------------------------------------------
    // 1. Prepare High-Res Circular Cropped Headshots (FULL BADA HEAD)
    // ----------------------------------------------------------
    let faceBlue   = null;
    let faceRed    = null;
    let faceGreen  = null;
    let facePurple = null;
    let faceOrange = null;

    try {
      const rawFaceImg = this.textures.get('player-face-raw').getSourceImage();

      // Blue hero face canvas (120x120) - DIP
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 120;
      bCanvas.height = 120;
      const bctx = bCanvas.getContext('2d');
      bctx.save();
      bctx.beginPath();
      bctx.arc(60, 60, 56, 0, Math.PI * 2);
      bctx.closePath();
      bctx.clip();
      // Crop to head area (curly hair, glasses, face) from 576x1024
      bctx.drawImage(rawFaceImg, 90, 65, 396, 440, 0, 0, 120, 120);
      bctx.restore();
      bctx.strokeStyle = '#00e5ff';
      bctx.lineWidth = 5;
      bctx.beginPath();
      bctx.arc(60, 60, 56, 0, Math.PI * 2);
      bctx.stroke();
      faceBlue = bCanvas;

      // Red hero face canvas (120x120) - SANKET
      let rawSanketImg = null;
      try {
        rawSanketImg = this.textures.get('sanket-face-raw').getSourceImage();
      } catch (e) {}

      const rCanvas = document.createElement('canvas');
      rCanvas.width = 120;
      rCanvas.height = 120;
      const rctx = rCanvas.getContext('2d');
      rctx.save();
      rctx.beginPath();
      rctx.arc(60, 60, 56, 0, Math.PI * 2);
      rctx.closePath();
      rctx.clip();
      if (rawSanketImg) {
        // Crop Sanket's head (576x1024, hair starts ~220, face ~350x350)
        rctx.drawImage(rawSanketImg, 110, 220, 360, 360, 0, 0, 120, 120);
      } else {
        rctx.drawImage(bCanvas, 0, 0, 120, 120);
      }
      rctx.restore();
      rctx.strokeStyle = '#ff3366';
      rctx.lineWidth = 5;
      rctx.beginPath();
      rctx.arc(60, 60, 56, 0, Math.PI * 2);
      rctx.stroke();
      faceRed = rCanvas;

      // Green hero face canvas (120x120) - SUSHRUTO
      let rawSushrutoImg = null;
      try {
        rawSushrutoImg = this.textures.get('sushruto-face-raw').getSourceImage();
      } catch (e) {}

      const gCanvas = document.createElement('canvas');
      gCanvas.width = 120;
      gCanvas.height = 120;
      const gctx = gCanvas.getContext('2d');
      gctx.save();
      gctx.beginPath();
      gctx.arc(60, 60, 56, 0, Math.PI * 2);
      gctx.closePath();
      gctx.clip();
      if (rawSushrutoImg) {
        // Sushruto photo is 171x179
        gctx.drawImage(rawSushrutoImg, 0, 0, rawSushrutoImg.width, rawSushrutoImg.height, 0, 0, 120, 120);
      } else {
        gctx.drawImage(bCanvas, 0, 0, 120, 120);
      }
      gctx.restore();
      gctx.strokeStyle = '#22c55e';
      gctx.lineWidth = 5;
      gctx.beginPath();
      gctx.arc(60, 60, 56, 0, Math.PI * 2);
      gctx.stroke();
      faceGreen = gCanvas;

      // Purple hero face canvas (120x120) - AHIL (Drunk Smoker Hero)
      let rawAhilImg = null;
      try {
        rawAhilImg = this.textures.get('ahil-face-raw').getSourceImage();
      } catch (e) {}

      const pCanvas = document.createElement('canvas');
      pCanvas.width = 120;
      pCanvas.height = 120;
      const pctx = pCanvas.getContext('2d');
      pctx.save();
      pctx.beginPath();
      pctx.arc(60, 60, 56, 0, Math.PI * 2);
      pctx.closePath();
      pctx.clip();
      if (rawAhilImg) {
        // Crop Ahil's head from 576x1024
        pctx.drawImage(rawAhilImg, 100, 180, 380, 400, 0, 0, 120, 120);
      } else {
        pctx.drawImage(bCanvas, 0, 0, 120, 120);
      }
      pctx.restore();
      pctx.strokeStyle = '#a855f7';
      pctx.lineWidth = 5;
      pctx.beginPath();
      pctx.arc(60, 60, 56, 0, Math.PI * 2);
      pctx.stroke();

      // Cigarette in mouth on face canvas
      pctx.fillStyle = '#ffffff';
      pctx.fillRect(72, 78, 14, 4);
      pctx.fillStyle = '#ff4500';
      pctx.fillRect(84, 78, 4, 4);
      pctx.fillStyle = '#ffaa00';
      pctx.fillRect(86, 79, 2, 2);

      facePurple = pCanvas;

      // Orange hero face canvas (120x120) - KESHAV (Drunk Bottle Thrower)
      let rawKeshavImg = null;
      try {
        rawKeshavImg = this.textures.get('keshav-face-raw').getSourceImage();
      } catch (e) {}

      const oCanvas = document.createElement('canvas');
      oCanvas.width = 120;
      oCanvas.height = 120;
      const octx = oCanvas.getContext('2d');
      octx.save();
      octx.beginPath();
      octx.arc(60, 60, 56, 0, Math.PI * 2);
      octx.closePath();
      octx.clip();
      if (rawKeshavImg) {
        // Crop Keshav's head from 853x1024
        octx.drawImage(rawKeshavImg, 280, 40, 290, 290, 0, 0, 120, 120);
      } else {
        octx.drawImage(bCanvas, 0, 0, 120, 120);
      }
      octx.restore();
      octx.strokeStyle = '#f59e0b';
      octx.lineWidth = 5;
      octx.beginPath();
      octx.arc(60, 60, 56, 0, Math.PI * 2);
      octx.stroke();

      faceOrange = oCanvas;
    } catch (e) {
      console.warn('Face texture generation note:', e);
    }

    // Continuous Smoke Puff texture for Ahil
    makeCanvasTexture('smoke-puff', 32, 32, (ctx) => {
      const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
      grad.addColorStop(0, 'rgba(240, 240, 250, 0.85)');
      grad.addColorStop(0.45, 'rgba(185, 190, 205, 0.45)');
      grad.addColorStop(1, 'rgba(120, 125, 140, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
    });

    // ----------------------------------------------------------
    // 2. Multi-Frame Animated Characters (Original Compact Body Size)
    // ----------------------------------------------------------
    const generatePlayerFrames = (colorKey, mainColorStr, darkColorStr) => {
      const faceImg = colorKey === 'blue' ? faceBlue : (colorKey === 'green' ? faceGreen : (colorKey === 'purple' ? facePurple : (colorKey === 'orange' ? faceOrange : faceRed)));

      const drawFrame = (ctx, frameType) => {
        if (frameType === 'dead') {
          // Ground shadow
          ctx.fillStyle = '#1a1a25';
          ctx.beginPath();
          ctx.ellipse(24, 50, 21, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Fallen head with photo face
          if (faceImg) {
            ctx.save();
            ctx.translate(12, 42);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(faceImg, -13, -13, 26, 26);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            ctx.fillStyle = mainColorStr;
            ctx.beginPath();
            ctx.arc(10, 44, 8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Fallen torso
          ctx.fillStyle = mainColorStr;
          ctx.fillRect(16, 40, 20, 10);
          ctx.fillStyle = darkColorStr;
          ctx.fillRect(22, 40, 4, 10);

          // Fallen legs
          ctx.fillStyle = darkColorStr;
          ctx.fillRect(34, 42, 10, 6);
          ctx.fillStyle = '#111111';
          ctx.fillRect(40, 44, 6, 5);

          // Dropped gun
          ctx.fillStyle = '#555555';
          ctx.fillRect(18, 48, 8, 4);
          ctx.fillStyle = '#222222';
          ctx.fillRect(24, 49, 4, 2);
          return;
        }

        let headX     = 20;
        let headY     = 13;
        let torsoY    = 20;
        let armX      = 28;
        let armY      = 24;
        let gunX      = 32;
        let gunY      = 22;
        let leftLegX  = 12;
        let leftLegY  = 40;
        let leftLegH  = 12;
        let rightLegX = 21;
        let rightLegY = 40;
        let rightLegH = 12;

        if (frameType === 'idle-1') {
          headY  += 1;
          torsoY += 1;
          armY   += 1;
          gunY   += 1;
        } else if (frameType === 'run-0') {
          headY  += 1;
          torsoY += 1;
          leftLegX -= 3;
          leftLegH -= 2;
          rightLegX += 3;
        } else if (frameType === 'run-1') {
          headY  -= 1;
          torsoY -= 1;
          armY   -= 1;
          gunY   -= 1;
        } else if (frameType === 'run-2') {
          headY  += 1;
          torsoY += 1;
          leftLegX += 3;
          rightLegX -= 3;
          rightLegH -= 2;
        } else if (frameType === 'run-3') {
          headY  -= 1;
          torsoY -= 1;
          armY   -= 1;
          gunY   -= 1;
        } else if (frameType === 'jump') {
          headY  -= 2;
          torsoY -= 2;
          leftLegY -= 3;
          leftLegH  = 8;
          rightLegY -= 4;
          rightLegH  = 8;
          gunY   -= 3;
          armY   -= 2;
        } else if (frameType === 'shoot') {
          armX -= 2;
          gunX -= 2;
        } else if (frameType === 'hit') {
          headY -= 1;
        }

        // Torso
        ctx.fillStyle = mainColorStr;
        ctx.fillRect(12, torsoY, 16, 20);
        ctx.fillStyle = darkColorStr;
        ctx.fillRect(18, torsoY, 4, 20);

        // Belt
        ctx.fillStyle = '#333333';
        ctx.fillRect(12, torsoY + 17, 16, 3);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(18, torsoY + 17, 4, 3);

        // Legs
        ctx.fillStyle = darkColorStr;
        ctx.fillRect(leftLegX, leftLegY, 7, leftLegH);
        ctx.fillRect(rightLegX, rightLegY, 7, rightLegH);

        // Boots
        ctx.fillStyle = '#222222';
        ctx.fillRect(leftLegX - 1, leftLegY + leftLegH - 3, 8, 5);
        ctx.fillRect(rightLegX - 1, rightLegY + rightLegH - 3, 8, 5);
        ctx.fillStyle = '#111111';
        ctx.fillRect(leftLegX - 1, leftLegY + leftLegH + 1, 9, 3);
        ctx.fillRect(rightLegX - 1, rightLegY + rightLegH + 1, 9, 3);

        // Arm
        ctx.fillStyle = mainColorStr;
        ctx.fillRect(armX, armY, 6, 5);

        // Weapon: Gun for most, Alcohol Bottle for Keshav
        if (colorKey === 'orange') {
          ctx.fillStyle = '#0f766e'; // Dark green bottle neck
          ctx.fillRect(gunX, gunY, 3, 3);
          ctx.fillStyle = '#d97706'; // Amber liquor bottle
          ctx.fillRect(gunX + 3, gunY - 2, 7, 8);
          ctx.fillStyle = '#fef08a'; // Label
          ctx.fillRect(gunX + 4, gunY, 4, 4);
        } else {
          ctx.fillStyle = '#555555';
          ctx.fillRect(gunX, gunY, 8, 6);
          ctx.fillStyle = '#333333';
          ctx.fillRect(gunX + 6, gunY + 1, 4, 4);
          ctx.fillStyle = '#444444';
          ctx.fillRect(gunX + 1, gunY + 6, 3, 4);
          ctx.fillStyle = '#777777';
          ctx.fillRect(gunX + 2, gunY + 1, 2, 4);
        }

        if (frameType === 'shoot') {
          ctx.fillStyle = '#ffdd00';
          ctx.beginPath();
          ctx.arc(gunX + 11, gunY + 3, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // HEAD: Real face photo
        if (faceImg) {
          ctx.drawImage(faceImg, headX - 13, headY - 13, 26, 26);
          if (colorKey === 'purple') {
            // Burning cigarette sticking out for Ahil
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(headX + 6, headY + 4, 7, 2);
            ctx.fillStyle = '#ff4500';
            ctx.fillRect(headX + 13, headY + 4, 3, 2);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(headX + 15, headY + 4, 1, 2);
          }
          if (frameType === 'hit') {
            ctx.fillStyle = 'rgba(255, 30, 30, 0.45)';
            ctx.beginPath();
            ctx.arc(headX, headY, 13, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = mainColorStr;
          ctx.beginPath();
          ctx.arc(headX, headY, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      const frames = ['idle-0', 'idle-1', 'run-0', 'run-1', 'run-2', 'run-3', 'jump', 'shoot', 'hit', 'dead'];
      frames.forEach(f => {
        makeCanvasTexture(`player-${colorKey}-${f}`, 48, 56, (ctx) => drawFrame(ctx, f));
      });
      // Fallback base
      makeCanvasTexture(`player-${colorKey}`, 48, 56, (ctx) => drawFrame(ctx, 'idle-0'));
    };

    generatePlayerFrames('blue',   '#4488ff', '#2266cc'); // DIP
    generatePlayerFrames('red',    '#ff4444', '#cc2222'); // SANKET
    generatePlayerFrames('green',  '#22c55e', '#15803d'); // SUSHRUTO
    generatePlayerFrames('purple', '#a855f7', '#7e22ce'); // AHIL (Drunk Smoker Hero)
    generatePlayerFrames('orange', '#f59e0b', '#b45309'); // KESHAV (Drunk Bottle Thrower)

    // ----------------------------------------------------------
    // Create Phaser Animations
    // ----------------------------------------------------------
    ['blue', 'red', 'green', 'purple', 'orange'].forEach(color => {
      this.anims.create({
        key: `${color}-idle`,
        frames: [{ key: `player-${color}-idle-0` }, { key: `player-${color}-idle-1` }],
        frameRate: 3,
        repeat: -1
      });
      this.anims.create({
        key: `${color}-run`,
        frames: [
          { key: `player-${color}-run-0` },
          { key: `player-${color}-run-1` },
          { key: `player-${color}-run-2` },
          { key: `player-${color}-run-3` }
        ],
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: `${color}-jump`,
        frames: [{ key: `player-${color}-jump` }],
        frameRate: 1
      });
      this.anims.create({
        key: `${color}-shoot`,
        frames: [{ key: `player-${color}-shoot` }],
        frameRate: 8
      });
      this.anims.create({
        key: `${color}-hit`,
        frames: [{ key: `player-${color}-hit` }],
        frameRate: 8
      });
      this.anims.create({
        key: `${color}-dead`,
        frames: [{ key: `player-${color}-dead` }],
        frameRate: 1
      });
    });

    // ----------------------------------------------------------
    // 3. Bullets, Platforms, Crates, Hearts
    // ----------------------------------------------------------
    makeGraphicsTexture('bullet', 14, 6, (g) => {
      g.fillStyle(0xffee00);
      g.fillRoundedRect(0, 0, 14, 6, 3);
      g.fillStyle(0xffffff);
      g.fillRect(3, 1, 6, 4);
    });

    // Alcohol Glass Bottle Projectile for Keshav
    makeCanvasTexture('bottle-bullet', 22, 10, (ctx) => {
      // Bottle neck
      ctx.fillStyle = '#0f766e'; // Dark green bottle glass
      ctx.fillRect(0, 3, 5, 4);
      // Cork
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, 3, 2, 4);
      // Bottle body
      ctx.fillStyle = '#047857';
      ctx.fillRect(5, 1, 15, 8);
      // Amber alcohol liquid inside
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(7, 2, 11, 6);
      // White label
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(9, 3, 7, 4);
      // Glass highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(6, 1, 13, 1);
    });

    // Glass Shard particle for bottle shatter
    makeCanvasTexture('glass-shard', 8, 8, (ctx) => {
      ctx.fillStyle = '#5eead4';
      ctx.beginPath();
      ctx.moveTo(1, 1);
      ctx.lineTo(7, 3);
      ctx.lineTo(4, 7);
      ctx.closePath();
      ctx.fill();
    });

    // Amber Alcohol Splash particle
    makeCanvasTexture('amber-splash', 10, 10, (ctx) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    makeGraphicsTexture('platform-tile', 32, 16, (g) => {
      g.fillStyle(0x3a3a4a);
      g.fillRect(0, 0, 32, 16);
      g.fillStyle(0x4a4a5a);
      g.fillRect(1, 1, 30, 2);
      g.fillStyle(0x2a2a3a);
      g.fillRect(1, 13, 30, 2);
      g.fillStyle(0x444455);
      g.fillRect(4, 5, 3, 3);
      g.fillRect(25, 5, 3, 3);
      g.lineStyle(1, 0x2a2a3a);
      g.strokeRect(0, 0, 32, 16);
    });

    makeGraphicsTexture('ground-tile', 32, 32, (g) => {
      g.fillStyle(0x2a2a35);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x333340);
      g.fillRect(0, 0, 32, 4);
      g.fillStyle(0x222230);
      g.fillRect(0, 10, 32, 1);
      g.fillRect(0, 20, 32, 1);
      g.fillStyle(0x252532);
      g.fillRect(5, 6, 8, 1);
      g.fillRect(18, 14, 10, 1);
      g.fillRect(2, 24, 12, 1);
      g.fillRect(20, 28, 8, 1);
    });

    makeGraphicsTexture('crate', 32, 32, (g) => {
      g.fillStyle(0x5a4a2a);
      g.fillRect(0, 0, 32, 32);
      g.lineStyle(2, 0x3a3018);
      g.strokeRect(1, 1, 30, 30);
      g.lineStyle(1, 0x3a3018);
      g.lineBetween(0, 0, 32, 32);
      g.lineBetween(32, 0, 0, 32);
      g.fillStyle(0x888888);
      g.fillCircle(16, 16, 3);
      g.fillStyle(0x777777);
      g.fillRect(0, 0, 32, 3);
      g.fillRect(0, 29, 32, 3);
    });

    makeGraphicsTexture('heart-full', 20, 18, (g) => {
      g.fillStyle(0xff1744);
      g.fillCircle(6, 6, 5);
      g.fillCircle(14, 6, 5);
      g.fillTriangle(1, 8, 19, 8, 10, 18);
    });

    makeGraphicsTexture('heart-empty', 20, 18, (g) => {
      g.fillStyle(0x333344);
      g.fillCircle(6, 6, 5);
      g.fillCircle(14, 6, 5);
      g.fillTriangle(1, 8, 19, 8, 10, 18);
    });

    makeGraphicsTexture('particle', 8, 8, (g) => {
      g.fillStyle(0xffffff);
      g.fillCircle(4, 4, 3);
    });

    makeGraphicsTexture('muzzle-flash', 20, 20, (g) => {
      g.fillStyle(0xffff00);
      g.fillCircle(10, 10, 6);
      g.fillStyle(0xffffff);
      g.fillCircle(10, 10, 3);
    });

    // ----------------------------------------------------------
    // 9. Golden Crown Texture (Awarded on 3+ Win Streak)
    // ----------------------------------------------------------
    makeCanvasTexture('crown', 24, 18, (ctx) => {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 6;

      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#d48b00';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(2, 14);
      ctx.lineTo(2, 6);   // Left tip
      ctx.lineTo(7, 10);  // Left valley
      ctx.lineTo(12, 2);  // Center highest tip
      ctx.lineTo(17, 10); // Right valley
      ctx.lineTo(22, 6);  // Right tip
      ctx.lineTo(22, 14); // Bottom right
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffeaa7';
      ctx.beginPath();
      ctx.moveTo(11, 4);
      ctx.lineTo(12, 2);
      ctx.lineTo(13, 4);
      ctx.lineTo(12, 11);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#c77d00';
      ctx.fillRect(2, 12, 20, 3);
      ctx.fillStyle = '#ffdd55';
      ctx.fillRect(3, 13, 18, 1);

      // Jewels on peaks
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(3, 6, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(12, 3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(21, 6, 2, 0, Math.PI * 2);
      ctx.fill();

      // Band center jewel
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(11, 12, 2, 2);
    });

    // ----------------------------------------------------------
    // 10. Brawl Stars Daytime Battleground Map Textures
    // ----------------------------------------------------------
    makeCanvasTexture('brawl-platform-tile', 32, 16, (ctx) => {
      // Grass top
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, 32, 5);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(2, 0, 4, 3);
      ctx.fillRect(10, 0, 5, 2);
      ctx.fillRect(18, 0, 6, 3);
      ctx.fillRect(27, 0, 3, 2);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 5, 32, 2);
      // Canyon rock bottom
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 7, 32, 9);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(4, 9, 8, 3);
      ctx.fillRect(18, 10, 10, 3);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(14, 8, 2, 7);
    });

    makeCanvasTexture('brawl-ground-tile', 32, 32, (ctx) => {
      // Grass layer top
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, 32, 7);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(3, 0, 5, 4);
      ctx.fillRect(12, 0, 6, 3);
      ctx.fillRect(22, 0, 7, 4);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 7, 32, 2);
      // Terracotta canyon dirt / stone blocks
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 9, 32, 23);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(2, 11, 12, 8);
      ctx.fillRect(18, 12, 11, 7);
      ctx.fillRect(6, 22, 18, 8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 20, 32, 1);
      ctx.fillRect(16, 9, 1, 11);
      ctx.fillRect(26, 20, 1, 12);
    });

    makeCanvasTexture('brawl-crate', 32, 32, (ctx) => {
      // Brawl Stars style wooden battle crate
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 30, 30);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(3, 3, 26, 26);
      // Cyan reinforced steel corners
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, 2, 8, 8);
      ctx.fillRect(22, 2, 8, 8);
      ctx.fillRect(2, 22, 8, 8);
      ctx.fillRect(22, 22, 8, 8);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(24, 4, 2, 2);
      ctx.fillRect(4, 24, 2, 2);
      ctx.fillRect(24, 24, 2, 2);
      // Golden star emblem
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(16, 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, 16, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // ----------------------------------------------------------
    // 11. Special Power Projectile Textures (Brawl Stars Ultimates)
    // ----------------------------------------------------------
    // DIP: Mega Plasma Beam
    makeCanvasTexture('super-beam', 64, 24, (ctx) => {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.fillRect(0, 0, 64, 24);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(0, 4, 64, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 8, 64, 8);
    });

    // SANKET: Meteor Rocket
    makeCanvasTexture('super-rocket', 28, 14, (ctx) => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(28, 7);
      ctx.lineTo(20, 1);
      ctx.lineTo(4, 1);
      ctx.lineTo(4, 13);
      ctx.lineTo(20, 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(2, 0, 4, 3);
      ctx.fillRect(2, 11, 4, 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, 4, 4, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 4, 8, 3);
    });

    // SUSHRUTO: Cyber Orb
    makeCanvasTexture('super-orb', 24, 24, (ctx) => {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.beginPath();
      ctx.arc(12, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(12, 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(12, 12, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fiery Explosion Blast
    makeCanvasTexture('super-blast', 44, 44, (ctx) => {
      ctx.fillStyle = 'rgba(255, 170, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(22, 22, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(22, 22, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(22, 22, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    // ----------------------------------------------------------
    // 12. Top-Down Brawl Stars Battleground Textures
    // ----------------------------------------------------------
    // Desert Sand Ground Tile
    makeCanvasTexture('brawl-sand-tile', 64, 64, (ctx) => {
      ctx.fillStyle = '#e29b67';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#d38b55';
      ctx.fillRect(10, 15, 24, 18);
      ctx.fillRect(40, 35, 18, 14);
      ctx.fillStyle = '#b86c3b';
      ctx.fillRect(14, 22, 3, 2);
      ctx.fillRect(48, 12, 2, 2);
      ctx.fillRect(32, 45, 3, 2);
      ctx.fillStyle = '#f0b07e';
      ctx.fillRect(20, 8, 4, 3);
      ctx.fillRect(52, 50, 4, 3);
    });

    // Canyon Cliff Rock Border
    makeCanvasTexture('brawl-canyon-wall', 36, 36, (ctx) => {
      ctx.fillStyle = '#8a3a1f';
      ctx.fillRect(0, 0, 36, 36);
      ctx.fillStyle = '#b55835';
      ctx.fillRect(0, 0, 36, 6);
      ctx.fillStyle = '#d07048';
      ctx.fillRect(2, 1, 32, 2);
      ctx.fillStyle = '#541c0a';
      ctx.fillRect(0, 32, 36, 4);
      ctx.strokeStyle = '#63210d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 6); ctx.lineTo(14, 20); ctx.lineTo(24, 32);
      ctx.stroke();
    });

    // Golden Wheat Bush (Brawl Stars Tall Grass Cluster)
    makeCanvasTexture('brawl-bush', 64, 52, (ctx) => {
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(32, 44, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      const stalks = [
        { x: 14, y: 18, h: 28, c: '#f59e0b' },
        { x: 22, y: 12, h: 34, c: '#fbbf24' },
        { x: 32, y: 8,  h: 38, c: '#fde047' },
        { x: 42, y: 12, h: 34, c: '#fbbf24' },
        { x: 50, y: 18, h: 28, c: '#f59e0b' },
        { x: 18, y: 22, h: 22, c: '#d97706' },
        { x: 28, y: 16, h: 28, c: '#fbbf24' },
        { x: 38, y: 16, h: 28, c: '#fbbf24' },
        { x: 46, y: 22, h: 22, c: '#d97706' }
      ];

      stalks.forEach(s => {
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + 5, s.y + s.h);
        ctx.lineTo(s.x - 5, s.y + s.h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Round Wooden Barrel with Metal Rings
    makeCanvasTexture('brawl-barrel', 36, 36, (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(18, 22, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(18, 18, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(18, 18, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(18, 5); ctx.lineTo(18, 31);
      ctx.moveTo(10, 8); ctx.lineTo(10, 28);
      ctx.moveTo(26, 8); ctx.lineTo(26, 28);
      ctx.stroke();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(18, 18, 13.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(18, 18, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Horizontal Wooden Fence
    makeCanvasTexture('brawl-fence-h', 96, 24, (ctx) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 6, 96, 5);
      ctx.fillRect(0, 14, 96, 5);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 7, 96, 3);
      ctx.fillRect(0, 15, 96, 3);
      [4, 32, 60, 88].forEach(x => {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(x - 4, 1, 9, 22);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x - 3, 2, 7, 19);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x - 2, 2, 2, 19);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(x - 4, 0, 9, 3);
      });
    });

    // Vertical Wooden Fence
    makeCanvasTexture('brawl-fence-v', 24, 96, (ctx) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 0, 5, 96);
      ctx.fillRect(14, 0, 5, 96);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(7, 0, 3, 96);
      ctx.fillRect(15, 0, 3, 96);
      [4, 32, 60, 88].forEach(y => {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(1, y - 4, 22, 9);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(2, y - 3, 19, 7);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(2, y - 2, 19, 2);
      });
    });

    // Brawl Stars Heist Vault / Diwali Khazana Vault
    makeCanvasTexture('brawl-safe', 52, 48, (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(26, 44, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Royal Gold & Crimson Treasure Safe
      ctx.fillStyle = '#b45309';
      ctx.fillRect(4, 6, 44, 38);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, 8, 40, 34);

      // Gold filigree panel
      ctx.fillStyle = '#78350f';
      ctx.fillRect(10, 12, 32, 26);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(12, 14, 28, 22);

      // Center Diya / Jewel lock
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(26, 25, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(26, 25, 4, 0, Math.PI * 2);
      ctx.fill();

      // Gold coins on top
      ctx.fillStyle = '#fde047';
      [14, 22, 30, 38].forEach((x, i) => {
        ctx.beginPath();
        ctx.arc(x, 7 + (i % 2) * 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Diwali Akash Kandil (Hanging Star Lantern)
    makeCanvasTexture('diwali-lantern', 36, 48, (ctx) => {
      // Glow
      ctx.fillStyle = 'rgba(255, 170, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(18, 18, 16, 0, Math.PI * 2);
      ctx.fill();

      // Octagonal lantern body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(18, 2);
      ctx.lineTo(30, 12);
      ctx.lineTo(30, 24);
      ctx.lineTo(18, 34);
      ctx.lineTo(6, 24);
      ctx.lineTo(6, 12);
      ctx.closePath();
      ctx.fill();

      // Inner golden star
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(18, 6);
      ctx.lineTo(26, 18);
      ctx.lineTo(18, 30);
      ctx.lineTo(10, 18);
      ctx.closePath();
      ctx.fill();

      // Cyan jewel core
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(18, 18, 4, 0, Math.PI * 2);
      ctx.fill();

      // Hanging ribbons
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      [10, 14, 18, 22, 26].forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, 32);
        ctx.lineTo(x, 46);
        ctx.stroke();
      });
    });

    // Desert Saguaro Cactus
    makeCanvasTexture('brawl-cactus', 32, 40, (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(16, 36, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.fillRect(12, 6, 8, 30);
      ctx.beginPath();
      ctx.arc(16, 7, 4, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(4, 18, 10, 5);
      ctx.fillRect(4, 12, 5, 10);
      ctx.fillRect(18, 22, 10, 5);
      ctx.fillRect(23, 16, 5, 10);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(14, 8, 2, 26);
    });

    // ----------------------------------------------------------
    // Diwali Battleground Textures (Bomb, Soan Papdi, Diyas, Blast Target)
    // ----------------------------------------------------------
    // 1. Diwali Pataka (Sutli Bomb)
    makeCanvasTexture('diwali-bomb', 36, 36, (ctx) => {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(18, 30, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Green Sutli / Jute wrapping cylinder
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(18, 18, 12, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red central band
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(6, 14, 24, 8);

      // Gold cross-ties (Sutli cords)
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, 18); ctx.lineTo(30, 18);
      ctx.moveTo(18, 6); ctx.lineTo(18, 30);
      ctx.stroke();

      // Burning golden fuse at top
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 7);
      ctx.quadraticCurveTo(24, 3, 24, 0);
      ctx.stroke();

      // Spark tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(24, 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Diwali Soan Papdi (Golden Sweet Box)
    makeCanvasTexture('diwali-soanpapdi', 36, 36, (ctx) => {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(18, 30, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden Mithai Box
      ctx.fillStyle = '#d97706';
      ctx.fillRect(5, 7, 26, 22);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(7, 9, 22, 18);

      // Festive ribbon wrap
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(16, 7, 4, 22);
      ctx.fillRect(5, 16, 26, 4);

      // Silver varq diamond in center
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(18, 13);
      ctx.lineTo(23, 18);
      ctx.lineTo(18, 23);
      ctx.lineTo(13, 18);
      ctx.closePath();
      ctx.fill();

      // Pistachio green specks
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(10, 11, 2, 2);
      ctx.fillRect(24, 11, 2, 2);
      ctx.fillRect(10, 23, 2, 2);
      ctx.fillRect(24, 23, 2, 2);
    });

    // 3. Diwali Blast Target (Red Danger Reticle)
    makeCanvasTexture('diwali-blast-target', 64, 64, (ctx) => {
      // Outer danger ring
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(32, 32, 26, 0, Math.PI * 2);
      ctx.stroke();

      // Inner danger fill
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(32, 32, 25, 0, Math.PI * 2);
      ctx.fill();

      // Crosshairs
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(32, 8); ctx.lineTo(32, 56);
      ctx.moveTo(8, 32); ctx.lineTo(56, 32);
      ctx.stroke();

      // Center warning dot
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(32, 32, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Diwali Rocket (Airborne Mortar)
    makeCanvasTexture('diwali-rocket', 32, 16, (ctx) => {
      // Wooden stick
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 7, 14, 2);

      // Cylinder rocket body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(12, 4, 12, 8);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(16, 4, 4, 8);

      // Pointy nose cone
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(24, 3);
      ctx.lineTo(31, 8);
      ctx.lineTo(24, 13);
      ctx.closePath();
      ctx.fill();
    });

    // 5. Diwali Diya (Clay Lamp with Glowing Flame)
    makeCanvasTexture('diwali-diya', 32, 28, (ctx) => {
      // Warm ground halo
      ctx.fillStyle = 'rgba(255, 170, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(16, 14, 13, 0, Math.PI * 2);
      ctx.fill();

      // Terracotta base
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.ellipse(16, 19, 12, 7, 0, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(16, 17, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(11, 16);
      ctx.quadraticCurveTo(10, 8, 16, 3);
      ctx.quadraticCurveTo(22, 8, 21, 16);
      ctx.closePath();
      ctx.fill();

      // Yellow hot core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(16, 12, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ground Selection Rings
    const makeRing = (key, colorHex, glowHex) => {
      makeCanvasTexture(key, 52, 30, (ctx) => {
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(26, 15, 23, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = glowHex;
        ctx.beginPath();
        ctx.ellipse(26, 15, 21, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    makeRing('brawl-ring-blue', '#00e5ff', 'rgba(0, 229, 255, 0.25)');
    makeRing('brawl-ring-red', '#ff3366', 'rgba(255, 51, 102, 0.25)');
    makeRing('brawl-ring-green', '#22c55e', 'rgba(34, 197, 94, 0.25)');
    makeRing('brawl-ring-purple', '#a855f7', 'rgba(168, 85, 247, 0.3)');
    makeRing('brawl-ring-orange', '#f59e0b', 'rgba(245, 158, 11, 0.35)');

    // Top-Down Hero Bodies (360° Rotatable with Real Face)
    const generateTopDownHero = (key, mainColorStr, darkColorStr, faceImg) => {
      makeCanvasTexture(key, 56, 56, (ctx) => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(28, 32, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders / Torso
        ctx.fillStyle = mainColorStr;
        ctx.beginPath();
        ctx.ellipse(26, 28, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkColorStr;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Gun Arm extending towards 0° right
        ctx.fillStyle = mainColorStr;
        ctx.fillRect(26, 26, 12, 6);
        ctx.fillStyle = darkColorStr;
        ctx.fillRect(26, 30, 12, 2);

        // Blaster / Gun (or Alcohol Bottle for Keshav)
        if (key === 'hero-td-orange') {
          ctx.fillStyle = '#0f766e'; // Dark green bottle neck
          ctx.fillRect(38, 25, 4, 4);
          ctx.fillStyle = '#d97706'; // Amber liquor bottle
          ctx.fillRect(42, 23, 11, 8);
          ctx.fillStyle = '#fef08a'; // Label
          ctx.fillRect(44, 24, 7, 6);
        } else {
          ctx.fillStyle = '#374151';
          ctx.fillRect(36, 24, 16, 7);
          ctx.fillStyle = '#111827';
          ctx.fillRect(44, 25, 7, 5);
          ctx.fillStyle = '#6b7280';
          ctx.fillRect(37, 24, 13, 2);
          ctx.fillStyle = mainColorStr === '#0284c7' ? '#00e5ff' : '#f59e0b';
          ctx.fillRect(39, 27, 4, 2);
        }

        // Left Arm supporting weapon
        ctx.fillStyle = mainColorStr;
        ctx.fillRect(22, 17, 10, 6);
        ctx.fillStyle = darkColorStr;
        ctx.fillRect(22, 17, 10, 2);

        // Real Face Photo Head
        if (faceImg) {
          ctx.drawImage(faceImg, 10, 14, 28, 28);
          if (key === 'hero-td-purple') {
            // Burning cigarette in mouth for Ahil
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(32, 28, 7, 2);
            ctx.fillStyle = '#ff4500';
            ctx.fillRect(39, 28, 3, 2);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(41, 28, 1, 2);
          }
        } else {
          ctx.fillStyle = mainColorStr;
          ctx.beginPath();
          ctx.arc(24, 28, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    generateTopDownHero('hero-td-blue', '#0284c7', '#0369a1', faceBlue);
    generateTopDownHero('hero-td-red', '#ef4444', '#b91c1c', faceRed);
    generateTopDownHero('hero-td-green', '#22c55e', '#15803d', faceGreen);
    generateTopDownHero('hero-td-purple', '#a855f7', '#7e22ce', facePurple);
    generateTopDownHero('hero-td-orange', '#d97706', '#b45309', faceOrange);

    // Advance to gameplay scene
    this.scene.start('GameScene');
  }
}

// ============================================================
// GAME SCENE — Main gameplay
// ============================================================

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    window.currentScene = this;
    this.isPaused        = false;

    // Show In-Game HUD (Pause Button)
    const inGameHud = document.getElementById('in-game-hud');
    if (inGameHud) inGameHud.style.display = 'flex';
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';

    this.socket          = window.socket;
    this.isLocal2P       = window.isLocal2P || false;
    this.isBotMatch      = window.isBotMatch || false;
    this.playerNumber    = window.playerNumber || 1;
    this.currentMap      = window.selectedMap || 'brawl';
    this.botDifficulty   = (window.botDifficulty || 'normal').toLowerCase();

    const BOT_DIFFICULTIES = {
      easy: {
        name: 'EASY',
        color: '#22c55e',
        tag: '🟢 EASY',
        topDownSpeed: 120,
        topDownStrafe: 100,
        topDownDodge: 140,
        dodgeChance: 0.45,
        shootDelayMin: 1300,
        shootDelayMax: 2100,
        pickupDist: 150,
        strafeMin: 1200,
        strafeMax: 2400,
        platSpeed: 130,
        platJumpMin: 3500,
        platJumpMax: 6000,
        superChance: 0.02
      },
      normal: {
        name: 'NORMAL',
        color: '#f59e0b',
        tag: '🟡 NORMAL',
        topDownSpeed: 165,
        topDownStrafe: 135,
        topDownDodge: 210,
        dodgeChance: 0.75,
        shootDelayMin: 700,
        shootDelayMax: 1200,
        pickupDist: 280,
        strafeMin: 800,
        strafeMax: 1600,
        platSpeed: 180,
        platJumpMin: 2600,
        platJumpMax: 4800,
        superChance: 0.04
      },
      hard: {
        name: 'HARD',
        color: '#ef4444',
        tag: '🔴 HARD',
        topDownSpeed: 210,
        topDownStrafe: 175,
        topDownDodge: 260,
        dodgeChance: 0.95,
        shootDelayMin: 420,
        shootDelayMax: 780,
        pickupDist: 450,
        strafeMin: 400,
        strafeMax: 900,
        platSpeed: 220,
        platJumpMin: 1800,
        platJumpMax: 3200,
        superChance: 0.08
      },
      supreme: {
        name: 'SUPREME',
        color: '#a855f7',
        tag: '⚡ SUPREME',
        topDownSpeed: 250,
        topDownStrafe: 215,
        topDownDodge: 300,
        dodgeChance: 1.0,
        shootDelayMin: 260,
        shootDelayMax: 440,
        pickupDist: 650,
        strafeMin: 250,
        strafeMax: 550,
        platSpeed: 260,
        platJumpMin: 1200,
        platJumpMax: 2200,
        superChance: 0.15
      }
    };
    this.botDiffConfig = BOT_DIFFICULTIES[this.botDifficulty] || BOT_DIFFICULTIES.normal;

    // Super Meter State & Projectiles
    this.p1Super           = 0;
    this.p2Super           = 0;
    this.passiveSuperTimer = 0;
    this.p1SuperTriggered  = false;
    this.p2SuperTriggered  = false;
    this.clouds            = [];
    this.homingOrbs        = [];

    // Resolve Character Roster (DIP, SANKET, SUSHRUTO)
    const p1Key = window.selectedP1Char || 'dip';
    const p2Key = window.selectedP2Char || 'sanket';

    this.charConfigs = {
      dip: {
        key: 'dip',
        name: 'DIP',
        color: 'blue',
        playVoice: () => this.playVoiceDip(),
        entryQuote: "DIP: Tum mujhe gussa mat dilao!",
        hitQuote: "DIP: Gussa mat dilao!",
        themeColor: '#4488ff',
        superName: 'Gussa Mega Beam'
      },
      sanket: {
        key: 'sanket',
        name: 'SANKET',
        color: 'red',
        playVoice: () => this.playVoiceSanket(),
        entryQuote: "Sanket: Baatein unchi unchi!",
        hitQuote: "Sanket Hit!",
        themeColor: '#ff4444',
        superName: 'Triple Meteor Slam'
      },
      sushruto: {
        key: 'sushruto',
        name: 'SUSHRUTO',
        color: 'green',
        playVoice: () => this.playVoiceSushruto(),
        entryQuote: "Sushruto: App launch nahi hua!",
        hitQuote: "Sushruto: Mail hi create hua!",
        themeColor: '#22c55e',
        superName: 'Cyber Overload EMP'
      },
      ahil: {
        key: 'ahil',
        name: 'AHIL',
        color: 'purple',
        playVoice: () => this.playVoiceAhil(),
        entryQuote: "Ahil: Oomfo! Tel lagake maarenge! 🚬🍺",
        hitQuote: "Ahil: Arre mera peg gir gaya! 😵",
        themeColor: '#a855f7',
        superName: 'Drunken Smoke Storm 💨'
      },
      keshav: {
        key: 'keshav',
        name: 'KESHAV',
        color: 'orange',
        playVoice: () => this.playVoiceKeshav(),
        entryQuote: "Keshav: Beta humse panga mat lena, warna network chala jayega! 🍾🍻",
        hitQuote: "Keshav: Bottle foot gayi re! 🍾💥",
        themeColor: '#f59e0b',
        superName: 'Desi Daru Molotov Blast 🔥🍾'
      }
    };

    this.p1Def = this.charConfigs[p1Key] || this.charConfigs.dip;
    this.p2Def = this.charConfigs[p2Key] || this.charConfigs.sanket;

    if (!this.isLocal2P && !this.isBotMatch && this.playerNumber === 2) {
      this.myColor = this.p2Def.color;
      this.opColor = this.p1Def.color;
      this.myDef   = this.p2Def;
      this.opDef   = this.p1Def;
    } else {
      this.myColor = this.p1Def.color;
      this.opColor = this.p2Def.color;
      this.myDef   = this.p1Def;
      this.opDef   = this.p2Def;
    }

    this.isTopDown       = (this.currentMap === 'brawl');
    this.maxHealth       = this.isTopDown ? 100 : 3;
    this.myHP            = this.maxHealth;
    this.opponentHP      = this.maxHealth;
    this.matchStarted    = false;
    this.lastShootTime   = 0;
    this.lastDamageTime  = 0;
    this.lastHitAnimTime = 0;
    this.bulletIdCounter  = 0;
    this.networkSendTimer = 0;
    this._mobileShootLast = false;

    // Local 2P / Bot Timers
    this.lastP2ShootTime      = 0;
    this.lastP2HitAnimTime    = 0;
    this.botNextShootTime     = 0;
    this.botNextJumpTime      = 0;
    this.botStrafeDir         = 1;
    this.botNextStrafeTime    = 0;
    this.botLastHitAnimTime   = 0;
    this.lastPlayerDamageTime = 0;
    this.lastBotDamageTime    = 0;
    this.localTimeLeft        = 120;
    this.localTimerEvent      = null;

    // Check for 3+ Win Streak Golden Crown
    const p1Streak = (window.winStreaks && window.winStreaks.p1) || 0;
    const p2Streak = (window.winStreaks && window.winStreaks.p2) || 0;
    this.p1HasCrown = p1Streak >= 3;
    this.p2HasCrown = p2Streak >= 3;
    this.p1Crown = null;
    this.p2Crown = null;

    this.physics.world.setBounds(0, 0, ARENA_W, ARENA_H);

    if (this.isTopDown) {
      this.physics.world.gravity.y = 0;
      this.drawTopDownBackground();
      this.buildTopDownMap();
      this.createTopDownPlayers();
      this.setupDiwaliPickups();
    } else {
      this.physics.world.gravity.y = GRAVITY;
      this.drawBackground();
      this.buildPlatforms();

      this.crateGroup = this.physics.add.staticGroup();
      CRATES.forEach(c => {
        this.crateGroup.create(c.x, c.y, 'crate').refreshBody();
      });

      this.createPlayers();

      this.physics.add.collider(this.myPlayer, this.platforms);
      this.physics.add.collider(this.myPlayer, this.crateGroup);
      this.physics.add.collider(this.opponent, this.platforms);
      this.physics.add.collider(this.opponent, this.crateGroup);
    }

    this.setupBullets();
    this.setupInput();

    // Mouse Left Click ONLY fires for Player 1 (Right click completely disabled)
    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (pointer) => {
      if (pointer.button === 0) {
        this.shoot();
      }
    });

    this.buildHUD();
    this.setupSounds();

    this.impactEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 220 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      blendMode: 'ADD',
      emitting: false,
      quantity: 10,
      tint: [0xffff00, 0xff8800, 0xffffff]
    });
    this.impactEmitter.setDepth(150);

    if (this.isLocal2P || this.isBotMatch) {
      this.startLocalMatch();
    } else {
      this.registerNetworkEvents();
    }
  }

  // ============================================================
  // TOP-DOWN BRAWL STARS DIWALI BATTLEGROUND MAP & BACKGROUND
  // ============================================================

  drawTopDownBackground() {
    const bg = this.add.graphics();

    // 1. Warm Golden Sandstone / Royal Palace Courtyard Floor (Brawl Stars style warmth!)
    bg.fillStyle(0xd98d57);
    bg.fillRect(0, 0, ARENA_W, ARENA_H);

    // Smooth organic desert/courtyard sand dunes (soft natural patches like Brawl Stars)
    bg.fillStyle(0xc87b46, 0.55);
    const sandPatches = [
      { x: 100, y: 130, w: 260, h: 140 },
      { x: 840, y: 120, w: 260, h: 150 },
      { x: 160, y: 430, w: 240, h: 110 },
      { x: 800, y: 420, w: 250, h: 120 }
    ];
    sandPatches.forEach(p => {
      bg.fillRoundedRect(p.x, p.y, p.w, p.h, 28);
    });

    // 2. Center Radiant Golden Ambient Glow
    const cx = 600;
    const cy = 300;

    bg.fillStyle(0xf59e0b, 0.22);
    bg.fillCircle(cx, cy, 260);
    bg.fillStyle(0xfbbf24, 0.32);
    bg.fillCircle(cx, cy, 180);
    bg.fillStyle(0xfde047, 0.45);
    bg.fillCircle(cx, cy, 130);

    // 3. Exquisite Central Diwali Rangoli Mandala (High Contrast & Vibrant!)
    // Deep Midnight Navy backing disc so colors pop brilliantly
    bg.fillStyle(0x1e1b4b, 0.95);
    bg.fillCircle(cx, cy, 114);

    // Outer golden beaded ring
    bg.lineStyle(3.5, 0xfacc15, 1);
    bg.strokeCircle(cx, cy, 112);
    bg.lineStyle(1.5, 0xf97316, 0.9);
    bg.strokeCircle(cx, cy, 94);

    // 12 Radiant Lotus Petals (Crimson, Gold, Violet, Teal)
    const petalColors = [
      0xef4444, 0xf59e0b, 0x8b5cf6, 0x06b6d4,
      0xef4444, 0xf59e0b, 0x8b5cf6, 0x06b6d4,
      0xef4444, 0xf59e0b, 0x8b5cf6, 0x06b6d4
    ];
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const px = cx + Math.cos(angle) * 62;
      const py = cy + Math.sin(angle) * 62;
      bg.fillStyle(petalColors[i], 0.9);
      bg.beginPath();
      bg.arc(px, py, 22, angle - Math.PI / 2, angle + Math.PI / 2);
      bg.fill();
    }

    // Concentric Inner Gold Lotus Star
    bg.fillStyle(0xd97706, 1);
    bg.fillCircle(cx, cy, 42);
    bg.fillStyle(0xfacc15, 1);
    bg.fillCircle(cx, cy, 28);
    bg.fillStyle(0xdc2626, 1);
    bg.fillCircle(cx, cy, 14);

    // 16 Sparkling Pearl Dots around outer perimeter
    bg.fillStyle(0xffffff, 1);
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const dx = cx + Math.cos(angle) * 112;
      const dy = cy + Math.sin(angle) * 112;
      bg.fillCircle(dx, dy, 3.5);
    }

    // 4. Canyon / Palace Terracotta Cliff Borders with Golden Trim
    // Left canyon rim
    bg.fillStyle(0x78350f);
    bg.fillRect(0, 0, 48, ARENA_H);
    bg.fillStyle(0xf59e0b);
    bg.fillRect(44, 0, 4, ARENA_H);

    // Right canyon rim
    bg.fillStyle(0x78350f);
    bg.fillRect(ARENA_W - 48, 0, 48, ARENA_H);
    bg.fillStyle(0xf59e0b);
    bg.fillRect(ARENA_W - 48, 0, 4, ARENA_H);

    // Top canyon rim
    bg.fillStyle(0x78350f);
    bg.fillRect(0, 0, ARENA_W, 40);
    bg.fillStyle(0xf59e0b);
    bg.fillRect(0, 36, ARENA_W, 4);

    // Bottom canyon rim
    bg.fillStyle(0x78350f);
    bg.fillRect(0, ARENA_H - 40, ARENA_W, 40);
    bg.fillStyle(0xf59e0b);
    bg.fillRect(0, ARENA_H - 40, ARENA_W, 4);

    // 5. Hanging Diwali Toran (Marigold Orange & Yellow Garlands) across Top
    const garlandG = this.add.graphics();
    garlandG.lineStyle(2, 0x15803d, 0.9);
    garlandG.beginPath();
    for (let x = 40; x <= ARENA_W - 40; x += 40) {
      const y = 38 + Math.sin((x / (ARENA_W - 80)) * Math.PI * 14) * 8;
      if (x === 40) garlandG.moveTo(x, y);
      else garlandG.lineTo(x, y);
    }
    garlandG.stroke();

    const bulbTints = [0xf59e0b, 0xef4444, 0xfacc15, 0x06b6d4, 0xec4899, 0x22c55e];
    let bulbIdx = 0;
    for (let x = 60; x <= ARENA_W - 60; x += 36) {
      const y = 38 + Math.sin(((x - 20) / (ARENA_W - 80)) * Math.PI * 14) * 8;
      // Marigold flower
      garlandG.fillStyle(0xea580c, 1);
      garlandG.fillCircle(x, y + 5, 4.5);
      garlandG.fillStyle(0xfde047, 1);
      garlandG.fillCircle(x, y + 5, 2);

      // Fairy bulb
      garlandG.fillStyle(bulbTints[bulbIdx % bulbTints.length], 0.95);
      garlandG.fillCircle(x + 18, y + 8, 3.5);
      bulbIdx++;
    }
  }

  buildTopDownMap() {
    this.wallsGroup  = this.physics.add.staticGroup();
    this.fencesGroup = this.physics.add.staticGroup();
    this.cratesGroup = this.physics.add.staticGroup();
    this.bushesGroup = this.physics.add.staticGroup();

    // 1. Perimeter Walls
    for (let x = 18; x < ARENA_W; x += 36) {
      this.wallsGroup.create(x, 18, 'brawl-canyon-wall');
      this.wallsGroup.create(x, ARENA_H - 18, 'brawl-canyon-wall');
    }
    for (let y = 54; y < ARENA_H - 36; y += 36) {
      this.wallsGroup.create(18, y, 'brawl-canyon-wall');
      this.wallsGroup.create(ARENA_W - 18, y, 'brawl-canyon-wall');
    }

    // 2. Strategic Wooden Fences (CLEAR of Center Rangoli!)
    // Top Lane Cover
    this.fencesGroup.create(450, 150, 'brawl-fence-h');
    this.fencesGroup.create(750, 150, 'brawl-fence-h');

    // Bottom Lane Cover
    this.fencesGroup.create(450, 450, 'brawl-fence-h');
    this.fencesGroup.create(750, 450, 'brawl-fence-h');

    // Left Flank Fences
    this.fencesGroup.create(240, 210, 'brawl-fence-v');
    this.fencesGroup.create(240, 390, 'brawl-fence-v');

    // Right Flank Fences
    this.fencesGroup.create(960, 210, 'brawl-fence-v');
    this.fencesGroup.create(960, 390, 'brawl-fence-v');

    // 3. Strategic Crates and Barrels (Positioned on flanks, NEVER in center!)
    // Left Flank Cover Cluster
    this.cratesGroup.create(320, 280, 'brawl-crate');
    this.cratesGroup.create(320, 320, 'brawl-barrel');

    // Right Flank Cover Cluster
    this.cratesGroup.create(880, 280, 'brawl-crate');
    this.cratesGroup.create(880, 320, 'brawl-barrel');

    // Top Vault Flank Crates
    this.cratesGroup.create(370, 150, 'brawl-crate');
    this.cratesGroup.create(830, 150, 'brawl-crate');
    this.cratesGroup.create(530, 150, 'brawl-barrel');
    this.cratesGroup.create(670, 150, 'brawl-barrel');

    // Bottom Lane Flank Crates
    this.cratesGroup.create(370, 450, 'brawl-crate');
    this.cratesGroup.create(830, 450, 'brawl-crate');
    this.cratesGroup.create(530, 450, 'brawl-barrel');
    this.cratesGroup.create(670, 450, 'brawl-barrel');

    // 4. DIWALI KHAZANA (Royal Golden Treasure Vault) at top center
    this.safeSprite = this.physics.add.staticSprite(600, 92, 'brawl-safe');
    this.add.text(600, 66, '🪔 DIWALI KHAZANA 🪔', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: '#fde047', stroke: '#78350f', strokeThickness: 3.5
    }).setOrigin(0.5).setDepth(25);

    // 5. Golden Wheat Bushes (Left & Right stealth fields + Vault side bushes)
    const bushPositions = [
      // Left stealth wheat field
      { x: 120, y: 220 }, { x: 120, y: 265 }, { x: 120, y: 310 }, { x: 120, y: 355 },
      // Right stealth wheat field
      { x: 1080, y: 220 }, { x: 1080, y: 265 }, { x: 1080, y: 310 }, { x: 1080, y: 355 },
      // Top lane ambush patches
      { x: 420, y: 95 }, { x: 780, y: 95 },
      // Bottom lane ambush patches
      { x: 420, y: 505 }, { x: 780, y: 505 }
    ];
    bushPositions.forEach(b => {
      const bush = this.bushesGroup.create(b.x, b.y, 'brawl-bush');
      bush.setDepth(20);
    });

    // 6. Diwali Akash Kandils (4 Traditional Star Lanterns in corners)
    const lanternSpots = [
      { x: 80, y: 70 },
      { x: 1120, y: 70 },
      { x: 80, y: 530 },
      { x: 1120, y: 530 }
    ];
    lanternSpots.forEach(ls => {
      const lantern = this.add.image(ls.x, ls.y, 'diwali-lantern').setDepth(23);
      this.tweens.add({
        targets: lantern,
        y: ls.y - 8,
        duration: Phaser.Math.Between(1100, 1500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // 7. Flickering Clay Diyas (Borders + 4 Cardinal points of Center Rangoli)
    const diyaPositions = [
      // Top border
      { x: 140, y: 32 }, { x: 300, y: 32 }, { x: 480, y: 32 }, { x: 720, y: 32 }, { x: 900, y: 32 }, { x: 1060, y: 32 },
      // Bottom border
      { x: 140, y: ARENA_H - 32 }, { x: 300, y: ARENA_H - 32 }, { x: 480, y: ARENA_H - 32 },
      { x: 720, y: ARENA_H - 32 }, { x: 900, y: ARENA_H - 32 }, { x: 1060, y: ARENA_H - 32 },
      // Side rims
      { x: 40, y: 220 }, { x: 40, y: 380 }, { x: ARENA_W - 40, y: 220 }, { x: ARENA_W - 40, y: 380 },
      // Center Rangoli cardinal points & center
      { x: 600, y: 300 }, // Center diya
      { x: 600, y: 175 }, // North
      { x: 600, y: 425 }, // South
      { x: 475, y: 300 }, // West
      { x: 725, y: 300 }  // East
    ];
    diyaPositions.forEach(dp => {
      const diya = this.add.image(dp.x, dp.y, 'diwali-diya').setDepth(22);
      this.tweens.add({
        targets: diya,
        alpha: { from: 0.8, to: 1.0 },
        scale: { from: 0.95, to: 1.05 },
        duration: Phaser.Math.Between(450, 750),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  // ============================================================
  // DIWALI PICKUPS (PATAKA BOMB & SOAN PAPDI HEAL)
  // ============================================================

  setupDiwaliPickups() {
    this.diwaliPickups = this.physics.add.group();

    this.diwaliSpawnSpots = [
      { x: 260, y: 220, zone: 'p1' },
      { x: 380, y: 320, zone: 'p1' },
      { x: 260, y: 440, zone: 'p1' },
      { x: 600, y: 220, zone: 'center' },
      { x: 600, y: 400, zone: 'center' },
      { x: 820, y: 320, zone: 'p2' },
      { x: 940, y: 220, zone: 'p2' },
      { x: 940, y: 440, zone: 'p2' }
    ];
    this.lastBombZone = 'p1';

    // Periodic spawn every 7.5 seconds (max 3 active pickups)
    this.diwaliSpawnTimer = this.time.addEvent({
      delay: 7500,
      callback: () => {
        if (!this.matchStarted) return;
        if (this.diwaliPickups && this.diwaliPickups.countActive(true) < 3) {
          const type = Math.random() > 0.45 ? 'bomb' : 'soanpapdi';
          this.spawnDiwaliPickup(type);
        }
      },
      loop: true
    });

    // Player 1 collects pickup
    if (this.myPlayer) {
      this.physics.add.overlap(this.myPlayer, this.diwaliPickups, (p, pickup) => {
        if (this.matchStarted && this.myHP > 0 && pickup.active) {
          this.collectDiwaliPickup(1, pickup);
        }
      });
    }

    // Opponent (P2 / Bot) collects pickup
    if (this.opponent) {
      this.physics.add.overlap(this.opponent, this.diwaliPickups, (p, pickup) => {
        if (this.matchStarted && this.opponentHP > 0 && pickup.active) {
          this.collectDiwaliPickup(2, pickup);
        }
      });
    }
  }

  spawnDiwaliPickup(forcedType, forcedX, forcedY) {
    if (!this.diwaliPickups) return;
    const type = forcedType || (Math.random() > 0.45 ? 'bomb' : 'soanpapdi');

    let spot = null;
    if (forcedX !== undefined && forcedY !== undefined) {
      spot = { x: forcedX, y: forcedY };
    } else {
      // Find spots not currently occupied by an active pickup
      const occupied = this.diwaliPickups.getChildren().filter(p => p.active);
      let candidates = this.diwaliSpawnSpots.filter(s => {
        return !occupied.some(p => Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y) < 70);
      });
      if (candidates.length === 0) candidates = [...this.diwaliSpawnSpots];

      if (type === 'bomb') {
        // Anti-P1 Bomb Bias: Bomb must NEVER spawn right next to Player 1!
        // Strictly filter out spots on Player 1's side (x < 450) and too close to Player 1 (< 220px)
        let safeBombSpots = candidates.filter(s => {
          if (s.x < 450) return false;
          if (!this.myPlayer) return true;
          return Phaser.Math.Distance.Between(s.x, s.y, this.myPlayer.x, this.myPlayer.y) >= 220;
        });

        if (safeBombSpots.length === 0) {
          // Fall back strictly to neutral center or opponent spots
          safeBombSpots = this.diwaliSpawnSpots.filter(s => s.x >= 500);
        }

        spot = Phaser.Utils.Array.GetRandom(safeBombSpots);
        this.lastBombZone = (spot.x < 500) ? 'p1' : ((spot.x > 700) ? 'p2' : 'center');
      } else {
        spot = Phaser.Utils.Array.GetRandom(candidates);
      }
    }

    const texKey = (type === 'bomb') ? 'diwali-bomb' : 'diwali-soanpapdi';
    const pickup = this.diwaliPickups.create(spot.x, spot.y, texKey);
    pickup.setData('pickupType', type);
    pickup.body.setAllowGravity(false);
    pickup.body.setImmovable(true);
    pickup.setDepth(35);

    // Glowing halo under pickup
    const halo = this.add.graphics();
    halo.fillStyle(type === 'bomb' ? 0xff0044 : 0xfbbf24, 0.35);
    halo.fillCircle(0, 0, 18);
    halo.x = spot.x;
    halo.y = spot.y + 6;
    halo.setDepth(34);
    pickup.setData('halo', halo);

    // Floating bob animation
    const bobTween = this.tweens.add({
      targets: [pickup, halo],
      y: '-=6',
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    pickup.setData('bobTween', bobTween);

    if (this.impactEmitter) {
      this.impactEmitter.explode(8, spot.x, spot.y);
    }
  }

  collectDiwaliPickup(collectorNum, pickup) {
    if (!pickup.active) return;
    const type = pickup.getData('pickupType');
    const halo = pickup.getData('halo');
    if (halo) halo.destroy();
    const bobTween = pickup.getData('bobTween');
    if (bobTween) bobTween.stop();
    pickup.destroy();

    const collector = collectorNum === 1 ? this.myPlayer : this.opponent;
    const opponent = collectorNum === 1 ? this.opponent : this.myPlayer;
    const opponentNum = collectorNum === 1 ? 2 : 1;

    if (this.impactEmitter) {
      this.impactEmitter.explode(16, collector.x, collector.y);
    }

    if (type === 'soanpapdi') {
      // Heal +40 HP (Extra Life)
      this.healPlayer(collectorNum, 40);
      this.playSuperElectricSound();
      this.showSpeechBubble(collector, "MITHAI RECOVERY! +40 HP 🍬", '#f59e0b');
    } else if (type === 'bomb') {
      // Diwali Pataka (Bomb): Targets opponent's LAST location at moment of collection
      if (!opponent || !opponent.active) return;
      const targetX = opponent.x;
      const targetY = opponent.y;

      this.playSuperReadySound();
      this.showSpeechBubble(collector, "DIWALI PATAKA FIRED! 💥", '#ff0055');

      // 1. Red warning danger reticle at target's location
      const reticle = this.add.image(targetX, targetY, 'diwali-blast-target').setDepth(30).setScale(0.7);
      const reticleTween = this.tweens.add({
        targets: reticle,
        scale: 1.25,
        alpha: 0.5,
        duration: 250,
        yoyo: true,
        repeat: -1
      });

      // 2. Launch mortar rocket towards (targetX, targetY)
      const rocket = this.add.sprite(collector.x, collector.y, 'diwali-rocket').setDepth(90);
      const flightDuration = 1100;
      const launchAngle = Phaser.Math.Angle.Between(collector.x, collector.y, targetX, targetY);
      rocket.setRotation(launchAngle);

      const rTrail = this.add.particles(0, 0, 'particle', {
        follow: rocket,
        scale: { start: 1, end: 0 },
        speed: 20,
        lifespan: 140,
        blendMode: 'ADD',
        tint: [0xff3300, 0xffaa00, 0xffff00]
      });
      rTrail.setDepth(89);

      this.tweens.add({
        targets: rocket,
        x: targetX,
        y: targetY,
        duration: flightDuration,
        ease: 'Quad.easeIn',
        onComplete: () => {
          rocket.destroy();
          if (rTrail && rTrail.scene) rTrail.destroy();
          reticleTween.stop();
          reticle.destroy();

          this.playSuperExplosionSound();
          this.cameras.main.shake(260, 0.025);

          // Firework blast sprite & particles
          const blast = this.add.sprite(targetX, targetY, 'super-blast').setDepth(95).setScale(0.8);
          this.tweens.add({
            targets: blast,
            scale: 2.8,
            alpha: 0,
            duration: 380,
            onComplete: () => blast.destroy()
          });
          if (this.impactEmitter) {
            this.impactEmitter.explode(30, targetX, targetY);
          }

          // Check if opponent is still near the targeted spot (within 85px)
          if (opponent && opponent.active && this.matchStarted) {
            const dist = Phaser.Math.Distance.Between(targetX, targetY, opponent.x, opponent.y);
            if (dist <= 85) {
              // DIRECT HIT: 50 HP DAMAGE!
              this.applyDamageToPlayer(opponentNum, 50);
            } else {
              // DODGED! Opponent moved away from that location
              this.showDodgedPopup(opponent.x, opponent.y);
              this.showSpeechBubble(opponent, "BAAL BAAL BACH GAYA! 💨", '#00e5ff');
            }
          }
        }
      });
    }
  }

  healPlayer(playerNum, amount) {
    if (playerNum === 1) {
      if (this.myHP <= 0) return;
      this.myHP = Math.min(MAX_HP, this.myHP + amount);
      this.updateHearts(1, this.myHP);
      if (this.p1HUD) this.p1HUD.updateHUD(this.myHP);
      this.showHealPopup(this.myPlayer.x, this.myPlayer.y, amount);
    } else {
      if (this.opponentHP <= 0) return;
      this.opponentHP = Math.min(MAX_HP, this.opponentHP + amount);
      this.updateHearts(2, this.opponentHP);
      if (this.p2HUD) this.p2HUD.updateHUD(this.opponentHP);
      this.showHealPopup(this.opponent.x, this.opponent.y, amount);
    }
  }

  setTopDownFacing(sprite, aimAngle) {
    if (!sprite || !sprite.active) return;
    if (Math.cos(aimAngle) < 0) {
      sprite.setFlipX(true);
      sprite.setRotation(aimAngle - Math.PI);
    } else {
      sprite.setFlipX(false);
      sprite.setRotation(aimAngle);
    }
  }

  createTopDownPlayers() {
    this.isIntroWalking = true;
    this.matchStarted = false;

    // Player 1 Sprite (Top-Down Hero with real face)
    this.myPlayer = this.physics.add.sprite(220, 300, `hero-td-${this.myColor}`);
    this.myPlayer.body.setAllowGravity(false);
    this.myPlayer.setCircle(18, 10, 10);
    this.myPlayer.setCollideWorldBounds(true);
    this.myPlayer.setBounce(0);
    this.myPlayer.setDepth(45);
    this.myPlayer.setRotation(0); // Facing right
    this.myPlayer.setFlipX(false);

    // Player 2 / Bot Sprite (Top-Down Hero with real face)
    this.opponent = this.physics.add.sprite(980, 300, `hero-td-${this.opColor}`);
    this.opponent.body.setAllowGravity(false);
    this.opponent.setCircle(18, 10, 10);
    this.opponent.setCollideWorldBounds(true);
    this.opponent.setBounce(0);
    this.opponent.setDepth(45);
    this.opponent.setRotation(0); // Upright face!
    this.opponent.setFlipX(true); // Facing left towards P1

    // Glowing ground rings under players' feet
    this.p1Ring = this.add.image(this.myPlayer.x, this.myPlayer.y, `brawl-ring-${this.myColor}`).setDepth(15);
    this.p2Ring = this.add.image(this.opponent.x, this.opponent.y, `brawl-ring-${this.opColor}`).setDepth(15);

    // Floating Overhead Brawl Stars Health Bars (Name + 3-Segmented HP bar + 3000 health)
    const p2DisplayName = this.isBotMatch
      ? `${this.p2Def.name} [${this.botDiffConfig.tag}]`
      : this.p2Def.name;
    this.p1HUD = this.createBrawlOverheadHUD(this.myPlayer, this.p1Def.name, this.myHP, this.p1Def.themeColor);
    this.p2HUD = this.createBrawlOverheadHUD(this.opponent, p2DisplayName, this.opponentHP, this.isBotMatch ? this.botDiffConfig.color : this.p2Def.themeColor);

    // Supreme Bot Electric Pulsing Aura
    if (this.isBotMatch && this.botDifficulty === 'supreme') {
      this.botAura = this.add.ellipse(this.opponent.x, this.opponent.y, 54, 54, 0xa855f7, 0.45).setDepth(44);
      this.tweens.add({
        targets: this.botAura,
        scaleX: 1.4,
        scaleY: 1.4,
        alpha: { from: 0.55, to: 0.15 },
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Golden Crown on head if 3+ Win Streak is active
    if (this.p1HasCrown) {
      this.p1Crown = this.add.image(this.myPlayer.x, this.myPlayer.y - 48, 'crown').setDepth(80);
    }
    if (this.p2HasCrown) {
      this.p2Crown = this.add.image(this.opponent.x, this.opponent.y - 48, 'crown').setDepth(80);
    }

    // Setup continuous cigarette smoke emitter for AHIL
    this.p1SmokeEmitter = this.setupSmokeEmitter(this.myPlayer, true);
    this.p2SmokeEmitter = this.setupSmokeEmitter(this.opponent, false);

    // Top-Down Obstacle Colliders
    if (this.wallsGroup) this.physics.add.collider(this.myPlayer, this.wallsGroup);
    if (this.fencesGroup) this.physics.add.collider(this.myPlayer, this.fencesGroup);
    if (this.cratesGroup) this.physics.add.collider(this.myPlayer, this.cratesGroup);
    if (this.safeSprite) this.physics.add.collider(this.myPlayer, this.safeSprite);

    if (this.wallsGroup) this.physics.add.collider(this.opponent, this.wallsGroup);
    if (this.fencesGroup) this.physics.add.collider(this.opponent, this.fencesGroup);
    if (this.cratesGroup) this.physics.add.collider(this.opponent, this.cratesGroup);
    if (this.safeSprite) this.physics.add.collider(this.opponent, this.safeSprite);
  }

  createBrawlOverheadHUD(targetSprite, name, hp, colorHex) {
    const container = this.add.container(targetSprite.x, targetSprite.y - 42);
    container.setDepth(70);

    // Name tag
    const nameText = this.add.text(0, -14, name, {
      fontSize: '12px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // HP Bar Background
    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.75);
    barBg.fillRoundedRect(-28, 0, 56, 8, 3);
    barBg.lineStyle(1.5, 0x111111, 0.9);
    barBg.strokeRoundedRect(-28, 0, 56, 8, 3);

    // HP Bar Segments Fill
    const barFill = this.add.graphics();

    // HP Numeric Text (e.g. 3000 / 3000)
    const hpText = this.add.text(0, 13, `${hp * 1000}`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2.5
    }).setOrigin(0.5);

    container.add([nameText, barBg, barFill, hpText]);

    const updateHUD = (newHP) => {
      barFill.clear();
      const pct = Math.max(0, newHP) / MAX_HP;
      const fillW = Math.max(0, 52 * pct);
      const col = newHP >= 60 ? 0x22c55e : (newHP >= 30 ? 0xf59e0b : 0xef4444);
      barFill.fillStyle(col, 1);
      barFill.fillRoundedRect(-26, 2, fillW, 4, 2);

      // Dividers
      barFill.fillStyle(0x000000, 0.85);
      barFill.fillRect(-26 + 17, 2, 1.5, 4);
      barFill.fillRect(-26 + 34, 2, 1.5, 4);

      hpText.setText(`${Math.max(0, newHP)} / 100 HP`);
    };

    updateHUD(hp);

    return { container, nameText, barFill, hpText, updateHUD };
  }

  showDamagePopup(x, y, dmg) {
    const isBomb = (dmg >= 50);
    const label = isBomb ? `-${dmg} HP 💥 PATAKA!` : `-${dmg} HP`;
    const popup = this.add.text(x + Phaser.Math.Between(-10, 10), y - 20, label, {
      fontSize: isBomb ? '20px' : '17px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: isBomb ? '#ff0055' : '#ff2222',
      stroke: '#ffffff',
      strokeThickness: 3.5
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: popup,
      y: y - 55,
      alpha: 0,
      scale: isBomb ? 1.5 : 1.3,
      duration: 800,
      ease: 'Power2',
      onComplete: () => popup.destroy()
    });
  }

  showHealPopup(x, y, amount) {
    const popup = this.add.text(x + Phaser.Math.Between(-10, 10), y - 20, `+${amount} HP 🍬`, {
      fontSize: '19px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#22c55e',
      stroke: '#ffffff',
      strokeThickness: 3.5
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: popup,
      y: y - 55,
      alpha: 0,
      scale: 1.4,
      duration: 800,
      ease: 'Power2',
      onComplete: () => popup.destroy()
    });
  }

  showDodgedPopup(x, y) {
    const popup = this.add.text(x + Phaser.Math.Between(-10, 10), y - 20, 'DODGED! 💨', {
      fontSize: '18px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#00e5ff',
      stroke: '#000000',
      strokeThickness: 3.5
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: popup,
      y: y - 55,
      alpha: 0,
      scale: 1.35,
      duration: 850,
      ease: 'Power2',
      onComplete: () => popup.destroy()
    });
  }

  drawBackground() {
    if (this.currentMap === 'brawl') {
      const bg = this.add.graphics();
      // Daytime Sunny Sky Gradient (deep cartoon blue down to bright cyan/azure)
      bg.fillGradientStyle(0x0284c7, 0x0284c7, 0x7dd3fc, 0xbae6fd, 1);
      bg.fillRect(0, 0, ARENA_W, ARENA_H);

      // Radiant Sunny Orb with warm glow rings
      bg.fillStyle(0xfde047, 0.25);
      bg.fillCircle(960, 95, 80);
      bg.fillStyle(0xfde047, 0.45);
      bg.fillCircle(960, 95, 55);
      bg.fillStyle(0xfffbeb, 1.0);
      bg.fillCircle(960, 95, 36);

      // Distant Terracotta Canyon Mountains
      bg.fillStyle(0xd97706);
      bg.beginPath();
      bg.moveTo(0, 480);
      bg.lineTo(120, 360);
      bg.lineTo(260, 430);
      bg.lineTo(440, 310);
      bg.lineTo(600, 410);
      bg.lineTo(760, 320);
      bg.lineTo(920, 390);
      bg.lineTo(1100, 300);
      bg.lineTo(1200, 370);
      bg.lineTo(1200, 560);
      bg.lineTo(0, 560);
      bg.closePath();
      bg.fill();

      // Canyon Highlights / Ridges
      bg.fillStyle(0xf59e0b, 0.6);
      bg.beginPath();
      bg.moveTo(440, 310);
      bg.lineTo(470, 410);
      bg.lineTo(430, 410);
      bg.closePath();
      bg.fill();

      bg.beginPath();
      bg.moveTo(760, 320);
      bg.lineTo(800, 420);
      bg.lineTo(750, 420);
      bg.closePath();
      bg.fill();

      bg.beginPath();
      bg.moveTo(1100, 300);
      bg.lineTo(1140, 400);
      bg.lineTo(1090, 400);
      bg.closePath();
      bg.fill();

      // Midground: Rolling Green Hills (Brawl Stars Arena Style)
      bg.fillStyle(0x16a34a);
      bg.beginPath();
      bg.arc(200, 580, 220, Math.PI, 0, false);
      bg.fill();
      bg.beginPath();
      bg.arc(600, 590, 260, Math.PI, 0, false);
      bg.fill();
      bg.beginPath();
      bg.arc(1020, 580, 240, Math.PI, 0, false);
      bg.fill();

      bg.fillStyle(0x22c55e);
      bg.beginPath();
      bg.arc(400, 600, 210, Math.PI, 0, false);
      bg.fill();
      bg.beginPath();
      bg.arc(820, 600, 220, Math.PI, 0, false);
      bg.fill();
      bg.beginPath();
      bg.arc(50, 610, 180, Math.PI, 0, false);
      bg.fill();
      bg.beginPath();
      bg.arc(1180, 610, 180, Math.PI, 0, false);
      bg.fill();

      // Festive Arena Pennant Bunting (Brawl Stars Stadium Banners)
      const bannerG = this.add.graphics();
      bannerG.lineStyle(2, 0x475569, 0.8);
      bannerG.beginPath();
      for (let x = 0; x <= ARENA_W; x += 60) {
        const y = 90 + Math.sin(x * 0.015) * 14;
        if (x === 0) bannerG.moveTo(x, y);
        else bannerG.lineTo(x, y);
      }
      bannerG.stroke();

      // Triangular colorful flags hanging from bunting
      const flagColors = [0xef4444, 0xfbbf24, 0x06b6d4, 0x22c55e, 0xa855f7, 0xf97316];
      let colIdx = 0;
      for (let x = 30; x < ARENA_W; x += 55) {
        const y = 90 + Math.sin(x * 0.015) * 14;
        bannerG.fillStyle(flagColors[colIdx % flagColors.length]);
        bannerG.beginPath();
        bannerG.moveTo(x - 14, y);
        bannerG.lineTo(x + 14, y);
        bannerG.lineTo(x, y + 24);
        bannerG.closePath();
        bannerG.fill();
        colIdx++;
      }

      // Moving Fluffy Clouds
      this.clouds = [];
      const cloudDefs = [
        { x: 80,   y: 60,  w: 120, h: 36, speed: 18 },
        { x: 380,  y: 110, w: 90,  h: 28, speed: 28 },
        { x: 680,  y: 50,  w: 140, h: 42, speed: 22 },
        { x: 980,  y: 125, w: 100, h: 30, speed: 32 },
        { x: -100, y: 85,  w: 110, h: 34, speed: 24 }
      ];

      cloudDefs.forEach(c => {
        const cg = this.add.graphics();
        cg.fillStyle(0xffffff, 0.88);
        cg.fillRoundedRect(0, 10, c.w, c.h - 10, 12);
        cg.fillCircle(c.w * 0.35, 12, c.h * 0.45);
        cg.fillCircle(c.w * 0.65, 10, c.h * 0.55);
        cg.x = c.x;
        cg.y = c.y;
        cg.setDepth(2);
        this.clouds.push({ sprite: cg, speed: c.speed, w: c.w });
      });
      return;
    }

    // Default Cyber City Night Skyline
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x16162a, 0x16162a, 1);
    bg.fillRect(0, 0, ARENA_W, ARENA_H);

    const buildings = [
      { x: 40,   w: 60, h: 220 }, { x: 120,  w: 45, h: 300 },
      { x: 190,  w: 80, h: 190 }, { x: 300,  w: 55, h: 340 },
      { x: 380,  w: 75, h: 260 }, { x: 490,  w: 95, h: 280 },
      { x: 610,  w: 45, h: 320 }, { x: 690,  w: 85, h: 220 },
      { x: 790,  w: 65, h: 360 }, { x: 870,  w: 55, h: 240 },
      { x: 950,  w: 75, h: 300 }, { x: 1050, w: 85, h: 210 },
      { x: 1110, w: 60, h: 280 }
    ];

    buildings.forEach(b => {
      bg.fillStyle(0x111122);
      bg.fillRect(b.x, ARENA_H - b.h - 32, b.w, b.h);

      for (let wy = ARENA_H - b.h - 20; wy < ARENA_H - 50; wy += 22) {
        for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 16) {
          if (Math.random() > 0.45) {
            bg.fillStyle(Math.random() > 0.7 ? 0x00e5ff : 0x224466, 0.7);
            bg.fillRect(wx, wy, 6, 8);
          }
        }
      }
    });

    bg.fillStyle(0x00e5ff, 0.05);
    bg.fillRect(0, ARENA_H - 120, ARENA_W, 120);
  }

  buildPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    const isBrawl = this.currentMap === 'brawl';
    const groundTex = isBrawl ? 'brawl-ground-tile' : 'ground-tile';
    const platTex   = isBrawl ? 'brawl-platform-tile' : 'platform-tile';

    PLATFORMS.forEach(p => {
      this.add.tileSprite(p.x, p.y, p.w, p.h, p.isGround ? groundTex : platTex)
        .setOrigin(0.5);

      const body = this.add.zone(p.x, p.y, p.w, p.h);
      this.physics.add.existing(body, true);
      this.platforms.add(body);
    });
  }

  createPlayers() {
    const isOnline = !this.isLocal2P && !this.isBotMatch;

    if (isOnline) {
      this.isIntroWalking = false;
      this.matchStarted = false;
      const myX = this.playerNumber === 1 ? 150 : 1050;
      const opX = this.playerNumber === 1 ? 1050 : 150;

      this.myPlayer = this.physics.add.sprite(myX, 540, `player-${this.myColor}-idle-0`);
      this.myPlayer.setCollideWorldBounds(true);
      this.myPlayer.setBounce(0);
      this.myPlayer.setSize(28, 50);
      this.myPlayer.setOffset(10, 3);
      this.myPlayer.play(`${this.myColor}-idle`);
      if (this.playerNumber === 2) this.myPlayer.setFlipX(true);

      this.opponent = this.physics.add.sprite(opX, 540, `player-${this.opColor}-idle-0`);
      this.opponent.setCollideWorldBounds(true);
      this.opponent.setBounce(0);
      this.opponent.setSize(28, 50);
      this.opponent.setOffset(10, 3);
      this.opponent.play(`${this.opColor}-idle`);
      if (this.playerNumber === 1) this.opponent.setFlipX(true);
    } else {
      this.isIntroWalking = true;
      this.matchStarted = false;

      // Player 1 (Starts off-screen left, faces right, gravity disabled during intro)
      this.myPlayer = this.physics.add.sprite(-60, 540, `player-${this.myColor}-idle-0`);
      this.myPlayer.body.setAllowGravity(false);
      this.myPlayer.setVelocity(0, 0);
      this.myPlayer.setCollideWorldBounds(false);
      this.myPlayer.setBounce(0);
      this.myPlayer.setSize(28, 50);
      this.myPlayer.setOffset(10, 3);
      this.myPlayer.play(`${this.myColor}-idle`);
      this.myPlayer.setFlipX(false);

      // Player 2 / Bot (Starts off-screen right, faces left, gravity disabled during intro)
      this.opponent = this.physics.add.sprite(1260, 540, `player-${this.opColor}-idle-0`);
      this.opponent.body.setAllowGravity(false);
      this.opponent.setVelocity(0, 0);
      this.opponent.setCollideWorldBounds(false);
      this.opponent.setBounce(0);
      this.opponent.setSize(28, 50);
      this.opponent.setOffset(10, 3);
      this.opponent.play(`${this.opColor}-idle`);
      this.opponent.setFlipX(true);
    }

    // Create Golden Crown on head if 3+ Win Streak is active
    if (this.p1HasCrown) {
      this.p1Crown = this.add.image(this.myPlayer.x, this.myPlayer.y - 34, 'crown');
      this.p1Crown.setDepth(60);
    }
    if (this.p2HasCrown) {
      this.p2Crown = this.add.image(this.opponent.x, this.opponent.y - 34, 'crown');
      this.p2Crown.setDepth(60);
    }

    // Setup continuous cigarette smoke emitter for AHIL in Platformer
    this.p1SmokeEmitter = this.setupSmokeEmitter(this.myPlayer, true);
    this.p2SmokeEmitter = this.setupSmokeEmitter(this.opponent, false);
  }

  setupBullets() {
    this.myBullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 20,
      allowGravity: false
    });

    this.opponentBullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 20,
      allowGravity: false
    });

    if (this.isTopDown) {
      const topDownObstacles = [this.wallsGroup, this.fencesGroup, this.cratesGroup];
      if (this.safeSprite) topDownObstacles.push(this.safeSprite);

      topDownObstacles.forEach(obs => {
        if (!obs) return;
        this.physics.add.collider(this.myBullets, obs, (bullet) => {
          this.bulletImpact(bullet.x, bullet.y);
          this.destroyBullet(bullet);
        });
        this.physics.add.collider(this.opponentBullets, obs, (bullet) => {
          this.bulletImpact(bullet.x, bullet.y);
          this.destroyBullet(bullet);
        });
      });
    } else {
      this.physics.add.collider(this.myBullets, this.platforms, (bullet) => {
        this.bulletImpact(bullet.x, bullet.y);
        this.destroyBullet(bullet);
      });
      this.physics.add.collider(this.myBullets, this.crateGroup, (bullet) => {
        this.bulletImpact(bullet.x, bullet.y);
        this.destroyBullet(bullet);
      });
      this.physics.add.collider(this.opponentBullets, this.platforms, (bullet) => {
        this.bulletImpact(bullet.x, bullet.y);
        this.destroyBullet(bullet);
      });
      this.physics.add.collider(this.opponentBullets, this.crateGroup, (bullet) => {
        this.bulletImpact(bullet.x, bullet.y);
        this.destroyBullet(bullet);
      });
    }

    // P1 Bullets hit Opponent (P2 / Bot)
    this.physics.add.overlap(this.myBullets, this.opponent, (opponent, bullet) => {
      this.bulletImpact(bullet.x, bullet.y);
      this.destroyBullet(bullet);
      if (this.matchStarted && this.opponentHP > 0) {
        if (!this.isTopDown) {
          this.chargeSuper(1, 35);
          this.chargeSuper(2, 15);
        }
        const bulletDamage = this.isTopDown ? 20 : 1;
        this.applyDamageToPlayer(2, bulletDamage);
      }
    });

    // Opponent Bullets hit Player 1
    this.physics.add.overlap(this.opponentBullets, this.myPlayer, (player, bullet) => {
      this.bulletImpact(bullet.x, bullet.y);
      this.destroyBullet(bullet);
      if (this.matchStarted && this.myHP > 0) {
        if (!this.isTopDown) {
          this.chargeSuper(2, 35);
          this.chargeSuper(1, 15);
        }
        const bulletDamage = this.isTopDown ? 20 : 1;
        this.applyDamageToPlayer(1, bulletDamage);
      }
    });
  }

  destroyBullet(bullet) {
    if (!bullet) return;
    const trail = bullet.getData('trail');
    if (trail) {
      trail.stop();
      this.time.delayedCall(150, () => {
        if (trail && trail.scene) trail.destroy();
      });
    }
    if (bullet.getData('isBottle')) {
      this.playBottleBreakSound();
      if (this.impactEmitter) {
        this.impactEmitter.explode(8, bullet.x, bullet.y);
      }
    }
    bullet.destroy();
  }

  setupInput() {
    this.cursors   = this.input.keyboard.createCursorKeys();
    this.wasd      = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shoot: Phaser.Input.Keyboard.KeyCodes.F
    });
    this.enterKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keyZero    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    this.keyNumZero = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO);
    this.keyPlus    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS);
    this.keyNumAdd  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD);
    this.keyEqual   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EQUAL);
    this.spaceKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Super Power Hotkeys (P1: E / Q, P2: Period / M / Right Shift)
    this.keyE       = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyQ       = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyPeriod  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
    this.keyM       = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    this.p1SuperTriggered = false;
    this.p2ShootTriggered = false;
    this.p2SuperTriggered = false;

    // Global listener for special keys across all keyboards
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
        this.p2ShootTriggered = true;
      }
      if (event.key === 'e' || event.key === 'E' || event.key === 'q' || event.key === 'Q') {
        this.p1SuperTriggered = true;
      }
      if (event.key === '.' || event.key === 'm' || event.key === 'M' || event.code === 'ShiftRight' || event.code === 'NumpadDecimal') {
        this.p2SuperTriggered = true;
      }
      if (event.key === 'Escape' || event.code === 'Escape' || event.key === 'p' || event.key === 'P') {
        this.togglePause();
      }
    });
  }

  pauseMatch() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.physics.world.pause();
    if (this.localTimerEvent) {
      this.localTimerEvent.paused = true;
    }
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.style.display = 'flex';
  }

  resumeMatch() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.physics.world.resume();
    if (this.localTimerEvent) {
      this.localTimerEvent.paused = false;
    }
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';
  }

  togglePause() {
    if (this.isPaused) {
      this.resumeMatch();
    } else {
      this.pauseMatch();
    }
  }

  buildHUD() {
    const HUD_DEPTH = 100;
    const p1Streak = (window.winStreaks && window.winStreaks.p1) || 0;
    const p2Streak = (window.winStreaks && window.winStreaks.p2) || 0;

    if (this.isTopDown) {
      // Top-Down Diwali Battleground HUD (100 HP Bars, No Super Meters)
      let p1Label = this.isLocal2P ? `P1: ${this.p1Def.name} [WASD + MOUSE]` : `P1: ${this.p1Def.name}`;
      if (p1Streak >= 3) p1Label = `👑 ${p1Label} [${p1Streak}x STREAK]`;
      this.add.text(30, 10, p1Label, {
        fontSize: '12px', fontFamily: 'Arial', color: p1Streak >= 3 ? '#ffd700' : this.p1Def.themeColor, fontStyle: 'bold'
      }).setScrollFactor(0).setDepth(HUD_DEPTH);

      this.p1BarBg = this.add.graphics().setScrollFactor(0).setDepth(HUD_DEPTH);
      this.p1BarBg.fillStyle(0x0f172a, 0.85);
      this.p1BarBg.fillRoundedRect(30, 28, 160, 14, 4);
      this.p1BarBg.lineStyle(1.5, 0x334155, 0.9);
      this.p1BarBg.strokeRoundedRect(30, 28, 160, 14, 4);

      this.p1BarFill = this.add.graphics().setScrollFactor(0).setDepth(HUD_DEPTH + 1);
      this.p1BarText = this.add.text(110, 35, `${this.myHP} / 100 HP`, {
        fontSize: '10px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(HUD_DEPTH + 2);

      const p2TopDownX = ARENA_W - 350;
      let p2Label = `P2: ${this.p2Def.name}`;
      if (this.isLocal2P) p2Label = `P2: ${this.p2Def.name} [ARROWS + 0/+]`;
      else if (this.isBotMatch) p2Label = `BOT: ${this.p2Def.name} [${this.botDiffConfig.tag}]`;
      if (p2Streak >= 3) p2Label = `👑 ${p2Label} [${p2Streak}x STREAK]`;
      this.add.text(p2TopDownX, 10, p2Label, {
        fontSize: '12px', fontFamily: 'Arial', color: p2Streak >= 3 ? '#ffd700' : (this.isBotMatch ? this.botDiffConfig.color : this.p2Def.themeColor), fontStyle: 'bold'
      }).setScrollFactor(0).setDepth(HUD_DEPTH);

      this.p2BarBg = this.add.graphics().setScrollFactor(0).setDepth(HUD_DEPTH);
      this.p2BarBg.fillStyle(0x0f172a, 0.85);
      this.p2BarBg.fillRoundedRect(p2TopDownX, 28, 160, 14, 4);
      this.p2BarBg.lineStyle(1.5, 0x334155, 0.9);
      this.p2BarBg.strokeRoundedRect(p2TopDownX, 28, 160, 14, 4);

      this.p2BarFill = this.add.graphics().setScrollFactor(0).setDepth(HUD_DEPTH + 1);
      this.p2BarText = this.add.text(p2TopDownX + 80, 35, `${this.opponentHP} / 100 HP`, {
        fontSize: '10px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(HUD_DEPTH + 2);

      this.updateHearts(1, this.myHP);
      this.updateHearts(2, this.opponentHP);
    } else {
      // Legacy Side-Scroller HUD with 3 Hearts and Super Gauges
      this.p1Hearts = [];
      for (let i = 0; i < 3; i++) {
        const heart = this.add.image(30 + i * 28, 30, 'heart-full')
          .setScrollFactor(0).setDepth(HUD_DEPTH);
        this.p1Hearts.push(heart);
      }
      let p1Label = this.isLocal2P ? `P1: ${this.p1Def.name} [WASD + MOUSE]` : `P1: ${this.p1Def.name}`;
      if (p1Streak >= 3) {
        p1Label = `👑 P1: ${this.p1Def.name} [${p1Streak}x STREAK]`;
      }
      this.add.text(30, 8, p1Label, {
        fontSize: '12px', fontFamily: 'Arial', color: p1Streak >= 3 ? '#ffd700' : this.p1Def.themeColor, fontStyle: 'bold'
      }).setScrollFactor(0).setDepth(HUD_DEPTH);

      this.p1SuperBg = this.add.graphics().setScrollFactor(0).setDepth(HUD_DEPTH);
      this.p1SuperBg.fillStyle(0x0f172a, 0.85);
      this.p1SuperBg.fillRoundedRect(30, 48, 120, 10, 4);
      this.p1SuperBg.lineStyle(1.5, 0x334155, 0.9);
      this.p1SuperBg.strokeRoundedRect(30, 48, 120, 10, 4);

      this.p1SuperFill = this.add.graphics().setScrollFactor(0).setDepth(HUD_DEPTH + 1);
      this.p1SuperText = this.add.text(30, 61, '⚡ SUPER: 0% [E]', {
        fontSize: '10px', fontFamily: 'Arial', color: '#fbbf24', fontStyle: 'bold'
      }).setScrollFactor(0).setDepth(HUD_DEPTH);

      const p2SideX = ARENA_W - 370;
      this.p2Hearts = [];
      for (let i = 0; i < 3; i++) {
        const heart = this.add.image(p2SideX + i * 28, 30, 'heart-full')
          .setScrollFactor(0).setDepth(HUD_DEPTH);
        this.p2Hearts.push(heart);
      }
      let p2Label = `P2: ${this.p2Def.name}`;
      if (this.isLocal2P) p2Label = `P2: ${this.p2Def.name} [ARROWS + 0/+]`;
      else if (this.isBotMatch) p2Label = `BOT: ${this.p2Def.name} [${this.botDiffConfig.tag}]`;
      if (p2Streak >= 3) {
        p2Label = `👑 ${p2Label} [${p2Streak}x STREAK]`;
      }

      this.add.text(p2SideX, 8, p2Label, {
        fontSize: '12px', fontFamily: 'Arial', color: p2Streak >= 3 ? '#ffd700' : (this.isBotMatch ? this.botDiffConfig.color : this.p2Def.themeColor), fontStyle: 'bold'
      }).setScrollFactor(0).setDepth(HUD_DEPTH);

      this.p2SuperBg = this.add.graphics().setScrollFactor(0).setDepth(HUD_DEPTH);
      this.p2SuperBg.fillStyle(0x0f172a, 0.85);
      this.p2SuperBg.fillRoundedRect(p2SideX, 48, 120, 10, 4);
      this.p2SuperBg.lineStyle(1.5, 0x334155, 0.9);
      this.p2SuperBg.strokeRoundedRect(p2SideX, 48, 120, 10, 4);

      this.p2SuperFill = this.add.graphics().setScrollFactor(0).setDepth(HUD_DEPTH + 1);
      const p2SuperHint = this.isBotMatch ? 'BOT SUPER: 0%' : 'SUPER: 0% [R-SHIFT]';
      this.p2SuperText = this.add.text(p2SideX, 61, `⚡ ${p2SuperHint}`, {
        fontSize: '10px', fontFamily: 'Arial', color: '#fbbf24', fontStyle: 'bold'
      }).setScrollFactor(0).setDepth(HUD_DEPTH);

      this.updateSuperHUD();
      this.updateHearts(1, this.myHP);
      this.updateHearts(2, this.opponentHP);
    }

    // Timer
    this.timerText = this.add.text(ARENA_W / 2, 20, '2:00', {
      fontSize: '28px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(HUD_DEPTH);

    // Mode label
    let roomText = `ROOM CODE: ${window.roomCode || 'LOCAL'}`;
    if (this.isLocal2P) roomText = 'MODE: SAME PC (1 KEYBOARD + MOUSE) 1v1';
    else if (this.isBotMatch) roomText = 'MODE: SINGLE PLAYER VS BOT';

    this.add.text(ARENA_W / 2, ARENA_H - 15, roomText, {
      fontSize: '12px', fontFamily: 'Arial', color: '#666680'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(HUD_DEPTH);

    // Countdown overlay
    this.countdownText = this.add.text(ARENA_W / 2, ARENA_H / 2, '', {
      fontSize: '76px', fontFamily: 'Arial', color: '#00e5ff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 7
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);
  }

  updateSuperHUD() {
    if (!this.p1SuperFill || !this.p2SuperFill) return;

    // P1 Super Fill
    this.p1SuperFill.clear();
    const p1Pct = Math.min(100, Math.max(0, this.p1Super)) / 100;
    const p1FillW = Math.max(0, 116 * p1Pct);
    if (p1FillW > 0) {
      const p1Color = this.p1Super >= 100 ? 0xffea00 : (this.p1Super > 50 ? 0xf59e0b : 0x0284c7);
      this.p1SuperFill.fillStyle(p1Color, 1.0);
      this.p1SuperFill.fillRoundedRect(32, 50, p1FillW, 6, 2);
    }
    if (this.p1Super >= 100) {
      this.p1SuperText.setText(`🔥 SUPER READY! [E]`);
      this.p1SuperText.setColor('#ffe600');
    } else {
      this.p1SuperText.setText(`⚡ SUPER: ${Math.floor(this.p1Super)}% [E]`);
      this.p1SuperText.setColor('#fbbf24');
    }

    // P2 Super Fill
    this.p2SuperFill.clear();
    const p2Pct = Math.min(100, Math.max(0, this.p2Super)) / 100;
    const p2FillW = Math.max(0, 116 * p2Pct);
    const p2SideX = ARENA_W - 370;
    if (p2FillW > 0) {
      const p2Color = this.p2Super >= 100 ? 0xffea00 : (this.p2Super > 50 ? 0xf59e0b : 0xef4444);
      this.p2SuperFill.fillStyle(p2Color, 1.0);
      this.p2SuperFill.fillRoundedRect(p2SideX + 2, 50, p2FillW, 6, 2);
    }
    if (this.p2Super >= 100) {
      const readyP2 = this.isBotMatch ? '🔥 BOT SUPER READY!' : '🔥 SUPER READY! [R-SHIFT]';
      this.p2SuperText.setText(readyP2);
      this.p2SuperText.setColor('#ffe600');
    } else {
      const p2Hint = this.isBotMatch ? 'BOT SUPER' : 'SUPER';
      const keyHint = this.isBotMatch ? '' : ' [R-SHIFT]';
      this.p2SuperText.setText(`⚡ ${p2Hint}: ${Math.floor(this.p2Super)}%${keyHint}`);
      this.p2SuperText.setColor('#fbbf24');
    }
  }

  chargeSuper(playerNum, amount) {
    if (this.isTopDown) return; // No super charging in Diwali Arena (Pataka Bomb is the ultimate weapon!)
    if (playerNum === 1) {
      const prev = this.p1Super;
      this.p1Super = Math.min(100, this.p1Super + amount);
      if (this.p1Super >= 100 && prev < 100) {
        this.playSuperReadySound();
        if (this.myPlayer && this.myPlayer.active) {
          this.showSpeechBubble(this.myPlayer, '⚡ SUPER READY! 🔥', '#ffd700');
        }
      }
    } else {
      const prev = this.p2Super;
      this.p2Super = Math.min(100, this.p2Super + amount);
      if (this.p2Super >= 100 && prev < 100) {
        this.playSuperReadySound();
        if (this.opponent && this.opponent.active) {
          this.showSpeechBubble(this.opponent, '⚡ SUPER READY! 🔥', '#ffd700');
        }
      }
    }
    this.updateSuperHUD();
  }

  applyDamageToPlayer(targetPlayerNum, dmg) {
    if (!this.matchStarted) return;
    if (targetPlayerNum === 2) {
      if (this.opponentHP <= 0) return;
      this.opponentHP = Math.max(0, this.opponentHP - dmg);
      this.updateHearts(2, this.opponentHP);
      this.damageFlash(this.opponent);
      this.playHitSound();

      const p2DamageText = this.isTopDown ? dmg : (dmg > 1 ? `-${dmg} ❤️` : "-1 ❤️");
      this.showDamagePopup(this.opponent.x, this.opponent.y, p2DamageText);
      if (this.isTopDown && this.p2HUD) {
        this.p2HUD.updateHUD(this.opponentHP);
      }

      if (this.p2Def && this.p2Def.playVoice) {
        this.p2Def.playVoice();
        this.showSpeechBubble(this.opponent, this.p2Def.hitQuote, this.p2Def.themeColor);
      }

      if (this.opponentHP <= 0) {
        if (!this.isTopDown) {
          this.opponent.play(`${this.opColor}-dead`);
        } else {
          this.tweens.add({
            targets: this.opponent,
            angle: 180,
            alpha: 0.35,
            duration: 500
          });
        }
        this.opponent.setVelocity(0, 0);
        this.playEliminationSound();
        this.matchStarted = false;
        if (this.localTimerEvent) this.localTimerEvent.remove();
        this.time.delayedCall(800, () => {
          if (window.handleMatchEnd) {
            window.handleMatchEnd({ winner: 1, reason: 'kill', health1: this.myHP, health2: this.opponentHP });
          }
        });
      }
    } else {
      if (this.myHP <= 0) return;
      this.myHP = Math.max(0, this.myHP - dmg);
      this.updateHearts(1, this.myHP);
      this.damageFlash(this.myPlayer);
      this.cameras.main.shake(160, 0.02);
      this.playHitSound();

      const p1DamageText = this.isTopDown ? dmg : (dmg > 1 ? `-${dmg} ❤️` : "-1 ❤️");
      this.showDamagePopup(this.myPlayer.x, this.myPlayer.y, p1DamageText);
      if (this.isTopDown && this.p1HUD) {
        this.p1HUD.updateHUD(this.myHP);
      }

      if (this.p1Def && this.p1Def.playVoice) {
        this.p1Def.playVoice();
        this.showSpeechBubble(this.myPlayer, this.p1Def.hitQuote, this.p1Def.themeColor);
      }

      if (this.myHP <= 0) {
        if (!this.isTopDown) {
          this.myPlayer.play(`${this.myColor}-dead`);
        } else {
          this.tweens.add({
            targets: this.myPlayer,
            angle: 180,
            alpha: 0.35,
            duration: 500
          });
        }
        this.myPlayer.setVelocity(0, 0);
        this.playEliminationSound();
        this.matchStarted = false;
        if (this.localTimerEvent) this.localTimerEvent.remove();
        this.time.delayedCall(800, () => {
          if (window.handleMatchEnd) {
            window.handleMatchEnd({ winner: 2, reason: 'kill', health1: this.myHP, health2: this.opponentHP });
          }
        });
      }
    }
  }

  useP1Super() {
    if (this.isTopDown) return; // Special powers disabled in Diwali Arena (Patakas on ground!)
    if (!this.matchStarted || this.myHP <= 0 || this.isIntroWalking) return;
    if (this.p1Super < 100) return;
    this.p1Super = 0;
    this.updateSuperHUD();

    this.executeSpecialPower(1, this.myPlayer, this.opponent, this.p1Def, 2);
  }

  useP2Super() {
    if (this.isTopDown) return; // Special powers disabled in Diwali Arena (Patakas on ground!)
    if (!this.matchStarted || this.opponentHP <= 0 || this.isIntroWalking) return;
    if (this.p2Super < 100) return;
    this.p2Super = 0;
    this.updateSuperHUD();

    this.executeSpecialPower(2, this.opponent, this.myPlayer, this.p2Def, 1);
  }

  executeSpecialPower(playerNum, caster, target, charDef, targetNum) {
    if (!caster || !caster.active) return;
    const direction = caster.flipX ? -1 : 1;
    const baseAngle = this.isTopDown
      ? (target && target.active
          ? Phaser.Math.Angle.Between(caster.x, caster.y, target.x, target.y)
          : (typeof caster.rotation === 'number' ? caster.rotation : 0))
      : (direction === -1 ? Math.PI : 0);

    // Dramatic voice and speech bubble
    if (charDef.key === 'dip') {
      this.playVoiceDip();
      this.showSpeechBubble(caster, "TUM MUJHE GUSSA MAT DILAO! 🔥", '#00e5ff');
    } else if (charDef.key === 'sanket') {
      this.playVoiceSanket();
      this.showSpeechBubble(caster, "BAATEIN UNCHI UNCHI! 🚀", '#ff3366');
    } else if (charDef.key === 'ahil') {
      this.playVoiceAhil();
      this.showSpeechBubble(caster, "OOMFO! TEL LAGAKE MAARENGE! 💨🍻", '#c084fc');
    } else if (charDef.key === 'keshav') {
      this.playVoiceKeshav();
      this.showSpeechBubble(caster, "BETA HUMSE PANGA MAT LENA! 🍾🔥", '#f59e0b');
    } else {
      this.playVoiceSushruto();
      this.showSpeechBubble(caster, "ABHI APP LAUNCH HOGA! ⚡", '#22c55e');
    }

    // --------------------------------------------------------
    // DIP SPECIAL: GUSSA MEGA BEAM (Piercing Plasma Laser)
    // --------------------------------------------------------
    if (charDef.key === 'dip') {
      this.playSuperBeamSound();
      this.cameras.main.shake(260, 0.02);

      const beamX = caster.x + (this.isTopDown ? Math.cos(baseAngle) * 36 : direction * 40);
      const beamY = caster.y + (this.isTopDown ? Math.sin(baseAngle) * 36 : -4);
      const beam = this.physics.add.sprite(beamX, beamY, 'super-beam');
      beam.setScale(1.8, 2.4);
      beam.body.setAllowGravity(false);

      if (this.isTopDown) {
        beam.setVelocity(Math.cos(baseAngle) * 1350, Math.sin(baseAngle) * 1350);
        beam.setRotation(baseAngle);
      } else {
        beam.setVelocityX(direction * 1250);
        beam.setFlipX(direction === -1);
      }
      beam.setDepth(90);

      const beamTrail = this.add.particles(0, 0, 'particle', {
        follow: beam,
        scale: { start: 1.2, end: 0 },
        speed: 20,
        lifespan: 140,
        blendMode: 'ADD',
        tint: [0x00e5ff, 0xffffff]
      });
      beamTrail.setDepth(89);

      let beamHit = false;
      this.physics.add.overlap(beam, target, () => {
        if (!beamHit && this.matchStarted) {
          beamHit = true;
          this.bulletImpact(target.x, target.y);
          this.applyDamageToPlayer(targetNum, 2);
          if (this.isTopDown) {
            target.setVelocity(Math.cos(baseAngle) * 320, Math.sin(baseAngle) * 320);
          } else {
            target.setVelocityX(direction * 450);
            target.setVelocityY(-200);
          }
        }
      });

      this.time.delayedCall(1200, () => {
        if (beam && beam.active) beam.destroy();
        if (beamTrail && beamTrail.scene) beamTrail.destroy();
      });
    }

    // --------------------------------------------------------
    // SANKET SPECIAL: TRIPLE METEOR SLAM (3 Spread Rockets)
    // --------------------------------------------------------
    else if (charDef.key === 'sanket') {
      this.playSuperExplosionSound();
      this.cameras.main.shake(180, 0.015);

      const angleOffsets = [-0.22, 0, 0.22];
      angleOffsets.forEach((off, idx) => {
        this.time.delayedCall(idx * 70, () => {
          if (!caster || !caster.active) return;
          const rAngle = baseAngle + off;
          const rocketX = caster.x + (this.isTopDown ? Math.cos(rAngle) * 30 : direction * 30);
          const rocketY = caster.y + (this.isTopDown ? Math.sin(rAngle) * 30 : -4);
          const rocket = this.physics.add.sprite(rocketX, rocketY, 'super-rocket');
          rocket.body.setAllowGravity(false);

          const speed = 720;
          if (this.isTopDown) {
            rocket.setVelocity(Math.cos(rAngle) * speed, Math.sin(rAngle) * speed);
            rocket.setRotation(rAngle);
          } else {
            const rad = off;
            rocket.setVelocity(Math.cos(rad) * speed * direction, Math.sin(rad) * speed);
            rocket.setRotation(rad * direction);
            rocket.setFlipX(direction === -1);
          }
          rocket.setDepth(85);

          const rTrail = this.add.particles(0, 0, 'particle', {
            follow: rocket,
            scale: { start: 0.9, end: 0 },
            speed: 15,
            lifespan: 120,
            blendMode: 'ADD',
            tint: [0xff4400, 0xffaa00, 0xffff00]
          });
          rTrail.setDepth(84);

          const onRocketHit = () => {
            if (!rocket.active) return;
            this.triggerSuperExplosion(rocket.x, rocket.y, 2, targetNum, target);
            rocket.destroy();
            if (rTrail && rTrail.scene) rTrail.destroy();
          };

          if (this.isTopDown) {
            if (this.wallsGroup) this.physics.add.collider(rocket, this.wallsGroup, onRocketHit);
            if (this.fencesGroup) this.physics.add.collider(rocket, this.fencesGroup, onRocketHit);
            if (this.cratesGroup) this.physics.add.collider(rocket, this.cratesGroup, onRocketHit);
            if (this.safeSprite) this.physics.add.collider(rocket, this.safeSprite, onRocketHit);
          } else {
            if (this.platforms) this.physics.add.collider(rocket, this.platforms, onRocketHit);
            if (this.crateGroup) this.physics.add.collider(rocket, this.crateGroup, onRocketHit);
          }
          this.physics.add.overlap(rocket, target, onRocketHit);

          this.time.delayedCall(1600, () => {
            if (rocket && rocket.active) onRocketHit();
          });
        });
      });
    }

    // --------------------------------------------------------
    // SUSHRUTO SPECIAL: CYBER OVERLOAD EMP (3 Homing Electric Orbs)
    // --------------------------------------------------------
    else if (charDef.key === 'sushruto') {
      this.playSuperElectricSound();
      this.cameras.main.shake(150, 0.012);

      const orbOffsets = [-24, 0, 24];
      orbOffsets.forEach((yOff, idx) => {
        this.time.delayedCall(idx * 120, () => {
          if (!caster || !caster.active) return;
          const orbX = caster.x + (this.isTopDown ? Math.cos(baseAngle) * 25 : direction * 25);
          const orbY = caster.y + (this.isTopDown ? Math.sin(baseAngle) * 25 + yOff : yOff);
          const orb = this.physics.add.sprite(orbX, orbY, 'super-orb');
          orb.body.setAllowGravity(false);
          orb.target = target;
          orb.setDepth(85);

          if (this.isTopDown) {
            const burstAngle = baseAngle + (idx - 1) * 0.35;
            orb.setVelocity(Math.cos(burstAngle) * 320, Math.sin(burstAngle) * 320);
          } else {
            orb.setVelocity(direction * 300, yOff * 6);
          }

          const orbTrail = this.add.particles(0, 0, 'particle', {
            follow: orb,
            scale: { start: 0.8, end: 0 },
            speed: 10,
            lifespan: 100,
            blendMode: 'ADD',
            tint: [0x22c55e, 0x00e5ff]
          });
          orbTrail.setDepth(84);

          this.homingOrbs.push(orb);

          const onOrbHit = () => {
            if (!orb.active) return;
            this.bulletImpact(orb.x, orb.y);
            this.playSuperElectricSound();
            this.applyDamageToPlayer(targetNum, 1);
            target.setVelocity(0, 0);
            target.setTint(0x00e5ff);
            this.time.delayedCall(400, () => {
              if (target && target.active) target.clearTint();
            });
            orb.destroy();
            if (orbTrail && orbTrail.scene) orbTrail.destroy();
          };

          if (this.isTopDown) {
            if (this.wallsGroup) this.physics.add.collider(orb, this.wallsGroup, onOrbHit);
            if (this.fencesGroup) this.physics.add.collider(orb, this.fencesGroup, onOrbHit);
            if (this.cratesGroup) this.physics.add.collider(orb, this.cratesGroup, onOrbHit);
            if (this.safeSprite) this.physics.add.collider(orb, this.safeSprite, onOrbHit);
          } else {
            if (this.platforms) this.physics.add.collider(orb, this.platforms, onOrbHit);
            if (this.crateGroup) this.physics.add.collider(orb, this.crateGroup, onOrbHit);
          }
          this.physics.add.overlap(orb, target, onOrbHit);

          this.time.delayedCall(2200, () => {
            if (orb && orb.active) onOrbHit();
          });
        });
      });
    }

    // --------------------------------------------------------
    // AHIL SPECIAL: DRUNKEN SMOKE STORM & OMFO BLAST (3 Smoke Bottles)
    // --------------------------------------------------------
    else if (charDef.key === 'ahil') {
      this.playShootSound();
      this.cameras.main.shake(220, 0.018);

      // Blinding smoke screen around caster
      try {
        const screenSmoke = this.add.particles(caster.x, caster.y, 'smoke-puff', {
          speed: { min: 40, max: 180 },
          scale: { start: 0.6, end: 2.2 },
          alpha: { start: 0.85, end: 0 },
          lifespan: 1400,
          quantity: 18,
          emitting: false
        }).setDepth(85);
        screenSmoke.explode(18);
      } catch (e) {}

      const bottleAngles = [-0.22, 0, 0.22];
      bottleAngles.forEach((off, idx) => {
        this.time.delayedCall(idx * 110, () => {
          if (!caster || !caster.active) return;
          const bAngle = baseAngle + off;
          const bX = caster.x + (this.isTopDown ? Math.cos(bAngle) * 28 : direction * 28);
          const bY = caster.y + (this.isTopDown ? Math.sin(bAngle) * 28 : -8);
          const bottle = this.physics.add.sprite(bX, bY, 'bullet');
          bottle.setTint(0xa855f7);
          bottle.setScale(1.7, 1.7);
          bottle.body.setAllowGravity(false);
          bottle.setDepth(86);

          const speed = 760;
          if (this.isTopDown) {
            bottle.setVelocity(Math.cos(bAngle) * speed, Math.sin(bAngle) * speed);
            bottle.setRotation(bAngle);
          } else {
            bottle.setVelocity(direction * Math.cos(off) * speed, Math.sin(off) * speed);
            bottle.setFlipX(direction === -1);
          }

          // Dense purple smoke trail
          const bTrail = this.add.particles(0, 0, 'smoke-puff', {
            follow: bottle,
            scale: { start: 0.45, end: 1.1 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 350,
            speed: 15
          }).setDepth(84);

          const onHit = () => {
            if (!bottle.active) return;
            bTrail.destroy();
            bottle.destroy();
            this.bulletImpact(bottle.x, bottle.y);

            // Smoke explosion
            try {
              const burstSmoke = this.add.particles(bottle.x, bottle.y, 'smoke-puff', {
                speed: { min: 60, max: 200 },
                scale: { start: 0.6, end: 2.0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 800,
                quantity: 14,
                emitting: false
              }).setDepth(86);
              burstSmoke.explode(14);
            } catch(e) {}

            this.applyDamageToPlayer(targetNum, 1);
          };

          if (this.isTopDown) {
            if (this.wallsGroup) this.physics.add.collider(bottle, this.wallsGroup, onHit);
            if (this.fencesGroup) this.physics.add.collider(bottle, this.fencesGroup, onHit);
            if (this.cratesGroup) this.physics.add.collider(bottle, this.cratesGroup, onHit);
            if (this.safeSprite) this.physics.add.collider(bottle, this.safeSprite, onHit);
          } else {
            if (this.platforms) this.physics.add.collider(bottle, this.platforms, onHit);
            if (this.crateGroup) this.physics.add.collider(bottle, this.crateGroup, onHit);
          }
          this.physics.add.overlap(bottle, target, onHit);
          this.time.delayedCall(1600, () => {
            if (bottle.active) {
              bTrail.destroy();
              bottle.destroy();
            }
          });
        });
      });
    }

    // --------------------------------------------------------
    // KESHAV SPECIAL: DESI DARU MOLOTOV BLAST (3 Flaming Alcohol Bottles)
    // --------------------------------------------------------
    else if (charDef.key === 'keshav') {
      this.playBottleBreakSound();
      this.cameras.main.shake(250, 0.02);

      const bottleAngles = [-0.25, 0, 0.25];
      bottleAngles.forEach((off, idx) => {
        this.time.delayedCall(idx * 110, () => {
          if (!caster || !caster.active) return;
          const bAngle = baseAngle + off;
          const bX = caster.x + (this.isTopDown ? Math.cos(bAngle) * 30 : direction * 30);
          const bY = caster.y + (this.isTopDown ? Math.sin(bAngle) * 30 : -8);
          const molotov = this.physics.add.sprite(bX, bY, 'bottle-bullet');
          molotov.setScale(2.1, 2.1);
          molotov.body.setAllowGravity(false);
          molotov.setDepth(88);

          const speed = 720;
          if (this.isTopDown) {
            molotov.setVelocity(Math.cos(bAngle) * speed, Math.sin(bAngle) * speed);
            molotov.setRotation(bAngle);
          } else {
            molotov.setVelocity(direction * Math.cos(off) * speed, Math.sin(off) * speed);
            molotov.setFlipX(direction === -1);
          }

          // Fiery amber alcohol trail
          const mTrail = this.add.particles(0, 0, 'amber-splash', {
            follow: molotov,
            scale: { start: 1.1, end: 0 },
            alpha: { start: 0.9, end: 0 },
            tint: [0xff4500, 0xf59e0b, 0xffd700],
            lifespan: 220,
            speed: 25,
            blendMode: 'ADD'
          }).setDepth(87);

          const onMolotovHit = () => {
            if (!molotov.active) return;
            mTrail.destroy();
            molotov.destroy();

            this.playBottleBreakSound();
            this.playSuperExplosionSound();
            this.cameras.main.shake(180, 0.015);

            if (this.impactEmitter) {
              this.impactEmitter.explode(18, molotov.x, molotov.y);
            }

            // Burning alcohol puddle on impact
            const firePuddle = this.add.ellipse(molotov.x, molotov.y, 60, 36, 0xf59e0b, 0.6).setDepth(40);
            this.tweens.add({
              targets: firePuddle,
              scaleX: 1.35,
              scaleY: 1.35,
              alpha: { from: 0.75, to: 0.1 },
              duration: 250,
              yoyo: true,
              repeat: 5,
              onComplete: () => firePuddle.destroy()
            });

            this.applyDamageToPlayer(targetNum, 1);
            if (target && target.active) {
              this.showSpeechBubble(target, "NETWORK DISCONNECTED! ⚡📵", '#ef4444');
            }
          };

          if (this.isTopDown) {
            if (this.wallsGroup) this.physics.add.collider(molotov, this.wallsGroup, onMolotovHit);
            if (this.fencesGroup) this.physics.add.collider(molotov, this.fencesGroup, onMolotovHit);
            if (this.cratesGroup) this.physics.add.collider(molotov, this.cratesGroup, onMolotovHit);
            if (this.safeSprite) this.physics.add.collider(molotov, this.safeSprite, onMolotovHit);
          } else {
            if (this.platforms) this.physics.add.collider(molotov, this.platforms, onMolotovHit);
            if (this.crateGroup) this.physics.add.collider(molotov, this.crateGroup, onMolotovHit);
          }
          this.physics.add.overlap(molotov, target, onMolotovHit);
          this.time.delayedCall(1600, () => {
            if (molotov.active) {
              mTrail.destroy();
              molotov.destroy();
            }
          });
        });
      });
    }
  }

  triggerSuperExplosion(x, y, dmg, targetNum, target) {
    this.playSuperExplosionSound();
    this.cameras.main.shake(200, 0.02);

    const blast = this.add.sprite(x, y, 'super-blast').setDepth(95).setScale(0.8);
    this.tweens.add({
      targets: blast,
      scale: 2.2,
      alpha: 0,
      duration: 320,
      onComplete: () => blast.destroy()
    });

    this.bulletImpact(x, y);

    if (target && target.active && this.matchStarted) {
      const dist = Phaser.Math.Distance.Between(x, y, target.x, target.y);
      if (dist < 80) {
        this.applyDamageToPlayer(targetNum, dmg);
        const kx = target.x > x ? 300 : -300;
        target.setVelocityX(kx);
        target.setVelocityY(-180);
      }
    }
  }

  startLocalMatch() {
    if (this.isTopDown) {
      // Top-Down Diwali Battleground: Cinematic Entrance & Dialogue for BOTH Players!
      this.isIntroWalking = true;
      this.matchStarted = false;
      this.myPlayer.body.enable = true;
      this.opponent.body.enable = true;
      this.myPlayer.body.setAllowGravity(false);
      this.opponent.body.setAllowGravity(false);
      this.myPlayer.setCollideWorldBounds(true);
      this.opponent.setCollideWorldBounds(true);
      this.myPlayer.setPosition(220, 300);
      this.opponent.setPosition(980, 300);
      this.myPlayer.setVelocity(0, 0);
      this.opponent.setVelocity(0, 0);
      this.myPlayer.setRotation(0);
      this.myPlayer.setFlipX(false);
      this.opponent.setRotation(0);
      this.opponent.setFlipX(true);

      const p1Streak = (window.winStreaks && window.winStreaks.p1) || 0;
      const p2Streak = (window.winStreaks && window.winStreaks.p2) || 0;

      const p2DisplayName = this.isBotMatch
        ? `BOT ${this.p2Def.name} [${this.botDiffConfig.tag}]`
        : this.p2Def.name;

      const p1Title = p1Streak >= 3
        ? `👑 DEFENDING CHAMPION: ${this.p1Def.name} (${p1Streak}x STREAK) 👑`
        : `🪔 BRAWL BATTLEGROUND: ${this.p1Def.name} VS ${p2DisplayName} 🪔`;

      const introBanner = this.add.text(ARENA_W / 2, 75, p1Title, {
        fontSize: '18px', fontFamily: 'Arial', color: '#fde047', fontStyle: 'bold',
        backgroundColor: 'rgba(0, 0, 0, 0.85)', padding: { x: 18, y: 8 }
      }).setOrigin(0.5).setDepth(200);

      // 1. Player 1 Entrance Dialogue & Audio
      if (this.p1Def && this.p1Def.playVoice) {
        this.p1Def.playVoice();
      }
      this.showSpeechBubble(this.myPlayer, this.p1Def.entryQuote, this.p1Def.themeColor);
      this.tweens.add({
        targets: this.myPlayer,
        y: 300 - 15,
        duration: 180,
        yoyo: true
      });

      // 2. Player 2 Entrance Dialogue & Audio (after 1800ms)
      this.time.delayedCall(1800, () => {
        if (!this.scene || !this.scene.isActive()) return;

        const p2Title = p2Streak >= 3
          ? `👑 DEFENDING CHAMPION: ${this.p2Def.name} (${p2Streak}x STREAK) 👑`
          : `🔥 FIGHTER 2: ${p2DisplayName} 🔥`;
        if (introBanner && introBanner.active) {
          introBanner.setText(p2Title);
          introBanner.setColor(p2Streak >= 3 ? '#ffd700' : this.p2Def.themeColor);
        }

        if (this.p2Def && this.p2Def.playVoice) {
          this.p2Def.playVoice();
        }
        this.showSpeechBubble(this.opponent, this.p2Def.entryQuote, this.p2Def.themeColor);
        this.tweens.add({
          targets: this.opponent,
          y: 300 - 15,
          duration: 180,
          yoyo: true
        });

        // 3. START Announcement & Match Start (after another 1800ms)
        this.time.delayedCall(1800, () => {
          if (!this.scene || !this.scene.isActive()) return;

          if (introBanner && introBanner.active) {
            this.tweens.add({
              targets: introBanner,
              alpha: 0,
              y: 45,
              duration: 300,
              onComplete: () => {
                if (introBanner && introBanner.active) introBanner.destroy();
              }
            });
          }

          // Say & Show "START! 💥"
          this.showStartVisual();

          // Combat and Movement ACTIVE!
          this.isIntroWalking = false;
          this.matchStarted = true;

          // Spawn initial pickups fairly (Bomb in neutral center or P2 side, NEVER fixed at P1!)
          const bombSpot = Math.random() > 0.5 ? { x: 600, y: 220 } : { x: 820, y: 320 };
          const healSpot = (bombSpot.x === 820) ? { x: 380, y: 320 } : { x: 600, y: 380 };
          this.spawnDiwaliPickup('bomb', bombSpot.x, bombSpot.y);
          this.spawnDiwaliPickup('soanpapdi', healSpot.x, healSpot.y);

          // Start Match Timer (120s)
          this.localTimeLeft = 120;
          this.localTimerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
              this.localTimeLeft--;
              const mins = Math.floor(this.localTimeLeft / 60);
              const secs = this.localTimeLeft % 60;
              this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
              if (this.localTimeLeft <= 10) {
                this.timerText.setColor('#ff1744');
              }
              if (this.localTimeLeft <= 0) {
                this.localTimerEvent.remove();
                this.matchStarted = false;
                let winner = 0;
                if (this.myHP > this.opponentHP) winner = 1;
                else if (this.opponentHP > this.myHP) winner = 2;
                if (window.handleMatchEnd) {
                  window.handleMatchEnd({ winner, reason: 'time', health1: this.myHP, health2: this.opponentHP });
                }
              }
            }
          });
        });
      });
      return;
    }

    this.isIntroWalking = true;
    this.matchStarted = false;

    const spawnY = 540;
    const p1StartX = -60;
    const p2StartX = 1260;

    // Both players must NOT fall under gravity or collide during cinematic entrance
    this.myPlayer.body.setAllowGravity(false);
    this.opponent.body.setAllowGravity(false);
    this.myPlayer.body.enable = false;
    this.opponent.body.enable = false;
    this.myPlayer.setVelocity(0, 0);
    this.opponent.setVelocity(0, 0);
    this.myPlayer.setPosition(p1StartX, spawnY);
    this.opponent.setPosition(p2StartX, spawnY);

    const p1Streak = (window.winStreaks && window.winStreaks.p1) || 0;
    const p2Streak = (window.winStreaks && window.winStreaks.p2) || 0;

    const p1Title = p1Streak >= 3
      ? `👑 DEFENDING CHAMPION (${p1Streak}x STREAK): ${this.p1Def.name} 👑`
      : `⭐ FIGHTER 1 ENTRANCE: ${this.p1Def.name} ⭐`;

    // Center Announcement Banner
    const introBanner = this.add.text(ARENA_W / 2, 75, p1Title, {
      fontSize: '20px', fontFamily: 'Arial', color: p1Streak >= 3 ? '#ffd700' : this.p1Def.themeColor, fontStyle: 'bold',
      backgroundColor: 'rgba(0, 0, 0, 0.85)', padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setDepth(200);

    // ========================================================
    // 1. PLAYER 1 DANCE WALK-IN ("Nachte Nachte" Entrance)
    // ========================================================
    this.myPlayer.setFlipX(false);
    if (!this.isTopDown && this.myPlayer.anims) {
      this.myPlayer.play(`${this.myColor}-run`, true);
    }

    // Rhythmic dancing bounce on Y
    const p1Bounce = this.tweens.add({
      targets: this.myPlayer,
      y: spawnY - 8,
      duration: 160,
      yoyo: true,
      repeat: 11,
      ease: 'Sine.easeInOut'
    });

    // Rhythmic dancing tilt sway
    const p1Tilt = this.tweens.add({
      targets: this.myPlayer,
      angle: 10,
      duration: 180,
      yoyo: true,
      repeat: 10,
      ease: 'Sine.easeInOut'
    });

    // Walk horizontally onto arena to x = 220
    this.tweens.add({
      targets: this.myPlayer,
      x: 220,
      duration: 2000,
      ease: 'Linear',
      onComplete: () => {
        p1Bounce.stop();
        p1Tilt.stop();
        this.myPlayer.setAngle(0);
        this.myPlayer.setPosition(220, spawnY);
        this.myPlayer.setVelocity(0, 0);
        if (!this.isTopDown && this.myPlayer.anims) {
          this.myPlayer.play(`${this.myColor}-idle`, true);
        }

        // Fun celebration jump
        this.tweens.add({
          targets: this.myPlayer,
          y: spawnY - 20,
          duration: 180,
          yoyo: true
        });

        // P1 speaks with dialogue & custom audio!
        if (this.p1Def && this.p1Def.playVoice) {
          this.p1Def.playVoice();
          this.showSpeechBubble(this.myPlayer, this.p1Def.entryQuote, this.p1Def.themeColor);
        }

        // P1 waits for Player 2's entrance!
        this.time.delayedCall(2200, () => {
          // ========================================================
          // 2. PLAYER 2 DANCE WALK-IN ("Nachte Nachte" Entrance)
          // ========================================================
          const p2Title = p2Streak >= 3
            ? `👑 DEFENDING CHAMPION (${p2Streak}x STREAK): ${this.p2Def.name} 👑`
            : `🔥 FIGHTER 2 ENTRANCE: ${this.p2Def.name} 🔥`;
          introBanner.setText(p2Title);
          introBanner.setColor(p2Streak >= 3 ? '#ffd700' : this.p2Def.themeColor);

          this.opponent.setPosition(p2StartX, spawnY);
          this.opponent.setVelocity(0, 0);
          this.opponent.setFlipX(true);
          if (!this.isTopDown && this.opponent.anims) {
            this.opponent.play(`${this.opColor}-run`, true);
          }

          const p2Bounce = this.tweens.add({
            targets: this.opponent,
            y: spawnY - 8,
            duration: 160,
            yoyo: true,
            repeat: 11,
            ease: 'Sine.easeInOut'
          });

          const p2Tilt = this.tweens.add({
            targets: this.opponent,
            angle: -10,
            duration: 180,
            yoyo: true,
            repeat: 10,
            ease: 'Sine.easeInOut'
          });

          this.tweens.add({
            targets: this.opponent,
            x: 980,
            duration: 2000,
            ease: 'Linear',
            onComplete: () => {
              p2Bounce.stop();
              p2Tilt.stop();
              this.opponent.setAngle(0);
              this.opponent.setPosition(980, spawnY);
              this.opponent.setVelocity(0, 0);
              if (!this.isTopDown && this.opponent.anims) {
                this.opponent.play(`${this.opColor}-idle`, true);
              }

              // Fun celebration jump
              this.tweens.add({
                targets: this.opponent,
                y: spawnY - 20,
                duration: 180,
                yoyo: true
              });

              // P2 speaks with dialogue & custom audio!
              if (this.p2Def && this.p2Def.playVoice) {
                this.p2Def.playVoice();
                this.showSpeechBubble(this.opponent, this.p2Def.entryQuote, this.p2Def.themeColor);
              }

              // P2 waits, then 3.. 2.. 1.. FIGHT!
              this.time.delayedCall(2000, () => {
                introBanner.destroy();

                this.showCountdownVisual(3);
                this.time.delayedCall(1000, () => this.showCountdownVisual(2));
                this.time.delayedCall(2000, () => this.showCountdownVisual(1));
                this.time.delayedCall(3000, () => {
                  this.showFightVisual();

                  // Enable physics body, gravity (if side-scroller) and bounds for combat
                  this.myPlayer.body.enable = true;
                  this.opponent.body.enable = true;
                  this.myPlayer.body.setAllowGravity(!this.isTopDown);
                  this.opponent.body.setAllowGravity(!this.isTopDown);
                  this.myPlayer.setCollideWorldBounds(true);
                  this.opponent.setCollideWorldBounds(true);
                  this.myPlayer.setVelocity(0, 0);
                  this.opponent.setVelocity(0, 0);

                  this.isIntroWalking = false;
                  this.matchStarted = true;

                  // Start Match Timer (120s)
                  this.localTimeLeft = 120;
                  this.localTimerEvent = this.time.addEvent({
                    delay: 1000,
                    loop: true,
                    callback: () => {
                      this.localTimeLeft--;
                      const mins = Math.floor(this.localTimeLeft / 60);
                      const secs = this.localTimeLeft % 60;
                      this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
                      if (this.localTimeLeft <= 10) {
                        this.timerText.setColor('#ff1744');
                      }
                      if (this.localTimeLeft <= 0) {
                        this.localTimerEvent.remove();
                        this.matchStarted = false;
                        let winner = 0;
                        if (this.myHP > this.opponentHP) winner = 1;
                        else if (this.opponentHP > this.myHP) winner = 2;
                        if (window.handleMatchEnd) {
                          window.handleMatchEnd({ winner, reason: 'time', health1: this.myHP, health2: this.opponentHP });
                        }
                      }
                    }
                  });
                });
              });
            }
          });
        });
      }
    });
  }

  showStartVisual() {
    if (!this.countdownText) return;
    this.countdownText.setVisible(true);
    this.countdownText.setText('START! 💥');
    this.countdownText.setStyle({ color: '#ffea00', stroke: '#ff0055', strokeThickness: 8 });
    this.countdownText.setScale(0.6);
    this.countdownText.setAlpha(1);

    this.playBeepSound(980, 0.35);
    this.cameras.main.flash(260, 255, 255, 255);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance("Start!");
        utter.pitch = 1.15;
        utter.rate = 1.2;
        utter.volume = 1;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }

    this.tweens.add({
      targets: this.countdownText,
      scale: 2.0,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.countdownText,
          alpha: 0,
          scale: 2.8,
          delay: 450,
          duration: 450,
          ease: 'Power2',
          onComplete: () => {
            if (this.countdownText && this.countdownText.active) {
              this.countdownText.setVisible(false);
              this.countdownText.setAlpha(1);
              this.countdownText.setScale(1);
            }
          }
        });
      }
    });
  }

  showCountdownVisual(count) {
    this.countdownText.setVisible(true);
    this.countdownText.setText(count.toString());
    this.countdownText.setStyle({ color: '#00e5ff' });
    this.countdownText.setScale(2);
    this.playBeepSound(500, 0.1);
    this.tweens.add({
      targets: this.countdownText,
      scale: 1,
      duration: 800,
      ease: 'Power2'
    });
  }

  showFightVisual() {
    this.countdownText.setText('FIGHT!');
    this.countdownText.setStyle({ color: '#ff1744' });
    this.countdownText.setScale(1.6);
    this.playBeepSound(900, 0.25);
    this.cameras.main.flash(250, 255, 255, 255);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance("Fight!");
        utter.pitch = 1.1;
        utter.rate = 1.2;
        utter.volume = 1;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }

    this.tweens.add({
      targets: this.countdownText,
      alpha: 0,
      scale: 2.2,
      duration: 800,
      onComplete: () => {
        this.countdownText.setVisible(false);
        this.countdownText.setAlpha(1);
        this.countdownText.setStyle({ color: '#00e5ff' });
      }
    });
  }

  showSpeechBubble(targetSprite, text, color = '#00e5ff') {
    if (!targetSprite || !targetSprite.active) return;
    const bubble = this.add.text(targetSprite.x, targetSprite.y - 48, `💬 "${text}"`, {
      fontSize: '13px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: color,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(250);

    if (targetSprite === this.myPlayer) {
      if (this.p1SpeechBubble && this.p1SpeechBubble.active) this.p1SpeechBubble.destroy();
      this.p1SpeechBubble = bubble;
    } else {
      if (this.p2SpeechBubble && this.p2SpeechBubble.active) this.p2SpeechBubble.destroy();
      this.p2SpeechBubble = bubble;
    }

    this.tweens.add({
      targets: bubble,
      y: bubble.y - 25,
      alpha: 0,
      duration: 2000,
      ease: 'Power1',
      onComplete: () => {
        if (targetSprite === this.myPlayer && this.p1SpeechBubble === bubble) this.p1SpeechBubble = null;
        if (targetSprite !== this.myPlayer && this.p2SpeechBubble === bubble) this.p2SpeechBubble = null;
        bubble.destroy();
      }
    });
  }

  // Voice playback for character DIP
  playVoiceDip() {
    if (window.soundEnabled === false) return;
    try {
      if (this.sound && this.cache.audio.exists('voice-dip')) {
        this.sound.play('voice-dip', { volume: 1.0 });
        return;
      }
    } catch(e) {}
    try {
      const v = new Audio('/assets/voice_dip.ogg');
      v.volume = 1.0;
      v.play().catch(e => {
        try {
          const v2 = new Audio('/assets/voice_dip.mp4');
          v2.volume = 1.0;
          v2.play().catch(() => {});
        } catch(err) {}
      });
    } catch(e) {}
  }

  // Voice playback for character SANKET
  playVoiceSanket() {
    if (window.soundEnabled === false) return;
    try {
      if (this.sound && this.cache.audio.exists('voice-sanket')) {
        this.sound.play('voice-sanket', { volume: 1.0 });
        return;
      }
    } catch(e) {}
    try {
      const v = new Audio('/assets/voice_sanket.ogg');
      v.volume = 1.0;
      v.play().catch(e => {});
    } catch(e) {}
  }

  // Voice playback for character SUSHRUTO
  playVoiceSushruto() {
    if (window.soundEnabled === false) return;
    try {
      if (this.sound && this.cache.audio.exists('voice-sushruto')) {
        this.sound.play('voice-sushruto', { volume: 1.0 });
        return;
      }
    } catch(e) {}
    try {
      const v = new Audio('/assets/voice_sushruto.ogg');
      v.volume = 1.0;
      v.play().catch(e => {});
    } catch(e) {}
  }

  // Voice playback for character AHIL ("Oomfo! Tel lagake maarenge!")
  playVoiceAhil() {
    if (window.soundEnabled === false) return;
    try {
      if (this.sound && this.cache.audio.exists('voice-ahil')) {
        this.sound.play('voice-ahil', { volume: 1.0 });
        return;
      }
    } catch(e) {}
    try {
      const v = new Audio('/assets/voice_ahil.ogg');
      v.volume = 1.0;
      v.play().catch(e => {});
    } catch(e) {}
  }

  playVoiceKeshav() {
    if (window.soundEnabled === false) return;
    try {
      if (this.sound && this.cache.audio.exists('voice-keshav')) {
        this.sound.play('voice-keshav', { volume: 1.0 });
        return;
      }
    } catch(e) {}
    try {
      const v = new Audio('/assets/voice_keshav.ogg');
      v.volume = 1.0;
      v.play().catch(e => {});
    } catch(e) {}
  }

  playBottleBreakSound() {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch(e) {}
  }

  // Setup Continuous Cigarette Smoke Emitter for AHIL ("Smoke karta huya all time in game")
  setupSmokeEmitter(player, isP1) {
    if (!player) return null;
    const charKey = isP1 ? this.p1Def.key : this.p2Def.key;
    if (charKey !== 'ahil') return null;

    try {
      const emitter = this.add.particles(0, 0, 'smoke-puff', {
        follow: player,
        followOffset: { x: this.isTopDown ? 8 : (player.flipX ? -8 : 8), y: this.isTopDown ? -4 : -18 },
        frequency: 85,
        lifespan: { min: 700, max: 1300 },
        scale: { start: 0.35, end: 1.3 },
        alpha: { start: 0.75, end: 0 },
        speedY: { min: -25, max: -65 },
        speedX: { min: -14, max: 14 },
        blendMode: 'NORMAL'
      });
      emitter.setDepth(52);
      return emitter;
    } catch(e) {
      console.warn('Smoke emitter setup note:', e);
      return null;
    }
  }

  playVoiceGussa() {
    this.playVoiceDip();
  }

  updateBotAI(time, delta) {
    if (!this.opponent || !this.opponent.active || this.opponentHP <= 0) return;

    const cfg = this.botDiffConfig || {
      topDownSpeed: 165,
      topDownStrafe: 135,
      topDownDodge: 210,
      dodgeChance: 0.75,
      shootDelayMin: 700,
      shootDelayMax: 1200,
      pickupDist: 280,
      strafeMin: 800,
      strafeMax: 1600,
      platSpeed: 180,
      platJumpMin: 2600,
      platJumpMax: 4800,
      superChance: 0.04
    };

    if (this.isTopDown) {
      // 1. Check for nearby Diwali Blast Danger reticles to DODGE!
      let dodgeDanger = null;
      if (this.children && this.children.list) {
        this.children.list.forEach(child => {
          if (child.texture && child.texture.key === 'diwali-blast-target' && child.active) {
            const d = Phaser.Math.Distance.Between(this.opponent.x, this.opponent.y, child.x, child.y);
            if (d < 130) dodgeDanger = child;
          }
        });
      }

      if (dodgeDanger) {
        // Roll against dodgeChance for current difficulty
        if (Math.random() <= cfg.dodgeChance) {
          const dodgeAngle = Phaser.Math.Angle.Between(dodgeDanger.x, dodgeDanger.y, this.opponent.x, this.opponent.y);
          this.opponent.setVelocity(Math.cos(dodgeAngle) * cfg.topDownDodge, Math.sin(dodgeAngle) * cfg.topDownDodge);
          return;
        }
      }

      // 2. Check for nearby Diwali Pickups (Soan Papdi if damaged, or Pataka Bomb)
      let targetPickup = null;
      if (this.diwaliPickups) {
        let closestDist = cfg.pickupDist;
        this.diwaliPickups.getChildren().forEach(p => {
          if (p.active) {
            const d = Phaser.Math.Distance.Between(this.opponent.x, this.opponent.y, p.x, p.y);
            if (d < closestDist) {
              closestDist = d;
              targetPickup = p;
            }
          }
        });
      }

      const aimAngle = Phaser.Math.Angle.Between(this.opponent.x, this.opponent.y, this.myPlayer.x, this.myPlayer.y);
      this.setTopDownFacing(this.opponent, aimAngle);

      let vx = 0;
      let vy = 0;

      if (targetPickup && (this.opponentHP < 85 || targetPickup.getData('pickupType') === 'bomb')) {
        const pickupAngle = Phaser.Math.Angle.Between(this.opponent.x, this.opponent.y, targetPickup.x, targetPickup.y);
        vx = Math.cos(pickupAngle) * cfg.topDownSpeed;
        vy = Math.sin(pickupAngle) * cfg.topDownSpeed;
      } else {
        const dist = Phaser.Math.Distance.Between(this.opponent.x, this.opponent.y, this.myPlayer.x, this.myPlayer.y);
        if (time > this.botNextStrafeTime) {
          this.botStrafeDir = Math.random() > 0.5 ? 1 : -1;
          this.botNextStrafeTime = time + Phaser.Math.Between(cfg.strafeMin, cfg.strafeMax);
        }

        if (dist > 330) {
          vx = Math.cos(aimAngle) * cfg.topDownSpeed;
          vy = Math.sin(aimAngle) * cfg.topDownSpeed;
        } else if (dist < 140) {
          vx = -Math.cos(aimAngle) * (cfg.topDownSpeed * 0.85);
          vy = -Math.sin(aimAngle) * (cfg.topDownSpeed * 0.85);
        } else {
          const perp = aimAngle + (Math.PI / 2) * this.botStrafeDir;
          vx = Math.cos(perp) * cfg.topDownStrafe;
          vy = Math.sin(perp) * cfg.topDownStrafe;
        }
      }
      this.opponent.setVelocity(vx, vy);

      if (time > this.botNextShootTime) {
        this.botNextShootTime = time + Phaser.Math.Between(cfg.shootDelayMin, cfg.shootDelayMax);
        this.p2Shoot();
      }
      return;
    }

    const dx = this.myPlayer.x - this.opponent.x;
    const dy = this.myPlayer.y - this.opponent.y;
    const platSpd = cfg.platSpeed;

    this.opponent.setFlipX(dx < 0);

    if (Math.abs(dx) > 380) {
      this.opponent.setVelocityX(dx > 0 ? platSpd : -platSpd);
    } else if (Math.abs(dx) < 160) {
      this.opponent.setVelocityX(dx > 0 ? -(platSpd * 0.75) : (platSpd * 0.75));
    } else {
      if (time > this.botNextStrafeTime) {
        this.botStrafeDir = Math.random() > 0.5 ? 1 : -1;
        this.botNextStrafeTime = time + Phaser.Math.Between(cfg.strafeMin, cfg.strafeMax);
      }
      this.opponent.setVelocityX(this.botStrafeDir * (platSpd * 0.75));
    }

    const botTouchingDown = this.opponent.body.touching.down;
    if (botTouchingDown) {
      if (this.opponent.body.blocked.left || this.opponent.body.blocked.right) {
        this.opponent.setVelocityY(JUMP_VEL);
      } else if (dy < -60 && Math.abs(dx) < 300) {
        this.opponent.setVelocityY(JUMP_VEL);
      } else if (time > this.botNextJumpTime) {
        this.botNextJumpTime = time + Phaser.Math.Between(cfg.platJumpMin, cfg.platJumpMax);
        if (Math.random() > 0.35) {
          this.opponent.setVelocityY(JUMP_VEL);
        }
      }
    }

    if (Math.abs(dx) < 700 && Math.abs(dy) < 360) {
      if (time > this.botNextShootTime) {
        this.botNextShootTime = time + Phaser.Math.Between(cfg.shootDelayMin, cfg.shootDelayMax);
        this.p2Shoot();
      }
    }

    // Bot AI triggers Special Power when 100% charged!
    if (this.p2Super >= 100 && Math.abs(dx) < 650 && Math.random() < cfg.superChance) {
      this.useP2Super();
    }

    let botAnim = 'idle';
    if (Date.now() - this.botLastHitAnimTime < 180) {
      botAnim = 'hit';
    } else if (Date.now() - this.lastP2ShootTime < 120) {
      botAnim = 'shoot';
    } else if (!botTouchingDown) {
      botAnim = 'jump';
    } else if (Math.abs(this.opponent.body.velocity.x) > 20) {
      botAnim = 'run';
    }

    if (this.opponent.anims && this.opponent.anims.currentAnim?.key !== `${this.opColor}-${botAnim}`) {
      this.opponent.play(`${this.opColor}-${botAnim}`, true);
    }
  }

  shoot() {
    if (!this.matchStarted || this.myHP <= 0 || this.isIntroWalking) return;
    if (Date.now() - this.lastShootTime < SHOOT_COOLDOWN) return;
    this.lastShootTime = Date.now();

    const bulletId = `p1-${this.bulletIdCounter++}`;

    if (this.isTopDown) {
      // Auto-Aim directly at Opponent (Player 2 / Bot) — exactly like Player 2
      const target = (this.opponent && this.opponent.active) ? this.opponent : null;
      const aimAngle = target
        ? Phaser.Math.Angle.Between(this.myPlayer.x, this.myPlayer.y, target.x, target.y)
        : (this.myPlayer.flipX ? (Math.PI + (this.myPlayer.rotation || 0)) : (this.myPlayer.rotation || 0));
      const bulletX = this.myPlayer.x + Math.cos(aimAngle) * 30;
      const bulletY = this.myPlayer.y + Math.sin(aimAngle) * 30;

      this.createBullet(this.myBullets, bulletX, bulletY, aimAngle, true, bulletId, true);

      const flash = this.add.image(bulletX, bulletY, 'muzzle-flash').setDepth(55).setRotation(aimAngle);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 0.5,
        duration: 100,
        onComplete: () => flash.destroy()
      });

      this.myPlayer.x -= Math.cos(aimAngle) * 2;
      this.myPlayer.y -= Math.sin(aimAngle) * 2;
      this.playShootSound();

      if (!this.isLocal2P && !this.isBotMatch && this.socket) {
        this.socket.emit('playerShoot', { x: bulletX, y: bulletY, angle: aimAngle, id: bulletId });
      }
      return;
    }

    const target = (this.opponent && this.opponent.active) ? this.opponent : null;
    let aimAngle;
    let direction;
    if (target) {
      aimAngle = Phaser.Math.Angle.Between(this.myPlayer.x, this.myPlayer.y, target.x, target.y);
      direction = (target.x >= this.myPlayer.x) ? 1 : -1;
      this.myPlayer.setFlipX(direction === -1);
    } else {
      direction = this.myPlayer.flipX ? -1 : 1;
      aimAngle = direction === -1 ? Math.PI : 0;
    }

    const bulletX = this.myPlayer.x + (direction * 25);
    const bulletY = this.myPlayer.y - 4;

    this.createBullet(this.myBullets, bulletX, bulletY, aimAngle, true, bulletId, true);
    if (this.myPlayer.anims) {
      this.myPlayer.play(`${this.myColor}-shoot`, true);
    }

    const flash = this.add.image(bulletX, bulletY, 'muzzle-flash').setDepth(55).setRotation(aimAngle);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 0.5,
      duration: 100,
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: this.myPlayer,
      x: this.myPlayer.x - direction * 3,
      duration: 50,
      yoyo: true
    });

    this.playShootSound();

    if (!this.isLocal2P && !this.isBotMatch && this.socket) {
      this.socket.emit('playerShoot', { x: bulletX, y: bulletY, angle: aimAngle, id: bulletId });
    }
  }

  p2Shoot() {
    if (!this.matchStarted || this.opponentHP <= 0 || this.isIntroWalking) return;
    if (Date.now() - this.lastP2ShootTime < SHOOT_COOLDOWN) return;
    this.lastP2ShootTime = Date.now();

    const bulletId = `p2-${this.bulletIdCounter++}`;

    if (this.isTopDown) {
      const aimAngle = Phaser.Math.Angle.Between(this.opponent.x, this.opponent.y, this.myPlayer.x, this.myPlayer.y);
      const bulletX = this.opponent.x + Math.cos(aimAngle) * 30;
      const bulletY = this.opponent.y + Math.sin(aimAngle) * 30;

      this.createBullet(this.opponentBullets, bulletX, bulletY, aimAngle, false, bulletId, true);

      const flash = this.add.image(bulletX, bulletY, 'muzzle-flash').setDepth(55).setRotation(aimAngle);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 0.5,
        duration: 100,
        onComplete: () => flash.destroy()
      });

      this.opponent.x -= Math.cos(aimAngle) * 2;
      this.opponent.y -= Math.sin(aimAngle) * 2;
      this.playShootSound();
      return;
    }

    const target = (this.myPlayer && this.myPlayer.active) ? this.myPlayer : null;
    let aimAngle;
    let direction;
    if (target) {
      aimAngle = Phaser.Math.Angle.Between(this.opponent.x, this.opponent.y, target.x, target.y);
      direction = (target.x >= this.opponent.x) ? 1 : -1;
      this.opponent.setFlipX(direction === -1);
    } else {
      direction = this.opponent.flipX ? -1 : 1;
      aimAngle = direction === -1 ? Math.PI : 0;
    }

    const bulletX = this.opponent.x + (direction * 25);
    const bulletY = this.opponent.y - 4;

    this.createBullet(this.opponentBullets, bulletX, bulletY, aimAngle, false, bulletId, true);
    if (this.opponent.anims) {
      this.opponent.play(`${this.opColor}-shoot`, true);
    }

    const flash = this.add.image(bulletX, bulletY, 'muzzle-flash').setDepth(55).setRotation(aimAngle);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 0.5,
      duration: 100,
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: this.opponent,
      x: this.opponent.x - direction * 3,
      duration: 50,
      yoyo: true
    });

    this.playShootSound();
  }

  createBullet(group, x, y, dirOrAngle, isMine, bulletId, isAngle = false) {
    const isKeshav = isMine ? (this.p1Def?.key === 'keshav') : (this.p2Def?.key === 'keshav');
    const textureKey = isKeshav ? 'bottle-bullet' : 'bullet';
    const bullet = group.create(x, y, textureKey);
    if (!bullet) return;

    bullet.setActive(true).setVisible(true);
    bullet.body.setAllowGravity(false);
    if (isKeshav) {
      bullet.setScale(1.35, 1.35);
      bullet.setData('isBottle', true);
      bullet.setAngularVelocity(720); // Spinning bottle!
    }

    if (isAngle) {
      bullet.setVelocity(Math.cos(dirOrAngle) * BULLET_SPEED, Math.sin(dirOrAngle) * BULLET_SPEED);
      bullet.setRotation(dirOrAngle);
    } else {
      bullet.setVelocityX(dirOrAngle * BULLET_SPEED);
      bullet.setFlipX(dirOrAngle === -1);
    }
    bullet.setDepth(50);
    if (bulletId) bullet.setData('id', bulletId);

    const bulletTint = isKeshav ? 0xf59e0b : (isMine ? 0x00e5ff : 0xff3366);
    if (!isKeshav) bullet.setTint(bulletTint);

    const trail = this.add.particles(0, 0, isKeshav ? 'amber-splash' : 'particle', {
      follow: bullet,
      scale: { start: isKeshav ? 0.6 : 0.7, end: 0 },
      alpha: { start: 0.8, end: 0 },
      speed: 10,
      lifespan: isKeshav ? 140 : 120,
      blendMode: isKeshav ? 'NORMAL' : 'ADD',
      tint: bulletTint
    });
    trail.setDepth(48);
    bullet.setData('trail', trail);

    this.time.delayedCall(2000, () => {
      if (bullet && bullet.active) this.destroyBullet(bullet);
    });
  }

  setupSounds() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playBeepSound(freq = 440, duration = 0.1) {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }

  playShootSound() {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx  = this.audioCtx;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  }

  playHitSound() {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx  = this.audioCtx;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
  }

  playEliminationSound() {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  }

  playSuperReadySound() {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        const t = ctx.currentTime + (idx * 0.08);
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch(e) {}
  }

  playSuperBeamSound() {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch(e) {}
  }

  playSuperExplosionSound() {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
  }

  playSuperElectricSound() {
    if (window.soundEnabled === false || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.08);
      osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  }

  bulletImpact(x, y) {
    this.impactEmitter.emitParticleAt(x, y, 10);
  }

  registerNetworkEvents() {
    this.socket.on('matchCountdown', (data) => {
      this.showCountdownVisual(data.count);
    });

    this.socket.on('matchStart', () => {
      this.showFightVisual();
      this.matchStarted = true;
    });

    this.socket.on('opponentMovement', (data) => {
      if (this.opponent && this.opponentHP > 0) {
        this.tweens.add({
          targets: this.opponent,
          x: data.x,
          y: data.y,
          duration: 50,
          ease: 'Linear'
        });
        this.opponent.setFlipX(data.flipX);
        if (data.anim && this.opponent.anims) {
          this.opponent.play(`${this.opColor}-${data.anim}`, true);
        }
      }
    });

    this.socket.on('opponentShoot', (data) => {
      this.createBullet(this.opponentBullets, data.x, data.y, data.direction, false);
      this.playShootSound();
      if (this.opponent && this.opponentHP > 0) {
        this.opponent.play(`${this.opColor}-shoot`, true);
      }
    });

    this.socket.on('playerDamaged', (data) => {
      const isMe = data.playerNumber === this.playerNumber;
      if (isMe) {
        this.myHP = data.health;
        this.updateHearts(this.playerNumber, data.health);
        this.damageFlash(this.myPlayer);
        this.cameras.main.shake(150, 0.015);
        this.lastDamageTime = Date.now();
        this.lastHitAnimTime = Date.now();

        this.playHitSound();
        this.playVoiceDip();
        this.showSpeechBubble(this.myPlayer, 'DIP Hit!');

        if (this.myHP <= 0) {
          this.myPlayer.play(`${this.myColor}-dead`);
          this.myPlayer.setVelocity(0, 0);
          this.playEliminationSound();
        }
      } else {
        this.opponentHP = data.health;
        this.updateHearts(data.playerNumber, data.health);
        this.damageFlash(this.opponent);

        this.playHitSound();
        this.playVoiceSanket();
        this.showSpeechBubble(this.opponent, 'Sanket Hit!');

        if (this.opponentHP <= 0) {
          this.opponent.play(`${this.opColor}-dead`);
          this.opponent.setVelocity(0, 0);
          this.playEliminationSound();
        }
      }
    });

    this.socket.on('timerUpdate', (data) => {
      const mins = Math.floor(data.timeLeft / 60);
      const secs = data.timeLeft % 60;
      this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
      if (data.timeLeft <= 10) {
        this.timerText.setColor('#ff1744');
      }
    });

    this.socket.on('matchEnd', (data) => {
      this.matchStarted = false;
      if (data.winner === this.playerNumber) {
        this.playBeepSound(880, 0.3);
      }
    });
  }

  updateHearts(playerNumber, health) {
    if (this.isTopDown) {
      const fillG = (playerNumber === 1) ? this.p1BarFill : this.p2BarFill;
      const textObj = (playerNumber === 1) ? this.p1BarText : this.p2BarText;
      const startX = (playerNumber === 1) ? 32 : (ARENA_W - 350 + 2);
      if (fillG) {
        fillG.clear();
        const pct = Math.max(0, health) / MAX_HP;
        const fillW = Math.max(0, 156 * pct);
        const col = health >= 60 ? 0x22c55e : (health >= 30 ? 0xf59e0b : 0xef4444);
        fillG.fillStyle(col, 1);
        fillG.fillRoundedRect(startX, 30, fillW, 10, 2);
      }
      if (textObj) {
        textObj.setText(`${Math.max(0, health)} / 100 HP`);
      }
      return;
    }

    const hearts = playerNumber === 1 ? this.p1Hearts : this.p2Hearts;
    if (hearts && hearts.length) {
      hearts.forEach((heart, i) => {
        heart.setTexture(i < health ? 'heart-full' : 'heart-empty');
      });
    }
  }

  damageFlash(sprite) {
    sprite.setTint(0xff2222);
    this.time.delayedCall(200, () => {
      if (sprite && sprite.active) sprite.clearTint();
    });
    this.tweens.add({
      targets: sprite,
      x: sprite.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3
    });
  }

  update(time, delta) {
    if (this.isPaused) return;
    if (!this.myPlayer || !this.myPlayer.active) return;

    // Golden Crown head-tracking with gentle floating bob
    const crownBob = Math.sin(time * 0.006) * 3;
    if (this.p1Crown && this.myPlayer && this.myPlayer.active) {
      this.p1Crown.x = this.myPlayer.x;
      this.p1Crown.y = this.myPlayer.y - (this.isTopDown ? 40 : 34) + crownBob;
      this.p1Crown.setVisible(this.myHP > 0);
    }
    if (this.p2Crown && this.opponent && this.opponent.active) {
      this.p2Crown.x = this.opponent.x;
      this.p2Crown.y = this.opponent.y - (this.isTopDown ? 40 : 34) + crownBob;
      this.p2Crown.setVisible(this.opponentHP > 0);
    }

    // Top-Down Brawl Stars Mode Visuals & Overheads
    if (this.isTopDown) {
      // 1. Ground selection rings follow feet
      if (this.p1Ring && this.myPlayer.active) {
        this.p1Ring.setPosition(this.myPlayer.x, this.myPlayer.y + 16);
        this.p1Ring.setVisible(this.myHP > 0);
      }
      if (this.p2Ring && this.opponent.active) {
        this.p2Ring.setPosition(this.opponent.x, this.opponent.y + 16);
        this.p2Ring.setVisible(this.opponentHP > 0);
      }
      if (this.botAura && this.opponent && this.opponent.active) {
        this.botAura.setPosition(this.opponent.x, this.opponent.y);
        this.botAura.setVisible(this.opponentHP > 0);
      }

      // 2. Overhead Brawl Stars Health HUDs
      if (this.p1HUD && this.myPlayer.active) {
        this.p1HUD.container.setPosition(this.myPlayer.x, this.myPlayer.y - 42);
        this.p1HUD.container.setVisible(this.myHP > 0);
        this.p1HUD.updateHUD(this.myHP);
      }
      if (this.p2HUD && this.opponent.active) {
        this.p2HUD.container.setPosition(this.opponent.x, this.opponent.y - 42);
        this.p2HUD.container.setVisible(this.opponentHP > 0);
        this.p2HUD.updateHUD(this.opponentHP);
      }

      // 3. Stealth Wheat Bushes Check (Brawl Stars stealth opacity mechanic)
      if (this.bushesGroup) {
        let p1InBush = false;
        let p2InBush = false;
        this.bushesGroup.getChildren().forEach(bush => {
          if (Phaser.Math.Distance.Between(this.myPlayer.x, this.myPlayer.y, bush.x, bush.y) < 38) {
            p1InBush = true;
          }
          if (this.opponent && Phaser.Math.Distance.Between(this.opponent.x, this.opponent.y, bush.x, bush.y) < 38) {
            p2InBush = true;
          }
        });
        this.myPlayer.setAlpha(p1InBush ? 0.55 : 1.0);
        if (this.opponent && this.opponent.active) {
          this.opponent.setAlpha(p2InBush ? 0.55 : 1.0);
        }
      }

      // 4. Player 1 Auto-Aim & 360-degree rotation directly towards Opponent (like Player 2)
      if (this.matchStarted && this.myHP > 0) {
        if (this.opponent && this.opponent.active) {
          const p1AimAngle = Phaser.Math.Angle.Between(this.myPlayer.x, this.myPlayer.y, this.opponent.x, this.opponent.y);
          this.setTopDownFacing(this.myPlayer, p1AimAngle);
        }
      }
    }

    // Drift clouds across daytime Brawl Stars arena
    if (this.clouds && this.clouds.length > 0) {
      this.clouds.forEach(c => {
        c.sprite.x += c.speed * (delta / 1000);
        if (c.sprite.x > ARENA_W + 50) {
          c.sprite.x = -c.w - 50;
        }
      });
    }

    // Update Sushruto Homing EMP Orbs
    if (this.homingOrbs && this.homingOrbs.length > 0) {
      this.homingOrbs = this.homingOrbs.filter(orb => {
        if (!orb.active || !orb.target || !orb.target.active) return false;
        const angle = Phaser.Math.Angle.Between(orb.x, orb.y, orb.target.x, orb.target.y);
        orb.setVelocity(Math.cos(angle) * 520, Math.sin(angle) * 520);
        return true;
      });
    }

    // Passive Super generation (+2% every 1.5 seconds)
    if (this.matchStarted && (this.myHP > 0 || this.opponentHP > 0)) {
      this.passiveSuperTimer = (this.passiveSuperTimer || 0) + delta;
      if (this.passiveSuperTimer >= 1500) {
        this.passiveSuperTimer = 0;
        this.chargeSuper(1, 2);
        this.chargeSuper(2, 2);
      }
    }

    if (this.isIntroWalking) return;

    if (this.isBotMatch && this.matchStarted) {
      this.updateBotAI(time, delta);
    }

    // AHIL: Drunken Swagger Sway & Continuous Cigarette Smoke
    if (this.matchStarted && this.myHP > 0 && this.p1Def.key === 'ahil' && this.myPlayer && this.myPlayer.active) {
      const drunkSway = Math.sin(time * 0.0055) * 0.14;
      if (this.isTopDown) {
        this.myPlayer.rotation += drunkSway * 0.35;
      } else {
        this.myPlayer.setRotation(drunkSway);
      }
      if (this.p1SmokeEmitter) {
        this.p1SmokeEmitter.followOffset.x = this.myPlayer.flipX ? -8 : 8;
      }
    }
    if (this.matchStarted && this.opponentHP > 0 && this.p2Def.key === 'ahil' && this.opponent && this.opponent.active) {
      const drunkSway2 = Math.sin(time * 0.0055 + 1.8) * 0.14;
      if (this.isTopDown) {
        this.opponent.rotation += drunkSway2 * 0.35;
      } else {
        this.opponent.setRotation(drunkSway2);
      }
      if (this.p2SmokeEmitter) {
        this.p2SmokeEmitter.followOffset.x = this.opponent.flipX ? -8 : 8;
      }
    }

    // KESHAV: Drunken Master Swagger Sway (Bottle in hand)
    if (this.matchStarted && this.myHP > 0 && this.p1Def.key === 'keshav' && this.myPlayer && this.myPlayer.active) {
      const drunkSway = Math.sin(time * 0.0058) * 0.16;
      if (this.isTopDown) {
        this.myPlayer.rotation += drunkSway * 0.38;
      } else {
        this.myPlayer.setRotation(drunkSway);
      }
    }
    if (this.matchStarted && this.opponentHP > 0 && this.p2Def.key === 'keshav' && this.opponent && this.opponent.active) {
      const drunkSway2 = Math.sin(time * 0.0058 + 2.1) * 0.16;
      if (this.isTopDown) {
        this.opponent.rotation += drunkSway2 * 0.38;
      } else {
        this.opponent.setRotation(drunkSway2);
      }
    }

    let p1MoveLeft  = false;
    let p1MoveRight = false;
    let p1MoveUp    = false;
    let p1MoveDown  = false;
    let p1Jump      = false;
    let p1Shoot     = false;

    if (window.mobileInput) {
      p1MoveLeft  = window.mobileInput.left;
      p1MoveRight = window.mobileInput.right;
      p1MoveUp    = window.mobileInput.up;
      p1MoveDown  = window.mobileInput.down;
      p1Jump      = window.mobileInput.jump;
      p1Shoot     = window.mobileInput.shoot;
    }

    if (this.isLocal2P) {
      p1MoveLeft  = p1MoveLeft  || this.wasd.left.isDown;
      p1MoveRight = p1MoveRight || this.wasd.right.isDown;
      p1MoveUp    = p1MoveUp    || this.wasd.up.isDown;
      p1MoveDown  = p1MoveDown  || this.wasd.down.isDown;
      p1Jump      = p1Jump      || this.wasd.up.isDown;
      p1Shoot     = p1Shoot     || Phaser.Input.Keyboard.JustDown(this.wasd.shoot) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
    } else {
      p1MoveLeft  = p1MoveLeft  || this.wasd.left.isDown || this.cursors.left.isDown;
      p1MoveRight = p1MoveRight || this.wasd.right.isDown || this.cursors.right.isDown;
      p1MoveUp    = p1MoveUp    || this.wasd.up.isDown || this.cursors.up.isDown;
      p1MoveDown  = p1MoveDown  || this.wasd.down.isDown || this.cursors.down.isDown;
      p1Jump      = p1Jump      || this.wasd.up.isDown || this.cursors.up.isDown;
      p1Shoot     = p1Shoot     || Phaser.Input.Keyboard.JustDown(this.wasd.shoot) || Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey);
    }

    if (window.mobileInput && window.mobileInput.shoot) {
      if (!this._mobileShootLast || (Date.now() - (this.lastShootTime || 0) >= SHOOT_COOLDOWN)) {
        p1Shoot = true;
      }
    }
    this._mobileShootLast = window.mobileInput ? window.mobileInput.shoot : false;

    // Player 1 Super Power Trigger
    const p1SuperKey = Phaser.Input.Keyboard.JustDown(this.keyE) || 
                       Phaser.Input.Keyboard.JustDown(this.keyQ) || 
                       this.p1SuperTriggered || 
                       (window.mobileInput && window.mobileInput.super);
    this.p1SuperTriggered = false;
    if (p1SuperKey && this.p1Super >= 100 && this.matchStarted && this.myHP > 0) {
      this.useP1Super();
      if (window.mobileInput) window.mobileInput.super = false;
    }

    // Dynamic Mobile Super Button glowing ready state
    if (window.mobileBtnSuper) {
      if (this.p1Super >= 100) {
        window.mobileBtnSuper.classList.add('ready');
      } else {
        window.mobileBtnSuper.classList.remove('ready');
      }
    }

    // Player 1 Movement handling
    if (this.matchStarted && this.myHP > 0) {
      if (this.isTopDown) {
        // 360-Degree Virtual Analog Joystick or 8-Directional Keyboard Movement
        let vx = 0;
        let vy = 0;
        const hasAnalog = window.mobileInput && (Math.abs(window.mobileInput.analogX) > 0.05 || Math.abs(window.mobileInput.analogY) > 0.05);

        if (hasAnalog) {
          vx = window.mobileInput.analogX;
          vy = window.mobileInput.analogY;
          const mag = Math.hypot(vx, vy);
          if (mag > 1) {
            vx /= mag;
            vy /= mag;
          }
        } else {
          if (p1MoveLeft)  vx -= 1;
          if (p1MoveRight) vx += 1;
          if (p1MoveUp)    vy -= 1;
          if (p1MoveDown)  vy += 1;

          if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
          }
        }
        this.myPlayer.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);

        if (p1Shoot) {
          this.shoot();
        }
      } else {
        // Classic Platformer Side-Scroll Movement (Analog + Directional)
        const hasAnalogX = window.mobileInput && Math.abs(window.mobileInput.analogX) > 0.1;
        if (hasAnalogX) {
          const ax = window.mobileInput.analogX;
          this.myPlayer.setVelocityX(ax * PLAYER_SPEED);
          this.myPlayer.setFlipX(ax < 0);
        } else if (p1MoveLeft) {
          this.myPlayer.setVelocityX(-PLAYER_SPEED);
          this.myPlayer.setFlipX(true);
        } else if (p1MoveRight) {
          this.myPlayer.setVelocityX(PLAYER_SPEED);
          this.myPlayer.setFlipX(false);
        } else {
          this.myPlayer.setVelocityX(0);
        }

        if (p1Jump && this.myPlayer.body.touching.down) {
          this.myPlayer.setVelocityY(JUMP_VEL);
        }

        if (p1Shoot) {
          this.shoot();
        }
      }
    } else if (this.myHP <= 0) {
      this.myPlayer.setVelocity(0, 0);
    }

    // Platformer Character Animations (only in side-scroll mode)
    if (!this.isTopDown && this.myHP > 0) {
      let animState = 'idle';
      if (Date.now() - this.lastHitAnimTime < 180) {
        animState = 'hit';
      } else if (Date.now() - this.lastShootTime < 120) {
        animState = 'shoot';
      } else if (!this.myPlayer.body.touching.down) {
        animState = 'jump';
      } else if (Math.abs(this.myPlayer.body.velocity.x) > 20) {
        animState = 'run';
      }

      if (this.myPlayer.anims && this.myPlayer.anims.currentAnim?.key !== `${this.myColor}-${animState}`) {
        this.myPlayer.play(`${this.myColor}-${animState}`, true);
      }
    }

    // Local 2P controls for Player 2
    if (this.isLocal2P && this.opponent && this.opponent.active) {
      if (this.matchStarted && this.opponentHP > 0) {
        let p2MoveLeft  = this.cursors.left.isDown;
        let p2MoveRight = this.cursors.right.isDown;
        let p2MoveUp    = this.cursors.up.isDown;
        let p2MoveDown  = this.cursors.down.isDown;
        let p2Jump      = this.cursors.up.isDown;
        let p2Shoot     = Phaser.Input.Keyboard.JustDown(this.keyZero) || 
                          Phaser.Input.Keyboard.JustDown(this.keyNumZero) || 
                          Phaser.Input.Keyboard.JustDown(this.keyPlus) || 
                          Phaser.Input.Keyboard.JustDown(this.keyNumAdd) || 
                          Phaser.Input.Keyboard.JustDown(this.keyEqual) || 
                          Phaser.Input.Keyboard.JustDown(this.enterKey) ||
                          this.p2ShootTriggered;
        this.p2ShootTriggered = false;

        // Player 2 Super Power Trigger (Local 2P)
        const p2SuperKey = Phaser.Input.Keyboard.JustDown(this.keyPeriod) || 
                           Phaser.Input.Keyboard.JustDown(this.keyM) || 
                           this.p2SuperTriggered;
        this.p2SuperTriggered = false;
        if (p2SuperKey && this.p2Super >= 100 && this.matchStarted && this.opponentHP > 0) {
          this.useP2Super();
        }

        if (this.isTopDown) {
          // 8-Directional Top-Down Movement for Player 2
          let p2vx = 0;
          let p2vy = 0;
          if (p2MoveLeft)  p2vx -= 1;
          if (p2MoveRight) p2vx += 1;
          if (p2MoveUp)    p2vy -= 1;
          if (p2MoveDown)  p2vy += 1;

          if (p2vx !== 0 && p2vy !== 0) {
            p2vx *= 0.7071;
            p2vy *= 0.7071;
          }
          this.opponent.setVelocity(p2vx * PLAYER_SPEED, p2vy * PLAYER_SPEED);

          // P2 faces towards P1 in Top-Down mode
          const p2AimAngle = Phaser.Math.Angle.Between(this.opponent.x, this.opponent.y, this.myPlayer.x, this.myPlayer.y);
          this.setTopDownFacing(this.opponent, p2AimAngle);

          if (p2Shoot) {
            this.p2Shoot();
          }
        } else {
          // Classic Platformer Side-Scroll Movement for Player 2
          if (p2MoveLeft) {
            this.opponent.setVelocityX(-PLAYER_SPEED);
            this.opponent.setFlipX(true);
          } else if (p2MoveRight) {
            this.opponent.setVelocityX(PLAYER_SPEED);
            this.opponent.setFlipX(false);
          } else {
            this.opponent.setVelocityX(0);
          }

          if (p2Jump && this.opponent.body.touching.down) {
            this.opponent.setVelocityY(JUMP_VEL);
          }

          if (p2Shoot) {
            this.p2Shoot();
          }

          let p2Anim = 'idle';
          if (Date.now() - this.lastP2HitAnimTime < 180) {
            p2Anim = 'hit';
          } else if (Date.now() - this.lastP2ShootTime < 120) {
            p2Anim = 'shoot';
          } else if (!this.opponent.body.touching.down) {
            p2Anim = 'jump';
          } else if (Math.abs(this.opponent.body.velocity.x) > 20) {
            p2Anim = 'run';
          }

          if (this.opponent.anims && this.opponent.anims.currentAnim?.key !== `${this.opColor}-${p2Anim}`) {
            this.opponent.play(`${this.opColor}-${p2Anim}`, true);
          }
        }
      } else if (this.opponentHP <= 0) {
        this.opponent.setVelocity(0, 0);
      }
    }

    // Network Sync
    if (!this.isLocal2P && !this.isBotMatch && this.socket) {
      this.networkSendTimer += delta;
      if (this.networkSendTimer >= 50 && this.matchStarted) {
        this.networkSendTimer = 0;
        this.socket.emit('playerMovement', {
          x: this.myPlayer.x,
          y: this.myPlayer.y,
          velX: this.myPlayer.body.velocity.x,
          velY: this.myPlayer.body.velocity.y,
          flipX: this.myPlayer.flipX,
          anim: this.myPlayer.anims.currentAnim ? this.myPlayer.anims.currentAnim.key.replace(`${this.myColor}-`, '') : 'idle'
        });
      }
    }

    // Bullets cleanup
    [this.myBullets, this.opponentBullets].forEach(group => {
      group.getChildren().forEach(bullet => {
        if (
          bullet.active &&
          (bullet.x < -50 || bullet.x > ARENA_W + 50 ||
           bullet.y < -50 || bullet.y > ARENA_H + 50)
        ) {
          this.destroyBullet(bullet);
        }
      });
    });
  }

  shutdown() {
    window.currentScene = null;
    const inGameHud = document.getElementById('in-game-hud');
    if (inGameHud) inGameHud.style.display = 'none';
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';

    if (this.localTimerEvent) {
      this.localTimerEvent.remove();
      this.localTimerEvent = null;
    }

    if (this.socket) {
      this.socket.off('matchCountdown');
      this.socket.off('matchStart');
      this.socket.off('opponentMovement');
      this.socket.off('opponentShoot');
      this.socket.off('playerDamaged');
      this.socket.off('timerUpdate');
      this.socket.off('matchEnd');
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
    }
  }
}

// ============================================================
// GLOBAL START / DESTROY / PAUSE CONTROLS
// ============================================================

window.pauseGame = function () {
  if (window.currentScene && typeof window.currentScene.pauseMatch === 'function') {
    window.currentScene.pauseMatch();
  }
};

window.resumeGame = function () {
  if (window.currentScene && typeof window.currentScene.resumeMatch === 'function') {
    window.currentScene.resumeMatch();
  }
};

window.togglePauseGame = function () {
  if (window.currentScene && typeof window.currentScene.togglePause === 'function') {
    window.currentScene.togglePause();
  }
};

let phaserGame = null;

window.startGame = function () {
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
  }

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: ARENA_W,
    height: ARENA_H,
    backgroundColor: '#0a0a1a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, GameScene],
    input: {
      activePointers: 3
    }
  };

  phaserGame = new Phaser.Game(config);
};

window.destroyGame = function () {
  window.currentScene = null;
  const inGameHud = document.getElementById('in-game-hud');
  if (inGameHud) inGameHud.style.display = 'none';
  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) pauseModal.style.display = 'none';

  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
  }
};
