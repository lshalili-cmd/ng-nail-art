const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
} = require('docx');
const fs = require('fs');

const GOLD='B8912E', GOLDD='8A6A1E', INK='2A2622', MUTED='6B655C', RED='A83232', LINE='D9D2C4';

const P=(o)=>new Paragraph(o);
const T=(t,o={})=>new TextRun({text:t,font:'Calibri',...o});
const h1=(t)=>P({heading:HeadingLevel.HEADING_1,spacing:{before:320,after:120},children:[T(t,{bold:true,size:30,color:GOLDD,font:'Georgia'})]});
const h2=(t)=>P({heading:HeadingLevel.HEADING_2,spacing:{before:200,after:70},children:[T(t,{bold:true,size:23,color:INK,font:'Georgia'})]});
const body=(runs,o={})=>{const k=Array.isArray(runs)?runs:[T(runs,{size:21,color:INK})];return P({spacing:{after:120,line:300},children:k,...o});};
function bullet(text,lead){const k=[];if(lead)k.push(T(lead+' ',{size:21,bold:true,color:GOLDD}));k.push(T(text,{size:21,color:INK}));return P({bullet:{level:0},spacing:{after:70,line:290},children:k});}
function warn(text,lead){const k=[T((lead?lead+' ':''),{size:21,bold:true,color:RED})];k.push(T(text,{size:21,color:INK}));return P({bullet:{level:0},spacing:{after:80,line:290},children:k});}
const rule=()=>P({spacing:{before:60,after:160},border:{bottom:{color:GOLD,space:1,style:BorderStyle.SINGLE,size:12}},children:[T('',{})]});
const mono=(t,o={})=>T(t,{font:'Consolas',size:18,color:INK,...o});
function code(lines){return lines.map((l,i)=>P({spacing:{after: i===lines.length-1?100:0, line:260}, shading:{type:ShadingType.CLEAR,color:'auto',fill:'F3EFe6'}, children:[mono('  '+l+'  ')]}));}
const thin=(c=LINE)=>({top:{style:BorderStyle.SINGLE,size:4,color:c},bottom:{style:BorderStyle.SINGLE,size:4,color:c},left:{style:BorderStyle.SINGLE,size:4,color:c},right:{style:BorderStyle.SINGLE,size:4,color:c},insideHorizontal:{style:BorderStyle.SINGLE,size:4,color:c},insideVertical:{style:BorderStyle.SINGLE,size:4,color:c}});
function cell(children,{w,shade}={}){return new TableCell({width:w?{size:w,type:WidthType.DXA}:undefined,shading:shade?{type:ShadingType.CLEAR,color:'auto',fill:shade}:undefined,margins:{top:60,bottom:60,left:90,right:90},children:Array.isArray(children)?children:[children]});}
function headRow(labels,widths){return new TableRow({tableHeader:true,children:labels.map((l,i)=>cell(P({children:[T(l,{bold:true,size:17,color:'FFFFFF'})]}),{w:widths[i],shade:GOLDD}))});}
function table(widths,head,rows,fs=17){
  const trs=[headRow(head,widths)];
  for(const r of rows){trs.push(new TableRow({children:r.map((v,i)=>cell(P({children:[T(String(v),{size:fs,color:INK})]}),{w:widths[i]}))}));}
  return new Table({width:{size:widths.reduce((a,b)=>a+b,0),type:WidthType.DXA},columnWidths:widths,borders:thin(),rows:trs});
}

const children=[];

// COVER
children.push(P({spacing:{before:1500},alignment:AlignmentType.CENTER,children:[T('MIRACLE NAIL ART AI',{size:22,color:GOLDD,bold:true,characterSpacing:60})]}));
children.push(P({spacing:{before:200},alignment:AlignmentType.CENTER,children:[T('Yayına Çıkış Yol Haritası',{size:56,bold:true,color:INK,font:'Georgia'})]}));
children.push(P({spacing:{before:40},alignment:AlignmentType.CENTER,children:[T('Canlıya alma · Google Play · App Store',{size:30,color:GOLDD,font:'Georgia'})]}));
children.push(P({spacing:{before:260},alignment:AlignmentType.CENTER,children:[T('Aşamalar · Maliyetler · Gerekli hesaplar · Komutlar · Kontrol listesi',{italics:true,size:22,color:MUTED,font:'Georgia'})]}));
children.push(P({spacing:{before:500},alignment:AlignmentType.CENTER,children:[T('v1 · 8 Temmuz 2026',{size:18,color:MUTED})]}));
children.push(P({children:[new PageBreak()]}));

