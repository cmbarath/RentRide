import { createClient } from './client';

export const STORAGE_BUCKETS = {
  VEHICLE_IMAGES: 'vehicle-images',
  DRIVING_LICENCES: 'driving-licences', // STRICT PRIVATE
  CUSTOMER_AVATARS: 'customer-avatars',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Uploads a customer driving licence to the private 'driving-licences' bucket.
 * Files are isolated in user-specific folders: {userId}/{side}_{timestamp}.{ext}
 */
export async function uploadDrivingLicence(
  userId: string,
  file: File | Blob,
  side: 'front' | 'back'
): Promise<{ path?: string; error?: string }> {
  try {
    const supabase = createClient();
    const extension = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
    const filePath = `${userId}/${side}_${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.DRIVING_LICENCES)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      return { error: error.message };
    }

    return { path: data.path };
  } catch (err: any) {
    return { error: err?.message || 'Failed to upload driving licence document' };
  }
}

/**
 * Generates a time-limited signed URL for viewing private driving licence documents.
 * Accessible only by the document owner or authorized fleet admin.
 */
export async function getSignedLicenceUrl(
  filePath: string,
  expiresInSeconds = 3600 // Default 1 hour
): Promise<{ signedUrl?: string; error?: string }> {
  try {
    if (!filePath || filePath.startsWith('/images/')) {
      // Local placeholder image fallback
      return { signedUrl: filePath };
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.DRIVING_LICENCES)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      return { error: error.message };
    }

    return { signedUrl: data.signedUrl };
  } catch (err: any) {
    return { error: err?.message || 'Failed to generate signed URL for licence' };
  }
}

/**
 * Uploads a fleet vehicle image to the public 'vehicle-images' bucket.
 */
export async function uploadVehicleImage(
  file: File | Blob,
  fileName: string
): Promise<{ publicUrl?: string; path?: string; error?: string }> {
  try {
    const supabase = createClient();
    const cleanFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.VEHICLE_IMAGES)
      .upload(cleanFileName, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      return { error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.VEHICLE_IMAGES)
      .getPublicUrl(data.path);

    return { publicUrl: urlData.publicUrl, path: data.path };
  } catch (err: any) {
    return { error: err?.message || 'Failed to upload vehicle image' };
  }
}

/**
 * Uploads a customer profile avatar to the 'customer-avatars' bucket.
 */
export async function uploadCustomerAvatar(
  userId: string,
  file: File | Blob
): Promise<{ publicUrl?: string; error?: string }> {
  try {
    const supabase = createClient();
    const extension = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
    const filePath = `${userId}/avatar_${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.CUSTOMER_AVATARS)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      return { error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.CUSTOMER_AVATARS)
      .getPublicUrl(data.path);

    return { publicUrl: urlData.publicUrl };
  } catch (err: any) {
    return { error: err?.message || 'Failed to upload customer avatar' };
  }
}
