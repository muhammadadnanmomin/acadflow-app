import { createClient } from "@/lib/supabase/client";

const BUCKET = "signatures";

/**
 * Converts a base64 data-URL to a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Upload a drawn signature PNG to Supabase Storage.
 *
 * Uses a cache-busting timestamp in the filename so browsers never serve
 * the stale version after an edit.
 *
 * @param conferenceId  UUID of the conference
 * @param dataUrl       base64 PNG produced by getTrimmedCanvas().toDataURL()
 * @param index         slot index 0 | 1 | 2
 * @param oldPath       previous storage path to delete on edit (optional)
 * @returns             public URL of the uploaded image
 */
export async function uploadSignature(
  conferenceId: string,
  dataUrl: string,
  index: number,
  oldPath?: string
): Promise<string> {
  const supabase = createClient();

  // Delete the old file so storage doesn't accumulate stale PNGs
  if (oldPath) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  const path = `${conferenceId}/${index}-${Date.now()}.png`;
  const blob = dataUrlToBlob(dataUrl);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/png", upsert: false });

  if (error) {
    throw new Error(`Signature upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a signature file from storage by its public URL.
 * Extracts the storage path from the URL.
 */
export async function deleteSignatureByUrl(imageUrl: string): Promise<void> {
  const supabase = createClient();
  try {
    // Path starts after "/object/public/{bucket}/"
    const marker = `/object/public/${BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return;
    const path = imageUrl.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // Best-effort — don't throw on cleanup failures
  }
}
