// Yasal metinler (uygulama içi gösterim). Dile göre TR/EN seçilir; RU/AR → EN.
// Bağlayıcı sürüm için teslim edilen DOCX dosyaları avukat onayından geçirilmelidir.

export type LegalDoc = 'privacy' | 'kvkk' | 'terms';
export interface LegalText { title: string; html: string; }

const PRIVACY_TR = `
<h4>1. Veri Sorumlusu</h4>
<p>Ünvan: [Şirket Ünvanı] · Adres: [Şirket Adresi] · E-posta: l.shalili@logper.com</p>
<h4>2. Topladığımız Kişisel Veriler</h4>
<ul>
<li><b>Hesap:</b> ad, soyad, e-posta, telefon, ülke ve şifreniz (geri döndürülemez şekilde hash'lenir; düz metin tutulmaz).</li>
<li><b>Üyelik/kullanım:</b> plan, kalan hak, ürettiğiniz tasarımlar, favoriler, işlem kayıtları.</li>
<li><b>Ödeme:</b> ödeme üçüncü taraf sağlayıcıda alınır; kart bilgisi sunucularımızda saklanmaz.</li>
<li><b>El/tırnak görüntüsü:</b> el analizi ve AR kameranızı kullanır; işleme <b>tamamen cihazınızda</b> olur, görüntüler sunucuya <b>yüklenmez</b>.</li>
<li><b>Teknik:</b> oturum jetonu, cihaz/tarayıcı bilgisi, hata kayıtları.</li>
<li><b>Destek:</b> Yardım/Destek üzerinden ilettiğiniz mesajlar.</li>
</ul>
<h4>3. İşleme Amaçları</h4>
<p>Hesap yönetimi ve kimlik doğrulama, yapay zeka ile tasarım üretimi, abonelik/ödeme, güvenlik ve iyileştirme, yasal yükümlülükler ve destek.</p>
<h4>4. Hukuki Sebepler</h4>
<p>Sözleşmenin ifası, açık rızanız (ör. kamera), meşru menfaat ve yasal yükümlülük.</p>
<h4>5. Üçüncü Taraflarla Paylaşım</h4>
<p>Yapay zeka görsel sağlayıcısı (metin isteği; el fotoğrafı gönderilmez), ödeme sağlayıcısı, SMS/e-posta sağlayıcıları. Verilerinizi asla satmayız.</p>
<h4>6. Uluslararası Aktarım</h4>
<p>Bazı sağlayıcıların sunucuları yurt dışında olabilir; aktarım uygun güvencelerle yapılır.</p>
<h4>7. Saklama Süresi</h4>
<p>Hesabınız aktif olduğu sürece ve yasal süreler boyunca. Hesabınızı silince veriler kalıcı silinir; 40 gün yeniden kayıt engeli uygulanabilir.</p>
<h4>8. Haklarınız</h4>
<p>Erişim, düzeltme, silme, itiraz, taşınabilirlik ve rızayı geri çekme. Uygulamadaki Hesabı Sil ve Yardım/Destek ile ya da l.shalili@logper.com üzerinden kullanabilirsiniz.</p>
<h4>9. Güvenlik</h4>
<p>HTTPS, şifre hash'leme ve erişim denetimleri gibi önlemler alınır.</p>
<h4>10. Çocukların Gizliliği</h4>
<p>Uygulama 18 yaş altı için tasarlanmamıştır.</p>
<h4>11. İletişim</h4>
<p>Sorularınız için: l.shalili@logper.com</p>
`;

