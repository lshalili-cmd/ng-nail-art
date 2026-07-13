const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
} = require('docx');
const fs = require('fs');

const GOLD='B8912E', GOLDD='8A6A1E', INK='2A2622', MUTED='6B655C', ROSE='A85560', LINE='D9D2C4';

const P=(o)=>new Paragraph(o);
const T=(t,o={})=>new TextRun({text:t,font:'Calibri',...o});
const h1=(t)=>P({heading:HeadingLevel.HEADING_1,spacing:{before:320,after:120},children:[T(t,{bold:true,size:30,color:GOLDD,font:'Georgia'})]});
const h2=(t)=>P({heading:HeadingLevel.HEADING_2,spacing:{before:200,after:70},children:[T(t,{bold:true,size:23,color:INK,font:'Georgia'})]});
const body=(runs,o={})=>{const k=Array.isArray(runs)?runs:[T(runs,{size:21,color:INK})];return P({spacing:{after:120,line:300},children:k,...o});};
function bullet(text,lead){const k=[];if(lead)k.push(T(lead+' ',{size:21,bold:true,color:GOLDD}));k.push(T(text,{size:21,color:INK}));return P({bullet:{level:0},spacing:{after:70,line:290},children:k});}
const rule=()=>P({spacing:{before:60,after:160},border:{bottom:{color:GOLD,space:1,style:BorderStyle.SINGLE,size:12}},children:[T('',{})]});
const thin=(c=LINE)=>({top:{style:BorderStyle.SINGLE,size:4,color:c},bottom:{style:BorderStyle.SINGLE,size:4,color:c},left:{style:BorderStyle.SINGLE,size:4,color:c},right:{style:BorderStyle.SINGLE,size:4,color:c},insideHorizontal:{style:BorderStyle.SINGLE,size:4,color:c},insideVertical:{style:BorderStyle.SINGLE,size:4,color:c}});
function cell(children,{w,shade,span}={}){return new TableCell({width:w?{size:w,type:WidthType.DXA}:undefined,columnSpan:span,shading:shade?{type:ShadingType.CLEAR,color:'auto',fill:shade}:undefined,margins:{top:60,bottom:60,left:90,right:90},children:Array.isArray(children)?children:[children]});}
function headRow(labels,widths){return new TableRow({tableHeader:true,children:labels.map((l,i)=>cell(P({children:[T(l,{bold:true,size:17,color:'FFFFFF'})]}),{w:widths[i],shade:GOLDD}))});}
function simpleTable(widths,head,rows,fs=17){
  const trs=[headRow(head,widths)];
  for(const r of rows){trs.push(new TableRow({children:r.map((v,i)=>cell(P({children:[T(String(v),{size:fs,color:INK})]}),{w:widths[i]}))}));}
  return new Table({width:{size:widths.reduce((a,b)=>a+b,0),type:WidthType.DXA},columnWidths:widths,borders:thin(),rows:trs});
}

const children=[];

// COVER
children.push(P({spacing:{before:1500},alignment:AlignmentType.CENTER,children:[T('MIRACLE NAIL ART AI',{size:22,color:GOLDD,bold:true,characterSpacing:60})]}));
children.push(P({spacing:{before:200},alignment:AlignmentType.CENTER,children:[T('Animasyon Videosu',{size:60,bold:true,color:INK,font:'Georgia'})]}));
children.push(P({spacing:{before:40},alignment:AlignmentType.CENTER,children:[T('Yapım Dokümantasyonu',{size:34,color:GOLDD,font:'Georgia'})]}));
children.push(P({spacing:{before:240},alignment:AlignmentType.CENTER,children:[T('Konsept · Görsel stil · Senaryo · Storyboard · Ses · Teknik teslimat · Üretim araçları',{italics:true,size:22,color:MUTED,font:'Georgia'})]}));
children.push(P({spacing:{before:500},alignment:AlignmentType.CENTER,children:[T('v1  ·  7 Temmuz 2026  ·  Bir animatöre/araca doğrudan verilebilir',{size:18,color:MUTED})]}));
children.push(P({children:[new PageBreak()]}));

