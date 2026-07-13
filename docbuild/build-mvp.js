const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, LevelFormat,
} = require('docx');

const GOLD = '9A7B1F';
const DARK = '1A1405';
const MUT = '6B6152';

const H = (t, level) => new Paragraph({ heading: level, spacing: { before: 260, after: 120 }, children: [new TextRun({ text: t, color: level === HeadingLevel.HEADING_1 ? DARK : GOLD, bold: true })] });
const P = (t, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: Array.isArray(t) ? t : [new TextRun({ text: t, size: 22 })] });
const B = (t) => new TextRun({ text: t, bold: true, size: 22 });
const T = (t) => new TextRun({ text: t, size: 22 });

const bullet = (t, lvl = 0) => new Paragraph({
  numbering: { reference: 'b', level: lvl }, spacing: { after: 70 },
  children: Array.isArray(t) ? t : [new TextRun({ text: t, size: 22 })],
});
const num = (t) => new Paragraph({
  numbering: { reference: 'n', level: 0 }, spacing: { after: 90 },
  children: Array.isArray(t) ? t : [new TextRun({ text: t, size: 22 })],
});

const cell = (t, { bold = false, w, shad, color } = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: shad ? { type: ShadingType.CLEAR, fill: shad, color: 'auto' } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: [new Paragraph({ children: [new TextRun({ text: t, bold, size: 20, color: color || '000000' })] })],
});

const COLS = [3400, 5960];
const trow = (a, b, head = false) => new TableRow({
  children: [
    cell(a, { bold: head, w: COLS[0], shad: head ? GOLD : 'F5EFDD', color: head ? 'FFFFFF' : DARK }),
    cell(b, { bold: head, w: COLS[1], shad: head ? GOLD : undefined, color: head ? 'FFFFFF' : undefined }),
  ],
});
const table = (rows) => new Table({ columnWidths: COLS, width: { size: COLS[0] + COLS[1], type: WidthType.DXA }, rows });

