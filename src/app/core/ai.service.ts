import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { ApiEnvelope, AiStatus, DesignSpec, GeneratedImage, Locale4 } from './ai.models';

/** API kök adresi. Boş = göreli ('/api'); geliştirmede proxy.conf.json backend'e yönlendirir. */
const API = '';

export interface AiError {
  code: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);

  /** Backend AI durumunu sorgular. Backend yoksa null döner (hata fırlatmaz). */
  async status(): Promise<AiStatus | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiEnvelope<AiStatus>>(`${API}/api/ai/status`),
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  }

  /** Metin isteğinden yapılandırılmış tasarım üretir (/api/ai/chat). */
  async chat(prompt: string, language: Locale4 = 'tr'): Promise<DesignSpec> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiEnvelope<DesignSpec>>(`${API}/api/ai/chat`, { prompt, language })
          .pipe(timeout(8000)),
      );
      if (!res.success || !res.data) {
        throw this.err(res.code, res.error);
      }
      return res.data;
    } catch (e) {
      throw this.normalize(e);
    }
  }

  /** Tasarımdan gerçek görsel üretir (/api/ai/generate-image). */
  async generateImage(input: {
    prompt: string;
    style?: string;
    shape?: string;
    colors?: string[];
    finish?: string;
    tier?: 'wow' | 'standard';
  }): Promise<GeneratedImage> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiEnvelope<GeneratedImage>>(`${API}/api/ai/generate-image`, input)
          .pipe(timeout(30000)),
      );
      if (!res.success || !res.data) {
        throw this.err(res.code, res.error);
      }
      return res.data;
    } catch (e) {
      throw this.normalize(e);
    }
  }

  /** Backend/anahtar yokken çalışan demo tasarım — UI'yı denenebilir tutar. */
  mockDesign(prompt: string): DesignSpec {
    const p = prompt.toLowerCase();
    const colorMap: [string, string][] = [
      ['kırmızı', 'red'], ['red', 'red'], ['altın', 'gold'], ['gold', 'gold'],
      ['pembe', 'pink'], ['pink', 'pink'], ['mavi', 'blue'], ['blue', 'blue'],
      ['siyah', 'black'], ['black', 'black'], ['beyaz', 'white'], ['white', 'white'],
      ['krom', 'chrome'], ['chrome', 'chrome'], ['yeşil', 'green'], ['green', 'green'],
    ];
    const colors = colorMap.filter(([k]) => p.includes(k)).map(([, v]) => v);
    const styleMap: [string, string][] = [
      ['french', 'french'], ['gelin', 'bridal'], ['bridal', 'bridal'], ['minimal', 'minimalist'],
      ['galaksi', 'galaxy'], ['galaxy', 'galaxy'], ['mermer', 'marble'], ['marble', 'marble'],
      ['lüks', 'luxury'], ['luxury', 'luxury'],
    ];
    const style = (styleMap.find(([k]) => p.includes(k)) ?? ['', 'luxury'])[1];
    const finish = p.includes('mat') || p.includes('matte') ? 'matte'
      : p.includes('krom') || p.includes('chrome') ? 'chrome' : 'glossy';
    return {
      source: 'demo',
      usesGallery: false,
      title: prompt.trim().slice(0, 40) || 'Demo Tasarım',
      description: 'Bu, backend/anahtar bağlı olmadığında gösterilen bir demo tasarımdır. Gerçek üretim için AI backend\'ini bağlayın.',
      designPrompt: prompt.trim(),
      colors: colors.length ? colors : ['gold', 'nude'],
      effects: finish === 'chrome' ? ['chrome', 'shine'] : ['gloss'],
      patterns: [style],
      style,
      finish,
      shape: 'almond',
      extras: [],
      reason: 'Anahtar kelimelere göre yerel olarak üretilmiş demo öneri.',
      tags: [style, finish, ...colors].filter(Boolean),
      confidence: 0.6,
    };
  }

  private err(code?: string, message?: string): AiError {
    return { code: code ?? 'AI_ERROR', message: message ?? 'Bilinmeyen bir hata oluştu.' };
  }

  private normalize(e: unknown): AiError {
    console.error('[AI] İstek hatası:', e);
    if (e instanceof HttpErrorResponse) {
      const body = e.error as ApiEnvelope<unknown> | null;
      if (e.status === 0) {
        return { code: 'NO_BACKEND', message: 'AI backend\'ine ulaşılamadı. Sunucu çalışıyor mu?' };
      }
      return this.err(body?.code, body?.error ?? e.message);
    }
    if (e && typeof e === 'object' && 'code' in e && 'message' in e) {
      return e as AiError;
    }
    return this.err();
  }
}
