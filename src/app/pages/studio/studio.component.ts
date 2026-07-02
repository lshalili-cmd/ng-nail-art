import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { I18nService } from '../../core/i18n.service';
import { AiService } from '../../core/ai.service';
import { AiStatus, DesignSpec, GeneratedImage } from '../../core/ai.models';

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

      <!-- Prompt -->
      <div class="composer card">
        <textarea
          [value]="prompt()"
          (input)="prompt.set($any($event.target).value)"
          [placeholder]="i18n.t('studio_prompt_ph')"
          rows="3"></textarea>
        <div class="chips-row">
          @for (s of suggestions; track s) {
            <button class="chip" (click)="prompt.set(s)">{{ s }}</button>
          }
        </div>
        <button class="btn-primary wide" (click)="generate()" [disabled]="loading() || !prompt().trim()">
          {{ loading() ? ('✨ ' + i18n.t('studio_generating')) : ('✨ ' + i18n.t('studio_generate')) }}
        </button>
        <p class="hint">{{ i18n.t('studio_hint') }}</p>
      </div>

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
          </div>

          <div class="rbody">
            <div class="rtop">
              <h3 class="rtitle">{{ d.title }}</h3>
              <span class="conf">%{{ pct(d.confidence) }}</span>
            </div>
            <p class="rdesc">{{ d.description }}</p>

            @if (d.source === 'demo') {
              <p class="demo">ℹ️ {{ i18n.t('studio_demo_note') }}</p>
            }

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
              <button class="btn-primary" (click)="genImage()" [disabled]="imgLoading()">🖼️ {{ i18n.t('studio_gen_image') }}</button>
              <button class="btn-ghost" (click)="tryAr()">📱 {{ i18n.t('studio_try_ar') }}</button>
              <button class="btn-ghost" (click)="generate()">🔄 {{ i18n.t('studio_regenerate') }}</button>
            </div>
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
    .result { overflow: hidden; margin-top: 4px; }
    .visual { position: relative; aspect-ratio: 16 / 10; display: flex; align-items: center; justify-content: center; }
    .visual img { width: 100%; height: 100%; object-fit: cover; }
    .visual .ph { font-size: 60px; opacity: 0.5; }
    .img-load { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.45); font-size: 30px; }
    .rbody { padding: 16px; }
    .rtop { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .rtitle { font-size: 18px; }
    .conf { font-size: 11px; font-weight: 700; color: var(--gold-soft);
      background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.4); padding: 2px 8px; border-radius: 999px; }
    .rdesc { margin: 8px 0 12px; font-size: 13px; color: var(--muted); line-height: 1.5; }
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
  `],
})
export class StudioComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly ai = inject(AiService);
  private readonly router = inject(Router);

  readonly prompt = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly imgLoading = signal<boolean>(false);
  readonly design = signal<DesignSpec | null>(null);
  readonly image = signal<GeneratedImage | null>(null);
  readonly error = signal<string | null>(null);
  readonly status = signal<AiStatus | null>(null);

  readonly suggestions = [
    'Altın kromlu badem French',
    'Pastel pembe minimal',
    'Galaksi temalı koyu mavi',
    'Gelin için inci beyazı',
    'Kırmızı mat coffin',
  ];

  readonly statusLabel = computed(() => {
    const s = this.status();
    if (!s) return '';
    return s.status === 'ready' ? `● ${s.provider} · ${s.model}` : '● demo';
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
    void this.ai.status().then((s) => this.status.set(s));
  }

  async generate(): Promise<void> {
    const p = this.prompt().trim();
    if (!p) return;
    this.loading.set(true);
    this.error.set(null);
    this.image.set(null);
    try {
      const d = await this.ai.chat(p, this.i18n.locale());
      this.design.set(d);
    } catch {
      // Backend yok/hatalı → sessizce demo tasarıma düş (kart "demo" notunu gösterir)
      this.design.set(this.ai.mockDesign(p));
    } finally {
      this.loading.set(false);
    }
  }

  async genImage(): Promise<void> {
    const d = this.design();
    if (!d) return;
    this.imgLoading.set(true);
    this.error.set(null);
    try {
      if (d.source === 'demo') {
        // Demo: istemci tarafında prosedürel tırnak önizlemesi üret (sunucu gerektirmez)
        this.image.set(this.proceduralImage(d));
        return;
      }
      const img = await this.ai.generateImage({
        prompt: d.designPrompt || d.title,
        style: d.style,
        shape: d.shape,
        colors: d.colors,
        finish: d.finish,
      });
      this.image.set(img);
    } catch {
      // Gerçek üretim başarısızsa prosedürel önizlemeye düş
      this.image.set(this.proceduralImage(d));
    } finally {
      this.imgLoading.set(false);
    }
  }

  /** Tasarımdan istemci tarafında 5 tırnaklı bir önizleme çizer (data URL). */
  private proceduralImage(d: DesignSpec): GeneratedImage {
    const c = document.createElement('canvas');
    c.width = 640; c.height = 400;
    const ctx = c.getContext('2d');
    if (!ctx) {
      return { imageUrl: '', filename: 'demo.png', prompt: d.designPrompt, style: d.style, shape: d.shape, colors: d.colors, finish: d.finish, size: 0, provider: 'demo' };
    }
    // Arka plan
    const bg = ctx.createLinearGradient(0, 0, 0, c.height);
    bg.addColorStop(0, '#1b1522'); bg.addColorStop(1, '#0c0a08');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);

    const a = this.colorHex(d.colors[0] ?? 'gold');
    const b = this.colorHex(d.colors[1] ?? d.colors[0] ?? 'nude');
    const heights = [190, 230, 250, 230, 190];
    const nailW = 78, gap = 26;
    const total = 5 * nailW + 4 * gap;
    let x = (c.width - total) / 2;
    for (let i = 0; i < 5; i++) {
      const h = heights[i];
      this.drawNail(ctx, x, c.height - h - 30, nailW, h, a, b, d.finish);
      x += nailW + gap;
    }
    return {
      imageUrl: c.toDataURL('image/png'), filename: 'demo.png', prompt: d.designPrompt,
      style: d.style, shape: d.shape, colors: d.colors, finish: d.finish, size: 0, provider: 'demo',
    };
  }

  private drawNail(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    a: string, b: string, finish: string,
  ): void {
    const r = w / 2;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, a); grad.addColorStop(1, b);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.quadraticCurveTo(x + w / 2, y + h + 14, x, y + h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.restore();
    // Parlaklık (finiş)
    if (finish !== 'matte') {
      ctx.fillStyle = `rgba(255,255,255,${finish === 'chrome' ? 0.55 : 0.28})`;
      ctx.beginPath();
      ctx.ellipse(x + w * 0.36, y + h * 0.4, w * 0.13, h * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  tryAr(): void {
    void this.router.navigate(['/scan']);
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