const PRIVACY_EN = `
<h4>1. Data Controller</h4>
<p>Company: [Company Name] · Address: [Company Address] · Email: l.shalili@logper.com</p>
<h4>2. Personal Data We Collect</h4>
<ul>
<li><b>Account:</b> name, email, phone, country and password (stored irreversibly hashed, never plain text).</li>
<li><b>Membership/usage:</b> plan, remaining credits, designs you generate, favorites, activity records.</li>
<li><b>Payment:</b> processed by a third-party provider; card details are not stored on our servers.</li>
<li><b>Hand/nail images:</b> hand analysis and AR use your camera; processing happens <b>entirely on your device</b> and images are <b>not uploaded</b>.</li>
<li><b>Technical:</b> session token, device/browser info, error logs.</li>
<li><b>Support:</b> messages you send via Help/Support.</li>
</ul>
<h4>3. Purposes</h4>
<p>Account management and identity verification, AI design generation, subscription/payment, security and improvement, legal obligations and support.</p>
<h4>4. Legal Bases</h4>
<p>Performance of a contract, your explicit consent (e.g. camera), legitimate interest and legal obligation.</p>
<h4>5. Sharing With Third Parties</h4>
<p>AI image provider (text request; no hand photo sent), payment provider, SMS/email providers. We never sell your data.</p>
<h4>6. International Transfer</h4>
<p>Some providers' servers may be located abroad; transfers are made under appropriate safeguards.</p>
<h4>7. Retention</h4>
<p>While your account is active and for legal retention periods. On deletion your data is permanently removed; a 40-day re-registration block may apply.</p>
<h4>8. Your Rights</h4>
<p>Access, correction, deletion, objection, portability and consent withdrawal — via Delete Account and Help/Support in the App, or l.shalili@logper.com.</p>
<h4>9. Security</h4>
<p>Measures such as HTTPS, password hashing and access controls.</p>
<h4>10. Children's Privacy</h4>
<p>The App is not intended for anyone under 18.</p>
<h4>11. Contact</h4>
<p>Questions: l.shalili@logper.com</p>
`;

const KVKK_TR = `
<p><i>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca.</i></p>
<h4>1. Veri Sorumlusu</h4>
<p>Kişisel verileriniz, veri sorumlusu [Şirket Ünvanı] tarafından işlenmektedir.</p>
<h4>2. İşlenen Veriler</h4>
<p>Kimlik/iletişim (ad, soyad, telefon, e-posta, ülke), hesap/işlem verileri, işlem güvenliği verileri ve ödeme (üçüncü tarafça). El/tırnak görüntüsü yalnızca cihazınızda işlenir, sunucuya aktarılmaz.</p>
<h4>3. Amaçlar</h4>
<p>Üyelik yönetimi, kimlik doğrulama, yapay zeka tasarım hizmeti, ödeme, güvenlik, talep/şikâyet yanıtlama ve yasal yükümlülükler.</p>
<h4>4. Hukuki Sebepler (md. 5-6)</h4>
<p>Sözleşmenin ifası, hukuki yükümlülük, meşru menfaat ve açık rıza.</p>
<h4>5. Aktarım</h4>
<p>Hizmet sağlayıcılar (yapay zeka, ödeme, SMS/e-posta) ve yetkili kamu kurumlarıyla sınırlı olarak; md. 9 kapsamında yurt dışına aktarım söz konusu olabilir.</p>
<h4>6. Haklarınız (md. 11)</h4>
<p>İşlenip işlenmediğini öğrenme, bilgi talep etme, amacı öğrenme, aktarılan tarafları bilme, düzeltme, silme/yok etme, otomatik analize itiraz ve zararın giderilmesini isteme.</p>
<h4>7. Başvuru</h4>
<p>Uygulamadaki Hesabı Sil ve Yardım/Destek ile ya da l.shalili@logper.com üzerinden. Başvurular en geç 30 günde sonuçlandırılır.</p>
`;

const KVKK_EN = `
<p><i>This notice concerns Turkish data-protection law (KVKK, Law No. 6698). If you are outside Türkiye, your rights are described in the Privacy Policy (GDPR and equivalents).</i></p>
<h4>Data Controller</h4>
<p>Your personal data is processed by [Company Name] as data controller.</p>
<h4>Your Rights (KVKK Art. 11)</h4>
<p>To learn whether your data is processed, request information, learn the purpose, know the recipients, request correction or erasure, object to automated analysis and seek compensation for damages.</p>
<h4>Requests</h4>
<p>Via Delete Account and Help/Support in the App, or l.shalili@logper.com. Requests are answered within 30 days.</p>
`;

