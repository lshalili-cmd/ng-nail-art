import { Injectable, signal, computed } from '@angular/core';

export type Locale = 'tr' | 'en' | 'ru' | 'ar';

export const LOCALES: { code: Locale; flag: string; label: string }[] = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
];

type Dict = Record<string, string>;

const EN: Dict = {
  app_name: 'Miracle Nail Art AI',
  splash_slogan: 'designs made just for you', splash_hint: 'TAP ▸',
  studio_tailored: '✨ Tailored to your hand scan', studio_tailored_prompt: 'An elegant, salon-quality nail design tailored to my {shape} nail shape and {tone} undertone',
  nav_home: 'Home', nav_scan: 'Scan', nav_explore: 'Explore', nav_shop: 'Shop', nav_profile: 'Profile',
  hero_overline: 'AI-POWERED BEAUTY', hero_title: 'Discover Your Perfect Nail Style',
  hero_sub: 'Let AI analyze your hand and recommend stunning designs', btn_scan: 'Scan Your Hand',
  trending: 'Trending Now', see_all: 'See all', ai_picks: 'AI Picks For You', top_artists: 'Top Artists',
  summer: 'Summer 2026', summer_sub: 'Sun-kissed designs for the season',
  explore_title: 'Explore Designs', categories: 'Categories', search_ph: 'Search nail designs...',
  cat_all: 'All', cat_luxury: 'Luxury', cat_bridal: 'Bridal', cat_minimal: 'Minimal', cat_trendy: 'Trendy',
  scan_title: 'AI Hand Analysis', scan_prompt: 'Position your hand in the frame',
  scan_sub: 'Take or upload a photo for AI analysis', take_photo: 'Take Photo', upload: 'Upload',
  analyzing: 'Analyzing your hand...', skin_tone: 'Skin Tone', finger_shape: 'Finger Shape',
  nail_bed: 'Nail Bed', nail_length: 'Nail Length', perfect_match: 'Your Perfect Match',
  try_on: 'Try On', rescan: 'Scan Again', warm_olive: 'Warm Olive', slender: 'Slender',
  med_oval: 'Medium Oval', medium: 'Medium',
  shop_title: 'Marketplace', artist_market: 'Artist Marketplace',
  artist_market_sub: 'Designs from top nail artists', feat_artists: 'Featured Artists', prem_col: 'Premium Collections',
  profile: 'Profile', favorites: 'Favorites', designs: 'Designs', tryons: 'Try-Ons',
  my_fav: 'My Favorites', tryon_hist: 'Try-On History', style_pref: 'Style Preferences',
  subscription: 'Subscription', settings: 'Settings', language: 'Language', help: 'Help & Support', logout: 'Log Out',
  manage_plan: 'Manage plan',
  ob_skip: 'Skip', ob_next: 'Next', ob_start: 'Get Started',
  ob1_t: 'Scan Your Hand', ob1_d: 'AI analyzes your skin tone, undertone and nail shape in seconds.',
  ob2_t: 'Personal Picks', ob2_d: 'Designs matched to you — the AI chooses what suits you best.',
  ob3_t: 'Try It in AR', ob3_d: 'See any design live on your own fingers, in real time.',
  ob4_t: 'Unlimited with Premium', ob4_d: 'Unlimited AI designs and real image generation — upgrade anytime.',
};

const TR: Dict = {
  app_name: 'Miracle Nail Art AI',
  splash_slogan: 'size özel tasarımlar', splash_hint: 'DOKUN ▸',
  studio_tailored: '✨ Elinize özel — tarama sonucuna göre', studio_tailored_prompt: '{shape} tırnak şeklime ve {tone} ten tonuma uygun, salon kalitesinde zarif bir tırnak tasarımı',
  nav_home: 'Ana Sayfa', nav_scan: 'Tara', nav_explore: 'Keşfet', nav_shop: 'Mağaza', nav_profile: 'Profil',
  hero_overline: 'YAPAY ZEKA GÜZELLİĞİ', hero_title: 'Mükemmel Tırnak Stilini Keşfet',
  hero_sub: 'Yapay zeka elinizi analiz etsin ve harika tasarımlar önersin', btn_scan: 'Elini Tara',
  trending: 'Trend Olanlar', see_all: 'Tümü', ai_picks: 'Yapay Zeka Seçimleri', top_artists: 'En İyi Sanatçılar',
  summer: 'Yaz 2026', summer_sub: 'Mevsimin güneş öpücüklü tasarımları',
  explore_title: 'Tasarımları Keşfet', categories: 'Kategoriler', search_ph: 'Tırnak tasarımı ara...',
  cat_all: 'Tümü', cat_luxury: 'Lüks', cat_bridal: 'Gelin', cat_minimal: 'Minimal', cat_trendy: 'Trend',
  scan_title: 'Yapay Zeka El Analizi', scan_prompt: 'Elinizi çerçeveye yerleştirin',
  scan_sub: 'AI analizi için fotoğraf çekin veya yükleyin', take_photo: 'Fotoğraf Çek', upload: 'Yükle',
  analyzing: 'Eliniz analiz ediliyor...', skin_tone: 'Cilt Tonu', finger_shape: 'Parmak Şekli',
  nail_bed: 'Tırnak Yatağı', nail_length: 'Tırnak Uzunluğu', perfect_match: 'Size En Uygun Tasarım',
  try_on: 'Dene', rescan: 'Tekrar Tara', warm_olive: 'Sıcak Zeytin', slender: 'İnce',
  med_oval: 'Orta Oval', medium: 'Orta',
  shop_title: 'Mağaza', artist_market: 'Sanatçı Pazaryeri',
  artist_market_sub: 'En iyi tırnak sanatçılarının tasarımları', feat_artists: 'Öne Çıkan Sanatçılar', prem_col: 'Premium Koleksiyonlar',
  profile: 'Profil', favorites: 'Favoriler', designs: 'Tasarımlar', tryons: 'Denemeler',
  my_fav: 'Favorilerim', tryon_hist: 'Deneme Geçmişi', style_pref: 'Stil Tercihleri',
  subscription: 'Abonelik', settings: 'Ayarlar', language: 'Dil', help: 'Yardım ve Destek', logout: 'Çıkış Yap',
  manage_plan: 'Planı Yönet',
  ob_skip: 'Atla', ob_next: 'İleri', ob_start: 'Hemen Başla',
  ob1_t: 'Elini Tara', ob1_d: 'AI cilt tonunu, alt tonunu ve tırnak şeklini saniyeler içinde analiz eder.',
  ob2_t: 'Sana Özel Öneriler', ob2_d: 'Analizine göre en yakışan tasarımları AI seçer.',
  ob3_t: 'AR ile Dene', ob3_d: 'Beğendiğin tasarımı parmağında canlı, gerçek zamanlı gör.',
  ob4_t: 'Premium ile Sınırsız', ob4_d: 'Sınırsız AI tasarım ve gerçek görsel üretimi; istediğin an yükselt.',
};

