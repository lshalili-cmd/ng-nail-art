import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.service';
import { apiBaseInterceptor } from './core/api-base';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // SIRA ÖNEMLİ: authInterceptor önce (göreli '/api' ile token ekler),
    // sonra apiBaseInterceptor native'de mutlak canlı adrese çevirir.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, apiBaseInterceptor])),
  ],
};
