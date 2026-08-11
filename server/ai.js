// ngNailArt backend — Çok sağlayıcılı AI (OpenAI / Gemini / Replicate)
// SDK'lar LAZY yüklenir: kurulu değilse o sağlayıcı sessizce devre dışı kalır.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

let openai = null;
let openaiMod = null;         // ham 'openai' modülü (toFile helper'ı için — images.edit)
let gemini = null;
let geminiMod = null;
let replicate = null;
let falKey = null;            // fal.ai FLUX 1.1 Pro / Kontext — HTTP ile (paket gerekmez)
let AI_PROVIDER = 'none';
let AI_MODEL = '';

function tryRequire(name) {
  try { return require(name); } catch { return null; }
}

function initProviders() {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (OPENAI_KEY && OPENAI_KEY !== 'your-openai-api-key-here') {
    openaiMod = tryRequire('openai');
    const OpenAI = openaiMod;
    if (OpenAI) { openai = new OpenAI({ apiKey: OPENAI_KEY }); console.log('🤖 OpenAI hazır'); }
    else console.warn('ℹ️  OPENAI_API_KEY var ama "openai" paketi kurulu değil (npm i openai)');
  }
  if (GEMINI_KEY && GEMINI_KEY !== 'your-gemini-api-key-here') {
    geminiMod = tryRequire('@google/genai');
    if (geminiMod) { gemini = new geminiMod.GoogleGenAI({ apiKey: GEMINI_KEY }); console.log('🤖 Gemini hazır'); }
    else console.warn('ℹ️  GEMINI_API_KEY var ama "@google/genai" paketi kurulu değil (npm i @google/genai)');
  }
  if (REPLICATE_TOKEN && REPLICATE_TOKEN !== 'your-replicate-api-token-here') {
    const Replicate = tryRequire('replicate');
    if (Replicate) { replicate = new Replicate({ auth: REPLICATE_TOKEN }); console.log('🎨 Replicate/Flux hazır'); }
    else console.warn('ℹ️  REPLICATE_API_TOKEN var ama "replicate" paketi kurulu değil (npm i replicate)');
  }
  // fal.ai FLUX 1.1 Pro — anahtar "id:secret" biçimindedir; HTTP ile çağrılır (paket gerekmez).
  const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (FAL_KEY && FAL_KEY !== 'your-fal-key-here') {
    falKey = FAL_KEY.trim();
    console.log('🎨 fal.ai / FLUX 1.1 Pro hazır');
  }
  AI_PROVIDER = gemini ? 'gemini' : (openai ? 'openai' : 'none');
  AI_MODEL = gemini ? 'gemini-2.0-flash' : (openai ? (process.env.AI_MODEL || 'gpt-4.1-mini') : '');
  if (AI_PROVIDER === 'none') {
    console.warn('⚠️  AI anahtarı yok — /api/ai/* çağrıları 503 döner, frontend demo/prosedürel görsele düşer.');
  } else {
    console.log(`✅ Aktif AI: ${AI_PROVIDER} (${AI_MODEL})`);
  }
}

function status() {
  const hasImage = !!(falKey || openai || gemini || replicate);   // kullanıcı üretimi (FLUX 1.1 Pro vb.)
  return {
    configured: hasImage,
    provider: AI_PROVIDER,
    model: AI_MODEL,
    textAvailable: !!(openai || gemini),                 // spec için LLM (yoksa istemci mockDesign)
    imageGenAvailable: hasImage,
    imageProvider: falKey ? 'flux-pro' : (gemini ? 'imagen3' : (openai ? 'dalle3' : (replicate ? 'flux-pro' : 'none'))),
    fluxAvailable: !!(falKey || replicate),
    status: hasImage ? 'ready' : 'not_configured',
  };
}

