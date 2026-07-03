// İndirme + paylaşma yardımcıları (data URL veya yol için).

/** Bir görseli cihaza indirir. */
export function downloadImage(url: string, filename = 'nailart.png'): void {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    console.warn('[Share] indirme hatası:', e);
  }
}

/**
 * Web Share API ile görseli paylaşır. Desteklenmiyorsa false döner
 * (çağıran taraf indirmeye düşebilir).
 */
export async function shareImage(url: string, filename = 'nailart.png', title = 'Miracle Nail Art'): Promise<boolean> {
  try {
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], title });
      return true;
    }
  } catch (e) {
    console.warn('[Share] paylaşım hatası:', e);
  }
  return false;
}