// 1 GENEL BAKIS
children.push(h1('1. Genel Bakış'));
children.push(body('Yayına çıkış iki ayrı iştir ve biri diğerine bağlıdır. Önce uygulamayı gerçek bir sunucuya alırsın (web canlıya çıkar), sonra mobil mağazalara gönderirsin — çünkü mağazadaki uygulamalar canlı arka uca (backend) bağlanır.'));
children.push(bullet('Backend + veritabanı + ön yüzü gerçek bir adrese taşımak (HTTPS, alan adı). Bittiğinde uygulama telefondan/her yerden tarayıcıyla çalışır.','A) Web canlıya:'));
children.push(bullet('Uygulamayı native pakete (Capacitor) çevirip Google Play ve Apple App Store\'a göndermek.','B) Mağazalara:'));
children.push(body('Önerilen sıra: Aşama 1 (deploy) → Aşama 2 (gerçek anahtarlar + yasal) → Aşama 3 (native paket) → Aşama 4 (mağaza gönderimi). Android ile başlamak mantıklı (ucuz, Mac gerektirmez); iOS en sona.'));
children.push(rule());

// 2 MALIYET & GEREKSINIM
children.push(h1('2. Maliyet & Gereksinimler'));
children.push(table([3400,2400,3600],['Kalem','Maliyet','Not'],[
  ['Barındırma (backend+DB)','~0–20 $/ay','Başlangıçta ücretsiz katman yeterli (Render/Railway/Supabase)'],
  ['Alan adı','~10–15 $/yıl','ör. miraclenailart.com'],
  ['Google Play geliştirici','25 $ (tek sefer)','Bir kez öde, ömür boyu'],
  ['Apple Developer','99 $/yıl','iOS için zorunlu, yıllık yenilenir'],
  ['Mac bilgisayar','—','iOS derlemesi için ŞART (ya da bulut Mac servisi)'],
  ['SMS (Twilio)','kullandıkça','OTP başına birkaç kuruş'],
  ['AI/ödeme','kullandıkça','Sağlayıcıya göre'],
]));
children.push(body([T('Toplam başlangıç: ',{size:21,bold:true,color:GOLDD}),T('Sadece Android için ~40 $ (Play 25$ + alan adı). iOS eklenince +99$/yıl ve bir Mac gerekir.',{size:21,color:INK})]));
children.push(rule());

// 3 ASAMA 1 DEPLOY
children.push(h1('3. Aşama 1 — Web\'i Canlıya Al'));
children.push(h2('3.1 Veritabanı: SQLite → PostgreSQL'));
children.push(body('SQLite yerel geliştirme içindir; canlıda yönetilen bir PostgreSQL kullanılır (Supabase, Neon veya Railway — ücretsiz katman var). Prisma sayesinde geçiş kolaydır:'));
children.push(bullet('schema.prisma\'da provider "sqlite" → "postgresql" yapılır.',''));
children.push(bullet('DATABASE_URL, sağlayıcının verdiği bağlantı adresine ayarlanır.',''));
children.push(...code(['npx prisma migrate deploy   # şemayı canlı DB\'ye uygular','npx prisma generate']));
children.push(h2('3.2 Backend\'i deploy et'));
children.push(body('Node/Express arka ucu bir platforma yüklenir (Render / Railway / Fly.io). Tüm ortam değişkenleri (JWT_SECRET, DATABASE_URL, AI/ödeme/SMS/e-posta anahtarları) panelden girilir. Başlatma komutu: node index.js.'));
children.push(h2('3.3 Ön yüzü deploy et'));
children.push(body('Angular üretim derlemesi alınır ve statik barındırmaya konur (Netlify / Vercel / Cloudflare Pages), ya da backend tarafından sunulur.'));
children.push(...code(['npm run build   # çıktı: dist/ng-nail-art']));
children.push(h2('3.4 Alan adı, HTTPS ve API adresi'));
children.push(bullet('Bir alan adı al ve barındırmaya bağla; HTTPS (SSL) çoğu platformda otomatiktir.','Alan adı:'));
children.push(bullet('Ön yüzün API çağrıları artık localhost:3000 değil, canlı backend adresine gitmeli (ortam bazlı API adresi ayarı). Backend\'te CORS canlı alan adına açılır.','Bağlantı:'));
children.push(rule());