/** Genel HTTPS JSON isteği (GET/POST) — fal.ai kuyruk (queue) uçları için ortak yardımcı. */
function falHttpJson(method, urlStr, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Authorization': `Key ${falKey}` };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request({ method, hostname: u.hostname, path: u.pathname + u.search, headers }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(makeError(`fal.ai hatası (${res.statusCode}): ${data.slice(0, 300)}`, 'AI_ERROR', 502));
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(makeError('fal.ai cevabı geçerli JSON değil: ' + (e && e.message ? e.message : ''), 'AI_ERROR', 500)); }
      });
    });
    req.on('error', (err) => reject(makeError('fal.ai bağlantı hatası: ' + err.message, 'AI_ERROR', 502)));
    if (payload) req.write(payload);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fal.ai KUYRUK (queue) API'si — Kontext/Flux Pro gibi modeller senkron fal.run uç noktasını
 * DEĞİL, queue.fal.run üzerinden submit → poll (status) → sonuç akışını kullanıyor
 * (bkz. fal.ai resmi dokümantasyonu: fal.subscribe). appPath örn. "/fal-ai/flux-pro/kontext".
 * Yanıt: ilk görsel URL'si.
 */
async function falQueueRun(appPath, input) {
  const submitted = await falHttpJson('POST', `https://queue.fal.run${appPath}`, input);
  const statusUrl = submitted.status_url || `https://queue.fal.run${appPath}/requests/${submitted.request_id}/status`;
  const responseUrl = submitted.response_url || `https://queue.fal.run${appPath}/requests/${submitted.request_id}`;

  const started = Date.now();
  const timeoutMs = 90_000;
  let status = submitted.status;
  while (status !== 'COMPLETED') {
    if (Date.now() - started > timeoutMs) {
      throw makeError('fal.ai (queue) zaman aşımına uğradı', 'AI_ERROR', 504);
    }
    await sleep(1500);
    const s = await falHttpJson('GET', statusUrl);
    status = s.status;
    if (status === 'ERROR' || status === 'FAILED') {
      throw makeError(`fal.ai (queue) üretim hatası: ${JSON.stringify(s).slice(0, 300)}`, 'AI_ERROR', 502);
    }
  }
  const result = await falHttpJson('GET', responseUrl);
  const url = result && result.images && result.images[0] && result.images[0].url;
  if (!url) throw makeError('fal.ai (queue) boş cevap döndürdü', 'AI_ERROR', 500);
  return url;
}

/**
 * fal.ai FLUX 1.1 Pro — kuyruk API'si ile görsel üretir (bkz. falQueueRun).
 * Anahtar "id:secret" biçiminde; header: Authorization: Key <anahtar>.
 */
function falGenerate(prompt) {
  return falQueueRun('/fal-ai/flux-pro/v1.1', {
    prompt,
    image_size: 'square_hd',
    num_images: 1,
    output_format: 'png',
    enable_safety_checker: true,
  });
}

/**
 * fal.ai FLUX.1 Kontext [pro] — GÖRSEL DÜZENLEME (image-to-image, maskesiz), kuyruk API'si ile.
 * Yüklenen fotoğrafı (data URL) girdi olarak alır, prompt'a göre sadece istenen bölgeyi
 * değiştirip geri kalanını korumaya çalışır.
 */
function falEditGenerate(prompt, imageDataUrl) {
  return falQueueRun('/fal-ai/flux-pro/kontext', {
    prompt,
    image_url: imageDataUrl,
    output_format: 'png',
    safety_tolerance: '2',
    // Kalite: fal.ai kendi prompt'u iyileştirsin + detaylara (desen/motif) daha sıkı uysun
    // (varsayılan guidance_scale 3.5 — ince desenler soluk çıkıyordu, biraz yükseltildi).
    enhance_prompt: true,
    guidance_scale: 4.5,
  });
}

/** "data:<mime>;base64,<...>" formatındaki bir görseli ayrıştırır. */
function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl || '');
  if (!m) throw makeError('Geçersiz görsel verisi (data URL bekleniyor)', 'BAD_IMAGE', 400);
  return { mimeType: m[1], base64: m[2] };
}

/**
 * Yüklenen el fotoğrafını DÜZENLEME (edit) modu için prompt — sadece görünen tırnak
 * yüzeylerine tasarımı uygular, elin/parmakların/arka planın aynen korunmasını ister.
 */
