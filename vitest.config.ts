import { defineConfig } from 'vitest/config';

// Birim testleri (saf mantık): hızlı, tarayıcısız (node ortamı).
// Angular bileşen testleri gerekirse ileride jsdom ortamı eklenebilir.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
