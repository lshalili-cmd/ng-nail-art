import { Injectable, computed, signal } from '@angular/core';

/** Kullanıcının favori tasarımlarını kalıcı tutan sinyal tabanlı servis (localStorage). */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly KEY = 'ngnail-favs';
  readonly ids = signal<number[]>(this.load());
  readonly count = computed(() => this.ids().length);

  /** id favoride mi? (sinyal okur → şablonlarda reaktif) */
  has(id: number): boolean {
    return this.ids().includes(id);
  }

  /** Favori durumunu değiştir ve kaydet. */
  toggle(id: number): void {
    const cur = this.ids();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    this.ids.set(next);
    this.persist(next);
  }

  clear(): void {
    this.ids.set([]);
    this.persist([]);
  }

  private load(): number[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : [];
    } catch {
      return [];
    }
  }

  private persist(v: number[]): void {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(v));
    } catch {
      /* localStorage yoksa sessizce geç */
    }
  }
}
