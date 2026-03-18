"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import { CelebrationOverlay, type CelebrationData } from "@/components/ui/celebration-overlay";
import { ALL_ACHIEVEMENTS } from "@/lib/data-logros";

interface ProfileContextValue {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
  triggerCelebration: (data: CelebrationData) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  activeProfile: null,
  setActiveProfile: () => {},
  refreshProfile: async () => {},
  clearProfile: () => {},
  triggerCelebration: () => {},
});

const STORAGE_KEY = "academia_estoica_profile_id";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  // Escuchar eventos globales de logros
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAchievement = (e: any) => {
      const { achievementId } = e.detail;
      const found = ALL_ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (found) {
        triggerCelebration({
          type: "achievement",
          title: found.label,
          icon: found.icon,
          color: found.color,
        });
      }
    };

    window.addEventListener("achievement_unlocked", handleAchievement);
    return () => window.removeEventListener("achievement_unlocked", handleAchievement);
  }, []);

  // Cargar el perfil guardado en localStorage al iniciar
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", savedId)
        .single()
        .then(({ data }: any) => {
          if (data) setActiveProfileState(data as Profile);
        });
    }
  }, []);

  const triggerCelebration = (data: CelebrationData) => {
    setCelebration(data);
  };

  const setActiveProfile = (profile: Profile) => {
    setActiveProfileState(profile);
    localStorage.setItem(STORAGE_KEY, profile.id);
    // Actualizar last_login
    supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", profile.id);
  };

  const refreshProfile = async () => {
    if (!activeProfile) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", activeProfile.id)
      .single();
    
    if (data) {
      // EVENTO: Subir de nivel!
      if (activeProfile && (data as Profile).level > activeProfile.level) {
        triggerCelebration({
          type: "level_up",
          title: `¡Nivel ${(data as Profile).level}! ✨`,
          icon: "🌟",
          color: "#f59e0b"
        });
      }
      setActiveProfileState(data as Profile);
    }
  };

  const clearProfile = () => {
    setActiveProfileState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ProfileContext.Provider
      value={{ activeProfile, setActiveProfile, refreshProfile, clearProfile, triggerCelebration }}
    >
      {children}
      <CelebrationOverlay data={celebration} onClose={() => setCelebration(null)} />
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
