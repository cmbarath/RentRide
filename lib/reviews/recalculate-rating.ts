import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Recalculates average rating and approved review count for a vehicle from public.reviews
 * and updates public.vehicles using the server admin client (required because customers
 * do not hold RLS UPDATE privileges on public.vehicles).
 */
export async function recalculateVehicleRating(
  adminClient: SupabaseClient,
  vehicleId: string
): Promise<void> {
  const { data: approvedReviews, error } = await adminClient
    .from('reviews')
    .select('rating')
    .eq('vehicle_id', vehicleId)
    .eq('is_approved', true);

  if (error) {
    console.warn('[recalculateVehicleRating] Failed to query approved reviews:', error.message);
    return;
  }

  const count = approvedReviews?.length || 0;
  const avg =
    count > 0
      ? Number(
          (approvedReviews!.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / count).toFixed(2)
        )
      : 5.0;

  const { error: updateErr } = await adminClient
    .from('vehicles')
    .update({ rating: avg, review_count: count })
    .eq('id', vehicleId);

  if (updateErr) {
    console.warn('[recalculateVehicleRating] Failed to update vehicle rating:', updateErr.message);
  }
}