const RU: Dict = {
  app_name: 'Miracle Nail Art AI',
  splash_slogan: 'дизайны специально для вас', splash_hint: 'НАЖМИТЕ ▸',
  studio_tailored: '✨ Подобрано по результатам сканирования', studio_tailored_prompt: 'Элегантный маникюр салонного качества для моей формы ногтей «{shape}» и {tone} подтона',
  nav_home: 'Главная', nav_scan: 'Скан', nav_explore: 'Обзор', nav_shop: 'Магазин', nav_profile: 'Профиль',
  hero_overline: 'КРАСОТА НА ИИ', hero_title: 'Откройте свой идеальный стиль',
  hero_sub: 'ИИ проанализирует вашу руку и подберёт дизайны', btn_scan: 'Сканировать руку',
  trending: 'В тренде', see_all: 'Все', ai_picks: 'ИИ рекомендует', top_artists: 'Лучшие мастера',
  summer: 'Лето 2026', summer_sub: 'Солнечные дизайны сезона',
  explore_title: 'Каталог дизайнов', categories: 'Категории', search_ph: 'Поиск дизайнов...',
  cat_all: 'Все', cat_luxury: 'Люкс', cat_bridal: 'Свадебный', cat_minimal: 'Минимализм', cat_trendy: 'Тренд',
  scan_title: 'ИИ-анализ руки', scan_prompt: 'Расположите руку в рамке',
  scan_sub: 'Сделайте или загрузите фото', take_photo: 'Сделать фото', upload: 'Загрузить',
  analyzing: 'Анализируем руку...', skin_tone: 'Тон кожи', finger_shape: 'Форма пальцев',
  nail_bed: 'Ногтевое ложе', nail_length: 'Длина ногтей', perfect_match: 'Идеальный подбор',
  try_on: 'Примерить', rescan: 'Ещё раз', warm_olive: 'Тёплый оливковый', slender: 'Тонкие',
  med_oval: 'Средний овал', medium: 'Средняя',
  shop_title: 'Магазин', artist_market: 'Маркетплейс мастеров',
  artist_market_sub: 'Дизайны лучших мастеров', feat_artists: 'Лучшие мастера', prem_col: 'Премиум коллекции',
  profile: 'Профиль', favorites: 'Избранное', designs: 'Дизайны', tryons: 'Примерки',
  my_fav: 'Избранное', tryon_hist: 'История примерок', style_pref: 'Стиль',
  subscription: 'Подписка', settings: 'Настройки', language: 'Язык', help: 'Помощь', logout: 'Выйти',
};

const AR: Dict = {
  app_name: 'ميراكل نيل آرت',
  splash_slogan: 'تصاميم خاصة بك', splash_hint: 'المس ▸',
  studio_tailored: '✨ مصمم خصيصًا لك حسب فحص يدك', studio_tailored_prompt: 'تصميم أظافر أنيق بجودة الصالون يناسب شكل أظافري {shape} ودرجة لوني {tone}',
  nav_home: 'الرئيسية', nav_scan: 'مسح', nav_explore: 'استكشاف', nav_shop: 'المتجر', nav_profile: 'الملف',
  hero_overline: 'جمال بالذكاء الاصطناعي', hero_title: 'اكتشفي أسلوب أظافرك المثالي',
  hero_sub: 'دعي الذكاء الاصطناعي يحلل يدك ويقترح تصاميم رائعة', btn_scan: 'امسحي يدك',
  trending: 'الأكثر رواجاً', see_all: 'الكل', ai_picks: 'اختيارات الذكاء', top_artists: 'أفضل الفنانين',
  summer: 'صيف 2026', summer_sub: 'تصاميم مشرقة للموسم',
  explore_title: 'استكشاف التصاميم', categories: 'الفئات', search_ph: 'ابحثي عن تصاميم...',
  cat_all: 'الكل', cat_luxury: 'فاخر', cat_bridal: 'عروس', cat_minimal: 'بسيط', cat_trendy: 'رائج',
  scan_title: 'تحليل اليد بالذكاء', scan_prompt: 'ضعي يدك داخل الإطار',
  scan_sub: 'التقطي أو ارفعي صورة للتحليل', take_photo: 'التقاط صورة', upload: 'رفع',
  analyzing: 'جاري تحليل يدك...', skin_tone: 'لون البشرة', finger_shape: 'شكل الأصابع',
  nail_bed: 'قاعدة الظفر', nail_length: 'طول الأظافر', perfect_match: 'التصميم المثالي لك',
  try_on: 'تجربة', rescan: 'مسح مجدداً', warm_olive: 'زيتوني دافئ', slender: 'نحيف',
  med_oval: 'بيضاوي متوسط', medium: 'متوسط',
  shop_title: 'المتجر', artist_market: 'سوق الفنانين',
  artist_market_sub: 'تصاميم أفضل الفنانين', feat_artists: 'فنانون مميزون', prem_col: 'مجموعات مميزة',
  profile: 'الملف الشخصي', favorites: 'المفضلة', designs: 'تصاميم', tryons: 'التجارب',
  my_fav: 'المفضلة', tryon_hist: 'سجل التجارب', style_pref: 'تفضيلات الأسلوب',
  subscription: 'الاشتراك', settings: 'الإعدادات', language: 'اللغة', help: 'المساعدة', logout: 'تسجيل الخروج',
};

// ── AI Studio ekranı anahtarları (Sprint 2) ──
Object.assign(EN, {
  studio_title: 'AI Design Studio', home_ai_design: 'Design with AI', scan_ai_suggest: 'Suggest with AI',
  studio_prompt_ph: 'Describe your dream nails... (e.g. gold chrome almond French)',
  studio_hint: 'Type colors, style, pattern and finish — AI proposes a design.',
  studio_generate: 'Design', studio_generating: 'Creating your design...', studio_result: 'Proposed Design',
  studio_colors: 'Colors', studio_effects: 'Effects', studio_finish: 'Finish', studio_shape: 'Shape',
  studio_try_ar: 'Try in AR', studio_save: 'Save', studio_regenerate: 'Regenerate', studio_gen_image: 'Generate image',
  studio_demo_note: 'Demo mode — connect the AI backend for real generation.', studio_error: 'Generation failed',
});
Object.assign(TR, {
  studio_title: 'AI Tasarım Stüdyosu', home_ai_design: 'AI ile Tasarla', scan_ai_suggest: 'AI ile Tasarım Öner',
  studio_prompt_ph: 'Hayalindeki tırnağı anlat... (ör. altın kromlu badem French)',
  studio_hint: 'Renk, stil, desen ve finiş yaz; AI bir tasarım önersin.',
  studio_generate: 'Tasarla', studio_generating: 'Tasarımın üretiliyor...', studio_result: 'Önerilen Tasarım',
  studio_colors: 'Renkler', studio_effects: 'Efektler', studio_finish: 'Finiş', studio_shape: 'Şekil',
  studio_try_ar: "AR'da Dene", studio_save: 'Kaydet', studio_regenerate: 'Yeniden Üret', studio_gen_image: 'Görsel Üret',
  studio_demo_note: "Demo modu — gerçek üretim için AI backend'ini bağlayın.", studio_error: 'Üretim başarısız oldu',
});
Object.assign(RU, {
  studio_title: 'AI Студия дизайна', home_ai_design: 'Создать с ИИ', scan_ai_suggest: 'Предложить с ИИ',
  studio_prompt_ph: 'Опишите желаемый дизайн... (напр. золотой хром миндаль френч)',
  studio_hint: 'Укажите цвета, стиль, узор и финиш — ИИ предложит дизайн.',
  studio_generate: 'Создать', studio_generating: 'Создаём ваш дизайн...', studio_result: 'Предложенный дизайн',
  studio_colors: 'Цвета', studio_effects: 'Эффекты', studio_finish: 'Финиш', studio_shape: 'Форма',
  studio_try_ar: 'Примерить в AR', studio_save: 'Сохранить', studio_regenerate: 'Заново', studio_gen_image: 'Создать фото',
  studio_demo_note: 'Демо-режим — подключите AI backend для реальной генерации.', studio_error: 'Ошибка генерации',
});
Object.assign(AR, {
  studio_title: 'استوديو التصميم بالذكاء', home_ai_design: 'صممي بالذكاء', scan_ai_suggest: 'اقتراح بالذكاء',
  studio_prompt_ph: 'صفي أظافر أحلامك... (مثال: كروم ذهبي لوز فرنش)',
  studio_hint: 'اكتبي الألوان والنمط والطلاء — يقترح الذكاء تصميماً.',
  studio_generate: 'صممي', studio_generating: 'يتم إنشاء تصميمك...', studio_result: 'التصميم المقترح',
  studio_colors: 'الألوان', studio_effects: 'التأثيرات', studio_finish: 'اللمسة', studio_shape: 'الشكل',
  studio_try_ar: 'جربي بالAR', studio_save: 'حفظ', studio_regenerate: 'إعادة', studio_gen_image: 'إنشاء صورة',
  studio_demo_note: 'وضع تجريبي — اربطي خادم الذكاء للإنشاء الحقيقي.', studio_error: 'فشل الإنشاء',
});

