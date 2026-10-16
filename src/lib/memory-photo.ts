/** Client-side photo compression for memory photos (free, no Storage required). */

export const MEMORY_PHOTO_MAX_SIDE = 960;
export const MEMORY_PHOTO_QUALITY = 0.72;
/** ~280KB of base64 is a practical localStorage / Postgres text budget. */
export const MEMORY_PHOTO_MAX_CHARS = 380_000;

export type MemoryPhotoResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

/**
 * Compresses a user photo to a JPEG data URL suitable for embedding in state.
 * Rejects non-images and oversized results.
 */
export async function compressMemoryPhoto(file: File): Promise<MemoryPhotoResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Elegí una imagen (JPG, PNG o HEIC convertido)." };
  }
  if (file.size > 12 * 1024 * 1024) {
    return { ok: false, error: "La foto pesa demasiado (máx. 12 MB originales)." };
  }

  try {
    const img = await loadImage(file);
    const scale = Math.min(
      1,
      MEMORY_PHOTO_MAX_SIDE / Math.max(img.width, img.height),
    );
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, error: "No se pudo procesar la foto." };
    ctx.drawImage(img, 0, 0, w, h);

    let quality = MEMORY_PHOTO_QUALITY;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > MEMORY_PHOTO_MAX_CHARS && quality > 0.4) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > MEMORY_PHOTO_MAX_CHARS) {
      return {
        ok: false,
        error: "La foto sigue muy pesada. Probá otra más chica.",
      };
    }
    return { ok: true, dataUrl };
  } catch {
    return { ok: false, error: "No se pudo procesar la foto." };
  }
}
