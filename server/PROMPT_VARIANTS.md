# Studio görsel üretimi — kaydedilmiş prompt varyantları (referans, henüz aktif değil)

Bu dosya, `server/ai.js`'teki `buildEditPrompt`'a henüz işlenmemiş ama kullanıcı tarafından
beğenilmiş, ileride kullanılabilecek alternatif prompt yaklaşımlarını saklar. 14 Ağustos 2026
tarihli test oturumunda (`WhatsApp Image 2026-08-06 at 15.42.49 (2).jpeg` referans fotoğrafıyla)
üretildi.

## C) Krom/metalik aksan (küçük şekil, tam kaplama değil)

```
Edit the uploaded image only. Preserve the original hand, fingers, skin, pose, lighting, shadows,
background, camera angle and image composition exactly. Do not regenerate the hand. Do not create
new fingers or nails. Look at the nails in the uploaded photo and identify their current
bare/natural color. That EXACT bare nail color must remain unchanged on every nail — the single
most important rule. On top of that unchanged bare nail, add ONE small chrome-mirror foil accent
shape per nail (a small metallic silver comma/swirl shape, like a tiny broken-glass chrome sticker)
plus one small star charm in gold — small accent shapes only, the rest of the nail stays bare, NOT
a full chrome coating. Apply the motif to EVERY SINGLE visible nail in the photo — all fingers and
the thumb, none skipped. Center the motif on each nail plate, balanced from cuticle to tip and
proportioned to that nail's size. Render at maximum image fidelity: ultra-high detail, sharp focus,
high-resolution macro photography, realistic light reflections, no blur, no noise. Do not alter
skin, fingers, hand anatomy, background, pose, or camera angle. Do not replace the entire image.
Do not modify anything outside the nail areas.
```

Not: Sonuçta taban tam boyanmadı ama beklenenden daha kapsamlı bir gümüş simli doku oluştu
(opak değil, ince simli). Kullanıcı görsel sonucu beğendi, saklanıyor.

## D) Yarı saydam renkli zemin + üzerine net desen

```
Edit the uploaded image only. Preserve the original hand, fingers, skin, pose, lighting, shadows,
background, camera angle and image composition exactly. Do not regenerate the hand. Do not create
new fingers or nails. Keep the nail shape and overall bare look from the original photo. Apply a
very light, sheer, semi-transparent color wash across each nail (like a barely-there sheer gel
polish you can still see the natural nail through — NOT an opaque solid color) in a soft blush-pink
tone, and on top of that sheer wash add a clearly visible gold star and crescent moon motif, crisp
and well-defined. The sheer wash must stay translucent — the natural nail underneath, its texture
and slight color variation, should still be faintly visible through it, unlike an opaque nail
polish. Apply the motif to EVERY SINGLE visible nail in the photo — all fingers and the thumb, none
skipped. Center the motif on each nail plate, balanced from cuticle to tip and proportioned to that
nail's size. Render at maximum image fidelity: ultra-high detail, sharp focus, high-resolution
macro photography, realistic light reflections, no blur, no noise. Do not alter skin, fingers, hand
anatomy, background, pose, or camera angle. Do not replace the entire image. Do not modify anything
outside the nail areas.
```

Not: Kullanıcının "desenler güzel, şimdi arkasına renkte eklensin" isteğine doğrudan cevap.
Opak boyama değil ama tamamen çıplak da değil — orta yol. Kullanıcı beğendi, saklanıyor.

## E) Kelebek + lila zemin, üst-orta hizalı (kullanıcı onayladı, EN İYİ konumlama)

```
Edit the uploaded image only. Preserve the original hand, fingers, skin, pose, lighting, shadows,
background, camera angle and image composition exactly. Do not regenerate the hand. Do not create
new fingers or nails. Keep the nail shape and overall bare look from the original photo. Apply a
very light, sheer, semi-transparent color wash across each nail (like a barely-there sheer gel
polish you can still see the natural nail through — NOT an opaque solid color) in a soft
lavender-lilac tone, and on top of that sheer wash add one small, delicate butterfly motif per nail
in white and lilac tones with fine gold antennae outlines, crisp and well-defined. The sheer wash
must stay translucent — the natural nail underneath should still be faintly visible through it,
unlike an opaque nail polish. CRITICAL PLACEMENT RULE: each butterfly must sit centered horizontally
(equal margin left and right) but positioned in the UPPER-CENTER of the nail plate, closer to the
cuticle than to the free edge/tip — roughly one third of the way down from the cuticle, not in the
exact vertical middle and not near the tip. The butterfly size should be small enough that clear
empty nail margin remains on all sides. MANDATORY: there are FIVE visible nails (thumb, index,
middle, ring, pinky). Place one centered butterfly on EACH of the five, none skipped. Render at
maximum image fidelity: ultra-high detail, sharp focus, high-resolution macro photography, realistic
light reflections, no blur, no noise. Do not alter skin, fingers, hand anatomy, background, pose, or
camera angle. Do not replace the entire image. Do not modify anything outside the nail areas.
```

Not: Kullanıcı onayladı — 5/5 tırnakta net kelebek, kutiküle yakın (üst 1/3), dengeli marj.
Şu ana kadarki en tutarlı/en beğenilen konumlama talimatı. **Referans olarak bu sürüm kullanılmalı.**

### Denenip vazgeçilen: "her tırnağın kendi eni/boyunu ölç" talimatı

Kullanıcı "tırnağın eni ve boyunu ölçüp ona göre ortalasın" istedi — CRITICAL PLACEMENT RULE'a
"first assess that specific nail's own visible width and length... scale the butterfly size to that
nail's own measured proportions" eklendi. Sonuç: pozisyon kalitesi korundu ama kapsama 5/5'ten
3/5'e düştü (muhtemelen talimat uzayıp karmaşıklaşınca model dikkatini dağıttı, ya da salt
üretim varyansı — aynı prompt farklı çalıştırmalarda farklı sonuç verebiliyor). Bu haliyle
yukarıdaki (E) sürümden daha iyi değil, kaydedilmedi. İleride tekrar denenebilir ama garanti
vermiyor — görsel modelin (FLUX Kontext) metin üzerinden gerçek piksel ölçümü yapamayacağını,
sadece "büyük/küçük" gibi göreceli ipuçlarını yorumlayabildiğini unutma.

## Diğer bulgular (bu oturumdan)

- **Koyu tonlar** (lacivert, muhtemelen bordo/mat siyah) "sadece desen" kuralını kırıp tüm tırnağı
  boyatma eğiliminde — "küçük 3D mücevher/taş" çerçevesi (bkz. A_dark_gem testi) kısmen çözüyor
  (taban boyanmıyor) ama 5 tırnağın hepsine uygulanma oranı düşük kaldı (2/5), iyileştirme gerekir.
- **Açık/metalik/orta ton renkler** (altın, gümüş, yeşil, pembe, siyah aksan) "sadece desen"
  kuralıyla güvenilir çalışıyor.
- **Çiçek (papatya) teması** çok başarılı sonuç verdi, havuza eklenebilir.
- **Geometrik tema** çalıştı ama görsel olarak fazla ince/silik kaldı, daha belirgin denenebilir.
