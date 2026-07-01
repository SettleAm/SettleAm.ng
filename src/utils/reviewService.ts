import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  artisan_id: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;       // 1–5
  comment: string;
  created_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const reviewService = {
  /**
   * Fetch all reviews for a given artisan, newest first.
   */
  async getReviewsForArtisan(artisanId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("artisan_id", artisanId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Failed to fetch reviews:", error.message);
        return [];
      }
      return (data as Review[]) || [];
    } catch (err) {
      console.warn("reviewService.getReviewsForArtisan error:", err);
      return [];
    }
  },

  /**
   * Check whether a specific user has already reviewed a specific artisan.
   */
  async hasUserReviewed(artisanId: string, reviewerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("artisan_id", artisanId)
        .eq("reviewer_id", reviewerId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = "no rows found" — that's fine, means not reviewed yet
        console.warn("hasUserReviewed check error:", error.message);
      }
      return !!data;
    } catch {
      return false;
    }
  },

  /**
   * Submit a new review and update the artisan's aggregate rating.
   */
  async submitReview(
    artisanId: string,
    reviewerId: string,
    reviewerName: string,
    rating: number,
    comment: string
  ): Promise<{ success: boolean; review?: Review; error?: string }> {
    try {
      // 1. Insert review row
      const { data: inserted, error: insertError } = await supabase
        .from("reviews")
        .insert({
          artisan_id: artisanId,
          reviewer_id: reviewerId,
          reviewer_name: reviewerName,
          rating,
          comment: comment.trim(),
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // 2. Recalculate aggregate rating on the profiles table
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("artisan_id", artisanId);

      if (allReviews && allReviews.length > 0) {
        const avg =
          allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          allReviews.length;
        await supabase
          .from("profiles")
          .update({
            rating: Math.round(avg * 10) / 10, // round to 1 decimal
            reviews: allReviews.length,
          })
          .eq("id", artisanId);
      }

      return { success: true, review: inserted as Review };
    } catch (err: any) {
      return { success: false, error: err.message || "Unexpected error" };
    }
  },
};