// 4 ASAMA 2
children.push(h1('4. Aşama 2 — "Demo"dan Gerçeğe'));
children.push(body('Uygulama şu an tüm dış servislerde demo modunda. Canlıda .env\'e gerçek anahtarlar girilir; kod değişmez, sadece anahtar eklenir:'));
children.push(bullet('OpenAI / Gemini / Replicate anahtarı → gerçek görsel üretimi.','AI:'));
children.push(bullet('Twilio (veya Netgsm) → gerçek OTP SMS.','SMS:'));
children.push(bullet('SMTP (ör. bir kurumsal e-posta) → şifre sıfırlama e-postaları.','E-posta:'));
children.push(h2('4.1 Yasal (mağaza için ZORUNLU)'));
children.push(warn('Her iki mağaza da yayın için bir URL ister; olmadan reddedilir.','Gizlilik Politikası + Kullanım Şartları:'));
children.push(bullet('Türkiye\'de kişisel veri işlediğin için KVKK aydınlatma metni ve açık rıza akışı gerekir.','KVKK:'));
children.push(bullet('Uygulama içi para iadesi / abonelik iptali koşulları netleştirilir.','Ticari:'));
children.push(rule());

// 5 ASAMA 3
children.push(h1('5. Aşama 3 — Native Pakete Çevir (Capacitor)'));
children.push(body('Angular uygulaması Capacitor ile native kabuğa sarılır; aynı koddan hem Android hem iOS paketi üretilir.'));
children.push(...code([
  'npm i @capacitor/core @capacitor/cli',
  'npx cap init "Miracle Nail Art" com.miracle.nailart',
  'npm run build',
  'npx cap add android',
  'npx cap add ios        # (yalnızca Mac\'te)',
  'npx cap sync',
]));
children.push(bullet('Uygulama kimliği (ör. com.miracle.nailart), adı, ikon ve açılış ekranı ayarlanır.','Kimlik & görsel:'));
children.push(bullet('Android Studio ile imzalı .aab üretilir; gerçek cihazda test edilir.','Android çıktı:'));
children.push(warn('iOS derlemesi macOS + Xcode ister. Mac yoksa: bir bulut Mac servisi (ör. MacStadium) veya bulut derleme (Ionic Appflow / EAS) alternatiftir.','iOS çıktı:'));
children.push(rule());

// 6 ASAMA 4
children.push(h1('6. Aşama 4 — Mağaza Gönderimi'));
children.push(h2('6.1 Google Play'));
children.push(bullet('Google Play Console\'da geliştirici hesabı aç (~25 $ tek sefer).','Hesap:'));
children.push(bullet('Uygulama oluştur; imzalı .aab yükle.','Yükleme:'));
children.push(bullet('Ekran görüntüleri, ikon, açıklama, içerik derecelendirme anketi, "Data safety" formu, gizlilik URL\'si.','Liste:'));
children.push(bullet('İnceleme genelde birkaç gün sürer.','İnceleme:'));
children.push(h2('6.2 Apple App Store'));
children.push(bullet('Apple Developer Program (99 $/yıl) + bir Mac.','Hesap:'));
children.push(bullet('App Store Connect\'te uygulama oluştur; Xcode/Transporter ile yükle.','Yükleme:'));
children.push(bullet('Ekran görüntüleri, gizlilik "nutrition label" etiketleri, açıklama.','Liste:'));
children.push(warn('Apple, sadece web sitesini saran "içeriksiz" uygulamaları reddeder. Uygulama gerçek native değer sunmalı (kamera/AR, bildirimler vb. iyi katkı sağlar).','Dikkat:'));
children.push(rule());