// 1
children.push(h1('1. Genel Bakış'));
children.push(body('Bu belge, Miracle Nail Art AI uygulaması için kısa bir tanıtım/animasyon videosunun uçtan uca yapım planıdır. Amaç: uygulamayı bir "araç" gibi değil, bir lüks marka gibi anlatan, 45–60 saniyelik akıcı bir animasyon üretmek. Belge; konsept, görsel stil, tam senaryo, sahne sahne storyboard, ses yönü ve teknik teslimatları içerir; bir animatöre, bir video ajansına ya da kod/AI tabanlı bir üretim aracına doğrudan verilebilir.'));
children.push(simpleTable([2400,7000],['Alan','Tanım'],[
  ['Amaç','Uygulamayı tanıtmak, indirmeyi/denemeyi teşvik etmek'],
  ['Hedef kitle','18–45 yaş, güzellik/tırnak sanatına ilgili; sosyal medya kullanıcıları'],
  ['Kullanım yeri','App Store/Play tanıtımı, Instagram/TikTok Reels, web açılış sayfası, reklam'],
  ['Ton','Zarif, premium, sıcak; teknolojiyi "sihir" gibi hissettiren'],
  ['Süre','Ana sürüm 45–60 sn; kısa sürüm 15 sn (Reels/Story kancası)'],
  ['Dil','Anlatım İngilizce (birincil) + Türkçe alternatif metin bu belgede'],
]));
children.push(rule());

// 2
children.push(h1('2. Konsept & Ana Mesaj'));
children.push(body([T('Tek cümlelik konsept: ',{size:21,bold:true,color:GOLDD}),T('"Hayalindeki tırnağı anlat, yapay zeka saniyeler içinde tasarlasın."',{size:21,color:INK,italics:true})]));
children.push(body('Anlatı yayı: kullanıcı uygulamayı açar (giriş) → sistem ona özel ilham sunar (kişiselleştirme) → Stüdyo\'da hayalini yazar, AI üretir (sihir anı, zirve) → el analizi ona yakışanı önerir (güven) → esnek üyelik (değer) → hepsi tek yerde, güvenli (huzur) → çağrı: bugün dene.'));
children.push(body([T('Ana mesaj: ',{size:21,bold:true,color:GOLDD}),T('"Your nails, reimagined by AI." (Tırnakların, yapay zekayla yeniden tasarlandı.)',{size:21,color:INK})]));
children.push(rule());

// 3
children.push(h1('3. Görsel Stil & Marka'));
children.push(body('Renk ve tipografi uygulamanın gerçek tasarım sistemiyle (src/styles.css) birebir olmalı — video ile uygulama arasında kopukluk olmasın.'));
children.push(h2('Renk paleti'));
{
  const w=[1500,2900,2200,2800];
  const rows=[headRow(['Renk','Ad','Hex','Kullanım'],w)];
  const data=[
    ['0C0A08','Zemin','#0C0A08','Arka plan (koyu)'],
    ['141019','Panel','#141019','Kart/telefon yüzeyi'],
    ['D4AF37','Altın','#D4AF37','Vurgu, buton, ışıltı'],
    ['E9D9A0','Yumuşak altın','#E9D9A0','Metin vurgusu, parıltı'],
    ['FFF8E7','Sıcak ak','#FFF8E7','Ana metin'],
    ['B76E79','Gül','#B76E79','İkincil vurgu, tırnak tonu'],
  ];
  for(const r of data){rows.push(new TableRow({children:[
    cell(P({children:[T('',{})]}),{w:w[0],shade:r[0]}),
    cell(P({children:[T(r[1],{size:18,color:INK})]}),{w:w[1]}),
    cell(P({children:[T(r[2],{size:17,color:MUTED,font:'Consolas'})]}),{w:w[2]}),
    cell(P({children:[T(r[3],{size:17,color:MUTED})]}),{w:w[3]}),
  ]}));}
  children.push(new Table({width:{size:9400,type:WidthType.DXA},columnWidths:w,borders:thin(),rows}));
}
children.push(h2('Tipografi & hareket'));
children.push(bullet('Başlıklar ince serif (mücevher hissi), yazılar sade sans. Uygulamayla aynı.','Yazı:'));
children.push(bullet('yumuşak "ease-in-out", 0.4–0.6 sn geçişler; ani sıçrama yok. Zarafet = yavaş ve akıcı.','Hareket:'));
children.push(bullet('altın parıltı/bokeh, ışık süzülmesi, tırnaklarda parlama (glossy shine) animasyonu.','İmza efekt:'));
children.push(bullet('telefon çerçevesi merkezde; içerik telefonda animasyonlu, yanında büyük başlık metni.','Kompozisyon:'));
children.push(rule());