function buildEditPrompt({ prompt, style, shape, colorStr, finish }) {
  return [
    'Edit the uploaded image only. Preserve the original hand, fingers, skin, pose, lighting, shadows, background, camera angle and image composition exactly.',
    'Do not regenerate the hand. Do not create new fingers or nails. Apply the requested nail design only to the visible nail surfaces.',
    'Keep the nail shapes and positions aligned with the original image. The result must look like the same photograph with only the manicure changed.',
    `Nail design: ${(prompt || '').trim()}.`,
    colorStr ? `Colors: ${colorStr}.` : '',
    `Finish: ${finish || 'glossy'}. Style: ${style || 'luxury'}, salon-quality.`,
    'Do not alter skin. Do not alter fingers. Do not alter hand anatomy. Do not add or remove fingers.',
    'Do not change background. Do not change pose. Do not change camera angle. Do not create a new hand.',
    'Do not replace the entire image. Do not modify anything outside the nail areas.',
  ].filter(Boolean).join(' ');
}

const SYSTEM_PROMPT = `Sen profesyonel bir tırnak tasarım uzmanı ve AI asistanısın.
Kullanıcının istediği tırnak tasarımını analiz edip SADECE aşağıdaki JSON yapısında cevap ver (başka açıklama ekleme):
{
  "source": "new_ai_generation",
  "usesGallery": false,
  "title": "Kısa başlık",
  "description": "Detaylı açıklama",
  "designPrompt": "Görsel üretimi için detaylı İngilizce prompt",
  "colors": ["ana", "ikincil", "aksan"],
  "effects": ["efekt1", "efekt2"],
  "patterns": ["french|marble|galaxy|ombre|chrome|line|glossy"],
  "style": "chrome|french|marble|galaxy|glitter|ombre|minimalist|luxury|bridal",
  "finish": "glossy|matte|chrome|holographic|velvet|shimmer",
  "shape": "oval|almond|coffin|stiletto|square|squoval|round",
  "extras": ["rhinestone", "pearl", "foil"],
  "reason": "Bu önerinin gerekçesi",
  "arInstructions": { "useAsNewTexture": true, "finish": "glossy", "primaryColor": "#hex", "secondaryColor": "#hex", "accentColor": "#hex" },
  "tags": ["etiket1", "etiket2"],
  "confidence": 0.95
}
Renkleri kısa etiketlerle ver (gold, red, pink, chrome, nude, black, white, silver, green, blue, purple).`;

function makeError(message, code, status) {
  const e = new Error(message);
  e.code = code || 'AI_ERROR';
  e.httpStatus = status || 500;
  return e;
}

