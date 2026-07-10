import {
  ChangeDetectionStrategy, Component, ElementRef, inject, signal, computed, effect, viewChild, OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { DesignCardComponent } from '../../shared/design-card.component';
import { I18nService } from '../../core/i18n.service';
import { DataService, Design } from '../../core/data.service';
import { HandAnalysisService, HandAnalysis, FingerLength } from '../../core/hand-analysis.service';
import { BackendService } from '../../core/api.service';
import { AnalysisStore } from '../../core/analysis-store';
import { recommend, ScoredDesign } from '../../core/recommendation';
import { detectNailShapeCloseup, CloseupResult } from '../../core/nail-shape-detect';
import { NailSegService } from '../../core/nail-seg.service';
import { ImageQuotaService } from '../../core/image-quota.service';

type Stage = 'idle' | 'camera' | 'analyzing' | 'results';
type CaptureMode = 'full' | 'closeup';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [HeaderComponent, DesignCardComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <div class="section-head"><h2 class="section-title">{{ i18n.t('scan_title') }}</h2></div>

      @if (error(); as e) { <div class="banner err">⚠️ {{ e }}</div> }

      <!-- Kamera / kare alanı (her zaman DOM'da, görünürlük aşamaya bağlı) -->
      <div class="stage" [class.tall]="stage() === 'camera' || stage() === 'idle' || stage() === 'analyzing'">
        <video #video class="media" [class.show]="stage() === 'camera'" playsinline muted></video>
        <canvas #frame class="media" [class.show]="stage() === 'results'"></canvas>

        @if (stage() === 'idle') {
          <div class="overlay">
            <span class="hand">🤚</span>
            <p class="hint">{{ i18n.t('cam_hint') }}</p>
          </div>
        }
        @if (stage() === 'analyzing') {
          <div class="overlay">
            <div class="orb">✨</div>
            <p class="al">{{ i18n.t('analyzing') }}</p>
          </div>
        }
        @if (stage() === 'camera') { <div class="frame-guide"></div> }
      </div>

      <!-- Aksiyonlar -->
      @switch (stage()) {
        @case ('idle') {
          @if (quotaBlocked()) {
            <div class="banner quota">
              ⚠️ {{ i18n.t('quota_empty') }}
              <div class="qacts">
                <button class="btn-primary" (click)="goShop()">⬆️ {{ i18n.t('quota_upgrade') }}</button>
                <button class="btn-ghost" (click)="goShop()">➕ {{ i18n.t('quota_buy_pack') }}</button>
              </div>
            </div>
          }
          <div class="actions">
            <button class="btn-primary" (click)="startFull()">📸 {{ i18n.t('cam_start') }}</button>
            <button class="btn-ghost" (click)="startUpload(fileInput)">🖼️ {{ i18n.t('upload') }}</button>
          </div>
          <p class="sub">{{ i18n.t('scan_sub') }}</p>
          <p class="hint2">🖼️ {{ i18n.t('quota_remaining') }}: <b>{{ quota.remaining() }}</b> {{ i18n.t('credits') }}</p>
          <p class="tip">💡 {{ i18n.t('capture_tip') }}</p>
        }
        @case ('camera') {
          @if (mode() === 'closeup') { <p class="tip">🔍 {{ i18n.t('closeup_guide') }}</p> }
          <div class="actions">
            <button class="btn-primary" (click)="capture()">✨ {{ i18n.t('cam_capture') }}</button>
            <button class="btn-ghost" (click)="cancelCamera()">✕ {{ i18n.t('cam_cancel') }}</button>
          </div>
        }
        @case ('results') {
          @if (analysis(); as a) {
            <div class="attrs">
              <div class="attr card">
                <span class="swatch" [style.background]="a.hex"></span>
                <div><p class="k">{{ i18n.t('skin_tone') }}</p><p class="v">{{ i18n.t('tone_' + a.toneKey) }}</p></div>
              </div>
              <div class="attr card">
                <span class="ai">🌡️</span>
                <div><p class="k">{{ i18n.t('result_undertone') }}</p><p class="v">{{ i18n.t('ut_' + a.undertone) }}</p></div>
              </div>
              <div class="attr card">
                <span class="ai">🖐️</span>
                <div><p class="k">{{ i18n.t('finger_shape') }}</p><p class="v">{{ i18n.t('fl_' + a.fingerLength) }}</p></div>
              </div>
              @if (a.handedness) {
                <div class="attr card">
                  <span class="ai">✋</span>
                  <div><p class="k">{{ i18n.t('result_hand') }}</p><p class="v">{{ i18n.t('hand_' + a.handedness) }}</p></div>
                </div>
              }
            </div>
          }

          <!-- Tırnak şekli: manuel seçim asıl kaynak; otomatik yalnızca yaklaşık öneri -->
          <div class="section-head">
            <h2 class="section-title">{{ i18n.t('choose_shape') }}</h2>
            @if (closeup()?.shape) {
              <span class="conf on">📸 {{ i18n.t('shp_' + closeup()?.shape) }} · %{{ pct(closeup()?.confidence ?? 0) }}</span>
            } @else if (analysis()?.nailShape) {
              <span class="conf">🤖 {{ i18n.t('shp_' + analysis()?.nailShape) }} · %{{ pct(analysis()?.shapeConfidence ?? 0) }} · {{ i18n.t('approx') }}</span>
            }
          </div>
          <p class="shhint">{{ i18n.t('shape_hint') }}</p>
          <div class="shapes">
            @for (s of shapes; track s.key) {
              <button class="shape" [class.on]="shape() === s.key" (click)="shape.set(s.key)">
                <img class="si" [src]="s.img" (error)="$any($event.target).style.display='none'" alt="" />
                <span class="sl">{{ i18n.t('shp_' + s.key) }}</span>
              </button>
            }
          </div>
          <div class="actions">
            <button class="btn-ghost" (click)="startCloseup()">🔍 {{ i18n.t('closeup_detect') }}</button>
            <button class="btn-ghost" (click)="pickCloseupFile()">🖼️ {{ i18n.t('closeup_upload') }}</button>
          </div>

          <div class="section-head"><h2 class="section-title">💎 {{ i18n.t('perfect_match') }}</h2></div>
          <div class="rail">
            @for (m of matchList(); track m.design.id) {
              <app-design-card [design]="m.design" [width]="150" [score]="m.score" />
            }
          </div>

          <button class="btn-primary wide" routerLink="/studio">🎨 {{ i18n.t('scan_ai_suggest') }}</button>
          <button class="btn-ghost wide" (click)="reset()">🔄 {{ i18n.t('rescan') }}</button>
        }
      }
    </div>

    <input #fileInput type="file" accept="image/*" hidden (change)="onFile($event)" />
    <input #closeupInput type="file" accept="image/*" hidden (change)="onCloseupFile($event)" />
  `,
  styles: [`
    .stage { position: relative; border-radius: 22px; overflow: hidden; background: var(--surface);
      border: 1px solid var(--line); margin-top: 6px; }
    .stage.tall { min-height: 320px; }
    .media { width: 100%; display: none; }
    .media.show { display: block; }
    video.media { max-height: 62vh; object-fit: cover; background: #000; }
    canvas.media { max-height: 62vh; object-fit: contain; background: #000; }
    .overlay { position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 14px;
      background: radial-gradient(circle at 50% 40%, rgba(212,175,55,0.08), transparent 60%); }
    .hand { font-size: 64px; opacity: 0.9; }
    .hint { margin: 0; color: var(--muted); font-size: 14px; }
    .orb { width: 84px; height: 84px; border-radius: 50%; font-size: 38px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.05));
      border: 2px solid var(--gold); animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
    .al { margin: 0; color: var(--gold-soft); font-weight: 600; }
    .frame-guide { position: absolute; inset: 12% 18%; border: 2px dashed rgba(212,175,55,0.6); border-radius: 20px; pointer-events: none; }
    .actions { display: flex; gap: 12px; margin-top: 16px; }
    .actions > * { flex: 1; }
    .sub { text-align: center; margin-top: 14px; font-size: 12.5px; color: var(--muted-2); }
    .tip { text-align: center; margin: 8px 0 0; font-size: 12px; color: var(--gold-soft);
      background: rgba(212,175,55,0.08); border: 1px dashed rgba(212,175,55,0.35); border-radius: 12px; padding: 10px 12px; line-height: 1.5; }
    .banner { margin: 12px 0; padding: 12px 14px; border-radius: 12px; font-size: 13px; }
    .banner.err { background: rgba(178,58,58,0.14); border: 1px solid rgba(178,58,58,0.4); color: #f0b8b8; }
    .banner.quota { background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.45); color: var(--gold-soft); }
    .qacts { display: flex; gap: 8px; margin-top: 10px; }
    .qacts > * { flex: 1; }
    .hint2 { text-align: center; margin: 8px 0 0; font-size: 12px; color: var(--muted-2); }
    .attrs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
    .attr { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
    .swatch { width: 30px; height: 30px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); flex: 0 0 auto; }
    .ai { font-size: 24px; }
    .k { margin: 0; font-size: 11px; color: var(--muted-2); }
    .v { margin: 2px 0 0; font-size: 14.5px; font-weight: 600; color: var(--gold-soft); }
    .conf { font-size: 11px; font-weight: 700; color: var(--muted-2);
      background: var(--surface-2); border: 1px solid var(--line); padding: 3px 9px; border-radius: 999px; }
    .conf.on { color: var(--gold-soft); background: rgba(212,175,55,0.14); border-color: rgba(212,175,55,0.4); }
    .shhint { margin: 0 0 10px; font-size: 12px; color: var(--muted-2); }
    .shapes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .shape { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 4px;
      border-radius: 12px; background: var(--surface-2); border: 1px solid var(--line); color: var(--muted); }
    .shape.on { background: rgba(212,175,55,0.16); border-color: rgba(212,175,55,0.5); color: var(--gold-soft); }
    .se { font-size: 22px; }
    .si { width: 42px; height: 42px; object-fit: contain; border-radius: 8px; }
    .sl { font-size: 10.5px; font-weight: 600; }
    .wide { width: 100%; margin-top: 12px; }
  `],
})
export class ScanComponent implements OnDestroy {
  readonly i18n = inject(I18nService);
  readonly data = inject(DataService);
  private readonly hands = inject(HandAnalysisService);
  private readonly backend = inject(BackendService);
  private readonly seg = inject(NailSegService);
  private readonly store = inject(AnalysisStore);
  private readonly router = inject(Router);
  readonly quota = inject(ImageQuotaService);

  /** Hak bitti uyarısı — tarama (el analizi + AI önerisi = 1 hak) başlatılamaz. */
  readonly quotaBlocked = signal<boolean>(false);
  /** Hak var mı? Yoksa uyarı göster ve engelle. (Tüketim üretimde olur, burada sadece kapı.) */
  private ensureQuota(): boolean {
    if (this.quota.remaining() < 1) { this.quotaBlocked.set(true); return false; }
    this.quotaBlocked.set(false);
    return true;
  }
  goShop(): void { void this.router.navigate(['/shop']); }

  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private readonly frame = viewChild.required<ElementRef<HTMLCanvasElement>>('frame');
  private readonly closeupInput = viewChild.required<ElementRef<HTMLInputElement>>('closeupInput');

  readonly stage = signal<Stage>('idle');
  readonly mode = signal<CaptureMode>('full');
  readonly error = signal<string | null>(null);
  readonly analysis = signal<HandAnalysis | null>(null);
  readonly closeup = signal<CloseupResult | null>(null);
  readonly shape = signal<string>('almond');

  private stream: MediaStream | null = null;

  readonly shapes = [
    { key: 'oval', emoji: '🥚', img: 'images/shape_oval1.png' },
    { key: 'almond', emoji: '💧', img: 'images/shape_almond1.png' },
    { key: 'square', emoji: '⬛', img: 'images/shape_square1.png' },
    { key: 'squoval', emoji: '🔲', img: 'images/shape_squoval1.png' },
    { key: 'coffin', emoji: '⚰️', img: 'images/shape_coffin1.png' },
    { key: 'stiletto', emoji: '🗡️', img: 'images/shape_stiletto1.png' },
    { key: 'round', emoji: '⚪', img: 'images/shape_round1.png' },
  ];

  /** Analiz + seçili şekle göre gerçek öneriler (yoksa null). */
  private readonly recos = computed<ScoredDesign[] | null>(() => {
    const a = this.analysis();
    if (!a) return null;
    return recommend(
      { toneKey: a.toneKey, undertone: a.undertone, fingerLength: a.fingerLength, nailShape: this.shape(), lab: a.lab },
      this.data.explore,
      new Date().getMonth(),
    ).slice(0, 8);
  });

  /** Şablon için: öneri varsa skorlu liste, yoksa varsayılan seçki. */
  readonly matchList = computed<{ design: Design; score: number | undefined }[]>(() => {
    const r = this.recos();
    if (r) return r.map((d) => ({ design: d as Design, score: d.matchScore }));
    return this.data.matches().map((d) => ({ design: d, score: undefined }));
  });

  constructor() {
    // Analiz veya seçili şekil değişince paylaşılan depoyu güncelle (Ana Sayfa buradan beslenir)
    effect(() => {
      const a = this.analysis();
      const shape = this.shape();
      if (a) {
        this.store.set({
          toneKey: a.toneKey, undertone: a.undertone, fingerLength: a.fingerLength,
          nailShape: shape, lab: a.lab,
        });
      }
    }, { allowSignalWrites: true });
  }

  /** Tam el taraması için kamerayı aç. */
  startFull(): void {
    if (!this.ensureQuota()) return;
    this.mode.set('full');
    void this.startCamera();
  }

  /** Tam el taraması için dosya yükle (kapı: hak kontrolü). */
  startUpload(input: HTMLInputElement): void {
    if (!this.ensureQuota()) return;
    this.mode.set('full');
    input.click();
  }

  /** Tek tırnak yakın çekimi için kamerayı aç. */
  startCloseup(): void {
    if (!this.ensureQuota()) return;
    this.mode.set('closeup');
    void this.startCamera();
  }

  /** Yakın çekim için dosya seç. */
  pickCloseupFile(): void {
    if (!this.ensureQuota()) return;
    this.mode.set('closeup');
    this.closeupInput().nativeElement.click();
  }

  /** Kamerayı iptal et — yakın çekimdeysek sonuçlara, değilsek boşa dön. */
  cancelCamera(): void {
    this.stopCamera();
    this.stage.set(this.mode() === 'closeup' && this.analysis() ? 'results' : 'idle');
    this.mode.set('full');
  }

  async startCamera(): Promise<void> {
    this.error.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('[Scan] Bu tarayıcı/ortam kamerayı desteklemiyor (getUserMedia yok).');
      this.error.set(this.i18n.t('err_camera'));
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      const v = this.video().nativeElement;
      v.srcObject = this.stream;
      this.stage.set('camera'); // önce görünür yap ki kareler aksın
      await v.play();
    } catch (e) {
      console.error('[Scan] Kamera erişim hatası:', e);
      this.error.set(this.i18n.t('err_camera'));
      this.stage.set('idle');
    }
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    const v = this.video().nativeElement;
    v.srcObject = null;
  }

  async capture(): Promise<void> {
    const v = this.video().nativeElement;
    // Gerçek bir kare gelene kadar bekle (siyah/boş kare yakalamayı önler)
    await this.waitForFrame(v);
    if (!v.videoWidth) {
      this.error.set(this.i18n.t('cam_not_ready'));
      return;
    }
    // Her yakalamada TAZE tuval — MediaPipe'a temiz kaynak verir (tekrar analizde bozulmayı önler)
    const work = document.createElement('canvas');
    work.width = v.videoWidth;
    work.height = v.videoHeight;
    work.getContext('2d')?.drawImage(v, 0, 0, work.width, work.height);
    this.stopCamera();
    if (this.mode() === 'closeup') {
      await this.runCloseup(work);
    } else {
      await this.runAnalysis(work);
    }
  }

  /** Yakın çekim karesinden tırnak şeklini çıkarır: ML modeli varsa onu, yoksa flood-fill. */
  private async runCloseup(work: HTMLCanvasElement): Promise<void> {
    // ML segmentasyon modeli yapılandırılmışsa önce onu dene (en yüksek doğruluk)
    let res = this.seg.enabled() ? await this.seg.segmentShape(work) : null;
    if (!res || !res.shape) res = detectNailShapeCloseup(work); // güvenilir fallback
    this.mode.set('full');
    if (!res.shape) {
      this.error.set(this.i18n.t('closeup_fail'));
      this.stage.set(this.analysis() ? 'results' : 'idle');
      return;
    }
    this.error.set(null);
    this.closeup.set(res);
    this.shape.set(res.shape);
    this.stage.set('results');
    console.log(`[Scan] yakın çekim tırnak şekli: ${res.shape} (%${Math.round(res.confidence * 100)})`);
  }

  onCloseupFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const work = document.createElement('canvas');
      const maxW = 1024;
      const scale = Math.min(1, maxW / img.naturalWidth);
      work.width = Math.round(img.naturalWidth * scale);
      work.height = Math.round(img.naturalHeight * scale);
      work.getContext('2d')?.drawImage(img, 0, 0, work.width, work.height);
      void this.runCloseup(work);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => this.error.set(this.i18n.t('err_camera'));
    img.src = URL.createObjectURL(f);
  }

  /** Video gerçek görüntü üretene kadar (en fazla ~2.5sn) bekler. */
  private waitForFrame(v: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      let tries = 0;
      const check = () => {
        if ((v.videoWidth > 0 && v.readyState >= 2 && v.currentTime > 0) || tries++ > 50) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  pct(n: number): number {
    return Math.round(n * 100);
  }

  private suggestShape(fl: FingerLength | null): string {
    switch (fl) {
      case 'long': return 'almond';
      case 'short': return 'round';
      default: return 'oval';
    }
  }

  onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const work = document.createElement('canvas');
      const maxW = 1024;
      const scale = Math.min(1, maxW / img.naturalWidth);
      work.width = Math.round(img.naturalWidth * scale);
      work.height = Math.round(img.naturalHeight * scale);
      work.getContext('2d')?.drawImage(img, 0, 0, work.width, work.height);
      void this.runAnalysis(work);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => this.error.set(this.i18n.t('err_camera'));
    img.src = URL.createObjectURL(f);
    input.value = '';
  }

  private async runAnalysis(work: HTMLCanvasElement): Promise<void> {
    this.error.set(null);
    this.closeup.set(null); // yeni tam tarama → önceki yakın çekim sonucunu temizle
    this.stage.set('analyzing');
    try {
      await this.hands.init();
    } catch (e) {
      console.error('[Scan] MediaPipe modeli yüklenemedi:', e);
      this.error.set(this.i18n.t('err_model'));
      this.stage.set('idle');
      return;
    }
    const result = this.hands.analyze(work);
    if (!result.handDetected) {
      this.error.set(this.i18n.t('no_hand'));
      this.stage.set('idle');
      return;
    }
    // Görünür tuvale kareyi + tespit noktalarını çiz
    const disp = this.frame().nativeElement;
    disp.width = work.width;
    disp.height = work.height;
    disp.getContext('2d')?.drawImage(work, 0, 0);
    this.drawLandmarks(disp, result);
    this.analysis.set(result);
    // Otomatik tırnak şekli: silüet analizi çıktıysa onu, yoksa parmak yapısı tahminini kullan
    const shape = result.nailShape ?? this.suggestShape(result.fingerLength);
    this.shape.set(shape);
    this.stage.set('results');
    // Analizi veritabanına da kaydet (sessiz-başarısız; backend kapalıysa atlar)
    void this.backend.saveAnalysis({
      toneKey: result.toneKey, undertone: result.undertone,
      fingerLength: result.fingerLength, nailShape: result.nailShape, hex: result.hex,
    });
    // ESAS AKIŞ: analiz biter bitmez el verisiyle OTOMATİK tasarım üretimine geç.
    // Paylaşılan depoyu kesin doldur (Stüdyo bunu okuyup kendiliğinden görsel üretir).
    this.store.set({
      toneKey: result.toneKey, undertone: result.undertone,
      fingerLength: result.fingerLength, nailShape: shape, lab: result.lab,
    });
    void this.router.navigate(['/studio']);
  }

  /** Tespit edilen noktaları kare üzerine çizer (örnekleme sonrası). */
  private drawLandmarks(canvas: HTMLCanvasElement, r: HandAnalysis): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !r.landmarks) return;
    const connections: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
    ];
    ctx.strokeStyle = 'rgba(212,175,55,0.7)';
    ctx.lineWidth = Math.max(2, canvas.width * 0.004);
    for (const [a, b] of connections) {
      const p = r.landmarks[a], q = r.landmarks[b];
      ctx.beginPath();
      ctx.moveTo(p.x * canvas.width, p.y * canvas.height);
      ctx.lineTo(q.x * canvas.width, q.y * canvas.height);
      ctx.stroke();
    }
    ctx.fillStyle = '#f3e5a8';
    const rad = Math.max(3, canvas.width * 0.008);
    for (const p of r.landmarks) {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  reset(): void {
    this.analysis.set(null);
    this.closeup.set(null);
    this.mode.set('full');
    this.error.set(null);
    this.stage.set('idle');
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