// 4
children.push(h1('4. Süre, Format & Platform Varyantları'));
children.push(simpleTable([2400,1500,1500,4000],['Varyant','Oran','Süre','Kullanım'],[
  ['Ana (yatay)','16:9','45–60 sn','YouTube, web açılış, reklam'],
  ['Dikey','9:16','30–45 sn','Reels, TikTok, Story'],
  ['Kare','1:1','30 sn','Instagram feed, Facebook'],
  ['Kısa kanca','9:16','15 sn','Reels/Story reklam (ilk 3 sn kritik)'],
]));
children.push(body('Çözünürlük: 1080p (tercihen 4K master). Kare hızı: 30 fps (mümkünse 60 fps akıcılık için). Dışa aktarım: MP4 (H.264), sessiz sürüm + altyazılı sürüm ayrı.'));
children.push(rule());

// 5
children.push(h1('5. Senaryo / Anlatım Metni'));
children.push(body('Aşağıdaki 7 replik sırayla okunur (İngilizce birincil). Türkçe karşılıkları alternatiftir. Anlatım sıcak, sakin bir kadın sesiyle; her replik bir sahneye denk gelir.'));
{
  const w=[500,4450,4450];
  const rows=[headRow(['#','İngilizce (VO)','Türkçe (alternatif)'],w)];
  const data=[
    ['1','Meet Miracle Nail Art — your personal AI-powered nail studio, right in your pocket.','Miracle Nail Art ile tanışın — cebinizdeki, yapay zeka destekli kişisel tırnak stüdyonuz.'],
    ['2','It starts the moment you open the app. Your home screen greets you with designs picked for your skin tone.','Uygulamayı açtığınız an başlar. Ana ekran, cilt tonunuza göre seçilmiş tasarımlarla sizi karşılar.'],
    ['3','In the Studio, just describe the look you dream of — and AI turns your words into a stunning design in seconds.','Stüdyo\'da hayalinizdeki görünümü yazmanız yeter — yapay zeka sözlerinizi saniyeler içinde etkileyici bir tasarıma dönüştürür.'],
    ['4','Not sure what suits you? Scan your hand. We read your skin tone and nail shape, then suggest your most flattering colors.','Ne yakışır bilmiyor musunuz? Elinizi tarayın. Cilt tonunuzu ve tırnak şeklinizi okur, size en yakışan renkleri öneririz.'],
    ['5','Choose the plan that fits you — monthly, yearly or pro, with more image credits as you grow.','Size uyan planı seçin — aylık, yıllık ya da pro; ürettikçe artan görsel haklarıyla.'],
    ['6','Your profile keeps it all in one place — plan, credits and settings, secured with phone verification.','Profiliniz her şeyi tek yerde tutar — plan, haklar ve ayarlar; telefon doğrulamasıyla güvende.'],
    ['7','Miracle Nail Art. Your nails, reimagined by AI. Try it today.','Miracle Nail Art. Tırnaklarınız, yapay zekayla yeniden tasarlandı. Bugün deneyin.'],
  ];
  for(const r of data){rows.push(new TableRow({children:[
    cell(P({alignment:AlignmentType.CENTER,children:[T(r[0],{size:19,bold:true,color:GOLDD})]}),{w:w[0]}),
    cell(P({children:[T(r[1],{size:17,color:INK})]}),{w:w[1]}),
    cell(P({children:[T(r[2],{size:17,color:MUTED})]}),{w:w[2]}),
  ]}));}
  children.push(new Table({width:{size:9400,type:WidthType.DXA},columnWidths:w,borders:thin(),rows}));
}
children.push(P({children:[new PageBreak()]}));

