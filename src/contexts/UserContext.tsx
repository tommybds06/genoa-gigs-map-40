import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserRole = "worker" | "employer";

export interface SocialLinks {
  instagram?: string | null;
  website?: string | null;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
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

interface UserContextType {
  profile: UserProfile | null;
  role: UserRole;
  isEmployer: boolean;
  isWorker: boolean;
  loading: boolean;
  hasLoaded: boolean;
  updateTags: (tags: string[]) => Promise<void>;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache the role in sessionStorage to prevent flash
const ROLE_CACHE_KEY = "genoagigs_user_role";

function getCachedRole(): UserRole | null {
  try {
    const cached = sessionStorage.getItem(ROLE_CACHE_KEY);
    if (cached === "worker" || cached === "employer") {
      return cached;
    }
  } catch {
    // sessionStorage might not be available
  }
  return null;
}

function setCachedRole(role: UserRole) {
  try {
    sessionStorage.setItem(ROLE_CACHE_KEY, role);
  } catch {
    // sessionStorage might not be available
  }
}

function clearCachedRole() {
  try {
    sessionStorage.removeItem(ROLE_CACHE_KEY);
  } catch {
    // sessionStorage might not be available
  }
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Use cached role for initial render to prevent flash
  const cachedRole = getCachedRole();
  const [role, setRole] = useState<UserRole>(cachedRole || "worker");

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setRole("worker");
      clearCachedRole();
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const userProfile: UserProfile = {
          ...data,
          tags: data.tags || [],
          photos: data.photos || [],
          social_links: data.social_links as SocialLinks | null,
          is_onboarded: data.is_onboarded || false,
          looking_for: data.looking_for || null,
          address_text: data.address_text || null,
          lat: data.lat || null,
          lng: data.lng || null,
        };
        
        setProfile(userProfile);
        setRole(userProfile.role);
        setCachedRole(userProfile.role);
      } else {
        setProfile(null);
        // Keep cached role if we have it to prevent flash
        if (!cachedRole) {
          setRole("worker");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [user, cachedRole]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Clear cache on logout
  useEffect(() => {
    if (!user) {
      clearCachedRole();
    }
  }, [user]);

  const updateTags = async (tags: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ tags })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, tags } : null));
    } catch (error) {
      console.error("Error updating tags:", error);
      throw error;
    }
  };

  const isEmployer = role === "employer";
  const isWorker = role === "worker";

  return (
    <UserContext.Provider
      value={{
        profile,
        role,
        isEmployer,
        isWorker,
        loading,
        hasLoaded,
        updateTags,
        refetch: fetchProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
