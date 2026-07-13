const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
} = require('docx');
const fs = require('fs');

// --- palette ---
const GOLD = 'B8912E', GOLDD = '8A6A1E', INK = '2A2622', MUTED = '6B655C', ROSE = 'A85560', LINE = 'D9D2C4';

// --- helpers ---
const P = (opts) => new Paragraph(opts);
const T = (text, o = {}) => new TextRun({ text, font: 'Calibri', ...o });

function h1(text) {
  return P({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 },
    children: [T(text, { bold: true, size: 30, color: GOLDD, font: 'Georgia' })] });
}
function h2(text) {
  return P({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 },
    children: [T(text, { bold: true, size: 24, color: INK, font: 'Georgia' })] });
}
function body(runs, o = {}) {
  const kids = Array.isArray(runs) ? runs : [T(runs, { size: 21, color: INK })];
  return P({ spacing: { after: 120, line: 300 }, children: kids, ...o });
}
function bullet(text, boldLead) {
  const kids = [];
  if (boldLead) kids.push(T(boldLead + ' ', { size: 21, bold: true, color: GOLDD }));
  kids.push(T(text, { size: 21, color: INK }));
  return P({ bullet: { level: 0 }, spacing: { after: 70, line: 290 }, children: kids });
}
function rule() {
  return P({ spacing: { before: 60, after: 160 }, border: { bottom: { color: GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 } }, children: [T('', {})] });
}
const noBorder = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } };
const thinBorder = (c = LINE) => ({ top: { style: BorderStyle.SINGLE, size: 4, color: c }, bottom: { style: BorderStyle.SINGLE, size: 4, color: c }, left: { style: BorderStyle.SINGLE, size: 4, color: c }, right: { style: BorderStyle.SINGLE, size: 4, color: c }, insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: c }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: c } });

function cell(children, { w, shade, span } = {}) {
  return new TableCell({
    width: w ? { size: w, type: WidthType.DXA } : undefined,
    columnSpan: span,
    shading: shade ? { type: ShadingType.CLEAR, color: 'auto', fill: shade } : undefined,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: Array.isArray(children) ? children : [children],
  });
}
function headRow(labels, widths) {
  return new TableRow({ tableHeader: true, children: labels.map((l, i) =>
    cell(P({ children: [T(l, { bold: true, size: 19, color: 'FFFFFF' })] }), { w: widths[i], shade: GOLDD })) });
}

// ---------------- content ----------------
const children = [];

// COVER
children.push(P({ spacing: { before: 1600, after: 0 }, alignment: AlignmentType.CENTER,
  children: [T('MIRACLE NAIL ART AI', { size: 22, color: GOLDD, bold: true, characterSpacing: 60 })] }));
children.push(P({ spacing: { before: 200, after: 0 }, alignment: AlignmentType.CENTER,
  children: [T('Tasarım Önerisi', { size: 64, bold: true, color: INK, font: 'Georgia' })] }));
children.push(P({ spacing: { before: 240, after: 0 }, alignment: AlignmentType.CENTER,
  children: [T('Mevcut uygulamanın kimliğini bozmadan, onu bir "araç"tan bir lüks markaya yükseltmek için tasarım yönü.', { italics: true, size: 24, color: MUTED, font: 'Georgia' })] }));
children.push(P({ spacing: { before: 500 }, alignment: AlignmentType.CENTER,
  children: [T('v1  ·  7 Temmuz 2026  ·  6 sekmeli mevcut yapı esas alınmıştır', { size: 18, color: MUTED })] }));
children.push(P({ children: [new PageBreak()] }));

// 1. YÖNETİCİ ÖZETİ
children.push(h1('1. Yönetici Özeti'));
children.push(body('Uygulama teknik olarak zaten çalışıyor: AI görsel üretimi, el analizi, üyelik ve görsel kotası, çoklu ödeme sağlayıcısı, telefon OTP\'li kimlik doğrulama ve cihazlar arası veri senkronu. Eksik olan teknik değil, algı. Bu belge yeni bir özellik önermez; mevcut altı ekranın görsel dilini tekleştirerek premium bir his kazandırır. Hedef basittir: kullanıcı ilk saniyede "bu ciddi, pahalı bir uygulama" hissetsin.'));
children.push(body([
  T('Öneri düşük risklidir: palet, tipografi ve bileşenler uygulamanın ', { size: 21, color: INK }),
  T('bugünkü koduyla birebir hizalıdır', { size: 21, color: INK, bold: true }),
  T(' (src/styles.css tokenları). Mevcut Angular bileşenleri yeniden yazılmadan, adım adım cilalanır.', { size: 21, color: INK }),
]));
children.push(rule());

