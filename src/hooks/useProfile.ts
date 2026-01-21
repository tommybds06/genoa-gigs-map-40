import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SocialLinks {
  instagram?: string | null;
  website?: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: "worker" | "employer";
  xp_points: number;
  level: number;
  tags: string[];
  photos: string[];
  experience: string | null;
  social_links: SocialLinks | null;
  is_onboarded: boolean;
  looking_for: string | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      setProfile(data ? { 
        ...data, 
        tags: data.tags || [],
        photos: data.photos || [],
        social_links: data.social_links as SocialLinks | null,
        is_onboarded: data.is_onboarded || false,
        looking_for: data.looking_for || null,
        address_text: data.address_text || null,
        lat: data.lat || null,
        lng: data.lng || null
      } : null);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateTags = async (tags: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ tags })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, tags } : null));
      toast.success("Tag aggiornati!");
    } catch (error) {
      console.error("Error updating tags:", error);
      toast.error("Errore nell'aggiornamento dei tag");
    }
  };

  return { profile, loading, updateTags, refetch: fetchProfile };
}