// ── Gerçek kamera + MediaPipe analizi anahtarları (Sprint 3) ──
Object.assign(EN, {
  cam_start: 'Open Camera', cam_capture: 'Analyze', cam_cancel: 'Cancel',
  cam_hint: 'Fit your hand inside the frame', no_hand: 'No hand detected — try again',
  err_camera: 'Could not access the camera', err_model: 'AI model could not load (check your connection)',
  choose_shape: 'Nail shape', manual_note: 'Automatic analysis unavailable — pick your skin tone and nail shape manually below.', result_undertone: 'Undertone', result_hand: 'Hand',
  shape_hint: 'Pick your shape below — this is what we use. The auto guess is only approximate; a close-up scans one nail far more accurately.',
  approx: 'approx.',
  closeup_detect: 'Close-up detect',
  closeup_upload: 'Upload close-up',
  closeup_guide: 'Fill the frame with a single nail — sharp focus, good light.',
  closeup_fail: 'Couldn\'t read the nail — get closer, steadier, with more contrast.',
  capture_tip: 'For accurate shape detection: spread your fingers, good lighting, plain background, nails toward the camera.',
  ut_warm: 'Warm', ut_cool: 'Cool', ut_neutral: 'Neutral',
  fl_short: 'Short', fl_medium: 'Medium', fl_long: 'Long',
  hand_Left: 'Left', hand_Right: 'Right',
  tone_very_fair: 'Very Fair', tone_fair: 'Fair', tone_light_wheat: 'Light Wheat', tone_wheat: 'Wheat',
  tone_tan: 'Tan', tone_dark_tan: 'Dark Tan', tone_dark_brown: 'Dark Brown', tone_very_dark: 'Very Dark',
  shp_oval: 'Oval', shp_almond: 'Almond', shp_square: 'Square', shp_squoval: 'Squoval',
  shp_coffin: 'Coffin', shp_stiletto: 'Stiletto', shp_round: 'Round',
});
Object.assign(TR, {
  cam_start: 'Kamerayı Aç', cam_capture: 'Analiz Et', cam_cancel: 'İptal',
  cam_hint: 'Elinizi çerçeveye yerleştirin', no_hand: 'El algılanamadı — tekrar deneyin',
  err_camera: 'Kameraya erişilemedi', err_model: 'AI modeli yüklenemedi (bağlantınızı kontrol edin)',
  choose_shape: 'Tırnak şekli', manual_note: 'Otomatik analiz yapılamadı — ten tonunu ve tırnak şeklini aşağıdan elle seç.', result_undertone: 'Alt Ton', result_hand: 'El',
  shape_hint: 'Şekli aşağıdan sen seç — kullanılan bu. Otomatik tahmin yalnızca yaklaşıktır; tek tırnak yakın çekimi çok daha isabetli sonuç verir.',
  approx: 'yaklaşık',
  closeup_detect: 'Yakın çekimle algıla',
  closeup_upload: 'Yakın çekim yükle',
  closeup_guide: 'Kadrajı tek tırnakla doldur — net odak, iyi ışık.',
  closeup_fail: 'Tırnak okunamadı — daha yakın, sabit ve kontrastlı dene.',
  capture_tip: 'Doğru şekil algılama için: parmaklarınızı açın, iyi ışık, sade arka plan, tırnaklar kameraya dönük olsun.',
  ut_warm: 'Sıcak', ut_cool: 'Soğuk', ut_neutral: 'Nötr',
  fl_short: 'Kısa', fl_medium: 'Orta', fl_long: 'Uzun',
  hand_Left: 'Sol', hand_Right: 'Sağ',
  tone_very_fair: 'Çok Açık', tone_fair: 'Açık', tone_light_wheat: 'Açık Buğday', tone_wheat: 'Buğday',
  tone_tan: 'Bronz', tone_dark_tan: 'Koyu Bronz', tone_dark_brown: 'Koyu Kahve', tone_very_dark: 'Çok Koyu',
  shp_oval: 'Oval', shp_almond: 'Badem', shp_square: 'Kare', shp_squoval: 'Kare-Oval',
  shp_coffin: 'Coffin', shp_stiletto: 'Stiletto', shp_round: 'Yuvarlak',
});

// ── Kamera ek mesajları (daha yol gösterici) ──
Object.assign(EN, {
  cam_not_ready: 'Camera not ready yet — wait a second and try again',
  no_hand: 'No hand detected — show your palm/back of hand clearly in the frame and try again',
});
Object.assign(TR, {
  cam_not_ready: 'Kamera henüz hazır değil — bir saniye bekleyip tekrar deneyin',
  no_hand: 'El algılanamadı — elinizin içi/üstü çerçevede net görünsün ve tekrar deneyin',
});
Object.assign(RU, {
  cam_not_ready: 'Камера ещё не готова — подождите секунду и повторите',
  no_hand: 'Рука не обнаружена — покажите ладонь чётко в кадре',
});
Object.assign(AR, {
  cam_not_ready: 'الكاميرا غير جاهزة — انتظري ثم أعيدي المحاولة',
  no_hand: 'لم يتم اكتشاف اليد — أظهري كفّك بوضوح في الإطار',
});