// 2. AMAÇ
children.push(h1('2. Amaç'));
children.push(body('Uygulamayı bir kuaför uygulaması gibi değil, bir mücevher/parfüm vitrini gibi konumlandırmak. Az ama net: koyu zemin üzerinde altın vurgu, bol nefes alanı ve her ekranda tek bir asıl eylem. Renkli olan tek şey tırnakların kendisi olsun; göz her zaman ürüne gitsin.'));
children.push(rule());

// 3. MEVCUT DURUM
children.push(h1('3. Mevcut Durum (Baz Alınan Yapı)'));
children.push(body('Öneri, uygulamanın gerçek 6 sekmeli alt menüsü üzerine kuruludur. AI Stüdyo, ana navigasyonun birinci sınıf üyesidir — soldan dördüncü sekme:'));
{
  const w = [900, 2400, 2600, 3500];
  const rows = [headRow(['Sıra', 'Sekme', 'Rota', 'Not'], w)];
  const data = [
    ['1', '🏠  Ana Sayfa', '/', 'Giriş / kişiselleştirilmiş akış'],
    ['2', '🔍  Keşfet', '/explore', 'Arama + kategori filtresi'],
    ['3', '🤚  Tara', '/scan', 'El & tırnak analizi'],
    ['4', '🎨  Stüdyo', '/studio', 'AI GÖRSEL ÜRETİMİ (uygulamanın kalbi)'],
    ['5', '🛍️  Mağaza', '/shop', 'Üyelik planları & paketler'],
    ['6', '👤  Profil', '/profile', 'Hesap, plan durumu, ayarlar'],
  ];
  for (const r of data) {
    const isStudio = r[1].includes('Stüdyo');
    rows.push(new TableRow({ children: r.map((v, i) =>
      cell(P({ children: [T(v, { size: 19, color: isStudio ? GOLDD : INK, bold: isStudio })] }),
        { w: w[i], shade: isStudio ? 'FBF3DC' : undefined })) }));
  }
  children.push(new Table({ width: { size: 9400, type: WidthType.DXA }, columnWidths: w, borders: thinBorder(), rows }));
}
children.push(body([
  T('AI Stüdyo butonu nerede?  ', { size: 21, bold: true, color: GOLDD }),
  T('Alt menüde soldan dördüncü sekme (🎨 Stüdyo). Ek olarak öneride Ana Sayfa\'da büyük bir "✨ AI ile üret" kısayolu da yer alır — çünkü AI üretim uygulamanın kalbidir ve tek tıkla erişilmelidir. AR ekranı navigasyonda değildir; tasarım detayından ve profil geçmişinden açılır (ikincil).', { size: 21, color: INK }),
], { spacing: { before: 140, after: 120, line: 300 } }));
children.push(rule());

// 4. TASARIM İLKELERİ
children.push(h1('4. Tasarım İlkeleri'));
children.push(bullet('Neredeyse siyah (#0C0A08) zemin, tek metalik vurgu altın; renkli olan tek şey tırnaklar.', 'Koyu zemin, tek vurgu.'));
children.push(bullet('Başlıklarda ince serif (mücevher hissi), gövdede sade sans. "Ucuz uygulama" algısını kıran en kritik detay.', 'İki font, net hiyerarşi.'));
children.push(bullet('Her ekranda gözü yormayan tek bir altın buton: Üret · Yükselt · Dene.', 'Ekran başına tek eylem.'));
children.push(bullet('Premium his kalabalıktan değil boşluktan gelir. Bol nefes alanı, yuvarlak köşeler, tek sütun.', 'Ferahlık = lüks.'));
children.push(bullet('Tara ekranı sadece şekil söylemez; yakışan paleti ve "Stüdyo\'da dene" yolunu sunar. Analiz, üretime ve satışa bağlanır.', 'Analiz → satış köprüsü.'));
children.push(bullet('"27/30 görsel" rozeti Stüdyo ve Profil\'de sabit durur; hak azalınca baskı değil, yumuşak bir yükseltme daveti çıkar.', 'Kota her yerde görünür.'));
children.push(rule());