const TERMS_TR = `
<h4>1. Hizmetin Tanımı</h4>
<p>Yapay zeka destekli tırnak tasarımı, el analizi ve AR ile deneme. Bazı özellikler ücretsiz, bazıları ücretli paketlerle sunulur.</p>
<h4>2. Hesap ve Güvenlik</h4>
<p>Doğru bilgi vermelisiniz; hesap ve şifrenizin güvenliğinden siz sorumlusunuz.</p>
<h4>3. Kabul Edilebilir Kullanım</h4>
<p>Yasa dışı kullanım, başkalarının haklarını ihlal, kötüye kullanım, tersine mühendislik ve izinsiz erişim yasaktır.</p>
<h4>4. Abonelik, Ödeme ve İptal</h4>
<p>Ücretli planlar seçtiğiniz süre boyunca geçerlidir; ödeme üçüncü tarafça alınır; aktif paket süresi bitmeden aynısı tekrar alınamaz, yalnızca yükseltilir. İade/iptal mevzuata ve sağlayıcı kurallarına tabidir.</p>
<h4>5. Yapay Zeka İçeriği</h4>
<p>Üretilen görseller kişisel kullanımınız içindir; çıktılar her zaman kusursuz olmayabilir.</p>
<h4>6. Fikri Mülkiyet</h4>
<p>Uygulama, marka, tasarım ve yazılım [Şirket Ünvanı]'na aittir; izinsiz kullanılamaz.</p>
<h4>7. Sorumluluğun Sınırı</h4>
<p>Hizmet "olduğu gibi" sunulur; yasanın izin verdiği ölçüde dolaylı zararlardan sorumlu değiliz.</p>
<h4>8. Askıya Alma ve Fesih</h4>
<p>Şartları ihlal halinde hesap askıya alınabilir; dilediğinizde hesabınızı silebilirsiniz.</p>
<h4>9. Değişiklikler ve İletişim</h4>
<p>Şartlar güncellenebilir; kullanmaya devam etmek güncel şartların kabulüdür. İletişim: l.shalili@logper.com</p>
`;

const TERMS_EN = `
<h4>1. Description of the Service</h4>
<p>AI-powered nail design, hand analysis and AR try-on. Some features are free; others via paid packages.</p>
<h4>2. Account and Security</h4>
<p>Provide accurate information; you are responsible for your account and password security.</p>
<h4>3. Acceptable Use</h4>
<p>No unlawful use, infringement of others' rights, abuse, reverse engineering or unauthorized access.</p>
<h4>4. Subscription, Payment and Cancellation</h4>
<p>Paid plans last for the period you select; payment is processed by a third party; an active package can't be re-bought before expiry, only upgraded. Refund/cancellation follow law and provider rules.</p>
<h4>5. AI Content</h4>
<p>Generated images are for personal use; outputs may not always be flawless.</p>
<h4>6. Intellectual Property</h4>
<p>The App, brand, design and software belong to [Company Name] and may not be used without permission.</p>
<h4>7. Limitation of Liability</h4>
<p>The service is provided "as is"; to the extent permitted by law we are not liable for indirect damages.</p>
<h4>8. Suspension and Termination</h4>
<p>We may suspend accounts that breach these terms; you may delete your account anytime.</p>
<h4>9. Changes and Contact</h4>
<p>Terms may be updated; continued use means acceptance. Contact: l.shalili@logper.com</p>
`;

const DATA: Record<LegalDoc, { tr: LegalText; en: LegalText }> = {
  privacy: {
    tr: { title: 'Gizlilik Politikası', html: PRIVACY_TR },
    en: { title: 'Privacy Policy', html: PRIVACY_EN },
  },
  kvkk: {
    tr: { title: 'KVKK Aydınlatma Metni', html: KVKK_TR },
    en: { title: 'KVKK Notice', html: KVKK_EN },
  },
  terms: {
    tr: { title: 'Kullanım Şartları', html: TERMS_TR },
    en: { title: 'Terms of Use', html: TERMS_EN },
  },
};

/** Verilen belge ve dil için metni döndürür (TR dışı diller EN'e düşer). */
export function legalText(doc: LegalDoc, locale: string): LegalText {
  return locale === 'tr' ? DATA[doc].tr : DATA[doc].en;
}
