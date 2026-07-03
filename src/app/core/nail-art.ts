// Miracle Nail Art AI — İstemci tarafı tırnak görseli çizici (harici görsel gerektirmez).
// Tasarımın renk + desen etiketlerinden 5 tırnaklı zengin bir önizleme üretir (data URL).
// Desenler: french, ombre, marble, galaxy, chrome, line, glossy, matte.

const COLOR: Record<string, string> = {
  gold: '#d4af37', red: '#d24b4b', pink: '#e6a4c4', rose: '#d98cae', blue: '#4b78d2',
  black: '#20202a', white: '#f3ecdd', chrome: '#cdd6e0', silver: '#c6c9d2', green: '#3ecf8e',
  emerald: '#1f8f63', nude: '#dcc3a6', cream: '#efe3cc', pearl: '#f1e7d4', purple: '#8a5bd0',
  galaxy: '#3a2b6b', dark: '#2a2333', warm: '#caa15a', metallic: '#bcae86', ice: '#dfeaf2',
  pastel: '#e8c9e0', bold: '#c0392b', glitter: '#c39be0', deep: '#3a2b4a', navy: '#26407a',
  bronze: '#b0824a', copper: '#b87333', amber: '#d99a3a', wine: '#6e2233', burgundy: '#7a1f2e',
  lavender: '#c9b6e6', coral: '#f08a6a', mint: '#a7e6c8', turquoise: '#3fbfb5', light: '#eadfce',
};

function hex(c: string): string {
  return COLOR[c?.toLowerCase()] ?? '#cbb489';
}

/** Renk etiketini (ör. "gold") #hex'e çevirir. */
export function colorToHex(tag: string): string {
  return hex(tag);
}

function pickFinish(colors: string[], pattern: string): 'chrome' | 'matte' | 'glossy' {
  if (pattern === 'chrome' || colors.some((c) => ['chrome', 'metallic', 'silver', 'mirror'].includes(c))) return 'chrome';
  if (colors.includes('matte')) return 'matte';
  return 'glossy';
}

/** Bir tırnak plakasının yolunu çizer (fill/clip için tekrar kullanılır). */
function nailPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.quadraticCurveTo(x + w / 2, y + h + h * 0.06, x, y + h);
  ctx.closePath();
}

function drawNail(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  a: string, b: string, finish: string, pattern: string, glitter: boolean,
): void {
  const r = w / 2;

  // Taban gradyanı (ombre burada oluşur)
  nailPath(ctx, x, y, w, h);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = w * 0.18;
  ctx.shadowOffsetY = h * 0.03;
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Desenler (tırnak şekline kırpılmış)
  ctx.save();
  nailPath(ctx, x, y, w, h);
  ctx.clip();

  if (pattern === 'french') {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.ellipse(x + r, y + h * 0.15, r * 1.1, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (pattern === 'marble') {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = w * 0.05;
    for (let i = 0; i < 3; i++) {
      const oy = y + h * (0.25 + 0.22 * i);
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.bezierCurveTo(x + w * 0.3, oy - h * 0.08, x + w * 0.6, oy + h * 0.1, x + w, oy - h * 0.03);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = w * 0.03;
    for (let i = 0; i < 2; i++) {
      const oy = y + h * (0.4 + 0.25 * i);
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.bezierCurveTo(x + w * 0.4, oy + h * 0.08, x + w * 0.7, oy - h * 0.1, x + w, oy + h * 0.04);
      ctx.stroke();
    }
  } else if (pattern === 'galaxy') {
    const neb = ctx.createRadialGradient(x + w * 0.6, y + h * 0.4, w * 0.05, x + w * 0.6, y + h * 0.4, w * 0.9);
    neb.addColorStop(0, 'rgba(150,95,225,0.55)');
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 22; i++) {
      const sx = x + ((i * 37) % 100) / 100 * w;
      const sy = y + ((i * 61) % 100) / 100 * h;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.5, w * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'line') {
    ctx.strokeStyle = 'rgba(212,175,55,0.95)';
    ctx.lineWidth = w * 0.06;
    ctx.beginPath();
    ctx.moveTo(x + r, y + h * 0.12);
    ctx.lineTo(x + r, y + h * 0.95);
    ctx.stroke();
  } else if (pattern === 'chrome') {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.1 + i * 0.06})`;
      ctx.beginPath();
      ctx.moveTo(x + w * (0.05 + 0.3 * i), y);
      ctx.lineTo(x + w * (0.22 + 0.3 * i), y);
      ctx.lineTo(x + w * (0.05 + 0.3 * i), y + h);
      ctx.lineTo(x - w * 0.12 + w * 0.3 * i, y + h);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (glitter) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 16; i++) {
      const gx = x + ((i * 7) % 10) / 10 * w;
      const gy = y + ((i * 13) % 10) / 10 * h;
      ctx.beginPath();
      ctx.arc(gx, gy, Math.max(0.6, w * 0.014), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Parlaklık (finiş)
  if (finish !== 'matte') {
    ctx.fillStyle = `rgba(255,255,255,${finish === 'chrome' ? 0.45 : 0.24})`;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.36, y + h * 0.36, w * 0.13, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Tasarım renk + deseninden 5 tırnaklı bir önizleme çizer, PNG data URL döndürür. */
export function renderNailThumb(colors: string[], pattern = 'glossy', w = 300, h = 380): string {
  try {
    if (typeof document === 'undefined') return '';
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return '';

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#241a2e');
    bg.addColorStop(1, '#140f1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const a = hex(colors[0] ?? 'nude');
    const b = hex(colors[1] ?? colors[0] ?? 'nude');
    const finish = pickFinish(colors, pattern);
    const glitter = pattern === 'galaxy' || colors.some((x) => ['glitter', 'bold', 'pearl'].includes(x));

    const factors = [0.5, 0.62, 0.68, 0.62, 0.5];
    const nailW = w * 0.135;
    const gap = w * 0.05;
    const total = 5 * nailW + 4 * gap;
    let x = (w - total) / 2;
    for (let i = 0; i < 5; i++) {
      const nh = factors[i] * h;
      drawNail(ctx, x, h - nh - h * 0.09, nailW, nh, a, b, finish, pattern, glitter);
      x += nailW + gap;
    }
    return c.toDataURL('image/png');
  } catch (e) {
    console.warn('[NailArt] çizim hatası:', e);
    return '';
  }
}