// ── Üyelik / Mağaza ──
Object.assign(EN, { membership: 'Membership', membership_sub: 'Upgrade for unlimited AI designs, real image generation and more', current_plan: 'Your plan', upgrade: 'Upgrade', select: 'Select', credit_packs: 'Image Packs', credits: 'images', payment_soon: 'Payment integration coming soon — selection is saved locally for now.', plan_locked: 'Not available', renew: 'Renew', days_left: 'days left', upgrade_rules: 'You can\'t re-buy your active plan before it expires — only upgrade. Once it expires you can pick any plan (downgrade included). Same rule for extra packs: you can\'t re-buy the same pack before it expires — only upgrade to a bigger one.', quota_remaining: 'Images left', quota_empty: 'You\'re out of image credits. Upgrade your plan or buy an extra pack.', quota_upgrade: 'Upgrade plan', quota_buy_pack: 'Buy extra pack', pack_added: 'added', pay_title: 'Payment', pay_provider: 'Payment method', pay_go: 'Continue to payment', pay_test: 'Pay (test)', pay_processing: 'Processing…', pay_cancel: 'Cancel', pay_secure: 'Secure payment — you\'ll be redirected to the provider.', pay_demo_note: 'Demo mode — no real charge. Add provider keys to go live.', pay_success: 'Payment successful', pay_close: 'Done' });
Object.assign(TR, { membership: 'Üyelik', membership_sub: 'Sınırsız AI tasarım, gerçek görsel üretimi ve daha fazlası için yükseltin', current_plan: 'Planınız', upgrade: 'Yükselt', select: 'Seç', credit_packs: 'Görsel Paketleri', credits: 'görsel', payment_soon: 'Ödeme entegrasyonu yakında — şimdilik seçim cihazda saklanıyor.', plan_locked: 'Uygun değil', renew: 'Yenile', days_left: 'gün kaldı', upgrade_rules: 'Aktif paketinizi süresi bitmeden tekrar alamazsınız — yalnızca yükseltebilirsiniz. Süresi dolunca istediğiniz planı seçebilirsiniz (düşürme dahil). Ek paketler için de aynı kural: aynı paketi süresi bitmeden tekrar alamazsınız, yalnızca daha büyük pakete geçebilirsiniz.', quota_remaining: 'Kalan görsel', quota_empty: 'Görsel hakkınız bitti. Paketi yükseltin ya da ek paket alın.', quota_upgrade: 'Paketi Yükselt', quota_buy_pack: 'Ek Paket Al', pack_added: 'eklendi', pay_title: 'Ödeme', pay_provider: 'Ödeme yöntemi', pay_go: 'Ödemeye devam et', pay_test: 'Öde (test)', pay_processing: 'İşleniyor…', pay_cancel: 'Vazgeç', pay_secure: 'Güvenli ödeme — sağlayıcının sayfasına yönlendirileceksiniz.', pay_demo_note: 'Demo modu — gerçek tahsilat yok. Yayına almak için sağlayıcı anahtarı ekleyin.', pay_success: 'Ödeme başarılı', pay_close: 'Tamam' });
Object.assign(RU, { membership: 'Подписка', membership_sub: 'Безлимитные AI-дизайны и генерация изображений', current_plan: 'Ваш план', upgrade: 'Улучшить', select: 'Выбрать', credit_packs: 'Пакеты изображений', credits: 'изображений', payment_soon: 'Оплата скоро — выбор пока сохраняется локально.', plan_locked: 'Недоступно', renew: 'Продлить', days_left: 'дн. осталось', upgrade_rules: 'Нельзя повторно купить активный план до окончания — только улучшение. После окончания можно выбрать любой план (в т.ч. ниже). То же для доп. пакетов: нельзя купить тот же пакет до окончания — только переход на больший.', quota_remaining: 'Осталось изображений', quota_empty: 'Изображения закончились. Улучшите план или купите доп. пакет.', quota_upgrade: 'Улучшить план', quota_buy_pack: 'Купить пакет', pack_added: 'добавлено' });
Object.assign(AR, { membership: 'العضوية', membership_sub: 'ترقية لتصاميم ذكاء غير محدودة وإنشاء صور حقيقية', current_plan: 'خطتك', upgrade: 'ترقية', select: 'اختيار', credit_packs: 'حزم الصور', credits: 'صورة', payment_soon: 'الدفع قريباً — يُحفظ الاختيار محلياً الآن.', plan_locked: 'غير متاح', renew: 'تجديد', days_left: 'يوم متبقٍ', upgrade_rules: 'لا يمكنك إعادة شراء خطتك النشطة قبل انتهائها — الترقية فقط. بعد انتهائها يمكنك اختيار أي خطة (بما في ذلك الأدنى). ونفس القاعدة للحزم الإضافية: لا يمكنك شراء نفس الحزمة قبل انتهائها — الترقية لحزمة أكبر فقط.', quota_remaining: 'الصور المتبقية', quota_empty: 'انتهت أرصدة الصور. رقِّ خطتك أو اشترِ حزمة إضافية.', quota_upgrade: 'ترقية الخطة', quota_buy_pack: 'شراء حزمة', pack_added: 'أُضيفت' });

