# ngNailArt Backend (Express + AI)

`localhost:3000`'de çalışır. Angular dev sunucusu `/api` ve `/images` isteklerini buraya
yönlendirir (kök `proxy.conf.json`). Böylece AI Studio gerçek tasarım + görsel üretir.

## Çalıştırma

```bash
cd server
npm install
npm start          # veya: npm run dev  (dosya değişince yeniden başlar)
```

Bu hâliyle backend **anahtarsız da çalışır**: `/api/ai/status` "not_configured" döner,
üretim çağrıları 503 verir, frontend otomatik olarak demo/prosedürel önizlemeye düşer.
(Böylece Angular tarafındaki `ECONNREFUSED` proxy hataları da kaybolur.)

## Gerçek AI'yı açmak

1. `.env.example` dosyasını **`.env`** olarak kopyalayın ve en az bir anahtar girin.
2. Kullanacağınız sağlayıcının SDK'sını kurun (yalnızca gerekeni):

   ```bash
   npm i @google/genai     # Gemini + Imagen 3
   npm i openai            # OpenAI GPT + DALL·E 3
   npm i replicate         # Flux 1.1 Pro (isteğe bağlı)
   ```

3. `npm start` ile yeniden başlatın. `http://localhost:3000/api/ai/status` "ready" göstermeli.

Öncelik sırası: Gemini → OpenAI (görsel: Imagen 3 → DALL·E 3 → Flux).

## Uçlar

- `GET  /api/health`
- `GET  /api/ai/status`
- `POST /api/ai/chat`            `{ prompt, language }`  → tasarım JSON'u
- `POST /api/ai/generate-image`  `{ prompt, style, shape, colors, finish, tier }` → görsel

## Veritabanı (Prisma + SQLite)

Harici veritabanı sunucusu gerekmez; SQLite dosyası (`prisma/dev.db`) kullanılır.

İlk kurulum (`server` klasöründe):

```bash
copy .env.example .env      # Windows (veya: cp .env.example .env)
npm install                 # @prisma/client + prisma CLI dahil
npm run db:setup            # prisma generate + migrate + seed (örnek tasarımlar)
npm start
```

`npm run db:setup` şunları yapar: Prisma client üretir, `prisma/dev.db` veritabanını oluşturur,
birkaç örnek tasarım ekler. **Veritabanı kurulmadan da sunucu çalışır** — DB uçları o zaman
`503 DB_NOT_READY` döner (AI uçları etkilenmez).

### DB uçları

- `GET  /api/designs`  ·  `POST /api/designs`
- `GET  /api/favorites`  ·  `POST /api/favorites`  ·  `DELETE /api/favorites/:designId`  (query: `userId`, varsayılan `guest`)
- `POST /api/analysis`  ·  `GET /api/analysis/latest`

### Sonraki adım

Frontend'i bu uçlara bağlamak: AI Studio üretimlerini `POST /api/designs` ile kaydetmek,
favorileri `localStorage` yerine `/api/favorites`'e taşımak, taramaları `/api/analysis`'e yazmak.
