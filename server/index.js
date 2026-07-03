// ngNailArt backend — Express + AI (port 3000)
// Angular dev proxy'si /api ve /images'i buraya yönlendirir (proxy.conf.json).
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ai = require('./ai');

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