// ── Mağaza plan/paket içerikleri + Studio öneri çipleri (dile bağlı) ──
Object.assign(EN, {
  pn_free: 'Free', pn_monthly: 'Monthly Premium', pn_yearly: 'Yearly Premium', pn_pro: 'Monthly Pro', pn_pro_yearly: 'Yearly Pro',
  badge_25: '25% off',
  f_free_img: '1 AI image/month', f_free_tools: 'Hand scan · AI Studio · AR: once', f_gallery: 'Gallery (135+): full access',
  f_m30: '30 AI images/month', f_tools_unlim: 'Scan · AI Studio · AR: unlimited', f_extra: 'Can buy extra packs',
  f_y360: '360 images/year total', f_all_unlim: 'Everything unlimited', f_589: '~$5.89/mo',
  f_p100: '100 AI images/month', f_salon: 'For salons & pros', f_py1200: '1,200 images/year total', f_1875: '~$18.75/mo',
  f_bigsalon: 'For large salons & agencies',
  pk_mini: 'Mini', pk_standart: 'Standard', pk_mega: 'Mega',
  sug1: 'Gold chrome almond French', sug2: 'Pastel pink minimal', sug3: 'Galaxy deep blue',
  sug4: 'Pearl white for brides', sug5: 'Red matte coffin',
});
Object.assign(TR, {
  pn_free: 'Free', pn_monthly: 'Aylık Premium', pn_yearly: 'Yıllık Premium', pn_pro: 'Aylık Pro', pn_pro_yearly: 'Yıllık Pro',
  badge_25: '%25 indirim',
  f_free_img: '1 AI görsel/ay', f_free_tools: 'El tarama · AI Stüdyo · AR: 1 kez', f_gallery: 'Galeri (135+): tam erişim',
  f_m30: 'Aylık 30 görsel üretim', f_tools_unlim: 'Tarama · AI Stüdyo · AR: sınırsız', f_extra: 'Ek paket alabilir',
  f_y360: 'Yıllık toplam 360 görsel', f_all_unlim: 'Her şey sınırsız', f_589: '~$5.89/ay',
  f_p100: 'Aylık 100 görsel üretim', f_salon: 'Salon & profesyoneller için', f_py1200: 'Yıllık toplam 1.200 görsel', f_1875: '~$18.75/ay',
  f_bigsalon: 'Büyük salon & ajanslar için',
  pk_mini: 'Mini', pk_standart: 'Standart', pk_mega: 'Mega',
  sug1: 'Altın kromlu badem French', sug2: 'Pastel pembe minimal', sug3: 'Galaksi temalı koyu mavi',
  sug4: 'Gelin için inci beyazı', sug5: 'Kırmızı mat coffin',
});
Object.assign(RU, {
  pn_free: 'Free', pn_monthly: 'Премиум Месяц', pn_yearly: 'Премиум Год', pn_pro: 'Pro Месяц', pn_pro_yearly: 'Pro Год',
  badge_25: '−25%',
  f_free_img: '1 AI-изображение/мес', f_free_tools: 'Скан · AI Студия · AR: 1 раз', f_gallery: 'Галерея (135+): полный доступ',
  f_m30: '30 AI-изображений/мес', f_tools_unlim: 'Скан · AI Студия · AR: без лимита', f_extra: 'Доп. пакеты доступны',
  f_y360: '360 изображений в год', f_all_unlim: 'Всё без лимита', f_589: '~$5.89/мес',
  f_p100: '100 AI-изображений/мес', f_salon: 'Для салонов и профи', f_py1200: '1 200 изображений в год', f_1875: '~$18.75/мес',
  f_bigsalon: 'Для больших салонов и агентств',
  pk_mini: 'Mini', pk_standart: 'Стандарт', pk_mega: 'Mega',
  sug1: 'Золотой хром миндаль френч', sug2: 'Пастельный розовый минимал', sug3: 'Галактика тёмно-синий',
  sug4: 'Жемчужно-белый для невест', sug5: 'Красный матовый coffin',
});
Object.assign(AR, {
  pn_free: 'Free', pn_monthly: 'بريميوم شهري', pn_yearly: 'بريميوم سنوي', pn_pro: 'برو شهري', pn_pro_yearly: 'برو سنوي',
  badge_25: 'خصم ٢٥٪',
  f_free_img: 'صورة ذكاء واحدة/شهر', f_free_tools: 'مسح · استوديو · AR: مرة', f_gallery: 'المعرض (135+): وصول كامل',
  f_m30: '٣٠ صورة ذكاء/شهر', f_tools_unlim: 'مسح · استوديو · AR: غير محدود', f_extra: 'يمكن شراء حزم إضافية',
  f_y360: '٣٦٠ صورة سنوياً', f_all_unlim: 'كل شيء غير محدود', f_589: '~$5.89/شهر',
  f_p100: '١٠٠ صورة ذكاء/شهر', f_salon: 'للصالونات والمحترفين', f_py1200: '١٢٠٠ صورة سنوياً', f_1875: '~$18.75/شهر',
  f_bigsalon: 'للصالونات والوكالات الكبيرة',
  pk_mini: 'Mini', pk_standart: 'ستاندرد', pk_mega: 'Mega',
  sug1: 'كروم ذهبي لوز فرنش', sug2: 'وردي باستيل بسيط', sug3: 'مجرة أزرق غامق',
  sug4: 'أبيض لؤلؤي للعرائس', sug5: 'أحمر مطفي coffin',
});

// ── Detay sayfası + paylaşım ──
Object.assign(EN, { back: 'Back', not_found: 'Design not found', download: 'Download', share: 'Share' });
Object.assign(TR, { back: 'Geri', not_found: 'Tasarım bulunamadı', download: 'İndir', share: 'Paylaş' });
Object.assign(RU, { back: 'Назад', not_found: 'Дизайн не найден', download: 'Скачать', share: 'Поделиться' });
Object.assign(AR, { back: 'رجوع', not_found: 'التصميم غير موجود', download: 'تنزيل', share: 'مشاركة' });

// ── AR Deneme ──
Object.assign(EN, { ar_title: 'AR Try-On', ar_capture: 'Capture', ar_color: 'Polish color', ar_close: 'Close', ar_hint: 'Show your hand to the camera', ar_starting: 'Starting camera...' });
Object.assign(TR, { ar_title: 'AR Deneme', ar_capture: 'Fotoğraf', ar_color: 'Oje rengi', ar_close: 'Kapat', ar_hint: 'Elinizi kameraya gösterin', ar_starting: 'Kamera başlatılıyor...' });
Object.assign(RU, { ar_title: 'AR примерка', ar_capture: 'Снимок', ar_color: 'Цвет лака', ar_close: 'Закрыть', ar_hint: 'Покажите руку камере', ar_starting: 'Запуск камеры...' });
Object.assign(AR, { ar_title: 'تجربة AR', ar_capture: 'التقاط', ar_color: 'لون الطلاء', ar_close: 'إغلاق', ar_hint: 'أظهري يدك للكاميرا', ar_starting: 'جارٍ تشغيل الكاميرا...' });

// ── Veritabanı: kayıtlı tasarımlar ──
Object.assign(EN, { saved_designs: 'Saved Designs', saved: 'Saved' });
Object.assign(TR, { saved_designs: 'Kayıtlı Tasarımlar', saved: 'Kaydedildi' });
Object.assign(RU, { saved_designs: 'Сохранённые', saved: 'Сохранено' });
Object.assign(AR, { saved_designs: 'التصاميم المحفوظة', saved: 'تم الحفظ' });

// ── Alt menü: AI Studio sekmesi ──
Object.assign(EN, { nav_studio: 'Studio' });
Object.assign(TR, { nav_studio: 'Stüdyo' });
Object.assign(RU, { nav_studio: 'Студия' });
Object.assign(AR, { nav_studio: 'استوديو' });

// ── Rozet etiketleri + eşleşme ──
Object.assign(EN, { badge_trending: 'Trending', badge_new: 'New', badge_premium: 'Premium', match: 'match', for_you: 'Matched for you', no_favorites: 'No favorites yet — tap the heart on a design to save it.' });
Object.assign(TR, { badge_trending: 'Trend', badge_new: 'Yeni', badge_premium: 'Premium', match: 'uyum', for_you: 'Size özel eşleşti', no_favorites: 'Henüz favori yok — bir tasarımdaki kalbe dokunarak kaydedin.' });
Object.assign(RU, { badge_trending: 'Тренд', badge_new: 'Новое', badge_premium: 'Премиум', match: 'совпадение', for_you: 'Подобрано для вас', no_favorites: 'Пока нет избранного — нажмите сердечко на дизайне.' });
Object.assign(AR, { badge_trending: 'رائج', badge_new: 'جديد', badge_premium: 'مميز', match: 'تطابق', for_you: 'مطابق لكِ', no_favorites: 'لا مفضلات بعد — اضغطي القلب على أي تصميم.' });

