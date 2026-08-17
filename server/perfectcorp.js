// ngNailArt backend — Perfect Corp (YouCam) Nail Virtual Try-On entegrasyonu.
// Mevcut "Sanal deneme" (studio.component.ts) tamamen GENERATIVE çalışır: Flux/Gemini el
// fotoğrafını görsel-üretim modeliyle yeniden yorumlayıp tasarımı üzerine "boyar". Bu modül
// farklı bir teknikle çalışır: Perfect Corp sunucu tarafında gerçek tırnak segmentasyonu yapıp,
// VERİLEN izole bir desen görselini (Studio'da el fotoğrafı OLMADAN üretilmiş bir tasarım, ör.
// "Isolated single nail, NO hand" çıktısı) kullanıcının gerçek el fotoğrafındaki tespit edilen
// tırnak bölgesine hassas biçimde bindirir. Anahtar yoksa bu özellik sessizce kapalı kalır.
require('dotenv').config();
const https = require('https');
const { URL } = require('url');

let API_KEY = null;
const API_HOST = 'yce-api-01.makeupar.com';
const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'];

function initProvider() {
  const key = process.env.PERFECTCORP_API_KEY;
  if (key && key !== 'your-perfectcorp-api-key-here') {
    API_KEY = key.trim();
    console.log('💅 Perfect Corp Nail VTO hazır');
  }
}

function ready() {
  return !!API_KEY;
}

function makeError(message, code, status) {
  const e = new Error(message);
  e.code = code || 'PERFECTCORP_ERROR';
  e.httpStatus = status || 500;
  return e;
}

/** Perfect Corp REST API'sine JSON istek (dosya yükleme METADATA'sı + görev oluşturma/sorgulama). */
function httpJson(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { Authorization: `Bearer ${API_KEY}` };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request({ method, hostname: API_HOST, path, headers }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = data ? JSON.parse(data) : null; } catch { /* boş/JSON-dışı gövde olabilir */ }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const msg = (parsed && (parsed.error || parsed.error_code)) || data.slice(0, 300) || `HTTP ${res.statusCode}`;
          return reject(makeError(`Perfect Corp API hatası (${res.statusCode}): ${msg}`, (parsed && parsed.error_code) || 'PERFECTCORP_ERROR', res.statusCode));
        }
        resolve(parsed);
      });
    });
    req.on('error', (err) => reject(makeError('Perfect Corp bağlantı hatası: ' + err.message, 'PERFECTCORP_ERROR', 502)));
    if (payload) req.write(payload);
    req.end();
  });
}

/** File API'nin 2. adımı: dönen presigned URL'e ham dosya baytlarını yükler. */
function httpUpload(method, urlStr, headers, buffer) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request({
      method: method || 'PUT',
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { ...headers, 'Content-Length': buffer.length },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(makeError(`Perfect Corp dosya yükleme hatası (${res.statusCode}): ${data.slice(0, 300)}`, 'PERFECTCORP_UPLOAD_ERROR', 502));
        }
        resolve();
      });
    });
    req.on('error', (err) => reject(makeError('Perfect Corp yükleme bağlantı hatası: ' + err.message, 'PERFECTCORP_UPLOAD_ERROR', 502)));
    req.write(buffer);
    req.end();
  });
}

/** GET isteğiyle bir uzak görseli belleğe indirir (yönlendirmeleri izler). {buffer, mimeType} döner. */
function downloadToBuffer(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadToBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const mimeType = (res.headers['content-type'] || 'image/jpeg').split(';')[0].trim();
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), mimeType }));
    }).on('error', reject);
  });
}

/** "data:<mime>;base64,<...>" ayrıştırır. */
function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl || '');
  if (!m) throw makeError('Geçersiz görsel verisi (data URL bekleniyor)', 'BAD_IMAGE', 400);
  return { mimeType: m[1], buffer: Buffer.from(m[2], 'base64') };
}

