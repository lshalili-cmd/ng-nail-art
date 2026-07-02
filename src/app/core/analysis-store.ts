import { Injectable, signal } from '@angular/core';
import { AnalysisInput } from './recommendation';

/** Son el analizini uygulama genelinde paylaşan sinyal deposu. */
@Injectable({ providedIn: 'root' })
export class AnalysisStore {
  readonly current = signal<AnalysisInput | null>(null);

  set(a: AnalysisInput): void {
    this.current.set(a);
  }

  clear(): void {
    this.current.set(null);
  }
}