// 5. RENK SİSTEMİ
children.push(h1('5. Renk Sistemi'));
children.push(body('Uygulamanın mevcut CSS değişkenleriyle birebir — yeni renk icat edilmedi, sistem netleştirildi.'));
{
  const w = [1500, 2900, 2200, 2800];
  const rows = [headRow(['Renk', 'Ad', 'Hex', 'Rol'], w)];
  const data = [
    ['0C0A08', 'Zemin', '#0C0A08', 'Ana arka plan'],
    ['141019', 'Panel', '#141019', 'Kartlar, menü'],
    ['2C2418', 'Çizgi', '#2C2418', 'İnce ayraçlar'],
    ['D4AF37', 'Altın (vurgu)', '#D4AF37', 'Birincil vurgu, butonlar'],
    ['E9D9A0', 'Yumuşak altın', '#E9D9A0', 'Aktif metin, rozet'],
    ['FFF8E7', 'Sıcak ak', '#FFF8E7', 'Ana metin'],
    ['B8AD97', 'Sönük metin', '#B8AD97', 'İkincil metin'],
    ['B76E79', 'Gül (2. vurgu)', '#B76E79', 'ÖNERİLEN: sıcaklık vurgusu'],
  ];
  for (const r of data) {
    const isNew = r[3].startsWith('ÖNERİLEN');
    rows.push(new TableRow({ children: [
      cell(P({ children: [T('', {})] }), { w: w[0], shade: r[0] }),
      cell(P({ children: [T(r[1], { size: 19, color: INK, bold: isNew })] }), { w: w[1] }),
      cell(P({ children: [T(r[2], { size: 18, color: MUTED, font: 'Consolas' })] }), { w: w[2] }),
      cell(P({ children: [T(r[3], { size: 18, color: isNew ? ROSE : MUTED, bold: isNew })] }), { w: w[3] }),
    ] }));
  }
  children.push(new Table({ width: { size: 9400, type: WidthType.DXA }, columnWidths: w, borders: thinBorder(), rows }));
}
children.push(body([
  T('Öneri: ', { size: 21, color: INK }),
  T('gül tonunu (#B76E79) ikincil vurgu olarak sisteme katmak', { size: 21, color: INK, bold: true }),
  T(' — altın "değer"i, gül "sıcaklık"ı taşır; ikisi tırnak estetiğiyle doğal uyum kurar.', { size: 21, color: INK }),
], { spacing: { before: 140, after: 120, line: 300 } }));
children.push(rule());

// 6. TİPOGRAFİ
children.push(h1('6. Tipografi'));
children.push(P({ spacing: { after: 40 }, children: [T('Başlık · Serif', { size: 16, color: MUTED, characterSpacing: 30 })] }));
children.push(P({ spacing: { after: 120 }, children: [T('Bugünün ilhamı', { size: 34, color: INK, font: 'Georgia' })] }));
children.push(P({ spacing: { after: 40 }, children: [T('Alt başlık · Serif', { size: 16, color: MUTED, characterSpacing: 30 })] }));
children.push(P({ spacing: { after: 120 }, children: [T('Stüdyo', { size: 26, color: INK, font: 'Georgia' })] }));
children.push(P({ spacing: { after: 40 }, children: [T('Gövde · Sans', { size: 16, color: MUTED, characterSpacing: 30 })] }));
children.push(P({ spacing: { after: 120 }, children: [T('Hayalini yaz, AI tırnağa döksün.', { size: 22, color: INK })] }));
children.push(P({ spacing: { after: 40 }, children: [T('Etiket · Sans (büyük harf, aralıklı)', { size: 16, color: MUTED, characterSpacing: 30 })] }));
children.push(P({ spacing: { after: 120 }, children: [T('KALAN GÖRSEL HAKKI', { size: 16, color: GOLDD, characterSpacing: 60 })] }));
children.push(rule());

// 7. BİLEŞEN DİLİ
children.push(h1('7. Bileşen Dili'));
children.push(bullet('altın degrade, koyu metin, 24px yuvarlak. Örn: "✨ Üret".', 'Birincil buton:'));
children.push(bullet('şeffaf zemin, altın çerçeve. Örn: "Yükselt".', 'İkincil buton:'));
children.push(bullet('koyu, seçilince altın çerçeve + yumuşak altın metin. Örn: Simli / Mat / Fransız.', 'Çipler:'));
children.push(bullet('her yerde aynı — altın çerçeve, koyu zemin. Örn: "27 / 30 görsel".', 'Kota rozeti:'));
children.push(bullet('koyu panel (#141019), ince altın çizgi, 14–16px köşe, bol iç boşluk.', 'Kartlar:'));
children.push(rule());

