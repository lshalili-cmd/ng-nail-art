import {
  ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy, ElementRef, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { I18nService } from '../../core/i18n.service';
import { AiService } from '../../core/ai.service';
import { BackendService } from '../../core/api.service';
import { AiStatus, DesignSpec, GeneratedImage } from '../../core/ai.models';
import { renderNailThumb } from '../../core/nail-art';
import { FavoritesService } from '../../core/favorites.service';
import { ImageQuotaService } from '../../core/image-quota.service';
import { Design } from '../../core/data.service';
import { AnalysisStore } from '../../core/analysis-store';
import { AnalysisInput } from '../../core/recommendation';
import { HandImageStore, HandImage } from '../../core/hand-image-store';
import { HandAnalysisService } from '../../core/hand-analysis.service';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <div class="section-head">
        <h2 class="section-title">🎨 {{ i18n.t('studio_title') }}</h2>
        @if (statusLabel()) { <span class="prov">{{ statusLabel() }}</span> }
      </div>

      <!-- Sanal deneme: el fotoğrafı kaynağı + önizleme (tasarım katmanı sonraki adımlarda) -->
      <div class="tryon card">
        @if (camOn()) {
          <div class="cam-wrap">
            <video #handVideo class="cam" playsinline muted></video>
            <div class="hand-actions">
              <button class="btn-primary" (click)="captureHand()">✨ {{ i18n.t('cam_capture') }}</button>
              <button class="btn-ghost" (click)="stopHandCamera()">✕ {{ i18n.t('cam_cancel') }}</button>
            </div>
          </div>
        } @else {
          @if (handImg(); as h) {
            <div class="hand-preview">
              <img [src]="h.imageUrl" alt="hand" />
              <span class="src-badge">
                {{ h.landmarks ? '📍 tırnaklar tespit edildi' : '⚠️ tırnak tespiti yok' }}
              </span>
            </div>
            <div class="hand-actions">
              <button class="btn-ghost" (click)="pickHandFile()">🖼️ {{ i18n.t('upload') }}</button>
              <button class="btn-ghost" (click)="startHandCamera()">📸 {{ i18n.t('cam_start') }}</button>
            </div>
          } @else {
            <div class="hand-empty">
              <span class="he">🖐️</span>
              <p class="hint">{{ i18n.t('cam_hint') }}</p>
              <div class="hand-actions">
                <button class="btn-primary" (click)="pickHandFile()">🖼️ {{ i18n.t('upload') }}</button>
                <button class="btn-ghost" (click)="startHandCamera()">📸 {{ i18n.t('cam_start') }}</button>
              </div>
            </div>
          }
        }
        @if (handError(); as he) { <p class="hand-err">⚠️ {{ he }}</p> }
      </div>
      <input #handFile type="file" accept="image/*" hidden (change)="onHandFile($event)" />

      <!-- Prompt / otomatik üretim -->
      <div class="composer card">
        @if (tailored()) {
          <!-- Taramadan gelindi: el verisiyle OTOMATİK üretim; kullanıcıdan giriş istenmez -->
          <div class="tailored-badge">{{ i18n.t('studio_tailored') }}</div>
          @if (loading()) {
            <p class="tailored-gen">✨ {{ i18n.t('studio_generating') }}</p>
          } @else {
            <button class="btn-primary wide" (click)="regenerateTailored()" [disabled]="loading()">
              🔄 {{ i18n.t('studio_regenerate') }}
            </button>
          }
        } @else {
          <textarea
            [value]="prompt()"
            (input)="prompt.set($any($event.target).value)"
            [placeholder]="i18n.t('studio_prompt_ph')"
            rows="3"></textarea>
          <div class="chips-row">
            @for (s of suggestions; track s) {
              <button class="chip" (click)="prompt.set(i18n.t(s))">{{ i18n.t(s) }}</button>
            }
          </div>
          <button class="btn-primary wide" (click)="generate()" [disabled]="loading() || !prompt().trim()">
            {{ loading() ? ('✨ ' + i18n.t('studio_generating')) : ('✨ ' + i18n.t('studio_generate')) }}
          </button>
        }
        <p class="hint">🖼️ {{ i18n.t('quota_remaining') }}: <b>{{ quota.remaining() }}</b> {{ i18n.t('credits') }} · {{ i18n.t('studio_hint') }}</p>
      </div>

      <!-- Quota bitti uyarısı -->
      @if (quotaBlocked()) {
        <div class="banner quota">
          ⚠️ {{ i18n.t('quota_empty') }}
          <div class="qacts">
            <button class="btn-primary" (click)="goShop()">⬆️ {{ i18n.t('quota_upgrade') }}</button>
            <button class="btn-ghost" (click)="goShop()">➕ {{ i18n.t('quota_buy_pack') }}</button>
          </div>
        </div>
      }

      <!-- Error banner -->
      @if (error(); as e) {
        <div class="banner err">⚠️ {{ i18n.t('studio_error') }}: {{ e }}</div>
      }

      <!-- Result -->
      @if (design(); as d) {
        <div class="section-head"><h2 class="section-title">{{ i18n.t('studio_result') }}</h2></div>

        <div class="result card">
          <!-- Visual -->
          <div class="visual" [style.background]="previewBg()">
            @if (imageSrc(); as src) {
              <img [src]="src" alt="AI design" />
            } @else {
              <span class="ph">💅</span>
            }
            @if (imgLoading()) { <div class="img-load">⏳</div> }
            <button class="fav-btn" (click)="toggleFav()" [attr.aria-pressed]="fav.has(favId())">
              {{ fav.has(favId()) ? '❤️' : '🤍' }}
            </button>
          </div>
          @if ((imageFallback() || d.source === 'demo') && !imgLoading()) {
            <p class="fallback-note">🎨 {{ i18n.t('studio_fallback_note') }}</p>
          }

          <div class="rbody">
            <div class="rtop">
              <h3 class="rtitle">{{ d.title }}</h3>
              <span class="conf">%{{ pct(d.confidence) }}</span>
            </div>
            <p class="rdesc">{{ d.description }}</p>

            <div class="attrs">
              <div class="attr"><span class="k">{{ i18n.t('studio_finish') }}</span><span class="v">{{ d.finish }}</span></div>
              <div class="attr"><span class="k">{{ i18n.t('studio_shape') }}</span><span class="v">{{ d.shape }}</span></div>
            </div>

            @if (d.colors.length) {
              <p class="k">{{ i18n.t('studio_colors') }}</p>
              <div class="swatches">
                @for (c of d.colors; track c) {
                  <span class="sw" [style.background]="colorHex(c)" [title]="c"></span>
                }
              </div>
            }

            @if (d.effects.length) {
              <p class="k">{{ i18n.t('studio_effects') }}</p>
              <div class="tags">
                @for (e of d.effects; track e) { <span class="tag">{{ e }}</span> }
                @for (t of d.patterns; track t) { <span class="tag">{{ t }}</span> }
              </div>
            }

            <div class="actions">
              <button class="btn-primary" (click)="generate()">🔄 {{ i18n.t('studio_regenerate') }}</button>
              @if (image(); as img) {
                @if (!img.edited && img.provider !== 'demo') {
                  <button class="btn-ghost" (click)="tryOnRealPhoto()" [disabled]="nailVtoLoading()">
                    {{ nailVtoLoading() ? ('⏳ ' + i18n.t('studio_nailvto_loading')) : i18n.t('studio_nailvto_btn') }}
                  </button>
                }
              }
            </div>
            @if (nailVtoError(); as nve) { <p class="hand-err">⚠️ {{ nve }}</p> }
            @if (nailVtoResult(); as nvr) {
              <div class="nailvto-result">
                <p class="k">{{ i18n.t('studio_nailvto_result_title') }}</p>
                <img [src]="nvr" alt="nail vto result" />
              </div>
            }
            <p class="hint">🖼️ {{ i18n.t('quota_remaining') }}: <b>{{ quota.remaining() }}</b> {{ i18n.t('credits') }} · her üretim 1 hak</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .prov { font-size: 11px; color: var(--muted-2); background: var(--surface-2);
      border: 1px solid var(--line); padding: 3px 9px; border-radius: 999px; }
    .composer { padding: 14px; }
    textarea { width: 100%; resize: vertical; background: var(--surface-2); color: var(--ink);
      border: 1px solid var(--line); border-radius: 12px; padding: 12px; font: inherit; font-size: 14px; outline: none; }
    textarea:focus { border-color: rgba(212,175,55,0.5); }
    .chips-row { display: flex; gap: 8px; overflow-x: auto; margin: 10px 0; scrollbar-width: none; }
    .chips-row::-webkit-scrollbar { display: none; }
    .chip { flex: 0 0 auto; padding: 6px 12px; border-radius: 999px; font-size: 12px;
      background: var(--surface-3); border: 1px solid var(--line); color: var(--muted); }
    .wide { width: 100%; }
    .hint { margin: 10px 0 0; font-size: 12px; color: var(--muted-2); text-align: center; }
    .banner { margin-top: 14px; padding: 12px 14px; border-radius: 12px; font-size: 13px; }
    .banner.err { background: rgba(178,58,58,0.14); border: 1px solid rgba(178,58,58,0.4); color: #f0b8b8; }
    .banner.quota { background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.45); color: var(--gold-soft); }
    .qacts { display: flex; gap: 8px; margin-top: 10px; }
    .qacts > * { flex: 1; }
    .result { overflow: hidden; margin-top: 4px; }
    .visual { position: relative; aspect-ratio: 16 / 10; display: flex; align-items: center; justify-content: center; }
    .visual img { width: 100%; height: 100%; object-fit: cover; }
    .visual .ph { font-size: 60px; opacity: 0.5; }
    .img-load { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.45); font-size: 30px; }
    .fav-btn { position: absolute; top: 10px; inset-inline-end: 10px; font-size: 18px;
      width: 38px; height: 38px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); }
    .rbody { padding: 16px; }
    .rtop { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .rtitle { font-size: 18px; }
    .conf { font-size: 11px; font-weight: 700; color: var(--gold-soft);
      background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.4); padding: 2px 8px; border-radius: 999px; }
    .rdesc { margin: 8px 0 12px; font-size: 13px; color: var(--muted); line-height: 1.5; }
    .fallback-note { margin: 8px 14px 0; padding: 8px 10px; font-size: 11.5px; text-align: center;
      color: var(--gold-soft); background: rgba(212,175,55,0.1); border: 1px dashed rgba(212,175,55,0.4);
      border-radius: 10px; }
    .demo { font-size: 12px; color: var(--gold-soft); background: rgba(212,175,55,0.1);
      border: 1px dashed rgba(212,175,55,0.4); padding: 8px 10px; border-radius: 10px; margin: 0 0 12px; }
    .attrs { display: flex; gap: 10px; margin-bottom: 12px; }
    .attr { flex: 1; background: var(--surface-2); border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; }
    .k { font-size: 11px; color: var(--muted-2); margin: 8px 0 6px; text-transform: capitalize; }
    .attr .k { margin: 0; }
    .attr .v { display: block; font-size: 14px; font-weight: 600; color: var(--ink); text-transform: capitalize; }
    .swatches { display: flex; gap: 8px; margin-bottom: 4px; }
    .sw { width: 26px; height: 26px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { font-size: 11.5px; padding: 4px 10px; border-radius: 999px;
      background: var(--surface-3); border: 1px solid var(--line); color: var(--muted); text-transform: capitalize; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .actions > * { flex: 1; min-width: 120px; }
    .tailored-badge { display: inline-block; margin-bottom: 10px; font-size: 12.5px; font-weight: 600;
      color: var(--gold-soft); background: rgba(212,175,55,0.14); border: 1px solid rgba(212,175,55,0.4);
      padding: 6px 12px; border-radius: 999px; }
    .tailored-gen { margin: 6px 0 2px; font-size: 14px; font-weight: 600; color: var(--gold-soft); text-align: center; }
    .tryon { padding: 12px; margin-bottom: 12px; }
    .hand-preview { position: relative; border-radius: 14px; overflow: hidden; background: var(--surface-2); }
    .hand-preview img { width: 100%; max-height: 62vh; object-fit: contain; display: block; background: #000; }
    .src-badge { position: absolute; top: 10px; inset-inline-start: 10px; font-size: 11px; font-weight: 700;
      color: var(--gold-soft); background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      border: 1px solid rgba(212,175,55,0.4); padding: 4px 10px; border-radius: 999px; }
    .src-badge.demo { color: var(--muted); border-color: var(--line); }
    .hand-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 22px 10px; text-align: center; }
    .hand-empty .he { font-size: 54px; opacity: 0.9; }
    .cam-wrap { border-radius: 14px; overflow: hidden; }
    .cam { width: 100%; max-height: 62vh; object-fit: cover; background: #000; display: block; border-radius: 14px; }
    .hand-actions { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    .hand-actions > * { flex: 1; min-width: 110px; }
    .hand-err { margin: 10px 0 0; font-size: 12.5px; color: #f0b8b8; text-align: center; }
    .nailvto-result { margin-top: 14px; }
    .nailvto-result img { width: 100%; border-radius: 12px; display: block; }
  `],
})
export class StudioComponent implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly ai = inject(AiService);
  private readonly backend = inject(BackendService);
  private readonly router = inject(Router);
  readonly fav = inject(FavoritesService);
  readonly quota = inject(ImageQuotaService);
  private readonly analysisStore = inject(AnalysisStore);
  private readonly handStore = inject(HandImageStore);
  private readonly hands = inject(HandAnalysisService);

  // — Sanal deneme: el fotoğrafı kaynağı —
  private readonly handVideo = viewChild<ElementRef<HTMLVideoElement>>('handVideo');
  private readonly handFile = viewChild.required<ElementRef<HTMLInputElement>>('handFile');
  /** Paylaşılan el fotoğrafı (Tara'dan veya Stüdyo'dan). */
  readonly handImg = computed(() => this.handStore.current());
  readonly camOn = signal<boolean>(false);
  readonly handError = signal<string | null>(null);
  private handStream: MediaStream | null = null;
  /** "Yeniden Üret" her seferinde farklı renk/bitiş denesin diye saklanır. */
  private lastAnalysis: AnalysisInput | null = null;

  /** Otomatik ("elinize özel") üretimde her seferinde farklı çıksın diye renk/bitiş BAĞIMSIZ
   *  rastgele seçilir (16 renk × 10 bitiş ≈ 160 kombinasyon). */
  private readonly TAILORED_STYLES: Record<string, { colors: string[]; finishes: string[] }> = {
    tr: {
      colors: [
        'altın kromlu', 'pastel pembe', 'mercan-somon tonlarında', 'derin bordo',
        'nude bej tonlarında', 'gece mavisi', 'şampanya altın', 'zümrüt yeşili',
        'gümüş krom', 'lavanta moru', 'mercan pembesi', 'mat siyah',
        'fildişi beyaz', 'bakır tonlarında', 'açık leylak', 'koyu çikolata kahvesi',
      ],
      finishes: [
        'ince yıldız desenli', 'zarif çiçek desenli', 'minimal kalp desenli',
        'altın çizgi desenli', 'geometrik desenli', 'yaprak desenli',
        'dalga desenli', 'kelebek desenli', 'nokta desenli', 'hilal desenli',
      ],
    },
    en: {
      colors: [
        'gold chrome', 'pastel pink', 'coral-salmon tones', 'deep burgundy',
        'nude beige tones', 'midnight blue', 'champagne gold', 'emerald green',
        'silver chrome', 'lavender purple', 'coral pink', 'matte black',
        'ivory white', 'copper tones', 'soft lilac', 'dark chocolate brown',
      ],
      finishes: [
        'fine star pattern', 'elegant floral pattern', 'minimal heart pattern',
        'thin gold line pattern', 'geometric pattern', 'leaf pattern',
        'wave pattern', 'butterfly pattern', 'dot pattern', 'crescent moon pattern',
      ],
    },
    ru: {
      colors: [
        'золотисто-хромовый', 'пастельно-розовый', 'коралловые тона', 'глубокий бордовый',
        'нюдовые бежевые тона', 'полуночно-синий', 'шампань-золото', 'изумрудно-зелёный',
        'серебристо-хромовый', 'сиреневый', 'коралловый розовый', 'матовый чёрный',
        'слоновая кость', 'медные тона', 'нежно-лиловый', 'тёмный шоколадно-коричневый',
      ],
      finishes: [
        'с узором из звёзд', 'с элегантным цветочным узором', 'с минималистичным узором сердечек',
        'с узором из тонких золотых линий', 'с геометрическим узором', 'с узором из листьев',
        'с волнистым узором', 'с узором бабочек', 'с точечным узором', 'с узором полумесяца',
      ],
    },
    ar: {
      colors: [
        'ذهبي كروم', 'وردي باستيل', 'درجات المرجاني', 'عنابي غامق',
        'درجات بيج نود', 'أزرق كحلي', 'ذهبي شمبانيا', 'أخضر زمردي',
        'فضي كروم', 'بنفسجي لافندر', 'وردي مرجاني', 'أسود مطفي',
        'أبيض عاجي', 'درجات نحاسية', 'ليلكي فاتح', 'بني شوكولاتة غامق',
      ],
      finishes: [
        'بنقشة نجوم رفيعة', 'بنقشة أزهار أنيقة', 'بنقشة قلوب بسيطة',
        'بنقشة خطوط ذهبية رفيعة', 'بنقشة هندسية', 'بنقشة أوراق',
        'بنقشة أمواج', 'بنقشة فراشات', 'بنقشة نقاط', 'بنقشة هلال',
      ],
    },
  };

  /** true: gerçek AI görseli üretilemedi, gösterilen çizim-önizleme yedektir (kullanıcı fark etsin). */
  readonly imageFallback = signal<boolean>(false);

  readonly favId = signal<number>(0);
  readonly quotaBlocked = signal<boolean>(false);
  readonly tailored = signal<boolean>(false);   // taramadan gelen "elinize özel" rozeti

  readonly prompt = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly imgLoading = signal<boolean>(false);
  readonly design = signal<DesignSpec | null>(null);
  readonly image = signal<GeneratedImage | null>(null);
  readonly error = signal<string | null>(null);
  readonly status = signal<AiStatus | null>(null);

  /** Perfect Corp Nail VTO — izole tasarımı gerçek el fotoğrafına bindirme sonucu/durumu. */
  readonly nailVtoLoading = signal<boolean>(false);
  readonly nailVtoResult = signal<string | null>(null);
  readonly nailVtoError = signal<string | null>(null);

  readonly suggestions = ['sug1', 'sug2', 'sug3', 'sug4', 'sug5'];

  readonly statusLabel = computed(() => {
    const s = this.status();
    // Üretim hissi: yalnızca gerçek sağlayıcı hazırsa sağlayıcı adı gösterilir.
    // Backend yoksa hiçbir "demo" rozeti/ibaresi gösterilmez.
    if (!s || s.status !== 'ready') return '';
    return `● ${s.provider} · ${s.model}`;
  });

  readonly imageSrc = computed<string | null>(() => {
    const im = this.image();
    if (!im?.imageUrl) return null;
    const u = im.imageUrl;
    if (u.startsWith('data:') || /^https?:\/\//.test(u) || u.startsWith('/')) return u;
    return '/' + u;
  });

  readonly previewBg = computed(() => {
    const d = this.design();
    if (!d || !d.colors.length) return 'linear-gradient(135deg,#241a2e,#3a2740)';
    const hexes = d.colors.slice(0, 2).map((c) => this.colorHex(c));
    return `linear-gradient(135deg, ${hexes[0]}, ${hexes[1] ?? hexes[0]})`;
  });

  ngOnInit(): void {
    void this.ai.status().then((s) => {
      this.status.set(s);
      // Taramadan (el analizinden) gelindiyse: o ele ÖZEL tasarımı otomatik üret.
      const a = this.analysisStore.current();
      if (a && (a.nailShape || a.undertone) && !this.prompt().trim()) {
        this.tailored.set(true);
        this.lastAnalysis = a;                // "yeniden üret" farklı renk/bitiş deneyebilsin diye sakla
        this.prompt.set(this.buildTailoredPrompt(a));
        this.analysisStore.clear();          // bir kez kullan (yenile'de tekrar tetiklenmesin)
        void this.generate();                // otomatik üret
      }
    });
  }

  /** El analizinden (tırnak şekli + ten tonu) kişiye özel istem metni üretir.
   *  Renk/bitiş HER ÇAĞRIDA rastgele seçilir — "yeniden üret" hep aynı düz tona düşmesin diye. */
  private buildTailoredPrompt(a: AnalysisInput): string {
    const shape = a.nailShape ? this.i18n.t('shp_' + a.nailShape) : '';
    const tone = a.undertone ? this.i18n.t('ut_' + a.undertone) : '';
    const pool = this.TAILORED_STYLES[this.i18n.locale()] ?? this.TAILORED_STYLES['en'];
    const color = pool.colors[Math.floor(Math.random() * pool.colors.length)];
    const finish = pool.finishes[Math.floor(Math.random() * pool.finishes.length)];
    return this.i18n.t('studio_tailored_prompt')
      .replace('{shape}', shape)
      .replace('{tone}', tone)
      .replace('{color}', color)
      .replace('{finish}', finish)
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /** "Yeniden Üret" — aynı el/şekil/ton ile ama YENİ rastgele renk+bitiş dener. */
  regenerateTailored(): void {
    if (this.lastAnalysis) this.prompt.set(this.buildTailoredPrompt(this.lastAnalysis));
    void this.generate();
  }

  async generate(): Promise<void> {
    const p = this.prompt().trim();
    if (!p) return;
    // Görsel hakkı kontrolü — bittiyse üretme, yükselt/ek paket uyarısı göster
    if (!this.quota.consume()) {
      this.quotaBlocked.set(true);
      return;
    }
    this.quotaBlocked.set(false);
    this.loading.set(true);
    this.error.set(null);
    this.image.set(null);
    this.nailVtoResult.set(null);
    this.nailVtoError.set(null);
    this.favId.set(Date.now()); // bu üretim için benzersiz favori kimliği
    try {
      const s = this.status();
      if (s && s.status === 'ready') {
        // Görsel üretimi hazır (Flux 1.1 Pro / paid AI).
        // Tasarım-spec: metin LLM'i varsa ondan, yoksa istemci-tarafı mockDesign.
        const d = s.textAvailable ? await this.ai.chat(p, this.i18n.locale()) : this.ai.mockDesign(p);
        this.design.set(d);
        await this.genImage();
      } else {
        // Görsel üretimi yok → demo + prosedürel görsel
        this.demoDesign(p);
      }
    } catch {
      // Beklenmedik hata → demo'ya düş
      this.demoDesign(p);
    } finally {
      this.loading.set(false);
    }
    this.persistGenerated();
  }

  /** Üretilen tasarımı veritabanına kaydeder (sessiz-başarısız; backend kapalıysa atlar). */
  private persistGenerated(): void {
    const d = this.design();
    if (!d) return;
    void this.backend.saveDesign({
      name: d.title,
      artist: 'AI Studio',
      pattern: this.patternFromSpec(d),
      category: 'ai',
      colors: d.colors,
      shapes: [d.shape],
      img: this.imageSrc() ?? '',
      prompt: d.designPrompt,
      source: d.source === 'demo' ? 'demo' : 'ai_studio',
    });
  }

  /** Demo tasarım + istemci tarafı prosedürel görseli hemen ayarlar. */
  private demoDesign(prompt: string): void {
    const demo = this.ai.mockDesign(prompt);
    // Demo modda (Flux yokken) "Farklı tasarım" GÖRÜNÜR değişsin diye rastgele varyasyon.
    // Gerçek çeşitlilik Flux 1.1 Pro bağlanınca gelir.
    const palette = ['gold', 'red', 'pink', 'blue', 'black', 'white', 'chrome', 'green', 'purple', 'nude', 'silver'];
    const patterns = ['french', 'marble', 'galaxy', 'chrome', 'ombre', 'line', 'glossy'];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    demo.colors = (demo.colors.length ? [...demo.colors] : [pick(palette)]).concat(pick(palette));
    demo.patterns = [pick(patterns)];
    this.design.set(demo);
    this.image.set(this.proceduralImage(demo));
  }

  async genImage(): Promise<void> {
    const d = this.design();
    if (!d) return;
    this.imgLoading.set(true);
    this.error.set(null);
    this.imageFallback.set(false);
    try {
      // Görsel üretimi mevcutsa (Flux 1.1 Pro / paid) GERÇEK görsel üret;
      // tasarım-spec demo/heuristik olsa bile. Yoksa prosedürel önizlemeye düş.
      const s = this.status();
      if (!s?.imageGenAvailable) {
        this.imageFallback.set(true);
        this.image.set(this.proceduralImage(d));
        return;
      }
      const img = await this.ai.generateImage({
        prompt: d.designPrompt || d.title,
        style: d.style,
        shape: d.shape,
        colors: d.colors,
        finish: d.finish,
        image: this.handImg()?.imageUrl,
      });
      this.image.set(img);
    } catch (e) {
      // Gerçek üretim başarısızsa prosedürel önizlemeye düş (ama hatayı gizleme — konsola yaz)
      console.error('[AI] görsel üretimi başarısız, demo önizlemeye düşülüyor:', e);
      this.imageFallback.set(true);
      this.image.set(this.proceduralImage(d));
    } finally {
      this.imgLoading.set(false);
    }
  }

  /**
   * Az önce üretilen İZOLE tasarımı (el fotoğrafı olmadan üretilmiş — bkz. `image()!.edited`),
   * kullanıcının GERÇEK el fotoğrafına Perfect Corp Nail VTO ile bindirir. El fotoğrafı yoksa
   * kullanıcıyı yukarıdaki "Sanal deneme" kartından fotoğraf eklemeye yönlendirir.
   */
  async tryOnRealPhoto(): Promise<void> {
    const img = this.image();
    if (!img) return;
    const hand = this.handImg();
    if (!hand) {
      this.nailVtoError.set(this.i18n.t('studio_nailvto_need_photo'));
      return;
    }
    this.nailVtoLoading.set(true);
    this.nailVtoError.set(null);
    this.nailVtoResult.set(null);
    try {
      const result = await this.ai.tryOnPhoto({ handImage: hand.imageUrl, designFilename: img.filename });
      this.nailVtoResult.set(result.imageUrl);
    } catch (e) {
      console.error('[NailVTO] bindirme başarısız:', e);
      this.nailVtoError.set(this.i18n.t('studio_nailvto_error'));
    } finally {
      this.nailVtoLoading.set(false);
    }
  }

  /** Tasarımdan istemci tarafında zengin bir tırnak önizlemesi üretir (data URL). */
  private proceduralImage(d: DesignSpec): GeneratedImage {
    const url = renderNailThumb(d.colors, this.patternFromSpec(d), 640, 400);
    return {
      imageUrl: url, filename: 'demo.png', prompt: d.designPrompt,
      style: d.style, shape: d.shape, colors: d.colors, finish: d.finish, size: 0, provider: 'demo',
    };
  }

  /** Tasarım stili/desenlerinden çizim desenini belirler. */
  private patternFromSpec(d: DesignSpec): string {
    const tokens = [d.style, ...(d.patterns ?? [])].map((x) => (x ?? '').toLowerCase());
    for (const p of ['french', 'marble', 'galaxy', 'chrome', 'ombre', 'line']) {
      if (tokens.includes(p)) return p;
    }
    if (d.finish === 'chrome') return 'chrome';
    return 'glossy';
  }

  /** Görsel hakkı bitince Mağaza'ya yönlendirir. */
  goShop(): void {
    void this.router.navigate(['/shop']);
  }

  /** Üretilen tasarımı bir Design nesnesine çevirir (favori için). */
  readonly genDesign = computed<Design | null>(() => {
    const d = this.design();
    if (!d) return null;
    return {
      id: this.favId(),
      name: d.title,
      artist: 'AI Studio',
      grad: 'linear-gradient(135deg,#f3e5a8,#b8912e)',
      img: this.imageSrc() ?? '',
      pattern: this.patternFromSpec(d),
      category: 'ai',
      shapes: [d.shape],
      tones: [],
      undertones: [],
      seasons: ['all'],
      colors: d.colors,
      popular: false,
      rating: 0,
      badge: 'new',
    };
  });

  /** Üretilen tasarımı favorilere ekler/çıkarır. */
  toggleFav(): void {
    const g = this.genDesign();
    if (g) this.fav.toggle(g);
  }

  // ————————————————— Sanal deneme: el fotoğrafı kaynağı —————————————————

  /** Dosya seçiciyi aç (el fotoğrafı yükle). */
  pickHandFile(): void {
    this.stopHandCamera();
    this.handFile().nativeElement.click();
  }

  /** Yüklenen el fotoğrafını ölçekle, landmark çıkar, depola. */
  onHandFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const work = document.createElement('canvas');
      const maxW = 1280;
      const scale = Math.min(1, maxW / img.naturalWidth);
      work.width = Math.round(img.naturalWidth * scale);
      work.height = Math.round(img.naturalHeight * scale);
      work.getContext('2d')?.drawImage(img, 0, 0, work.width, work.height);
      void this.processHandCanvas(work, 'upload');
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => this.handError.set(this.i18n.t('err_camera'));
    img.src = URL.createObjectURL(f);
  }

  /** Stüdyo içi kamerayı aç (el fotoğrafı çek). */
  async startHandCamera(): Promise<void> {
    this.handError.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('[Studio] getUserMedia yok — kamera desteklenmiyor.');
      this.handError.set(this.i18n.t('err_camera'));
      return;
    }
    try {
      this.handStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false,
      });
      this.camOn.set(true);
      // video elemanı @if ile yeni render olduğundan bir tick bekle
      setTimeout(() => {
        const v = this.handVideo()?.nativeElement;
        if (v) { v.srcObject = this.handStream; void v.play(); }
      }, 0);
    } catch (e) {
      console.error('[Studio] Kamera erişim hatası:', e);
      this.handError.set(this.i18n.t('err_camera'));
      this.camOn.set(false);
    }
  }

  stopHandCamera(): void {
    this.handStream?.getTracks().forEach((t) => t.stop());
    this.handStream = null;
    const v = this.handVideo()?.nativeElement;
    if (v) v.srcObject = null;
    this.camOn.set(false);
  }

  /** Kameradan kareyi yakala, landmark çıkar, depola. */
  async captureHand(): Promise<void> {
    const v = this.handVideo()?.nativeElement;
    if (!v || !v.videoWidth) { this.handError.set(this.i18n.t('cam_not_ready')); return; }
    const work = document.createElement('canvas');
    work.width = v.videoWidth; work.height = v.videoHeight;
    work.getContext('2d')?.drawImage(v, 0, 0, work.width, work.height);
    this.stopHandCamera();
    await this.processHandCanvas(work, 'upload');
  }

  /** Ortak: kareden landmark çıkar (varsa analizi paylaş) ve el fotoğrafını depola. */
  private async processHandCanvas(work: HTMLCanvasElement, source: 'upload' | 'demo'): Promise<void> {
    this.handError.set(null);
    let landmarks = null as HandImage['landmarks'];
    try {
      await this.hands.init();
      const res = this.hands.analyze(work);
      if (res.handDetected) {
        landmarks = res.landmarks;
        this.analysisStore.set({
          toneKey: res.toneKey, undertone: res.undertone,
          fingerLength: res.fingerLength, nailShape: res.nailShape, lab: res.lab,
        });
      } else {
        console.warn('[Studio] El bulunamadı — tırnak tespiti manuel olacak.');
      }
    } catch (e) {
      console.warn('[Studio] MediaPipe landmark çıkarılamadı, manuel tespite düşülecek:', e);
    }
    try {
      this.handStore.set({
        imageUrl: work.toDataURL('image/jpeg', 0.92),
        width: work.width, height: work.height, landmarks, source,
      });
    } catch {
      this.handError.set('Fotoğraf işlenemedi, farklı bir görsel deneyin.');
    }
  }

  ngOnDestroy(): void {
    this.stopHandCamera();
  }

  pct(n: number): number {
    return Math.round(n * 100);
  }

  colorHex(name: string): string {
    const map: Record<string, string> = {
      red: '#d24b4b', gold: '#d4af37', pink: '#e6a4c4', blue: '#4b78d2', black: '#1c1c22',
      white: '#f3ecdd', chrome: '#c8d0da', green: '#3ecf8e', nude: '#d9bfa3', silver: '#c0c0c8',
      purple: '#8a5bd0', burgundy: '#7a1f2e', navy: '#243b6b', coral: '#f08a6a', lavender: '#c9b6e6',
      cream: '#efe3cc', bronze: '#b0824a', emerald: '#1f8f63', wine: '#6e2233',
    };
    return map[name.toLowerCase()] ?? '#b8ad97';
  }
}
