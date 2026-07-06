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
  choose_shape: 'Nail shape', result_undertone: 'Undertone', result_hand: 'Hand',
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
  choose_shape: 'Tırnak şekli', result_undertone: 'Alt Ton', result_hand: 'El',
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
Object.assign(EN, { membership: 'Membership', membership_sub: 'Upgrade for unlimited AI designs, real image generation and more', current_plan: 'Your plan', upgrade: 'Upgrade', select: 'Select', credit_packs: 'Image Packs', credits: 'images', payment_soon: 'Payment integration coming soon — selection is saved locally for now.', plan_locked: 'Not available', renew: 'Renew', days_left: 'days left', upgrade_rules: 'You can\'t re-buy your active plan before it expires — only upgrade. Once it expires you can pick any plan (downgrade included). Same rule for extra packs: you can\'t re-buy the same pack before it expires — only upgrade to a bigger one.', quota_remaining: 'Images left', quota_empty: 'You\'re out of image credits. Upgrade your plan or buy an extra pack.', quota_upgrade: 'Upgrade plan', quota_buy_pack: 'Buy extra pack', pack_added: 'added' });
Object.assign(TR, { membership: 'Üyelik', membership_sub: 'Sınırsız AI tasarım, gerçek görsel üretimi ve daha fazlası için yükseltin', current_plan: 'Planınız', upgrade: 'Yükselt', select: 'Seç', credit_packs: 'Görsel Paketleri', credits: 'görsel', payment_soon: 'Ödeme entegrasyonu yakında — şimdilik seçim cihazda saklanıyor.', plan_locked: 'Uygun değil', renew: 'Yenile', days_left: 'gün kaldı', upgrade_rules: 'Aktif paketinizi süresi bitmeden tekrar alamazsınız — yalnızca yükseltebilirsiniz. Süresi dolunca istediğiniz planı seçebilirsiniz (düşürme dahil). Ek paketler için de aynı kural: aynı paketi süresi bitmeden tekrar alamazsınız, yalnızca daha büyük pakete geçebilirsiniz.', quota_remaining: 'Kalan görsel', quota_empty: 'Görsel hakkınız bitti. Paketi yükseltin ya da ek paket alın.', quota_upgrade: 'Paketi Yükselt', quota_buy_pack: 'Ek Paket Al', pack_added: 'eklendi' });
Object.assign(RU, { membership: 'Подписка', membership_sub: 'Безлимитные AI-дизайны и генерация изображений', current_plan: 'Ваш план', upgrade: 'Улучшить', select: 'Выбрать', credit_packs: 'Пакеты изображений', credits: 'изображений', payment_soon: 'Оплата скоро — выбор пока сохраняется локально.', plan_locked: 'Недоступно', renew: 'Продлить', days_left: 'дн. осталось', upgrade_rules: 'Нельзя повторно купить активный план до окончания — только улучшение. После окончания можно выбрать любой план (в т.ч. ниже). То же для доп. пакетов: нельзя купить тот же пакет до окончания — только переход на больший.', quota_remaining: 'Осталось изображений', quota_empty: 'Изображения закончились. Улучшите план или купите доп. пакет.', quota_upgrade: 'Улучшить план', quota_buy_pack: 'Купить пакет', pack_added: 'добавлено' });
Object.assign(AR, { membership: 'العضوية', membership_sub: 'ترقية لتصاميم ذكاء غير محدودة وإنشاء صور حقيقية', current_plan: 'خطتك', upgrade: 'ترقية', select: 'اختيار', credit_packs: 'حزم الصور', credits: 'صورة', payment_soon: 'الدفع قريباً — يُحفظ الاختيار محلياً الآن.', plan_locked: 'غير متاح', renew: 'تجديد', days_left: 'يوم متبقٍ', upgrade_rules: 'لا يمكنك إعادة شراء خطتك النشطة قبل انتهائها — الترقية فقط. بعد انتهائها يمكنك اختيار أي خطة (بما في ذلك الأدنى). ونفس القاعدة للحزم الإضافية: لا يمكنك شراء نفس الحزمة قبل انتهائها — الترقية لحزمة أكبر فقط.', quota_remaining: 'الصور المتبقية', quota_empty: 'انتهت أرصدة الصور. رقِّ خطتك أو اشترِ حزمة إضافية.', quota_upgrade: 'ترقية الخطة', quota_buy_pack: 'شراء حزمة', pack_added: 'أُضيفت' });

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

const DICT: Record<Locale, Dict> = { en: EN, tr: TR, ru: RU, ar: AR };

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>('tr');
  readonly dir = computed<'rtl' | 'ltr'>(() => (this.locale() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    this.apply(this.locale());
  }

  setLocale(l: Locale): void {
    this.locale.set(l);
    this.apply(l);
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