// 6 STORYBOARD
children.push(h1('6. Storyboard (Sahne Sahne)'));
children.push(body('Her satır bir sahnedir. "Görsel & Animasyon" sütunu animatör için yönergedir; "Ekran metni" ekranda beliren yazıdır; "VO" o sahnede okunan repliktir.'));
{
  const w=[420,1350,780,2900,1600,2350];
  const rows=[headRow(['#','Sahne','Süre','Görsel & Animasyon','Ekran metni','Anlatım (VO)'],w)];
  const data=[
    ['1','Açılış / Logo','0–6 sn','Karanlıktan altın parıltı belirir; logo "Miracle Nail Art" harf harf ışıldayarak yazılır; altında bir el, tırnaklar gül-altın tonunda parlar.','Miracle Nail Art\nYour AI nail studio','Replik 1'],
    ['2','Ana Sayfa','6–15 sn','Telefon çerçevesi kayarak girer; ana ekran açılır; "bugünün ilhamı" kartı yukarı doğru belirir; %94 uyum rozeti sayarak dolar; "Create with AI" butonu parlar.','It knows what suits you','Replik 2'],
    ['3','AI Stüdyo','15–26 sn','Prompt satırına "red glitter night nails" yazılıyor efekti; stil çipi "Glitter" seçilir; boş tırnaklar bir dalga hâlinde kırmızı-simli renge boyanır (imza sihir anı); "Generate" ışıldar; kota 28→27 düşer.','Describe it. See it.','Replik 3'],
    ['4','El Analizi','26–36 sn','El silueti tarama çizgisiyle geçilir; cilt tonu swatch\'i belirir; tırnak şekli "Almond" etiketi yazılır; alttan 5 renk yuvarlağı sırayla pop yapar.','Scan. Get matched.','Replik 4'],
    ['5','Mağaza','36–45 sn','Üç plan kartı arka arkaya kayar; "Yearly" kartı öne çıkıp "MOST POPULAR" rozeti parlar; fiyat ve "360 images a year" notu belirir.','A plan that grows with you','Replik 5'],
    ['6','Profil','45–53 sn','Avatar "L" ölçeklenerek belirir; plan durumu kartı (312 gün, 27 kredi) yukarı süzülür; menü satırları sırayla belirir; küçük kilit ikonu "secured" hissi.','Everything in one place','Replik 6'],
    ['7','Kapanış / CTA','53–60 sn','Ekranlar altın bokeh içinde toplanır; logo tekrar belirir; "Try it today" butonu nabız gibi atar; App Store/Play rozetleri alta gelir.','Your nails, reimagined by AI\nTry it today','Replik 7'],
  ];
  for(const r of data){
    const isStudio=r[1].includes('Stüdyo');
    rows.push(new TableRow({children:[
      cell(P({alignment:AlignmentType.CENTER,children:[T(r[0],{size:18,bold:true,color:GOLDD})]}),{w:w[0],shade:isStudio?'FBF3DC':undefined}),
      cell(P({children:[T(r[1],{size:16,bold:true,color:isStudio?GOLDD:INK})]}),{w:w[1],shade:isStudio?'FBF3DC':undefined}),
      cell(P({children:[T(r[2],{size:16,color:MUTED})]}),{w:w[2]}),
      cell(P({children:[T(r[3],{size:16,color:INK})]}),{w:w[3]}),
      cell(r[4].split('\n').map(line=>P({children:[T(line,{size:16,color:INK})]})),{w:w[4]}),
      cell(P({children:[T(r[5],{size:16,color:MUTED})]}),{w:w[5]}),
    ]}));
  }
  children.push(new Table({width:{size:9400,type:WidthType.DXA},columnWidths:w,borders:thin(),rows}));
}
children.push(rule());

// 7
children.push(h1('7. Ses & Müzik Yönü'));
children.push(bullet('sıcak, sakin, güven veren kadın sesi; İngilizce (US veya nötr). Tempo yavaş, net.','Seslendirme:'));
children.push(bullet('minimal, zarif, hafif elektronik + akustik; "lüks güzellik" hissi. Zirvede (Stüdyo sahnesi) küçük bir yükseliş.','Müzik:'));
children.push(bullet('yumuşak "shimmer/ışıltı" sesi (logo ve üretim anında), hafif "pop" (rozet/renk belirişlerinde), tık sesleri minimal.','Ses efektleri (SFX):'));
children.push(bullet('müzik VO\'nun altında kısılır (ducking); kapanışta müzik hafif yükselir.','Miks:'));
children.push(body('Telifsiz müzik kaynakları: Epidemic Sound, Artlist, Uppbeat, YouTube Audio Library. "elegant beauty / luxury ambient" anahtar kelimeleriyle aranır.'));
children.push(rule());

