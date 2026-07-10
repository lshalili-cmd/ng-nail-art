// Miracle Nail Art AI — AI API tipleri
// Sözleşme, mevcut monolit backend'in (_serve.js) /api/ai/* uçlarıyla birebir uyumludur.

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: { provider?: string; model?: string; timestamp?: string };
}

export interface ArInstructions {
  useAsNewTexture: boolean;
  textureStyle: string;
  background: string;
  finish: string;
  placement: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

/** /api/ai/chat çıktısı — kullanıcı isteğinden üretilen yapılandırılmış tasarım. */
export interface DesignSpec {
  source: string;
  usesGallery: boolean;
  title: string;
  description: string;
  designPrompt: string;
  colors: string[];
  effects: string[];
  patterns: string[];
  style: string;
  finish: string;
  shape: string;
  extras: string[];
  reason: string;
  arInstructions?: ArInstructions;
  tags: string[];
  confidence: number;
}

/** /api/ai/generate-image çıktısı. */
export interface GeneratedImage {
  imageUrl: string;
  filename: string;
  prompt: string;
  style: string;
  shape: string;
  colors: string[];
  finish: string;
  size: number;
  provider: string;
}

/** /api/ai/status çıktısı. */
export interface AiStatus {
  configured: boolean;
  provider: string;
  model: string;
  textAvailable?: boolean;      // tasarım-spec için LLM var mı (yoksa istemci mockDesign)
  imageGenAvailable: boolean;
  imageProvider: string;
  fluxAvailable: boolean;
  status: 'ready' | 'not_configured' | string;
}

export type Locale4 = 'tr' | 'en' | 'ru' | 'ar';
