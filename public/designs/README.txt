KATALOG GÖRSELLERİ (statik — bir kez üretilir, çalışma anında AI çağrısı YOK)
============================================================================

Keşfet ve Ana Sayfadaki örnek tasarımlar buradan gelir. Dosya adları:

  design-1.jpg  →  Gold Chrome
  design-2.jpg  →  Pink Ombré
  design-3.jpg  →  Galaxy Dreams
  design-4.jpg  →  French Gold
  design-5.jpg  →  Emerald Marble
  design-6.jpg  →  Nude Gold Line
  design-7.jpg  →  Bridal Pearl
  design-8.jpg  →  Red Chrome
  design-9.jpg  →  Silver Frost

NASIL DOLDURULUR (3 yol):
  1) Ücretsiz Gemini ile toplu üret:  server/scripts/gen-catalog.js  (aşağıya bak)
  2) Kendi seçtiğin görselleri koy:   yukarıdaki adlarla .jpg olarak buraya at
  3) Flux free/schnell ile üret:      REPLICATE_API_TOKEN ile gen-catalog.js

DOSYA YOKSA: uygulama otomatik olarak çizim önizlemesine düşer (hata vermez).
Yani bu klasör boşken de uygulama çalışır; görseller eklendikçe vitrin zenginleşir.

ÖNEMLİ: Flux 1.1 Pro yalnızca KULLANICIYA ÖZEL üretim içindir; vitrin/katalog
için pahalı AI çalıştırılmaz. Bu klasör tam da bunun için: bir kez üret, hep kullan.
