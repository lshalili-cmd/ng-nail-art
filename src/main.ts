import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// PWA: service worker'ı YALNIZCA üretim derlemesinde kaydet.
// Dev sunucuda (ng serve) isDevMode() true → atlanır, hiçbir şey bozulmaz.
// Not: @angular/service-worker import edilmez; ngsw-worker.js üretim derlemesinde oluşur.
if (!isDevMode() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('ngsw-worker.js').catch(() => { /* sessiz geç */ });
}