const rule = () => new Paragraph({ spacing: { after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D8C88F' } }, children: [new TextRun('')] });

const doc = new Document({
  numbering: {
    config: [
      { reference: 'b', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 260 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 800, hanging: 260 } } } },
      ] },
      { reference: 'n', levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 260 } } } },
      ] },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Calibri' } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', run: { size: 40, bold: true, color: DARK }, paragraph: { spacing: { after: 60 } } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    children: [
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'Miracle Nail Art AI', size: 44, bold: true, color: DARK })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'MVP Yol Haritası — Yapılması Gerekenler', size: 26, color: GOLD, bold: true })] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Hazırlanma tarihi: 9 Temmuz 2026', size: 18, italics: true, color: MUT })] }),
      rule(),

      H('MVP nedir ve bu uygulamada ne demek?', HeadingLevel.HEADING_1),
      P('MVP (Minimum Viable Product / En Küçük Çalışan Ürün), bir uygulamanın gerçek kullanıcıya sunulabilecek en küçük ama uçtan uca çalışan hâlidir. Amaç mükemmel bir ürün değil; ana değeri kanıtlayan, gösterilebilen ve geri bildirim toplanabilen bir sürümdür.'),
      P([B('Bu uygulamanın ana değeri: '), T('kullanıcı elini kameraya tarar, yapay zekâ o ele/tırnağa özel bir tırnak tasarımı üretir; kullanıcı beğenir, kaydeder, AR ile parmağında dener ve satın alabilir. MVP, bu döngünün internette çalışan en küçük hâlidir.')]),

      H('1) Şu an HAZIR olanlar', HeadingLevel.HEADING_1),
      P('Aşağıdakiler tamamlandı ve yerelde çalışıyor:'),
      bullet('Kayıt / giriş + OTP doğrulama (şu an demo modda: kod ekranda görünür), şifre göster/gizle, şifremi unuttum.'),
      bullet('Açılış (splash) ekranı — 4 dilde (Türkçe, İngilizce, Rusça, Arapça), ilk açılışta gösterim.'),
      bullet([B('AI El Analizi (kamera): '), T('MediaPipe ile gerçek, cihaz-üstü çalışıyor — tırnak şekli, parmak yapısı, ten tonu. Anahtar/ücret gerektirmez.')]),
      bullet([B('AR deneme: '), T('tasarımı parmakta canlı gösterme altyapısı.')]),
      bullet('Otomatik akış: el analizi biter bitmez Stüdyo’ya geçip tasarım üretimine başlar (buton beklemeden).'),
      bullet('Tasarım önerisi: analiz sonucuna göre katalogdan puanlı eşleşmeler.'),
      bullet('Keşfet, Mağaza (planlar/paketler), Profil, Tasarım detay, Admin paneli (kullanıcılar, gelir, içerik, hata müdahalesi, bakım modu).'),
      bullet('Veritabanı (SQLite) + cihazlar arası senkron; GitHub’a otomatik yedekleme.'),

      H('2) MVP için EKSİK olanlar (öncelik sırasıyla)', HeadingLevel.HEADING_1),
      P('Gerçek, gösterilebilir bir MVP için tamamlanması gerekenler:'),
      table([
        trow('Adım', 'Ne yapılacak / neden gerekli', true),
        trow('1. Çalışan AI görsel üretimi', 'Uygulamanın KALBİ. Ücretsiz Gemini beklenen sonucu vermedi. Sağlayıcı kararı gerekiyor (aşağıda ayrı bölüm). Bu çözülmeden gerçek MVP olmaz.'),
        trow('2. Deploy (internete çıkış)', 'SQLite → PostgreSQL, backend Angular’ı sunar, render.yaml. Sonuç: herkesin girebileceği canlı bir adres.'),
        trow('3. Kayıt güvenliği (SMS)', 'OTP şu an demo (kod ekranda = güvensiz). Gerçek kullanıcı için SMS sağlayıcı (Netgsm / Twilio).'),
        trow('4. Temel yasal metinler', 'Gizlilik Politikası + KVKK aydınlatma metni. Hem kayıt için hem de ileride Play Store için zorunlu.'),
        trow('5. APK (isteğe bağlı, en son)', 'Deploy sonrası PWABuilder ile 10 dakikada Android APK/AAB. Uygulama zaten buna hazır.'),
      ]),

      H('3) Kritik karar: AI görsel üretimi', HeadingLevel.HEADING_1),
      P('Bu, MVP’nin en önemli maddesi. Ücretsiz Gemini denendi ama görsel üretmedi. Üç yol var; birini seçmek gerekiyor:'),
      P([B('Seçenek A — Başka bir AI sağlayıcı dene (önerilen). ')]),
      bullet([B('fal.ai (Flux schnell) '), T('veya '), B('Replicate: '), T('görsel başına ~0,003–0,01 $ (yani çok ucuz). Küçük deneme kredisi de veriyorlar. Kod Replicate/Flux’a zaten hazır.')]),
      bullet([B('OpenAI (DALL·E 3): '), T('daha pahalı ama çok stabil; görsel başına birkaç sent.')]),
      P([B('Seçenek B — AI’yı sonraya bırak, MVP’yi "katalog + AR" olarak çıkar. '), T('El analizi + hazır tasarım önerisi + AR deneme ile gösterilebilir bir sürüm; AI görsel üretimi ikinci aşamada eklenir.')]),
      P([B('Seçenek C — Ücretli plana geçip Gemini/Imagen kullan. '), T('Kredi kartı + faturalandırma açılırsa Imagen çalışır; ama ek kurulum ister.')]),
      P([B('Öneri: '), T('Seçenek A ile fal.ai/Replicate üzerinden Flux bağlamak — hem ucuz hem uygulamanın kalbini gerçekten çalıştırır. Karar senin.')]),

      H('4) Önerilen sıra (adım adım)', HeadingLevel.HEADING_1),
      num([B('AI kararını ver ve bağla. '), T('Seçenek A/B/C’den birini seç; çalışan görsel üretimini kur ve yerelde test et.')]),
      num([B('Yerelde uçtan uca doğrula. '), T('Kayıt → el tara → tasarım üret → beğen/kaydet → AR dene. Akış sorunsuz mu?')]),
      num([B('Deploy et. '), T('PostgreSQL + web servisi (Render). Canlı adres al, orada tekrar test et.')]),
      num([B('SMS + yasal metinleri ekle. '), T('Kayıt güvenli olsun; gizlilik/KVKK sayfaları eklensin.')]),
      num([B('APK çıkar (istenirse). '), T('PWABuilder ile canlı adresten Android paketi.')]),

      H('5) Kaba maliyet özeti', HeadingLevel.HEADING_1),
      table([
        trow('Kalem', 'Yaklaşık maliyet', true),
        trow('AI görsel (Flux schnell)', 'Görsel başına ~0,003–0,01 $ · test bedava kredilerle'),
        trow('Deploy — web servisi', 'Ücretsiz katman (uyur) veya ~7 $/ay (hep açık)'),
        trow('Deploy — PostgreSQL', 'Ücretsiz katman (30 gün) veya ~6 $/ay (kalıcı)'),
        trow('SMS (OTP)', 'Kullanıma göre; Netgsm/Twilio paketleri'),
        trow('Google Play (yayın)', '~25 $ tek seferlik (sadece Play’de yayınlarsan)'),
      ]),
      P([B('Özet: '), T('Sıfır maliyetle test edilebilir; gerçek/kalıcı kullanım için ayda ~13 $ (web + veritabanı) + görsel başına cent’ler. En kritik ve ilk adım: çalışan bir AI görsel sağlayıcısı seçip bağlamak.')], { spacing: { before: 140, after: 60 } }),
      rule(),
      new Paragraph({ children: [new TextRun({ text: 'Bu belge, uygulamanın güncel durumuna göre hazırlanmıştır ve her adımda güncellenebilir.', size: 18, italics: true, color: MUT })] }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync('/home/claude/ngNailArt/MVP-Yol-Haritasi.docx', buf);
  console.log('yazildi: MVP-Yol-Haritasi.docx', buf.length, 'bayt');
});
