import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

/** Target compressed size in MB (~250 KB) */
const TARGET_SIZE_MB = 0.24;

/** Max dimension (width or height) after resize */
const MAX_DIMENSION_PX = 1920;

// ── Bucket names (must match what you created in Supabase Storage) ──────────
const PORTFOLIO_BUCKET = "portfolio-images";
const PROFILE_BUCKET   = "profile-images";

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
    // Ensure we don't enlarge small images
    alwaysKeepResolution: false,
  };

  const compressed = await imageCompression(file, options);

  // Return as a proper File so we keep the original name
  return new File([compressed], file.name, { type: compressed.type });
}

/**
 * Compress + upload a portfolio image to Supabase Storage.
 * Returns the public URL of the stored image.
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

  // 2. Upload to Supabase Storage  → "portfolio-images" bucket
  const ext = compressed.type === "image/png" ? "png" : "jpg";
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/${timestamp}-${safeName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(storagePath, compressed, {
      contentType: compressed.type,
      upsert: false,
    });

  if (uploadError) {
    onProgress?.({ ...baseProgress, stage: "error", error: uploadError.message });
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 3. Get public URL
  const { data } = supabase.storage
    .from(PORTFOLIO_BUCKET)
    .getPublicUrl(storagePath);

  const url = data.publicUrl;
  onProgress?.({ ...baseProgress, stage: "done", compressedSizeKB, url });

  return url;
}

/**
 * Compress + upload a profile avatar image to Supabase Storage.
 * Overwrites any existing avatar for this user.
 * Returns the public URL.
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

  // 2. Upload → "profile-images" bucket, overwrite existing avatar
  const storagePath = `${userId}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(storagePath, compressed, {
      contentType: "image/jpeg",
      upsert: true, // overwrite previous avatar
    });

  if (uploadError) {
    onProgress?.({ ...baseProgress, stage: "error", error: uploadError.message });
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 3. Get public URL (cache-busting so browser picks up the latest)
  const { data } = supabase.storage
    .from(PROFILE_BUCKET)
    .getPublicUrl(storagePath);

  const url = `${data.publicUrl}?t=${Date.now()}`;
  onProgress?.({ ...baseProgress, stage: "done", compressedSizeKB, url });

  return url;
}

/**
 * Delete an image from Supabase Storage given its full public URL.
 */
export async function deleteStorageImage(publicUrl: string): Promise<void> {
  try {
    // Detect which bucket the URL belongs to and extract the path
    for (const bucket of [PORTFOLIO_BUCKET, PROFILE_BUCKET]) {
      const marker = `/${bucket}/`;
      const idx = publicUrl.indexOf(marker);
      if (idx !== -1) {
        const storagePath = publicUrl.slice(idx + marker.length).split("?")[0];
        await supabase.storage.from(bucket).remove([storagePath]);
        return;
      }
    }
    // Not a recognised storage URL — skip silently
  } catch {
    // Non-critical — don't block the UI
  }
}