// ── RU/AR eksik blok tamamlamaları (tarama sonuçları, ödeme, onboarding, plan) ──
Object.assign(RU, {
  cam_start: 'Открыть камеру', cam_capture: 'Анализ', cam_cancel: 'Отмена',
  cam_hint: 'Поместите руку в рамку', err_camera: 'Нет доступа к камере', err_model: 'Не удалось загрузить AI-модель (проверьте связь)',
  choose_shape: 'Форма ногтя', manual_note: 'Автоанализ недоступен — выберите тон кожи и форму ногтя вручную ниже.', result_undertone: 'Подтон', result_hand: 'Рука',
  shape_hint: 'Выберите форму ниже — используется она. Авто-оценка приблизительна; макросъёмка одного ногтя точнее.',
  approx: 'прибл.', closeup_detect: 'Определить (макро)', closeup_upload: 'Загрузить макро',
  closeup_guide: 'Заполните кадр одним ногтем — резкость и хороший свет.',
  closeup_fail: 'Не удалось распознать ноготь — ближе, устойчивее, контрастнее.',
  capture_tip: 'Для точности: раздвиньте пальцы, хороший свет, простой фон, ногти к камере.',
  ut_warm: 'Тёплый', ut_cool: 'Холодный', ut_neutral: 'Нейтральный',
  fl_short: 'Короткие', fl_medium: 'Средние', fl_long: 'Длинные',
  hand_Left: 'Левая', hand_Right: 'Правая',
  tone_very_fair: 'Очень светлый', tone_fair: 'Светлый', tone_light_wheat: 'Светлая пшеница', tone_wheat: 'Пшеничный',
  tone_tan: 'Загар', tone_dark_tan: 'Тёмный загар', tone_dark_brown: 'Тёмно-коричневый', tone_very_dark: 'Очень тёмный',
  shp_oval: 'Овал', shp_almond: 'Миндаль', shp_square: 'Квадрат', shp_squoval: 'Сквовал',
  shp_coffin: 'Coffin', shp_stiletto: 'Стилет', shp_round: 'Круглый',
  pay_title: 'Оплата', pay_provider: 'Способ оплаты', pay_go: 'Перейти к оплате', pay_test: 'Оплатить (тест)',
  pay_processing: 'Обработка…', pay_cancel: 'Отмена', pay_secure: 'Безопасная оплата — вы перейдёте к провайдеру.',
  pay_demo_note: 'Демо — без реальной оплаты. Добавьте ключи для запуска.', pay_success: 'Оплата успешна', pay_close: 'Готово',
  manage_plan: 'Управление планом',
  ob_skip: 'Пропустить', ob_next: 'Далее', ob_start: 'Начать',
  ob1_t: 'Сканируйте руку', ob1_d: 'ИИ анализирует тон кожи, подтон и форму ногтей за секунды.',
  ob2_t: 'Личные подборки', ob2_d: 'Дизайны, подобранные вам — ИИ выбирает лучшее.',
  ob3_t: 'Примерка в AR', ob3_d: 'Смотрите любой дизайн на своих пальцах в реальном времени.',
  ob4_t: 'Безлимит с Премиум', ob4_d: 'Безлимитные AI-дизайны и генерация — улучшайте в любой момент.',
});
Object.assign(AR, {
  cam_start: 'افتحي الكاميرا', cam_capture: 'تحليل', cam_cancel: 'إلغاء',
  cam_hint: 'ضعي يدك داخل الإطار', err_camera: 'تعذّر الوصول للكاميرا', err_model: 'تعذّر تحميل نموذج الذكاء (تحققي من الاتصال)',
  choose_shape: 'شكل الظفر', manual_note: 'تعذّر التحليل التلقائي — اختاري درجة لون البشرة وشكل الظفر يدويًا أدناه.', result_undertone: 'درجة اللون', result_hand: 'اليد',
  shape_hint: 'اختاري الشكل بالأسفل — هو المستخدم. التقدير التلقائي تقريبي؛ لقطة مقرّبة لظفر واحد أدق.',
  approx: 'تقريبي', closeup_detect: 'كشف مقرّب', closeup_upload: 'رفع لقطة مقرّبة',
  closeup_guide: 'املئي الإطار بظفر واحد — تركيز حاد وإضاءة جيدة.',
  closeup_fail: 'تعذّرت قراءة الظفر — اقتربي، ثبات وتباين أكثر.',
  capture_tip: 'للدقة: باعدي أصابعك، إضاءة جيدة، خلفية بسيطة، الأظافر نحو الكاميرا.',
  ut_warm: 'دافئ', ut_cool: 'بارد', ut_neutral: 'محايد',
  fl_short: 'قصيرة', fl_medium: 'متوسطة', fl_long: 'طويلة',
  hand_Left: 'يسار', hand_Right: 'يمين',
  tone_very_fair: 'فاتح جداً', tone_fair: 'فاتح', tone_light_wheat: 'قمحي فاتح', tone_wheat: 'قمحي',
  tone_tan: 'برونزي', tone_dark_tan: 'برونزي غامق', tone_dark_brown: 'بني غامق', tone_very_dark: 'غامق جداً',
  shp_oval: 'بيضاوي', shp_almond: 'لوز', shp_square: 'مربع', shp_squoval: 'مربع-بيضاوي',
  shp_coffin: 'Coffin', shp_stiletto: 'ستيلتو', shp_round: 'دائري',
  pay_title: 'الدفع', pay_provider: 'طريقة الدفع', pay_go: 'المتابعة للدفع', pay_test: 'ادفعي (تجريبي)',
  pay_processing: 'جارٍ المعالجة…', pay_cancel: 'إلغاء', pay_secure: 'دفع آمن — سيتم تحويلك للمزوّد.',
  pay_demo_note: 'وضع تجريبي — بلا رسوم. أضيفي المفاتيح للتفعيل.', pay_success: 'تم الدفع بنجاح', pay_close: 'تم',
  manage_plan: 'إدارة الخطة',
  ob_skip: 'تخطي', ob_next: 'التالي', ob_start: 'ابدئي الآن',
  ob1_t: 'امسحي يدك', ob1_d: 'يحلل الذكاء لون بشرتك ودرجتها وشكل أظافرك في ثوانٍ.',
  ob2_t: 'اختيارات لكِ', ob2_d: 'تصاميم مطابقة لكِ — يختار الذكاء الأنسب.',
  ob3_t: 'جرّبي بالAR', ob3_d: 'شاهدي أي تصميم على أصابعك مباشرةً.',
  ob4_t: 'غير محدود مع بريميوم', ob4_d: 'تصاميم ذكاء وإنشاء صور بلا حدود — رقّي وقتما تشائين.',
});

Object.assign(EN, { per_mo: '/mo', per_yr: '/yr' });
Object.assign(TR, { per_mo: '/ay', per_yr: '/yıl' });
Object.assign(RU, { per_mo: '/мес', per_yr: '/год' });
Object.assign(AR, { per_mo: '/شهر', per_yr: '/سنة' });

