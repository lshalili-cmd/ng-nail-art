import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Miracle Nail Art AI',
  },
  {
    path: 'explore',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/explore/explore.component').then((m) => m.ExploreComponent),
    title: 'Keşfet — Miracle Nail Art AI',
  },
  {
    path: 'scan',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/scan/scan.component').then((m) => m.ScanComponent),
    title: 'Tara — Miracle Nail Art AI',
  },
  {
    path: 'shop',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shop/shop.component').then((m) => m.ShopComponent),
    title: 'Mağaza — Miracle Nail Art AI',
  },
  {
    // Profil = üye olmayan için ÜYELİK/GİRİŞ sayfası (kapı DIŞINDA bırakılır).
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    title: 'Profil — Miracle Nail Art AI',
  },
  {
    path: 'studio',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/studio/studio.component').then((m) => m.StudioComponent),
    title: 'AI Stüdyo — Miracle Nail Art AI',
  },
  {
    path: 'ar',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/ar/ar.component').then((m) => m.ArComponent),
    title: 'AR Deneme — Miracle Nail Art AI',
  },
  {
    path: 'design/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/design-detail/design-detail.component').then((m) => m.DesignDetailComponent),
    title: 'Tasarım — Miracle Nail Art AI',
  },
  {
    // Yönetici paneli kendi girişini yapar (admin doğrulaması içeride).
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    title: 'Yönetici — Miracle Nail Art AI',
  },
  {
    // Yasal metinler herkese açık (kayıt ekranındaki KVKK/şartlar linkleri için gerekli).
    path: 'legal',
    loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent),
    title: 'Yasal — Miracle Nail Art AI',
  },
  { path: '**', redirectTo: '' },
];
