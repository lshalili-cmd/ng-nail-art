import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { Design } from './data.service';
import { renderNailThumb } from './nail-art';

/** Backend'e (Express + Prisma) HTTP erişimi. Backend kapalıysa sessizce boş döner. */
@Injectable({ providedIn: 'root' })
export class BackendService {
  private readonly http = inject(HttpClient);

  /** Veritabanındaki kayıtlı tasarımlar (yoksa/backend kapalıysa boş dizi). */
  async getDesigns(): Promise<Design[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; designs: ServerDesign[] }>('/api/designs').pipe(timeout(5000)),
      );
      if (!res.success || !res.designs) return [];
      return res.designs.map((d) => this.toDesign(d));
    } catch {
      return [];
    }
  }

  /** Bir tasarımı veritabanına kaydeder. Başarısızsa null döner. */
  async saveDesign(input: SaveDesignInput): Promise<Design | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; design: ServerDesign }>('/api/designs', input).pipe(timeout(8000)),
      );
      return res.success && res.design ? this.toDesign(res.design) : null;
    } catch {
      return null;
    }
  }

  private toDesign(d: ServerDesign): Design {
    const colors = d.colors ?? [];
    const pattern = d.pattern ?? 'glossy';
    return {
      id: d.id,
      name: d.name,
      artist: d.artist || 'AI Studio',
      grad: 'linear-gradient(135deg,#f3e5a8,#b8912e)',
      img: d.img && d.img.length > 0 ? d.img : renderNailThumb(colors, pattern),
      pattern,
      category: d.category || 'ai',
      shapes: d.shapes ?? [],
      tones: d.tones ?? [],
      undertones: d.undertones ?? [],
      seasons: d.seasons ?? ['all'],
      colors,
      popular: !!d.popular,
      rating: d.rating || 0,
      badge: d.source === 'ai_studio' ? 'new' : undefined,
    };
  }
}

interface ServerDesign {
  id: number;
  name: string;
  artist?: string;
  pattern?: string;
  category?: string;
  colors?: string[];
  shapes?: string[];
  tones?: string[];
  undertones?: string[];
  seasons?: string[];
  img?: string;
  source?: string;
  popular?: boolean;
  rating?: number;
}

export interface SaveDesignInput {
  name: string;
  artist?: string;
  pattern?: string;
  category?: string;
  colors?: string[];
  shapes?: string[];
  seasons?: string[];
  img?: string;
  prompt?: string;
  source?: string;
}