// ── Kimlik doğrulama (giriş/kayıt) ──
Object.assign(EN, {
  login: 'Log in', register: 'Sign up', auth_guest: 'Guest',
  auth_sub: 'Log in to sync your favorites, plan and credits across devices.',
  auth_email: 'Email', auth_password: 'Password (min 6)', auth_fill: 'Enter email and password',
  auth_switch_reg: "Don't have an account? Sign up", auth_switch_log: 'Already a member? Log in',
});
Object.assign(TR, {
  login: 'Giriş Yap', register: 'Kayıt Ol', auth_guest: 'Misafir',
  auth_sub: 'Giriş yap; favorilerin, planın ve kredilerin cihazlar arası senkronlansın.',
  auth_email: 'E-posta', auth_password: 'Şifre (en az 6)', auth_fill: 'E-posta ve şifre gir',
  auth_switch_reg: 'Hesabın yok mu? Kayıt ol', auth_switch_log: 'Zaten üye misin? Giriş yap',
});
Object.assign(RU, {
  login: 'Войти', register: 'Регистрация', auth_guest: 'Гость',
  auth_sub: 'Войдите, чтобы синхронизировать избранное, план и кредиты между устройствами.',
  auth_email: 'Эл. почта', auth_password: 'Пароль (мин. 6)', auth_fill: 'Введите почту и пароль',
  auth_switch_reg: 'Нет аккаунта? Зарегистрируйтесь', auth_switch_log: 'Уже есть аккаунт? Войти',
});
Object.assign(AR, {
  login: 'تسجيل الدخول', register: 'إنشاء حساب', auth_guest: 'ضيف',
  auth_sub: 'سجّلي الدخول لمزامنة المفضلة والخطة والأرصدة بين الأجهزة.',
  auth_email: 'البريد الإلكتروني', auth_password: 'كلمة المرور (٦ على الأقل)', auth_fill: 'أدخلي البريد وكلمة المرور',
  auth_switch_reg: 'ليس لديك حساب؟ سجّلي', auth_switch_log: 'لديك حساب؟ ادخلي',
});

// ── Kayıt alanları / OTP / şifre sıfırlama ──
Object.assign(EN, {
  auth_first: 'First name', auth_last: 'Last name', auth_phone: 'Phone number', auth_fill_all: 'Fill in all fields',
  auth_pw_rule: 'Password: exactly 1 letter + the rest digits (min 6).',
  auth_otp_title: 'Verify your phone', auth_otp: 'SMS code', auth_otp_sent: 'We sent a code to', auth_verify: 'Verify',
  auth_resend: 'Resend code', auth_otp_resent: 'Code resent.', auth_resent_email: 'Code re-sent to your email.', set_del_email: 'A deletion confirmation link was sent to your email. Click it to delete your account.',
  auth_forgot: 'Forgot password?', auth_forgot_sub: 'Enter your email — we\'ll send a reset code.',
  auth_send_link: 'Send code', auth_link_sent: 'If the email exists, a reset code was sent.',
  auth_reset_title: 'New password', auth_reset_sub: 'Enter the code from your email and a new password.', auth_new_pw: 'New password',
  auth_code_ph: '6-digit code',
  auth_set_pw: 'Set password', auth_reset_done: 'Password updated — you can log in now.',
  auth_demo_otp: 'Demo code', auth_demo_link: 'Demo link',
  sup_title: 'Help & Support', sup_sub: 'Describe your issue and we\'ll get back to you.', sup_ph: 'Write your problem here…',
  sup_email_ph: 'Email (for our reply)', sup_send: 'Send', sup_sent: 'Your message was sent — thank you!',
  sup_mine: 'Your messages', sup_answer: 'Reply', sup_waiting: 'Awaiting reply', sup_new: 'New message',
  agree_text: 'I have read and accept the Privacy Policy, KVKK Notice and Terms of Use.',
  agree_required: 'Please accept the terms to continue.',
  leg_privacy: 'Privacy Policy', leg_kvkk: 'KVKK Notice', leg_terms: 'Terms of Use', legal: 'Privacy & Legal',
  currency: 'Currency', auth_remember: 'Remember me',
});
Object.assign(TR, {
  auth_first: 'Ad', auth_last: 'Soyad', auth_phone: 'Telefon numarası', auth_fill_all: 'Tüm alanları doldurun',
  auth_pw_rule: 'Şifre: tam 1 harf + gerisi rakam (en az 6).',
  auth_otp_title: 'Telefonunu doğrula', auth_otp: 'SMS kodu', auth_otp_sent: 'Kod gönderildi:', auth_verify: 'Doğrula',
  auth_resend: 'Kodu yeniden gönder', auth_otp_resent: 'Kod yeniden gönderildi.', auth_resent_email: 'Kod e-postana gönderildi.', set_del_email: 'Silme onay linki e-postana gönderildi. Linke tıklayınca hesabın silinir.',
  auth_forgot: 'Şifremi unuttum', auth_forgot_sub: 'E-postanı gir — sıfırlama kodu gönderelim.',
  auth_send_link: 'Kod gönder', auth_link_sent: 'E-posta kayıtlıysa sıfırlama kodu gönderildi.',
  auth_reset_title: 'Yeni şifre', auth_reset_sub: 'E-postana gelen kodu ve yeni şifreni gir.', auth_new_pw: 'Yeni şifre',
  auth_code_ph: '6 haneli kod',
  auth_set_pw: 'Şifreyi belirle', auth_reset_done: 'Şifre güncellendi — artık giriş yapabilirsin.',
  auth_demo_otp: 'Demo kod', auth_demo_link: 'Demo bağlantı',
  sup_title: 'Yardım & Destek', sup_sub: 'Sorununu yaz, sana dönelim.', sup_ph: 'Sorununu buraya yaz…',
  sup_email_ph: 'E-posta (yanıt için)', sup_send: 'Gönder', sup_sent: 'Mesajın iletildi — teşekkürler!',
  sup_mine: 'Mesajların', sup_answer: 'Yanıt', sup_waiting: 'Yanıt bekleniyor', sup_new: 'Yeni mesaj',
  agree_text: 'Gizlilik Politikası, KVKK Aydınlatma Metni ve Kullanım Şartları\'nı okudum, kabul ediyorum.',
  agree_required: 'Devam etmek için şartları kabul etmelisiniz.',
  leg_privacy: 'Gizlilik Politikası', leg_kvkk: 'KVKK Aydınlatma', leg_terms: 'Kullanım Şartları', legal: 'Gizlilik ve Yasal',
  currency: 'Para birimi', auth_remember: 'Beni hatırla',
});
Object.assign(RU, {
  auth_first: 'Имя', auth_last: 'Фамилия', auth_phone: 'Номер телефона', auth_fill_all: 'Заполните все поля',
  auth_pw_rule: 'Пароль: ровно 1 буква + остальные цифры (мин. 6).',
  auth_otp_title: 'Подтвердите телефон', auth_otp: 'Код из SMS', auth_otp_sent: 'Код отправлен на', auth_verify: 'Подтвердить',
  auth_resend: 'Отправить код снова', auth_otp_resent: 'Код отправлен повторно.', auth_resent_email: 'Код отправлен на вашу почту.', set_del_email: 'Ссылка для удаления отправлена на почту. Нажмите её, чтобы удалить аккаунт.',
  auth_forgot: 'Забыли пароль?', auth_forgot_sub: 'Введите email — пришлём код для сброса.',
  auth_send_link: 'Отправить код', auth_link_sent: 'Если email существует, код отправлен.',
  auth_reset_title: 'Новый пароль', auth_reset_sub: 'Введите код из письма и новый пароль.', auth_new_pw: 'Новый пароль',
  auth_code_ph: 'Код из 6 цифр',
  auth_set_pw: 'Задать пароль', auth_reset_done: 'Пароль обновлён — теперь можно войти.',
  auth_demo_otp: 'Демо-код', auth_demo_link: 'Демо-ссылка',
  sup_title: 'Помощь и поддержка', sup_sub: 'Опишите проблему — мы ответим.', sup_ph: 'Опишите проблему здесь…',
  sup_email_ph: 'Email (для ответа)', sup_send: 'Отправить', sup_sent: 'Сообщение отправлено — спасибо!',
  sup_mine: 'Ваши сообщения', sup_answer: 'Ответ', sup_waiting: 'Ожидает ответа', sup_new: 'Новое сообщение',
  agree_text: 'Я прочитал(а) и принимаю Политику конфиденциальности, Уведомление KVKK и Условия использования.',
  agree_required: 'Чтобы продолжить, примите условия.',
  leg_privacy: 'Политика конфиденциальности', leg_kvkk: 'Уведомление KVKK', leg_terms: 'Условия использования', legal: 'Конфиденциальность и право',
  currency: 'Валюта', auth_remember: 'Запомнить меня',
});
Object.assign(AR, {
  auth_first: 'الاسم', auth_last: 'اللقب', auth_phone: 'رقم الهاتف', auth_fill_all: 'املئي جميع الحقول',
  auth_pw_rule: 'كلمة المرور: حرف واحد فقط + الباقي أرقام (٦ على الأقل).',
  auth_otp_title: 'وثّقي هاتفك', auth_otp: 'رمز SMS', auth_otp_sent: 'أرسلنا رمزاً إلى', auth_verify: 'تأكيد',
  auth_resend: 'إعادة إرسال الرمز', auth_otp_resent: 'أُعيد إرسال الرمز.', auth_resent_email: 'أُرسل الرمز إلى بريدك.', set_del_email: 'أُرسل رابط تأكيد الحذف إلى بريدك. اضغط عليه لحذف حسابك.',
  auth_forgot: 'نسيت كلمة المرور؟', auth_forgot_sub: 'أدخلي بريدك — سنرسل رمز إعادة التعيين.',
  auth_send_link: 'إرسال الرمز', auth_link_sent: 'إن كان البريد موجوداً فقد أُرسل الرمز.',
  auth_reset_title: 'كلمة مرور جديدة', auth_reset_sub: 'أدخلي الرمز الوارد في بريدك وكلمة مرور جديدة.', auth_new_pw: 'كلمة المرور الجديدة',
  auth_code_ph: 'رمز من ٦ أرقام',
  auth_set_pw: 'تعيين', auth_reset_done: 'تم تحديث كلمة المرور — يمكنك الدخول الآن.',
  auth_demo_otp: 'رمز تجريبي', auth_demo_link: 'رابط تجريبي',
  sup_title: 'المساعدة والدعم', sup_sub: 'اكتبي مشكلتك وسنعود إليك.', sup_ph: 'اكتبي مشكلتك هنا…',
  sup_email_ph: 'البريد (للرد)', sup_send: 'إرسال', sup_sent: 'تم إرسال رسالتك — شكراً!',
  sup_mine: 'رسائلك', sup_answer: 'الرد', sup_waiting: 'بانتظار الرد', sup_new: 'رسالة جديدة',
  agree_text: 'لقد قرأت وأوافق على سياسة الخصوصية وإشعار KVKK وشروط الاستخدام.',
  agree_required: 'يرجى قبول الشروط للمتابعة.',
  leg_privacy: 'سياسة الخصوصية', leg_kvkk: 'إشعار KVKK', leg_terms: 'شروط الاستخدام', legal: 'الخصوصية والقانون',
  currency: 'العملة', auth_remember: 'تذكرني',
});

