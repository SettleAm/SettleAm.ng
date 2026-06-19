import imageCompression from "browser-image-compression";

/** Target compressed size in MB (~250 KB) */
const TARGET_SIZE_MB = 0.24;

/** Max dimension (width or height) after resize */
const MAX_DIMENSION_PX = 1920;

const CLOUDINARY_CLOUD_NAME = "do4kkjsgg";
const CLOUDINARY_UPLOAD_PRESET = "settleam_unsigned";

export interface UploadProgress {
  fileName: string;
  stage: "compressing" | "uploading" | "done" | "error";
  originalSizeKB: number;
  compressedSizeKB?: number;
  url?: string;
  error?: string;
}

/**
 * Compresses a single image file to ~250 KB using browser-image-compression.
 * Returns the compressed File blob.
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: TARGET_SIZE_MB,
    maxWidthOrHeight: MAX_DIMENSION_PX,
    useWebWorker: true,
    fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
    initialQuality: 0.85,
    alwaysKeepResolution: false,
  };

  const compressed = await imageCompression(file, options);

  // Return as a proper File so we keep the original name
  return new File([compressed], file.name, { type: compressed.type });
}

/**
 * Helper to inject Cloudinary optimization transformations (f_auto, q_auto)
 */
export function optimizeCloudinaryUrl(url: string): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

/**
 * Compress + upload a portfolio image to Cloudinary.
 * Returns the optimized URL of the stored image.
 */
export async function uploadPortfolioImage(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const originalSizeKB = Math.round(file.size / 1024);
  const baseProgress: UploadProgress = {
    fileName: file.name,
    stage: "compressing",
    originalSizeKB,
  };

  onProgress?.(baseProgress);

  // 1. Compress
  let compressed: File;
  try {
    compressed = await compressImage(file);
  } catch (err: any) {
    onProgress?.({ ...baseProgress, stage: "error", error: "Compression failed" });
    throw new Error(`Compression failed: ${err.message}`);
  }

  const compressedSizeKB = Math.round(compressed.size / 1024);
  onProgress?.({ ...baseProgress, stage: "uploading", compressedSizeKB });

  // 2. Upload to Cloudinary using unsigned upload
  try {
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("tags", `portfolio,user-${userId}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      // Log full error so it's visible in browser DevTools Console
      console.error("[Cloudinary] Upload failed (portfolio). Status:", res.status, "Body:", errData);
      const msg = errData.error?.message || `Cloudinary upload failed (HTTP ${res.status})`;
      throw new Error(msg);
    }

    const data = await res.json();
    const rawUrl = data.secure_url;
    const url = optimizeCloudinaryUrl(rawUrl);

    onProgress?.({ ...baseProgress, stage: "done", compressedSizeKB, url });

    return url;
  } catch (err: any) {
    onProgress?.({ ...baseProgress, stage: "error", error: err.message });
    throw err;
  }
}

/**
 * Compress + upload a profile avatar image to Cloudinary.
 * Returns the optimized URL.
 */
export async function uploadProfileImage(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const originalSizeKB = Math.round(file.size / 1024);
  const baseProgress: UploadProgress = {
    fileName: file.name,
    stage: "compressing",
    originalSizeKB,
  };

  onProgress?.(baseProgress);

  // 1. Compress (avatar: tighter size, smaller max dimension)
  let compressed: File;
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: 0.15,          // 150 KB for avatars
      maxWidthOrHeight: 400,    // Avatars don't need to be large
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.85,
    });
    compressed = new File([compressed], file.name, { type: compressed.type });
  } catch (err: any) {
    onProgress?.({ ...baseProgress, stage: "error", error: "Compression failed" });
    throw new Error(`Compression failed: ${err.message}`);
  }

  const compressedSizeKB = Math.round(compressed.size / 1024);
  onProgress?.({ ...baseProgress, stage: "uploading", compressedSizeKB });

  // 2. Upload to Cloudinary using unsigned upload
  try {
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("tags", `avatar,user-${userId}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      // Log full error so it's visible in browser DevTools Console
      console.error("[Cloudinary] Upload failed (avatar). Status:", res.status, "Body:", errData);
      const msg = errData.error?.message || `Cloudinary upload failed (HTTP ${res.status})`;
      throw new Error(msg);
    }

    const data = await res.json();
    const rawUrl = data.secure_url;
    const url = optimizeCloudinaryUrl(rawUrl);

    onProgress?.({ ...baseProgress, stage: "done", compressedSizeKB, url });

    return url;
  } catch (err: any) {
    onProgress?.({ ...baseProgress, stage: "error", error: err.message });
    throw err;
  }
}

/**
 * Delete an image. Frontend client calls cannot delete resources in Cloudinary directly 
 * without exposing API secrets, which is unsafe. This is kept as a placeholder to match
 * the original interface signature, but skips the action gracefully.
 */
export async function deleteStorageImage(publicUrl: string): Promise<void> {
  // Skipped silently on frontend for security
  console.log("Cloudinary image deletion skipped on client side:", publicUrl);
}
