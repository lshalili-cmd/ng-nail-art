// ngNailArt backend — Çok sağlayıcılı AI (OpenAI / Gemini / Replicate)
// SDK'lar LAZY yüklenir: kurulu değilse o sağlayıcı sessizce devre dışı kalır.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

let openai = null;
let gemini = null;
let geminiMod = null;
let replicate = null;
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
    const OpenAI = tryRequire('openai');
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

  AI_PROVIDER = gemini ? 'gemini' : (openai ? 'openai' : 'none');
  AI_MODEL = gemini ? 'gemini-2.0-flash' : (openai ? (process.env.AI_MODEL || 'gpt-4.1-mini') : '');
  if (AI_PROVIDER === 'none') {
    console.warn('⚠️  AI anahtarı yok — /api/ai/* çağrıları 503 döner, frontend demo/prosedürel görsele düşer.');
  } else {
    console.log(`✅ Aktif AI: ${AI_PROVIDER} (${AI_MODEL})`);
  }
}

function status() {
  return {
    configured: !!(openai || gemini || replicate),
    provider: AI_PROVIDER,
    model: AI_MODEL,
    imageGenAvailable: !!(openai || gemini || replicate),
    imageProvider: gemini ? 'imagen3' : (openai ? 'dalle3' : (replicate ? 'flux-pro' : 'none')),
    fluxAvailable: !!replicate,
    status: (openai || gemini || replicate) ? 'ready' : 'not_configured',
  };
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
  const { prompt, style, shape, colors, finish, tier } = input;
  if (!openai && !gemini && !replicate) {
    throw makeError('Görsel üretim servisi yok. .env içine bir AI anahtarı ekleyin.', 'AI_NOT_CONFIGURED', 503);
  }
  const colorStr = (colors && colors.length) ? colors.join(', ') : '';
  const artPrompt = [
    `Professional nail art photography, close-up of a single elegant female hand with perfectly manicured ${shape || 'almond'}-shaped nails.`,
    `Design: ${(prompt || '').trim()}.`,
    colorStr ? `Colors: ${colorStr}.` : '',
    `Finish: ${finish || 'glossy'}. Style: ${style || 'luxury'}, salon-quality.`,
    `Clean soft background, studio lighting, ultra-high detail, photorealistic, no text, no watermark.`,
  ].filter(Boolean).join(' ');

  const rnd = Math.random().toString(36).slice(2, 7);
  const stamp = Date.now();
  let filename, provider, imageBytesBuffer, remoteUrl;

  if (tier === 'wow' && replicate) {
    provider = 'flux-pro';
    const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
      input: { prompt: artPrompt, aspect_ratio: '1:1', output_format: 'png', output_quality: 100, prompt_upsampling: true },
    });
    remoteUrl = Array.isArray(output) ? output[0] : output;
    if (remoteUrl && typeof remoteUrl.url === 'function') remoteUrl = remoteUrl.url();
    filename = `flux_${stamp}_${rnd}.png`;
  } else if (gemini) {
    provider = 'imagen3';
    const response = await gemini.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: artPrompt,
      config: { numberOfImages: 1, aspectRatio: '1:1' },
    });
    if (!response.generatedImages || !response.generatedImages.length) throw makeError('Imagen görsel üretemedi', 'AI_ERROR', 500);
    imageBytesBuffer = Buffer.from(response.generatedImages[0].image.imageBytes, 'base64');
    filename = `imagen_${stamp}_${rnd}.png`;
  } else if (openai) {
    provider = 'dalle3';
    const imageResponse = await openai.images.generate({
      model: process.env.DALLE_MODEL || 'dall-e-3', prompt: artPrompt, n: 1, size: '1024x1024', quality: 'hd', style: 'vivid',
    });
    remoteUrl = imageResponse.data[0] && imageResponse.data[0].url;
    if (!remoteUrl) throw makeError('DALL-E boş cevap döndürdü', 'AI_ERROR', 500);
    filename = `dalle_${stamp}_${rnd}.png`;
  } else if (replicate) {
    provider = 'flux-pro';
    const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
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
    size,
    provider,
  };
}

module.exports = { initProviders, status, chat, generateImage };