// ── Ayarlar: şifre değiştir / hesabı sil ──
Object.assign(EN, {
  set_changepw: 'Change password', set_delete: 'Delete account', set_newpw: 'New password', set_newpw2: 'Repeat new password',
  set_change_btn: 'Change password', set_del_btn: 'Delete account',
  set_del_blocked: 'You cannot open a new account with the same number and email for 40 days.',
  set_pw_mismatch: 'Passwords do not match', set_pw_changed: 'Password changed.',
});
Object.assign(TR, {
  set_changepw: 'Şifre değiştir', set_delete: 'Hesabı sil', set_newpw: 'Yeni şifre', set_newpw2: 'Tekrar yeni şifre',
  set_change_btn: 'Şifreyi Değiştir', set_del_btn: 'Hesabı Sil',
  set_del_blocked: '40 gün boyunca aynı numara ve mail ile tekrar yeni hesap açamazsınız.',
  set_pw_mismatch: 'Şifreler eşleşmiyor', set_pw_changed: 'Şifre değiştirildi.',
});
Object.assign(RU, {
  set_changepw: 'Сменить пароль', set_delete: 'Удалить аккаунт', set_newpw: 'Новый пароль', set_newpw2: 'Повторите пароль',
  set_change_btn: 'Сменить пароль', set_del_btn: 'Удалить аккаунт',
  set_del_blocked: 'В течение 40 дней нельзя создать новый аккаунт с тем же номером и почтой.',
  set_pw_mismatch: 'Пароли не совпадают', set_pw_changed: 'Пароль изменён.',
});
Object.assign(AR, {
  set_changepw: 'تغيير كلمة المرور', set_delete: 'حذف الحساب', set_newpw: 'كلمة مرور جديدة', set_newpw2: 'أعيدي كلمة المرور',
  set_change_btn: 'تغيير', set_del_btn: 'حذف الحساب',
  set_del_blocked: 'لا يمكنك إنشاء حساب جديد بنفس الرقم والبريد لمدة ٤٠ يوماً.',
  set_pw_mismatch: 'كلمتا المرور غير متطابقتين', set_pw_changed: 'تم تغيير كلمة المرور.',
});

const DICT: Record<Locale, Dict> = { en: EN, tr: TR, ru: RU, ar: AR };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly KEY = 'ngnail-locale';
  readonly locale = signal<Locale>(this.load());
  readonly dir = computed<'rtl' | 'ltr'>(() => (this.locale() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    this.apply(this.locale());
  }

  setLocale(l: Locale): void {
    this.locale.set(l);
    this.apply(l);
    try { localStorage.setItem(this.KEY, l); } catch { /* yoksa geç */ }
  }

  /** Kayıtlı dili okur (yoksa varsayılan İngilizce). İlk açılış İngilizce gelir,
   *  kullanıcı bir dil seçince o dil kaydedilir ve seçime göre değişir. */
  private load(): Locale {
    try {
      const v = localStorage.getItem(this.KEY);
      if (v === 'tr' || v === 'en' || v === 'ru' || v === 'ar') return v;
    } catch { /* geç */ }
    return 'en';
  }

  /** Reactive translate: reads the locale signal so templates update on change. */
  t(key: string): string {
    const active = DICT[this.locale()];
    return active[key] ?? EN[key] ?? key;
  }

  private apply(l: Locale): void {
    const html = document.documentElement;
    html.lang = l;
    html.dir = l === 'ar' ? 'rtl' : 'ltr';
  }
}