// 8. EKRAN BAZLI ÖNERİLER
children.push(h1('8. Ekran Bazlı Öneriler'));
children.push(body('Mevcut yapıyı bozmadan, "Şu an" üzerine "Öneri" cilası.'));
{
  const w = [1900, 3200, 4300];
  const rows = [headRow(['Ekran', 'Şu an', 'Öneri'], w)];
  const data = [
    ['🏠 Ana Sayfa', 'Tasarım ızgarası', 'Cilt tonuna göre "bugünün ilhamı" hero\'su + büyük "✨ AI ile üret" kısayolu; altında kişiselleştirilmiş öneriler.'],
    ['🔍 Keşfet', 'Arama + kategori', 'Filtre çiplerini altın "seçili" diline getir; kartlarda tutarlı favori ve %uyum rozeti.'],
    ['🤚 Tara', 'Analiz sonucu', 'Sonucu "cilt tonu · şekil · yakışan renkler" kartlarına böl; en altta "Stüdyo\'da dene" köprüsü.'],
    ['🎨 Stüdyo', 'Prompt + üretim', 'Prompt satırı + stil çipleri + büyük önizleme + tek "✨ Üret"; sağ üstte sabit kota rozeti ve "yeniden üret".'],
    ['🛍️ Mağaza', 'Plan kartları', 'Yıllık Premium\'u "en popüler" rozetiyle öne çıkar; fiyatı aya böl, yıllık toplam görseli (360 / 1.200) not et.'],
    ['👤 Profil', '7\'li menü', 'Üstte plan durumu kartı (kalan gün + kota); altında sade menü. Ayarlar\'da şifre/hesap işlemleri.'],
    ['✨ AR / Detay', 'İkincil', 'Navigasyonda kalmasın; tasarım detayından "AR\'da dene" ile açılsın — ana akışı sadeleştirir.'],
  ];
  for (const r of data) {
    const isStudio = r[0].includes('Stüdyo');
    rows.push(new TableRow({ children: [
      cell(P({ children: [T(r[0], { size: 18, color: isStudio ? GOLDD : INK, bold: true })] }), { w: w[0], shade: isStudio ? 'FBF3DC' : undefined }),
      cell(P({ children: [T(r[1], { size: 18, color: MUTED })] }), { w: w[1] }),
      cell(P({ children: [T(r[2], { size: 18, color: INK })] }), { w: w[2] }),
    ] }));
  }
  children.push(new Table({ width: { size: 9400, type: WidthType.DXA }, columnWidths: w, borders: thinBorder(), rows }));
}
children.push(rule());

// 9. UYGULAMA PLANI
children.push(h1('9. Uygulama Planı (Düşük Risk)'));
children.push(body('Mevcut Angular bileşenlerini yeniden yazmadan, adım adım. Her fazdan sonra test ajanı (test.bat) ile derleme + testler doğrulanır.'));
{
  const w = [700, 5100, 3600];
  const rows = [headRow(['Faz', 'İş', 'Süre & Risk'], w)];
  const data = [
    ['1', 'Tasarım tokenlarını netleştir: styles.css\'i tek kaynak yap, gül tonunu (#B76E79) ikincil vurgu olarak ekle.', '~yarım gün · risk: düşük'],
    ['2', 'Ortak bileşenleri hizala: buton, çip, kart, kota rozeti ve 6\'lı alt menü tek stile.', '1–2 gün · risk: düşük'],
    ['3', 'Ana Sayfa + Stüdyo: hero + "✨ AI ile üret" kısayolu; Stüdyo\'da önizleme ve sabit kota rozeti.', '2 gün · risk: orta'],
    ['4', 'Tara → Stüdyo köprüsü: analiz sonucundan doğrudan üretime bağlantı.', '1 gün · risk: düşük'],
    ['5', 'Mağaza + Profil rötuşu: "en popüler" rozeti + yıllık toplam notu; plan durumu kartı.', '1 gün · risk: düşük'],
  ];
  for (const r of data) {
    rows.push(new TableRow({ children: [
      cell(P({ alignment: AlignmentType.CENTER, children: [T(r[0], { size: 22, color: GOLDD, bold: true })] }), { w: w[0] }),
      cell(P({ children: [T(r[1], { size: 18, color: INK })] }), { w: w[1] }),
      cell(P({ children: [T(r[2], { size: 18, color: MUTED })] }), { w: w[2] }),
    ] }));
  }
  children.push(new Table({ width: { size: 9400, type: WidthType.DXA }, columnWidths: w, borders: thinBorder(), rows }));
}
children.push(P({ spacing: { before: 260 }, alignment: AlignmentType.CENTER,
  children: [T('Bu bir tasarım yönü önerisidir — kod değişikliği içermez. Onayladığın fazlar sırayla, adım adım onayınla uygulanır.', { italics: true, size: 18, color: MUTED })] }));

// ---- doc ----
const doc = new Document({
  creator: 'Miracle Nail Art AI',
  title: 'Tasarım Önerisi',
  styles: { default: { document: { run: { font: 'Calibri', size: 21, color: INK } } } },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, bottom: 1200, left: 1300, right: 1300 } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync('/home/claude/ngNailArt/Tasarim-Onerisi.docx', buf);
  console.log('WROTE Tasarim-Onerisi.docx', buf.length, 'bytes');
});
