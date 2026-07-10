import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface AdminStats { users: number; verified: number; paidUsers: number; designs: number; dailyDesigns: number; ordersPaid: number; revenue: number; }
export interface AdminUser { id: number; email: string; phone: string; firstName: string; lastName: string; verified: boolean; plan: string; imagesUsed: number; imagesExtra: number; role?: string; }
export interface AdminOrder { id: number; userId: string; kind: string; itemId: string; itemName: string; amount: number; currency: string; provider: string; status: string; createdAt: string; }
export interface AdminDesign { id: number; name: string; category: string; source: string; popular: boolean; rating: number; createdAt: string; }
export interface AdminBlocked { id: number; email: string; phone: string; until: number; createdAt: string; }
export interface AdminError { level: string; message: string; source: string; createdAt: string; }
export interface AdminTicket { id: number; userId: string; name: string; email: string; message: string; status: string; createdAt: string; }
export interface AdminSystem { db: boolean; ai: { provider?: string; model?: string }; payments: unknown; sms: string; mailer: boolean; maintenance: boolean; uptime: number; node: string; }

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private get<T>(url: string) { return firstValueFrom(this.http.get<T>(url).pipe(timeout(9000))); }

  stats() { return this.get<{ success: boolean; data: AdminStats }>('/api/admin/stats'); }
  users(q = '') { return this.get<{ success: boolean; users: AdminUser[] }>(`/api/admin/users${q ? '?q=' + encodeURIComponent(q) : ''}`); }
  updateUser(id: number, patch: Partial<AdminUser>) { return firstValueFrom(this.http.put<{ success: boolean; user: AdminUser }>(`/api/admin/users/${id}`, patch).pipe(timeout(9000))); }
  deleteUser(id: number) { return firstValueFrom(this.http.delete<{ success: boolean }>(`/api/admin/users/${id}`).pipe(timeout(9000))); }

  orders() { return this.get<{ success: boolean; orders: AdminOrder[]; summary: { count: number; paid: number; revenue: number } }>('/api/admin/orders'); }

  designs() { return this.get<{ success: boolean; designs: AdminDesign[] }>('/api/admin/designs'); }
  togglePopular(id: number) { return firstValueFrom(this.http.post<{ success: boolean; popular: boolean }>(`/api/admin/designs/${id}/popular`, {}).pipe(timeout(9000))); }
  deleteDesign(id: number) { return firstValueFrom(this.http.delete<{ success: boolean }>(`/api/admin/designs/${id}`).pipe(timeout(9000))); }

  blocked() { return this.get<{ success: boolean; blocked: AdminBlocked[] }>('/api/admin/blocked'); }
  unblock(id: number) { return firstValueFrom(this.http.delete<{ success: boolean }>(`/api/admin/blocked/${id}`).pipe(timeout(9000))); }

  errors() { return this.get<{ success: boolean; errors: AdminError[] }>('/api/admin/errors'); }
  clearErrors() { return firstValueFrom(this.http.delete<{ success: boolean }>('/api/admin/errors').pipe(timeout(9000))); }

  system() { return this.get<{ success: boolean; data: AdminSystem }>('/api/admin/system'); }
  setMaintenance(on: boolean) { return firstValueFrom(this.http.post<{ success: boolean; maintenance: boolean }>('/api/admin/maintenance', { on }).pipe(timeout(9000))); }

  support() { return this.get<{ success: boolean; tickets: AdminTicket[]; summary: { total: number; open: number } }>('/api/admin/support'); }
  toggleTicket(id: number) { return firstValueFrom(this.http.post<{ success: boolean; status: string }>(`/api/admin/support/${id}/close`, {}).pipe(timeout(9000))); }
  deleteTicket(id: number) { return firstValueFrom(this.http.delete<{ success: boolean }>(`/api/admin/support/${id}`).pipe(timeout(9000))); }
}
