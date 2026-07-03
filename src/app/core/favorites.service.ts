import { Injectable, computed, signal } from '@angular/core';
import { Design } from './data.service';

/**
 * Favori tasarımları kalıcı tutar (localStorage). Katalog tasarımlarını da,
 * AI Studio'da üretilen tasarımları da tam nesne olarak saklar — böylece her ikisi de
 * Profil > Favorilerim'de gösterilebilir.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly KEY = 'ngnail-favs';
  readonly items = signal<Design[]>(this.load());
  readonly count = computed(() => this.items().length);

  /** id favoride mi? (sinyal okur → şablonlarda reaktif) */
  has(id: number): boolean {
    return this.items().some((d) => d.id === id);
  }

  /** Tasarımı favoriye ekler/çıkarır ve kaydeder. */
  toggle(design: Design): void {
    const cur = this.items();
    const next = cur.some((d) => d.id === design.id)
      ? cur.filter((d) => d.id !== design.id)
      : [...cur, design];
    this.items.set(next);
    this.persist(next);
  }

  clear(): void {
    this.items.set([]);
    this.persist([]);
  }

  private load(): Design[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(v: Design[]): void {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(v));
    } catch {
      /* localStorage yoksa sessizce geç */
    }
  }
}
