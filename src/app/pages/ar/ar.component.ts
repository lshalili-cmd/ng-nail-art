import {
  ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild, OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { I18nService } from '../../core/i18n.service';
import { HandAnalysisService } from '../../core/hand-analysis.service';
import { downloadImage, shareImage } from '../../core/share';
import { TryonStore } from '../../core/tryon-store';


@Component({
  selector: 'app-ar',
  standalone: true,
  imports: [HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <div class="section-head"><h2 class="section-title">💅 {{ i18n.t('ar_title') }}</h2></div>

      @if (error(); as e) { <div class="banner err">⚠️ {{ e }}</div> }

      <div class="stage">
        <div class="mirror">
          <video #video class="media" playsinline muted></video>
          <canvas #overlay class="media overlay"></canvas>
        </div>
        @if (!running() && !photo() && !starting()) {
          <div class="hint"><span class="ic">💅</span><p>{{ i18n.t('ar_hint') }}</p></div>
        }
        @if (starting()) {
          <div class="hint"><span class="ic spin">⏳</span><p>{{ i18n.t('ar_starting') }}</p></div>
        }
        @if (photo(); as p) { <img class="shot" [src]="p" alt="AR" /> }
      </div>

      <!-- Kontroller -->
      <div class="actions">
        @if (photo(); as p) {
          <button class="btn-primary" (click)="download(p)">💾 {{ i18n.t('download') }}</button>
          <button class="btn-ghost" (click)="share(p)">📤 {{ i18n.t('share') }}</button>
          <button class="btn-ghost" (click)="photo.set(null)">🔄 {{ i18n.t('rescan') }}</button>
        } @else if (!running()) {
          <button class="btn-primary" (click)="start()" [disabled]="starting()">📸 {{ i18n.t('ar_title') }}</button>
        } @else {
          <button class="btn-primary" (click)="capture()">📷 {{ i18n.t('ar_capture') }}</button>
          <button class="btn-ghost" (click)="stop()">✕ {{ i18n.t('ar_close') }}</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .stage { position: relative; border-radius: 22px; overflow: hidden; background: #000;
      border: 1px solid var(--line); margin-top: 6px; min-height: 300px; }
    .mirror { position: relative; }
    .media { width: 100%; display: block; }
    video.media { max-height: 64vh; object-fit: contain; background: #000; }
    canvas.overlay { position: absolute; inset: 0; width: 100%; height: 100%; }
    .hint { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; color: var(--muted); }
    .hint .ic { font-size: 60px; opacity: 0.85; }
    .spin { animation: arspin 1.1s linear infinite; display: inline-block; }
    @keyframes arspin { to { transform: rotate(360deg); } }
    .shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
    .banner { margin: 12px 0; padding: 12px 14px; border-radius: 12px; font-size: 13px; }
    .banner.err { background: rgba(178,58,58,0.14); border: 1px solid rgba(178,58,58,0.4); color: #f0b8b8; }
    .lbl { margin: 16px 0 8px; font-size: 13px; font-weight: 600; color: var(--muted); }
    .swatches { display: flex; gap: 10px; flex-wrap: wrap; }
    .sw { width: 34px; height: 34px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); }
    .sw.on { border-color: var(--gold); transform: scale(1.12); }
    .actions { display: flex; gap: 12px; margin-top: 18px; }
    .actions > * { flex: 1; }
  `],
})
export class ArComponent implements OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly hands = inject(HandAnalysisService);
  private readonly route = inject(ActivatedRoute);
  private readonly tryon = inject(TryonStore);

  /** Üretilen tasarım görseli — tırnağa canlı bindirmek için. */
  private designImg: HTMLImageElement | null = null;
  readonly hasDesign = signal<boolean>(false);

  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private readonly overlay = viewChild.required<ElementRef<HTMLCanvasElement>>('overlay');

  readonly running = signal(false);
  readonly starting = signal(false);
  readonly error = signal<string | null>(null);
  readonly photo = signal<string | null>(null);
  readonly color = signal<string>('#d4af37');
  readonly pattern = signal<string>('glossy');

  constructor() {
    // "Dene" ile bir tasarımdan gelindiyse rengini/desenini uygula
    const qp = this.route.snapshot.queryParamMap;
    const c = qp.get('color');
    if (c) this.color.set(c);
    const p = qp.get('pattern');
    if (p) this.pattern.set(p);
    // GERÇEK üretilen tasarımı (üstten çekim tek tırnak, elsiz) canlı tırnağa bindir.
    const t = this.tryon.current();
    if (t) {
      if (t.color) this.color.set(t.color);
      if (t.pattern) this.pattern.set(t.pattern);
      if (t.imageUrl) this.loadDesignImage(t.imageUrl);   // yüklenene kadar renkle boyar (fallback)
    }
  }

  /** Tasarım görselini yükler. crossOrigin KOYMUYORUZ: canlı çizim her URL'de
   *  (data: veya çapraz-köken) çalışsın diye. (Fotoğraf çekimi capture()'da korunuyor.) */
  private loadDesignImage(url: string): void {
    const img = new Image();
    img.onload = () => { this.designImg = img; this.hasDesign.set(true); };
    img.onerror = () => { this.designImg = null; this.hasDesign.set(false); };
    img.src = url;
  }

  private stream: MediaStream | null = null;
  private raf = 0;
  private smooth: { x: number; y: number }[] | null = null; // yumuşatılmış son el
  private miss = 0; // el bulunamayan ardışık kare sayısı

  async start(): Promise<void> {
    this.error.set(null);
    this.photo.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set(this.i18n.t('err_camera'));
      return;
    }
    this.starting.set(true);
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        // Arka kamerayı tercih et (tırnağa bakmak için); arka yoksa otomatik öne düşer.
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 720 }, height: { ideal: 960 } }, audio: false,
      });
      const v = this.video().nativeElement;
      v.srcObject = this.stream;
      await v.play();
    } catch (e) {
      console.error('[AR] Kamera hatası:', e);
      this.error.set(this.i18n.t('err_camera'));
      this.starting.set(false);
      return;
    }
    try {
      await this.hands.initVideo();
    } catch (e) {
      console.error('[AR] MediaPipe yüklenemedi:', e);
      this.error.set(this.i18n.t('err_model'));
      this.starting.set(false);
      this.stopStream();
      return;
    }
    this.starting.set(false);
    this.running.set(true);
    this.loop();
  }

  private loop = (): void => {
    if (!this.running()) return;
    const v = this.video().nativeElement;
    const c = this.overlay().nativeElement;
    if (v.videoWidth > 0) {
      if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, c.width, c.height);
        const hands = this.hands.detectVideo(v, performance.now());
        const draw = this.stabilize(hands);
        if (draw) this.drawNails(ctx, [draw], c.width, c.height, this.color(), this.pattern());
      }
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  /** Kareler arası yumuşatma (EMA) + kısa süreli koruma → titremeyi azaltır. */
  private stabilize(hands: { x: number; y: number }[][]): { x: number; y: number }[] | null {
    const raw = hands.length && hands[0].length >= 21 ? hands[0] : null;
    if (raw) {
      const a = 0.28; // düşük = daha sabit, yüksek = daha hızlı tepki
      if (this.smooth && this.smooth.length === raw.length) {
        const prev = this.smooth;
        this.smooth = raw.map((p, i) => ({ x: a * p.x + (1 - a) * prev[i].x, y: a * p.y + (1 - a) * prev[i].y }));
      } else {
        this.smooth = raw.map((p) => ({ x: p.x, y: p.y }));
      }
      this.miss = 0;
      return this.smooth;
    }
    if (this.smooth && this.miss < 8) {
      this.miss++;
      return this.smooth;
    }
    this.smooth = null;
    return null;
  }

  private drawNails(ctx: CanvasRenderingContext2D, hands: { x: number; y: number }[][], w: number, h: number, color: string, pattern: string): void {
    const tips = [4, 8, 12, 16, 20];
    const lows = [3, 7, 11, 15, 19];
    const matte = pattern === 'matte';
    const glitter = pattern === 'glitter' || pattern === 'galaxy';
    for (const lm of hands) {
      if (!lm || lm.length < 21) continue;
      for (let i = 0; i < 5; i++) {
        const t = lm[tips[i]], l = lm[lows[i]];
        const tx = t.x * w, ty = t.y * h, lx = l.x * w, ly = l.y * h;
        const dx = tx - lx, dy = ty - ly;
        const ang = Math.atan2(dy, dx);
        const len = Math.hypot(dx, dy);
        const nl = len * 1.05, nw = len * 0.66;
        const ux = Math.cos(ang), uy = Math.sin(ang);
        const cx = tx - ux * nl * 0.1, cy = ty - uy * nl * 0.1;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);

        // Taban renk
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, nl / 2, nw / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Desen aksanları — tırnak şekline kırpılmış
        ctx.beginPath();
        ctx.ellipse(0, 0, nl / 2, nw / 2, 0, 0, Math.PI * 2);
        ctx.clip();

        // ÜRETİLEN TASARIM GÖRSELİ → tırnağa BİRE BİR bindir (tam tasarım, kırpmadan)
        if (this.designImg) {
          const img = this.designImg;
          // Görselin merkezindeki kareyi al (üstten tek tırnak, ortada)
          const s = Math.min(img.width, img.height) * 0.96;
          const sx = (img.width - s) / 2;
          const sy = (img.height - s) / 2;
          ctx.globalAlpha = 1;
          // Görselin uzun eksenini tırnağın uzun eksenine hizala (90° döndür) ve tırnağı DOLDUR.
          ctx.save();
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, sx, sy, s, s, -nw / 2, -nl / 2, nw, nl);
          ctx.restore();
          if (!matte) {                                          // ıslak parlaklık
            ctx.globalAlpha = 0.30;
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.ellipse(nl * 0.12, -nw * 0.16, nl * 0.18, nw * 0.16, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          continue;                                              // desen aksanlarını atla
        }

        if (pattern === 'french') {
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = '#f5efe2';
          ctx.beginPath();
          ctx.ellipse(nl * 0.42, 0, nl * 0.22, nw * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (glitter) {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          for (let g = 0; g < 10; g++) {
            const gx = (-0.4 + 0.08 * g) * nl;
            const gy = (((g * 37) % 10) / 10 - 0.5) * nw;
            ctx.beginPath();
            ctx.arc(gx, gy, Math.max(0.6, nw * 0.04), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (!matte) {
          ctx.globalAlpha = pattern === 'chrome' ? 0.55 : 0.4;
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.beginPath();
          ctx.ellipse(nl * 0.12, -nw * 0.16, nl * 0.18, nw * 0.16, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (pattern === 'chrome') {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(-nl * 0.2, nw * 0.1, nl * 0.12, nw * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  capture(): void {
    const v = this.video().nativeElement;
    const c = this.overlay().nativeElement;
    const out = document.createElement('canvas');
    out.width = v.videoWidth || 720;
    out.height = v.videoHeight || 960;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    // Gerçek yön (ayna yok)
    ctx.drawImage(v, 0, 0, out.width, out.height);
    ctx.drawImage(c, 0, 0, out.width, out.height);
    try {
      this.photo.set(out.toDataURL('image/png'));
    } catch (e) {
      // Çapraz-köken tasarım görseli tuvali "kirletmiş" olabilir → fotoğraf okunamaz.
      // Canlı önizleme çalışmaya devam eder; sadece kaydetme/çekim engellenir.
      console.warn('[AR] fotoğraf çekilemedi (çapraz-köken görsel):', e);
      this.error.set(this.i18n.t('err_camera'));
    }
    this.stop();
  }

  download(url: string): void {
    downloadImage(url, 'nailart-ar.png');
  }

  async share(url: string): Promise<void> {
    const ok = await shareImage(url, 'nailart-ar.png', 'Miracle Nail Art');
    if (!ok) downloadImage(url, 'nailart-ar.png');
  }

  stop(): void {
    this.running.set(false);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.smooth = null;
    this.miss = 0;
    this.stopStream();
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    const v = this.video().nativeElement;
    v.srcObject = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
