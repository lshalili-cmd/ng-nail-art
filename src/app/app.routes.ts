import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Miracle Nail Art AI',
  },
  {
    path: 'explore',
    loadComponent: () => import('./pages/explore/explore.component').then((m) => m.ExploreComponent),
    title: 'Keşfet — Miracle Nail Art AI',
  },
  {
    path: 'scan',
    loadComponent: () => import('./pages/scan/scan.component').then((m) => m.ScanComponent),
    title: 'Tara — Miracle Nail Art AI',
  },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop/shop.component').then((m) => m.ShopComponent),
    title: 'Mağaza — Miracle Nail Art AI',
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    title: 'Profil — Miracle Nail Art AI',
  },
  {
    path: 'studio',
    loadComponent: () => import('./pages/studio/studio.component').then((m) => m.StudioComponent),
    title: 'AI Stüdyo — Miracle Nail Art AI',
  },
  {
    path: 'ar',
    loadComponent: () => import('./pages/ar/ar.component').then((m) => m.ArComponent),
    title: 'AR Deneme — Miracle Nail Art AI',
  },
  {
    path: 'design/:id',
    loadComponent: () => import('./pages/design-detail/design-detail.component').then((m) => m.DesignDetailComponent),
    title: 'Tasarım — Miracle Nail Art AI',
  },
  { path: '**', redirectTo: '' },
];
