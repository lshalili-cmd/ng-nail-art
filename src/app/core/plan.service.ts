import { Injectable, signal } from '@angular/core';

/** Kullanıcının seçili üyelik planını kalıcı tutar (localStorage). */
@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly KEY = 'ngnail-plan';
  readonly current = signal<string>(this.load());

  select(id: string): void {
    this.current.set(id);
    try { localStorage.setItem(this.KEY, id); } catch { /* yoksa geç */ }
  }

  private load(): string {
    try { return localStorage.getItem(this.KEY) || 'free'; } catch { return 'free'; }
  }
}
