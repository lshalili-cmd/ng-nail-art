import {
  ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild, OnDestroy,
} from '@angular/core';
import { HeaderComponent } from '../../shared/header.component';
import { I18nService } from '../../core/i18n.service';
import { HandAnalysisService } from '../../core/hand-analysis.service';

interface Swatch { name: string; hex: string; }

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
        @if (!running() && !photo()) {
          <div class="hint"><span class="ic">💅</span><p>{{ i18n.t('ar_hint') }}</p></div>
        }
        @if (photo(); as p) { <img class="shot" [src]="p" alt="AR" /> }
      </div>

      <!-- Renk seçimi -->
      <p class="lbl">{{ i18n.t('ar_color') }}</p>
      <div class="swatches">
        @for (s of swatches; track s.hex) {
          <button class="sw" [class.on]="color() === s.hex" [style.background]="s.hex"
                  [title]="s.name" (click)="color.set(s.hex)"></button>
        }
      </div>

      <!-- Kontroller -->
      <div class="actions">
        @if (!running()) {
          <button class="btn-primary" (click)="start()">📸 {{ i18n.t('ar_title') }}</button>
        } @else {
          <button class="btn-primary" (click)="capture()">📷 {{ i18n.t('ar_capture') }}</button>
          <button class="btn-ghost" (click)="stop()">✕ {{ i18n.t('ar_close') }}</button>
        }
        @if (photo()) { <button class="btn-ghost" (click)="photo.set(null)">🔄 {{ i18n.t('rescan') }}</button> }
      </div>
    </div>
  `,
  styles: [`
    .stage { position: relative; border-radius: 22px; overflow: hidden; background: #000;
      border: 1px solid var(--line); margin-top: 6px; min-height: 300px; }
    .mirror { transform: scaleX(-1); }
    .media { width: 100%; display: block; }
    video.media { max-height: 64vh; object-fit: contain; background: #000; }
    canvas.overlay { position: absolute; inset: 0; width: 100%; height: 100%; }
    .hint { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; color: var(--muted); }
    .hint .ic { font-size: 60px; opacity: 0.85; }
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

  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private readonly overlay = viewChild.required<ElementRef<HTMLCanvasElement>>('overlay');

  readonly running = signal(false);
  readonly error = signal<string | null>(null);
  readonly photo = signal<string | null>(null);
  readonly color = signal<string>('#d4af37');

  readonly swatches: Swatch[] = [
    { name: 'Gold', hex: '#d4af37' }, { name: 'Red', hex: '#d24b4b' }, { name: 'Pink', hex: '#e6a4c4' },
    { name: 'Nude', hex: '#dcc3a6' }, { name: 'Chrome', hex: '#cdd6e0' }, { name: 'Black', hex: '#20202a' },
    { name: 'Blue', hex: '#4b78d2' }, { name: 'Emerald', hex: '#1f8f63' }, { name: 'Purple', hex: '#8a5bd0' },
  ];

  private stream: MediaStream | null = null;
  private raf = 0;

  async start(): Promise<void> {
    this.error.set(null);
    this.photo.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set(this.i18n.t('err_camera'));
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false,
      });
      const v = this.video().nativeElement;
      v.srcObject = this.stream;
      await v.play();
    } catch (e) {
      console.error('[AR] Kamera hatası:', e);
      this.error.set(this.i18n.t('err_camera'));
      return;
    }
    try {
      await this.hands.initVideo();
    } catch (e) {
      console.error('[AR] MediaPipe yüklenemedi:', e);
      this.error.set(this.i18n.t('err_model'));
      this.stopStream();
      return;
    }
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
        this.drawNails(ctx, hands, c.width, c.height, this.color());
      }
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private drawNails(ctx: CanvasRenderingContext2D, hands: { x: number; y: number }[][], w: number, h: number, color: string): void {
    const tips = [4, 8, 12, 16, 20];
    const lows = [3, 7, 11, 15, 19];
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
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.ellipse(0, 0, nl / 2, nw / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.ellipse(nl * 0.12, -nw * 0.14, nl * 0.18, nw * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
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
    // Aynalı görüntü olarak birleştir
    ctx.save();
    ctx.translate(out.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, out.width, out.height);
    ctx.drawImage(c, 0, 0, out.width, out.height);
    ctx.restore();
    this.photo.set(out.toDataURL('image/png'));
    this.stop();
  }

  stop(): void {
    this.running.set(false);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
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