// 7 KRITIK UYARILAR
children.push(h1('7. Kritik Uyarılar'));
children.push(warn('Uygulama içinde dijital ürün (abonelik, görsel hakkı) satıyorsun. Apple (In-App Purchase) ve Google (Play Billing) bunu KENDİ ödeme sistemleriyle zorunlu tutar ve %15–30 komisyon alır. Yani iyzico/Stripe\'ı mobil uygulamada abonelik için kullanamazsın; mağaza faturalamasına geçmen gerekir. (Web sürümünde kendi ödemeni kullanmaya devam edebilirsin.)','Ödeme komisyonu:'));
children.push(warn('iOS için Mac + 99$/yıl şart. Mac yoksa Android\'le başla, iOS\'u sonraya bırak.','iOS engeli:'));
children.push(warn('Gizlilik politikası URL\'si ve veri işleme beyanları olmadan hiçbir mağaza yayına almaz.','Yasal:'));
children.push(warn('Trial/demo değil; canlıda gerçek SMS/AI/ödeme maliyeti kullandıkça oluşur — bütçe planla.','Maliyet:'));
children.push(rule());

// 8 MATERYALLER
children.push(h1('8. Mağaza Materyalleri (hazırlanacaklar)'));
children.push(table([3200,6200],['Öğe','Detay'],[
  ['Uygulama ikonu','1024×1024 PNG (köşesiz)'],
  ['Ekran görüntüleri','Telefon için 3–8 adet; Play ve App Store farklı boyutlar ister'],
  ['Özellik grafiği (Play)','1024×500'],
  ['Açıklama','Kısa (80 karakter) + uzun açıklama, anahtar kelimeler'],
  ['Gizlilik politikası','Yayında bir URL'],
  ['Kategori & yaş','Örn. "Güzellik" / uygun yaş derecelendirmesi'],
]));
children.push(rule());

// 9 SIRA & KONTROL
children.push(h1('9. Önerilen Sıra & Kontrol Listesi'));
children.push(body('En hızlı ve en ucuz yol: önce web\'i canlıya al, sonra Android. iOS\'u ihtiyaç olunca ekle.'));
[
  'Aşama 1: PostgreSQL + backend deploy + ön yüz deploy + alan adı/HTTPS',
  'Aşama 2: Gerçek anahtarlar (AI/SMS/e-posta) + Gizlilik & KVKK metinleri',
  'Karar: Mobil aboneliği mağaza faturalamasına taşı (IAP / Play Billing)',
  'Aşama 3: Capacitor ile Android paketi (.aab) + cihaz testi',
  'Aşama 4a: Google Play hesabı + liste + gönderim',
  'Materyaller: ikon, ekran görüntüleri, açıklamalar, gizlilik URL\'si',
  'Aşama 4b (sonra): Mac + Apple Developer + iOS paketi + App Store gönderim',
].forEach(t=>children.push(P({bullet:{level:0},spacing:{after:60},children:[T(t,{size:20,color:INK})]})));
children.push(P({spacing:{before:260},alignment:AlignmentType.CENTER,children:[T('Onayınla Aşama 1\'den (deploy) başlayıp adım adım birlikte ilerleyebiliriz.',{italics:true,size:18,color:MUTED})]}));

const doc=new Document({
  creator:'Miracle Nail Art AI', title:'Yayına Çıkış Yol Haritası',
  styles:{default:{document:{run:{font:'Calibri',size:21,color:INK}}}},
  sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:1200,bottom:1200,left:1200,right:1200}}},children}],
});
Packer.toBuffer(doc).then(buf=>{fs.writeFileSync('/home/claude/ngNailArt/Yayina-Cikis-Yol-Haritasi.docx',buf);console.log('WROTE',buf.length,'bytes');});
