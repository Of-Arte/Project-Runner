import { PlayerState } from '../types';

export const COLORS = {
  NEON_CYAN: '#00F0FF',
  NEON_PURPLE: '#BD0AFF',
  NEON_YELLOW: '#FACC15',
  NEON_RED: '#F87171',
  NEON_GREEN: '#4ADE80',
  DARK_BG: '#050505',
};

// Helper for glowing lines
const drawGlowingLine = (
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  width: number,
  glow: number
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
};

export const drawPlayer = (
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  animTime: number,
  isPortrait: boolean,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  ctx.save();
  
  // Animation calculations
  const runCycle = Math.sin(animTime * 15);
  const runCycle2 = Math.cos(animTime * 15);
  
  const headColor = COLORS.NEON_CYAN;
  const bodyColor = '#FFFFFF';
  const jointColor = COLORS.NEON_PURPLE;

  // Position adjustments based on state
  const isDucking = player.isDucking;
  const isJumping = !player.isGrounded;
  
  // Center of mass
  const cx = x + width / 2;
  const cy = y + height / 3;

  // Head
  ctx.fillStyle = headColor;
  ctx.shadowBlur = 15;
  ctx.shadowColor = headColor;
  ctx.beginPath();
  // Visor shape
  if (isPortrait) {
      // Top-down view head
       ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  } else {
      // Side view head
      ctx.ellipse(cx + 5, cy - 15 + (isDucking ? 10 : 0), 8, 6, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // If Portrait (Top-down), draw specific top-down assets
  if (isPortrait) {
     // Draw shoulders
     drawGlowingLine(ctx, cx - 15, cy, cx + 15, cy, bodyColor, 4, 10);
     // Draw running arms
     drawGlowingLine(ctx, cx - 15, cy, cx - 20, cy + 20 + runCycle * 10, jointColor, 3, 5);
     drawGlowingLine(ctx, cx + 15, cy, cx + 20, cy + 20 - runCycle * 10, jointColor, 3, 5);
     
     // Scarf/Trail
     const trailLen = 40;
     ctx.strokeStyle = COLORS.NEON_CYAN;
     ctx.lineWidth = 2;
     ctx.globalAlpha = 0.6;
     ctx.beginPath();
     ctx.moveTo(cx, cy);
     ctx.quadraticCurveTo(
         cx + Math.sin(animTime * 10) * 10, 
         cy + trailLen / 2, 
         cx + Math.sin(animTime * 8) * 20, 
         cy + trailLen
     );
     ctx.stroke();
  } else {
    // Landscape (Side scrolling) - Stick runner
    const bodyTopY = cy - 5 + (isDucking ? 10 : 0);
    const bodyBottomY = cy + 15;
    
    // Scarf
    ctx.save();
    ctx.strokeStyle = COLORS.NEON_CYAN;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.NEON_CYAN;
    ctx.beginPath();
    ctx.moveTo(cx, bodyTopY - 5);
    // Flowing scarf segments
    for(let i=1; i<=5; i++) {
        ctx.lineTo(
            cx - i * 10 - Math.abs(x * 0.05), // Trail behind
            bodyTopY - 5 + Math.sin(animTime * 10 + i) * 5 + i * 2
        );
    }
    ctx.stroke();
    ctx.restore();

    // Body
    drawGlowingLine(ctx, cx, bodyTopY, cx + (isDucking ? 10 : 0), bodyBottomY, bodyColor, 4, 10);

    // Arms
    const armY = bodyTopY + 5;
    const armX = cx;
    if (isDucking) {
         // Arms back for aerodynamics
         drawGlowingLine(ctx, armX, armY, armX - 15, armY - 5, jointColor, 3, 5);
    } else {
        // Swing
        drawGlowingLine(ctx, armX, armY, armX + runCycle * 15, armY + 10, jointColor, 3, 5);
        drawGlowingLine(ctx, armX, armY, armX - runCycle * 15, armY + 10, jointColor, 3, 5);
    }

    // Legs
    const legY = bodyBottomY;
    if (isJumping) {
        // Jump pose
        drawGlowingLine(ctx, cx, legY, cx + 10, legY + 15, jointColor, 3, 5); // Front leg bent
        drawGlowingLine(ctx, cx, legY, cx - 5, legY + 15, jointColor, 3, 5); // Back leg straightish
    } else if (isDucking) {
        // Slide pose
        drawGlowingLine(ctx, cx, legY, cx + 25, legY + 5, jointColor, 3, 5); // Legs forward
    } else {
        // Run cycle
        // Leg 1
        const l1x = cx + Math.sin(animTime * 15) * 15;
        const l1y = legY + 20 + Math.cos(animTime * 15) * 5;
        drawGlowingLine(ctx, cx, legY, l1x, l1y, jointColor, 3, 5);
        
        // Leg 2
        const l2x = cx - Math.sin(animTime * 15) * 15;
        const l2y = legY + 20 - Math.cos(animTime * 15) * 5;
        drawGlowingLine(ctx, cx, legY, l2x, l2y, jointColor, 3, 5);
    }
  }

  ctx.restore();
};

export const drawDrone = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number,
  animTime: number,
  warn: boolean
) => {
  // Cyber-Security Sight (Eye)
  ctx.save();
  const cx = x + width / 2;
  const cy = y + height / 2 + Math.sin(animTime * 5) * 5; 
  const rad = Math.min(width, height) / 2.5;

  // Outer Shell (Rotating segments)
  ctx.translate(cx, cy);
  ctx.rotate(animTime * 2);
  ctx.strokeStyle = warn ? COLORS.NEON_RED : COLORS.NEON_CYAN;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const segments = 3;
  for (let i = 0; i < segments; i++) {
    const start = (i * Math.PI * 2) / segments;
    const end = start + (Math.PI / segments); 
    ctx.arc(0, 0, rad * 1.3, start, end);
  }
  ctx.stroke();
  
  // Reset rotation for core
  ctx.rotate(-animTime * 2);

  // Core (The Eye)
  ctx.fillStyle = '#111';
  ctx.shadowBlur = 15;
  ctx.shadowColor = warn ? COLORS.NEON_RED : COLORS.NEON_CYAN;
  ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fill();

  // Lens (Glowing Center)
  ctx.fillStyle = warn ? COLORS.NEON_RED : COLORS.NEON_CYAN;
  ctx.beginPath(); ctx.arc(0, 0, rad * 0.4, 0, Math.PI * 2); ctx.fill();

  // Scanning Beam
  ctx.rotate(animTime * 3);
  ctx.fillStyle = warn ? 'rgba(248, 113, 113, 0.2)' : 'rgba(34, 211, 238, 0.2)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, rad * 3, -0.3, 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  }



export const drawServer = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number,
  animTime: number
) => {
  ctx.save();
  // Main Rack
  ctx.fillStyle = '#1a1a1a';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  // Blinking LEDs
  const rows = 4;
  const cols = 3;
  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.7) continue; // Randomly skip some
      const blink = Math.sin(animTime * 10 + r * c) > 0;
      ctx.fillStyle = blink ? COLORS.NEON_GREEN : '#003300';
      ctx.shadowBlur = blink ? 5 : 0;
      ctx.shadowColor = COLORS.NEON_GREEN;
      
      const lx = x + c * cellW + 4;
      const ly = y + r * cellH + 4;
      ctx.fillRect(lx, ly, cellW - 8, 4);
    }
  }

  // Metallic rim
  const grad = ctx.createLinearGradient(x, y, x + width, y);
  grad.addColorStop(0, '#333');
  grad.addColorStop(0.5, '#777');
  grad.addColorStop(1, '#333');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.restore();
};
