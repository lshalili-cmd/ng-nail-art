// Miracle Nail Art AI — İstemci tarafı tırnak görseli çizici (harici görsel gerektirmez).
// Tasarımın renk/finiş etiketlerinden 5 tırnaklı bir önizleme üretir (data URL).

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

function pickFinish(colors: string[]): 'chrome' | 'matte' | 'glossy' {
  if (colors.some((c) => ['chrome', 'metallic', 'silver', 'mirror'].includes(c))) return 'chrome';
  if (colors.includes('matte')) return 'matte';
  return 'glossy';
}

function drawNail(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  a: string, b: string, finish: string, glitter: boolean,
): void {
  const r = w / 2;
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.quadraticCurveTo(x + w / 2, y + h + h * 0.06, x, y + h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = w * 0.18;
  ctx.shadowOffsetY = h * 0.03;
  ctx.fill();
  ctx.restore();

  // Parlaklık
  if (finish !== 'matte') {
    ctx.fillStyle = `rgba(255,255,255,${finish === 'chrome' ? 0.55 : 0.26})`;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.36, y + h * 0.38, w * 0.14, h * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Simli noktalar
  if (glitter) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 14; i++) {
      const gx = x + (0.15 + 0.7 * ((i * 7) % 10) / 10) * w;
      const gy = y + (0.15 + 0.75 * ((i * 13) % 10) / 10) * h;
      ctx.beginPath();
      ctx.arc(gx, gy, Math.max(0.6, w * 0.015), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Tasarım renklerinden 5 tırnaklı bir önizleme çizer, PNG data URL döndürür. */
export function renderNailThumb(colors: string[], w = 300, h = 380): string {
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
    const finish = pickFinish(colors);
    const glitter = colors.some((x) => ['glitter', 'galaxy', 'bold', 'pearl'].includes(x));

    const factors = [0.5, 0.62, 0.68, 0.62, 0.5];
    const nailW = w * 0.135;
    const gap = w * 0.05;
    const total = 5 * nailW + 4 * gap;
    let x = (w - total) / 2;
    for (let i = 0; i < 5; i++) {
      const nh = factors[i] * h;
      drawNail(ctx, x, h - nh - h * 0.09, nailW, nh, a, b, finish, glitter);
      x += nailW + gap;
    }
    return c.toDataURL('image/png');
  } catch {
    return '';
  }
}