/** Bir görseli Perfect Corp'a yükler (2 adımlı File API) → file_id döner. */
async function uploadFile(buffer, mimeType, fileName) {
  const meta = await httpJson('POST', '/s2s/v2.0/file', {
    files: [{ content_type: mimeType, file_name: fileName, file_size: buffer.length }],
  });
  // NOT: Dokümantasyondaki şema düz {files:[...]} gösterse de, gerçek API cevabı
  // {status, data:{files:[...]}} şeklinde sarmalı geliyor (canlı testte görüldü) — ikisini de dene.
  const files = (meta && meta.data && meta.data.files) || (meta && meta.files);
  const f = files && files[0];
  const uploadReq = f && f.requests && f.requests[0];
  if (!f || !f.file_id || !uploadReq) {
    throw makeError('Perfect Corp dosya yükleme yanıtı beklenmedik biçimde geldi', 'PERFECTCORP_ERROR', 500);
  }
  await httpUpload(uploadReq.method, uploadReq.url, uploadReq.headers, buffer);
  return f.file_id;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Gerçek el fotoğrafına (handImageDataUrl), izole bir desen görselini (designBuffer/designMimeType,
 * ör. Studio'da el fotoğrafı OLMADAN üretilmiş "tek tırnak" görseli) BEŞ parmağa da uygular.
 * Dönen sonuç, sunucudan indirilmiş ham PNG baytlarıdır (çağıran taraf diske yazar).
 */
async function tryOnPhoto({ handImageDataUrl, designBuffer, designMimeType }) {
  if (!API_KEY) {
    throw makeError('Perfect Corp servisi yapılandırılmamış. .env içine PERFECTCORP_API_KEY ekleyin.', 'PERFECTCORP_NOT_CONFIGURED', 503);
  }
  const { mimeType: handMime, buffer: handBuffer } = parseDataUrl(handImageDataUrl);

  const [srcFileId, refFileId] = await Promise.all([
    uploadFile(handBuffer, handMime, 'hand.' + (handMime.split('/')[1] || 'jpg')),
    uploadFile(designBuffer, designMimeType, 'design.' + (designMimeType.split('/')[1] || 'png')),
  ]);

  const effects = FINGERS.map((finger) => ({
    sub_type: 'design',
    finger,
    ref_file_index: 0,
    texture: 'cream',
    transparency: 0,
    reflection: 60,
    contrast: 40,
    roughness: 0,
  }));

  const created = await httpJson('POST', '/s2s/v2.0/task/nail-vto', {
    src_file_id: srcFileId,
    ref_file_ids: [refFileId],
    version: '1.0',
    effect_type: 'nail_polish',
    effects,
  });
  const taskId = created && created.data && created.data.task_id;
  if (!taskId) throw makeError('Perfect Corp görev oluşturamadı (task_id gelmedi)', 'PERFECTCORP_ERROR', 500);

  // NOT: Dokümantasyon düz {url} gösteriyor ama gerçek cevap (canlı testte görüldü)
  // {status,data:{task_status,results:{url},error}} şeklinde — task_status: 'running'|'success'|'error'.
  const started = Date.now();
  const timeoutMs = 60_000;
  let resultUrl = null;
  while (!resultUrl) {
    if (Date.now() - started > timeoutMs) {
      throw makeError('Perfect Corp isteği zaman aşımına uğradı', 'PERFECTCORP_ERROR', 504);
    }
    await sleep(1500);
    const poll = await httpJson('GET', `/s2s/v2.0/task/nail-vto/${taskId}`, null);
    const d = (poll && poll.data) || poll || {};
    if (d.task_status === 'error') {
      throw makeError('Perfect Corp görevi hatayla sonuçlandı: ' + (d.error || 'bilinmeyen hata'), 'PERFECTCORP_ERROR', 502);
    }
    if (d.task_status === 'success' && d.results && d.results.url) {
      resultUrl = d.results.url;
    }
  }
  return downloadToBuffer(resultUrl);
}

module.exports = { initProvider, ready, tryOnPhoto };
