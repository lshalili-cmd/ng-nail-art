// ngNailArt backend — Express + AI (port 3000)
// Angular dev proxy'si /api ve /images'i buraya yönlendirir (proxy.conf.json).
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ai = require('./ai');
const db = require('./db');

ai.initProviders();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '4mb' }));

// Üretilen görsellerin klasörü + statik sunum
const IMG_DIR = path.join(__dirname, 'images', 'ai-generated');
fs.mkdirSync(IMG_DIR, { recursive: true });
app.use('/images', express.static(path.join(__dirname, 'images'), {
  setHeaders: (res) => res.set('Cache-Control', 'no-cache'),
}));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'healthy', time: new Date().toISOString() } });
});

app.get('/api/ai/status', (_req, res) => {
  res.json({ success: true, data: ai.status() });
});

app.post('/api/ai/chat', async (req, res) => {
  const { prompt, language } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Lütfen bir tasarım isteği girin', code: 'EMPTY_PROMPT' });
  }
  try {
    console.log(`🎨 AI chat: "${prompt.slice(0, 60)}..."`);
    const data = await ai.chat(prompt, language);
    res.json({ success: true, data, meta: { provider: ai.status().provider, model: ai.status().model, timestamp: new Date().toISOString() } });
  } catch (e) {
    handleAiError(res, e);
  }
});

app.post('/api/ai/generate-image', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Prompt gerekli', code: 'EMPTY_PROMPT' });
  }
  try {
    console.log(`🖼️  Görsel üretimi: "${prompt.slice(0, 50)}..."`);
    const data = await ai.generateImage(req.body, IMG_DIR);
    console.log(`✅ Görsel kaydedildi: ${data.filename} (${Math.round(data.size / 1024)}KB, ${data.provider})`);
    res.json({ success: true, data });
  } catch (e) {
    handleAiError(res, e);
  }
});

// ===== Veritabanı uçları (Prisma) =====
function dbNotReady(res) {
  return res.status(503).json({ success: false, error: 'Veritabanı kurulmadı. server klasöründe: npm run db:setup', code: 'DB_NOT_READY' });
}
function dbError(res, e) {
  console.error('❌ DB hatası:', e.message);
  res.status(500).json({ success: false, error: e.message, code: 'DB_ERROR' });
}

// --- Tasarımlar ---
app.get('/api/designs', async (_req, res) => {
  if (!db.ready()) return dbNotReady(res);
  try {
    const items = await db.prisma.design.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, designs: items.map(db.designOut), count: items.length });
  } catch (e) { dbError(res, e); }
});

app.post('/api/designs', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ success: false, error: 'name gerekli', code: 'BAD_REQUEST' });
  try {
    const d = await db.prisma.design.create({
      data: {
        name: b.name, artist: b.artist || 'AI Studio', pattern: b.pattern || 'glossy', category: b.category || 'ai',
        colors: db.stringifyArr(b.colors), shapes: db.stringifyArr(b.shapes), tones: db.stringifyArr(b.tones),
        undertones: db.stringifyArr(b.undertones), seasons: db.stringifyArr(b.seasons && b.seasons.length ? b.seasons : ['all']),
        img: b.img || '', prompt: b.prompt || '', source: b.source || 'ai_studio',
      },
    });
    res.json({ success: true, design: db.designOut(d) });
  } catch (e) { dbError(res, e); }
});

// --- Favoriler (userId ile; varsayılan "guest") ---
app.get('/api/favorites', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const userId = req.query.userId || 'guest';
  try {
    const favs = await db.prisma.favorite.findMany({ where: { userId }, include: { design: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, designs: favs.map((f) => db.designOut(f.design)) });
  } catch (e) { dbError(res, e); }
});

app.post('/api/favorites', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const { userId = 'guest', designId } = req.body || {};
  if (!designId) return res.status(400).json({ success: false, error: 'designId gerekli', code: 'BAD_REQUEST' });
  try {
    const favorite = await db.prisma.favorite.upsert({
      where: { userId_designId: { userId, designId } },
      update: {},
      create: { userId, designId },
    });
    res.json({ success: true, favorite });
  } catch (e) { dbError(res, e); }
});

app.delete('/api/favorites/:designId', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const userId = req.query.userId || 'guest';
  const designId = parseInt(req.params.designId, 10);
  try {
    await db.prisma.favorite.deleteMany({ where: { userId, designId } });
    res.json({ success: true });
  } catch (e) { dbError(res, e); }
});

// --- Tarama analizleri ---
app.post('/api/analysis', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const b = req.body || {};
  try {
    const analysis = await db.prisma.scanAnalysis.create({
      data: {
        userId: b.userId || 'guest', toneKey: b.toneKey || null, undertone: b.undertone || null,
        fingerLength: b.fingerLength || null, nailShape: b.nailShape || null, hex: b.hex || null,
      },
    });
    res.json({ success: true, analysis });
  } catch (e) { dbError(res, e); }
});

app.get('/api/analysis/latest', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const userId = req.query.userId || 'guest';
  try {
    const analysis = await db.prisma.scanAnalysis.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, analysis });
  } catch (e) { dbError(res, e); }
});

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' }));

function handleAiError(res, e) {
  console.error('❌ AI hatası:', e.message);
  const status = e.httpStatus || (e.status === 401 ? 401 : e.status === 429 ? 429 : 500);
  const code = e.code || (e.status === 401 ? 'INVALID_API_KEY' : e.status === 429 ? 'RATE_LIMITED' : 'AI_ERROR');
  res.status(status).json({ success: false, error: e.message || 'AI servisinde hata', code });
}

app.listen(PORT, () => {
  console.log('');
  console.log('🌟 ═══════════════════════════════════════');
  console.log('   ngNailArt — Backend');
  console.log('   ═══════════════════════════════════════');
  console.log(`🚀 API:     http://localhost:${PORT}/api/health`);
  console.log(`🤖 Durum:   http://localhost:${PORT}/api/ai/status`);
  console.log('');
});