// 8
children.push(h1('8. Teknik Özellikler & Teslimatlar'));
children.push(simpleTable([3200,6200],['Öğe','Değer'],[
  ['Çözünürlük','1920×1080 (16:9), 1080×1920 (9:16), 1080×1080 (1:1)'],
  ['Kare hızı','30 fps (tercihen 60 fps)'],
  ['Format','MP4 / H.264, yüksek bitrate; master için ProRes'],
  ['Süre','45–60 sn (ana), 15 sn (kısa)'],
  ['Ses','Stereo, -14 LUFS civarı; VO net, müzik ducking\'li'],
  ['Teslimatlar','Sesli sürüm + sessiz sürüm + altyazılı (EN) sürüm; 3 en-boy oranı'],
  ['Ekstra','Kaynak proje dosyası (AE/Rive/Lottie), fontlar, renk kodları'],
]));
children.push(rule());

// 9
children.push(h1('9. Üretim Seçenekleri & Araçlar'));
children.push(body('Bu videoyu üretmenin birkaç yolu var; bütçe ve kontrole göre seç:'));
children.push(bullet('en profesyonel, tam kontrol. Storyboard doğrudan AE\'ye aktarılır. Bir motion designer 2–4 günde yapar.','After Effects (klasik):'));
children.push(bullet('mevcut HTML tanıtımını (tanitim-video.html) React/Remotion\'a taşıyıp kod ile birebir aynı ekranlardan MP4 render etmek. Kod tabanlı, tekrarlanabilir; uygulamayla %100 aynı görünür.','Remotion (kod ile video):'));
children.push(bullet('mikro-etkileşim animasyonları için hafif; uygulamaya da gömülebilir. Ekran geçişleri için ideal.','Rive / Lottie:'));
children.push(bullet('metinden video/animasyon üreten araçlar hızlı taslak için; ancak marka tutarlılığı ve ekran doğruluğu düşük olabilir.','AI video araçları:'));
children.push(bullet('elimizdeki tanitim-video.html\'i tarayıcıda oynatıp ekran kaydı (OBS / Win+G) almak — en hızlı ve ücretsiz yol; İngilizce anlatım sesiyle birlikte MP4 elde edilir. İlk sürüm için yeterli.','En hızlı (ücretsiz):'));
children.push(body([T('Öneri: ',{size:21,bold:true,color:GOLDD}),T('Taslak/ilk sürüm için "ekran kaydı" yolu; nihai reklam kalitesi için After Effects veya Remotion. Storyboard (Bölüm 6) her iki yolda da doğrudan kullanılabilir.',{size:21,color:INK})]));
children.push(rule());

// 10
children.push(h1('10. Yapım Kontrol Listesi'));
[
  'Senaryo ve storyboard onayı (Bölüm 5–6)',
  'Seslendirme kaydı (İngilizce VO, 7 replik)',
  'Müzik ve SFX seçimi (telifsiz)',
  'Ekran tasarımlarının animasyona hazırlanması (uygulama renk/font ile birebir)',
  'Sahne animasyonları (geçişler, tırnak boyama efekti, rozet sayaçları)',
  'Miks (VO + müzik ducking + SFX)',
  'Render: 16:9 + 9:16 + 1:1; sesli/sessiz/altyazılı',
  'Kontrol: marka tutarlılığı, süre, ilk 3 sn kancası, CTA netliği',
].forEach(t=>children.push(P({bullet:{level:0},spacing:{after:60},children:[T(t,{size:20,color:INK})]})));
children.push(P({spacing:{before:260},alignment:AlignmentType.CENTER,children:[T('Bu doküman bir yapım planıdır. Onayınla, mevcut HTML tanıtımından bir taslak MP4 üretmekle başlayabilir ya da doğrudan profesyonel animasyona geçebiliriz.',{italics:true,size:18,color:MUTED})]}));

const doc=new Document({
  creator:'Miracle Nail Art AI', title:'Animasyon Videosu — Yapım Dokümantasyonu',
  styles:{default:{document:{run:{font:'Calibri',size:21,color:INK}}}},
  sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:1200,bottom:1200,left:1200,right:1200}}},children}],
});
Packer.toBuffer(doc).then(buf=>{fs.writeFileSync('/home/claude/ngNailArt/Animasyon-Video-Dokumantasyonu.docx',buf);console.log('WROTE',buf.length,'bytes');});
