import { supabase } from "./supabase";

export interface ArtisanProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  craft: string;
  location: string;
  services: string[];
  experience: string;
  price: string;
  description: string;
  profile_image: string;  // Supabase Storage URL for avatar
  portfolio: string[];    // Supabase Storage URLs for work photos
  rating: number;
  reviews: number;
  role?: 'customer' | 'artisan';
}

// Key for local storage fallback list of all custom profiles (to display on the listing page)
const LOCAL_CUSTOM_ARTISANS_KEY = "settleam_custom_artisans";

export const profileService = {
  /**
   * Save profile to Supabase (and duplicate to LocalStorage as a robust fallback)
   */
  async saveProfile(profile: ArtisanProfile): Promise<boolean> {
    try {
      // 1. Try to upsert into Supabase profiles table
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          craft: profile.craft,
          location: profile.location,
          services: profile.services,
          experience: profile.experience,
          price: profile.price,
          description: profile.description,
          profile_image: profile.profile_image || "",
          portfolio: profile.portfolio,
          rating: profile.rating,
          reviews: profile.reviews,
          role: profile.role || "customer",
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (error) {
        console.warn("Supabase upsert failed, using localStorage fallback:", error.message);
      }
    } catch (err) {
      console.warn("Supabase upsert error, using localStorage fallback:", err);
    }

    // 2. Always update localStorage to ensure fallback data persistence
    try {
      // Save individual profile
      localStorage.setItem(`artisan_profile_${profile.id}`, JSON.stringify(profile));

      // Update the global list of custom profiles
      const existingStr = localStorage.getItem(LOCAL_CUSTOM_ARTISANS_KEY);
      let list: ArtisanProfile[] = existingStr ? JSON.parse(existingStr) : [];
      
      // Filter out existing profile and add the updated one
      list = list.filter(item => item.id !== profile.id);
      list.push(profile);
      
      localStorage.setItem(LOCAL_CUSTOM_ARTISANS_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error("LocalStorage save failed:", e);
      return false;
    }
  },

  /**
   * Get a profile by User ID
   */
  async getProfile(userId: string): Promise<ArtisanProfile | null> {
    // 1. Try fetching from Supabase
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data && !error) {
        return {
          id: data.id,
          email: data.email || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          craft: data.craft || "",
          location: data.location || "",
          services: Array.isArray(data.services) ? data.services : [],
          experience: data.experience || "",
          price: data.price || "",
          description: data.description || "",
          profile_image: data.profile_image || "",
          portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
          rating: data.rating || 5.0,
          reviews: data.reviews || 0,
          role: data.role || "customer",
        };
      }
    } catch (err) {
      console.warn("Supabase select error, fetching from localStorage:", err);
    }

    // 2. Fallback to LocalStorage
    try {
      const cached = localStorage.getItem(`artisan_profile_${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error("LocalStorage fetch failed:", e);
    }

    return null;
  },

  /**
   * Get all custom artisan profiles (for listing page)
   */
  async getAllCustomArtisans(): Promise<ArtisanProfile[]> {
    // 1. Try fetching from Supabase profiles table
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      if (data && !error) {
        return data.map((item: any) => ({
          id: item.id,
          email: item.email || "",
          first_name: item.first_name || "",
          last_name: item.last_name || "",
          phone: item.phone || "",
          craft: item.craft || "",
          location: item.location || "",
          services: Array.isArray(item.services) ? item.services : [],
          experience: item.experience || "",
          price: item.price || "",
          description: item.description || "",
          profile_image: item.profile_image || "",
          portfolio: Array.isArray(item.portfolio) ? item.portfolio : [],
          rating: item.rating || 5.0,
          reviews: item.reviews || 0,
          role: item.role || "customer",
        }));
      }
    } catch (err) {
      console.warn("Supabase fetch all error, using localStorage list:", err);
    }

    // 2. Fallback to LocalStorage list
    try {
      const cached = localStorage.getItem(LOCAL_CUSTOM_ARTISANS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error("LocalStorage list fetch failed:", e);
    }

    return [];
  },

  /**
   * Helper to automatically create/ensure an artisan profile on signup/login.
   * Pulls info from current Supabase session metadata if profile doesn't exist yet.
   */
  async ensureProfileForUser(userId: string, email: string, metadata: any, defaultRole: 'customer' | 'artisan' = 'customer'): Promise<ArtisanProfile> {
    const existing = await this.getProfile(userId);
    if (existing) {
      if (!existing.role) {
        existing.role = metadata?.role || defaultRole;
        await this.saveProfile(existing);
      }
      return existing;
    }

    // Create a new default profile
    const newProfile: ArtisanProfile = {
      id: userId,
      email: email,
      first_name: metadata?.first_name || "",
      last_name: metadata?.last_name || "",
      phone: metadata?.phone || "",
      craft: metadata?.craft || "",
      location: metadata?.location || "",
      services: [],
      experience: "1 yr exp",
      price: "₦5,000",
      description: "",
      profile_image: "",
      portfolio: [],
      rating: 5.0,
      reviews: 0,
      role: metadata?.role || defaultRole,
    };

    await this.saveProfile(newProfile);
    return newProfile;
  }
};
