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

## Sonraki adım

Prisma + veritabanı (tasarım/favori/analiz kalıcılığı) bir sonraki artımda eklenecek.
