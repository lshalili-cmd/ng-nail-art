import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'NGNAILART',
  },
  {
    path: 'explore',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/explore/explore.component').then((m) => m.ExploreComponent),
    title: 'Keşfet — NGNAILART',
  },
  {
    path: 'scan',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/scan/scan.component').then((m) => m.ScanComponent),
    title: 'Tara — NGNAILART',
  },
  {
    path: 'shop',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shop/shop.component').then((m) => m.ShopComponent),
    title: 'Mağaza — NGNAILART',
  },
  {
    // Profil = üye olmayan için ÜYELİK/GİRİŞ sayfası (kapı DIŞINDA bırakılır).
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    title: 'Profil — NGNAILART',
  },
  {
    path: 'studio',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/studio/studio.component').then((m) => m.StudioComponent),
    title: 'AI Stüdyo — NGNAILART',
  },
  {
    path: 'design/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/design-detail/design-detail.component').then((m) => m.DesignDetailComponent),
    title: 'Tasarım — NGNAILART',
  },
  {
    // Yönetici paneli kendi girişini yapar (admin doğrulaması içeride).
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    title: 'Yönetici — NGNAILART',
  },
  {
    // Yasal metinler herkese açık (kayıt ekranındaki KVKK/şartlar linkleri için gerekli).
    path: 'legal',
    loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent),
    title: 'Yasal — NGNAILART',
  },
  { path: '**', redirectTo: '' },
];