async function chat(prompt, language) {
  if (!openai && !gemini) {
    throw makeError('AI servisi yapılandırılmamış. .env içine GEMINI_API_KEY veya OPENAI_API_KEY ekleyin.', 'AI_NOT_CONFIGURED', 503);
  }
  const lang = language || 'tr';
  const userMessage = `Kullanıcı şu tırnak tasarımını istiyor: "${prompt}"\nCevabı ${lang === 'tr' ? 'Türkçe' : 'İngilizce'}, SADECE JSON formatında ver.`;

  let text = null;
  if (gemini) {
    const result = await gemini.models.generateContent({
      model: AI_MODEL,
      contents: SYSTEM_PROMPT + '\n\n' + userMessage,
      config: { temperature: 0.7, responseMimeType: 'application/json' },
    });
    text = result.text;
  } else if (openai) {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMessage }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });
    text = completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content;
  }
  if (!text) throw makeError('AI boş cevap döndürdü', 'AI_ERROR', 500);
  try {
    return JSON.parse(text);
  } catch {
    throw makeError('AI cevabı geçerli JSON değil', 'AI_ERROR', 500);
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const getter = String(url).startsWith('https') ? https : http;
    getter.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function generateImage(input, imgDir) {
  const { prompt, style, shape, colors, finish, tier, image } = input;
  // KULLANICI ÜRETİMİ = FLUX 1.1 Pro (fal.ai) / Flux (Replicate) / OpenAI / Gemini. Anahtar yoksa demo'ya düşülür.
  if (!falKey && !openai && !gemini && !replicate) {
    throw makeError('Görsel üretim servisi yok. Kullanıcı üretimi için FAL_KEY (FLUX 1.1 Pro) ekleyin.', 'AI_NOT_CONFIGURED', 503);
  }
  const colorStr = (colors && colors.length) ? colors.join(', ') : '';
  // image varsa: yüklenen el fotoğrafını DÜZENLE (image-to-image) — elini/parmakları/arka planı koru,
  // sadece tırnaklara tasarımı uygula. image yoksa: eski davranış (izole tırnak, elsiz/parmaksız).
  const editMode = !!image;
  const artPrompt = editMode
    ? buildEditPrompt({ prompt, style, shape, colorStr, finish })
    : [
        `Nail art design, top-down macro close-up of a single ${shape || 'almond'}-shaped nail filling the entire frame.`,
        `Design: ${(prompt || '').trim()}.`,
        colorStr ? `Colors: ${colorStr}.` : '',
        `Finish: ${finish || 'glossy'}. Style: ${style || 'luxury'}, salon-quality.`,
        `Isolated single nail, NO hand, NO finger, NO skin, plain soft background, studio lighting, ultra-high detail, photorealistic, no text, no watermark.`,
      ].filter(Boolean).join(' ');
  console.log(`[AI] generateImage — editMode: ${editMode}\n[AI] prompt: ${artPrompt}`);

  const rnd = Math.random().toString(36).slice(2, 7);
  const stamp = Date.now();
  let filename, provider, imageBytesBuffer, remoteUrl;

  if (falKey) {
    // TERCİH EDİLEN: fal.ai FLUX 1.1 Pro (üretim) / FLUX.1 Kontext [pro] (düzenleme).
    if (editMode) {
      provider = 'flux-kontext';
      remoteUrl = await falEditGenerate(artPrompt, image);
      filename = `fluxkontext_${stamp}_${rnd}.png`;
    } else {
      provider = 'flux-pro';
      remoteUrl = await falGenerate(artPrompt);
      filename = `flux_${stamp}_${rnd}.png`;
    }
  } else if (tier === 'wow' && replicate) {
    provider = editMode ? 'flux-kontext' : 'flux-pro';
    const output = editMode
      ? await replicate.run('black-forest-labs/flux-kontext-pro', {
          input: { prompt: artPrompt, input_image: image, aspect_ratio: 'match_input_image', output_format: 'png', safety_tolerance: 2 },
        })
      : await replicate.run('black-forest-labs/flux-1.1-pro', {
          input: { prompt: artPrompt, aspect_ratio: '1:1', output_format: 'png', output_quality: 100, prompt_upsampling: true },
        });
    remoteUrl = Array.isArray(output) ? output[0] : output;
    if (remoteUrl && typeof remoteUrl.url === 'function') remoteUrl = remoteUrl.url();
    filename = `flux_${stamp}_${rnd}.png`;
  } else if (gemini) {
    // ÜCRETSİZ görsel modeli (Gemini 2.5 Flash Image / "Nano Banana") — kart gerektirmez, ~500/gün.
    // editMode: contents multimodal dizi (inlineData: yüklenen fotoğraf + text: prompt) → image-to-image düzenleme.
    // Model adı sürüme göre değişebildiği için birkaç geçerli adı sırayla deneriz.
    provider = editMode ? 'gemini-flash-image-edit' : 'gemini-flash-image';
    const candidates = process.env.GEMINI_IMAGE_MODEL
      ? [process.env.GEMINI_IMAGE_MODEL]
      : ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation', 'gemini-2.5-flash-image-preview'];
    let contents;
    if (editMode) {
      const { mimeType, base64 } = parseDataUrl(image);
      contents = [{ inlineData: { mimeType, data: base64 } }, { text: artPrompt }];
    } else {
      contents = artPrompt;
    }
    let b64 = null, lastErr = null, usedModel = null;
    for (const model of candidates) {
      try {
        const response = await gemini.models.generateContent({
          model,
          contents,
          config: { responseModalities: ['IMAGE', 'TEXT'] },
        });
        const cand = response && response.candidates && response.candidates[0];
        const parts = (cand && cand.content && cand.content.parts) || [];
        for (const p of parts) {
          if (p && p.inlineData && p.inlineData.data) { b64 = p.inlineData.data; break; }
        }
        if (b64) { usedModel = model; break; }
        lastErr = new Error('görsel parçası yok');
      } catch (e) {
        lastErr = e;
        console.warn(`[AI] Gemini model denendi, olmadı: ${model} — ${e && e.message ? e.message : e}`);
      }
    }
    if (!b64) {
      console.error('[AI] Gemini görsel üretemedi. Son hata:', lastErr && lastErr.message ? lastErr.message : lastErr);
      throw makeError('Gemini görsel üretemedi: ' + (lastErr && lastErr.message ? lastErr.message : 'bilinmeyen'), 'AI_ERROR', 500);
    }
    console.log(`[AI] Gemini görsel üretildi (model: ${usedModel}, edit: ${editMode})`);
    imageBytesBuffer = Buffer.from(b64, 'base64');
    filename = `gemini_${stamp}_${rnd}.png`;
  } else if (openai) {
    if (editMode) {
      // gpt-image-1 + images.edit: maskesiz, prompt-güdümlü düzenleme (girdi fotoğrafını korur).
      provider = 'gpt-image-1-edit';
      const { mimeType, base64 } = parseDataUrl(image);
      const buffer = Buffer.from(base64, 'base64');
      const ext = mimeType.includes('png') ? 'png' : (mimeType.includes('webp') ? 'webp' : 'jpg');
      const file = await openaiMod.toFile(buffer, `hand.${ext}`, { type: mimeType });
      const imageResponse = await openai.images.edit({
        model: process.env.OPENAI_EDIT_MODEL || 'gpt-image-1',
        image: file,
        prompt: artPrompt,
        size: '1024x1024',
      });
      const b64out = imageResponse.data[0] && imageResponse.data[0].b64_json;
      if (!b64out) throw makeError('gpt-image-1 boş cevap döndürdü', 'AI_ERROR', 500);
      imageBytesBuffer = Buffer.from(b64out, 'base64');
      filename = `gptimg_${stamp}_${rnd}.png`;
    } else {
      provider = 'dalle3';
      const imageResponse = await openai.images.generate({
        model: process.env.DALLE_MODEL || 'dall-e-3', prompt: artPrompt, n: 1, size: '1024x1024', quality: 'hd', style: 'vivid',
      });
      remoteUrl = imageResponse.data[0] && imageResponse.data[0].url;
      if (!remoteUrl) throw makeError('DALL-E boş cevap döndürdü', 'AI_ERROR', 500);
      filename = `dalle_${stamp}_${rnd}.png`;
    }
  } else if (replicate) {
    provider = editMode ? 'flux-kontext' : 'flux-pro';
    const output = editMode
      ? await replicate.run('black-forest-labs/flux-kontext-pro', {
          input: { prompt: artPrompt, input_image: image, aspect_ratio: 'match_input_image', output_format: 'png', safety_tolerance: 2 },
        })
      : await replicate.run('black-forest-labs/flux-1.1-pro', {
          input: { prompt: artPrompt, aspect_ratio: '1:1', output_format: 'png', output_quality: 90 },
        });
    remoteUrl = Array.isArray(output) ? output[0] : output;
    if (remoteUrl && typeof remoteUrl.url === 'function') remoteUrl = remoteUrl.url();
    filename = `flux_${stamp}_${rnd}.png`;
  }

  const imgPath = path.join(imgDir, filename);
  if (imageBytesBuffer) {
    fs.writeFileSync(imgPath, imageBytesBuffer);
  } else {
    await download(remoteUrl, imgPath);
  }
  const size = fs.statSync(imgPath).size;

  return {
    imageUrl: `images/ai-generated/${filename}`,
    filename,
    prompt: (prompt || '').trim(),
    style: style || 'luxury',
    shape: shape || 'almond',
    colors: colors || [],
    finish: finish || 'glossy',
    edited: editMode,
    size,
    provider,
  };
}

module.exports = { initProviders, status, chat, generateImage };
