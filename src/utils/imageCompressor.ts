/**
 * Utility to compress images on the client side before storing in localStorage or sending to API.
 * Prevents localStorage QuotaExceededError (5MB browser limit) by reducing megabyte photos
 * to efficient 20-50KB optimized WebP/JPEG thumbnails.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
}

export async function compressImage(
  fileOrDataUrl: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.75,
    mimeType = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn("Image compression failed, falling back to original:", err);
        resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
      }
    };

    img.onerror = (err) => {
      console.warn("Failed to load image for compression:", err);
      resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
