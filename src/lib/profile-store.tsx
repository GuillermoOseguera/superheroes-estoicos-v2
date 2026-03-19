"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import { CelebrationOverlay, type CelebrationData } from "@/components/ui/celebration-overlay";
import { ALL_ACHIEVEMENTS } from "@/lib/data-logros";

interface ProfileContextValue {
  activeProfile: Profile | null;
  activeAccount: { id: string; username: string } | null;
  setActiveProfile: (profile: Profile) => void;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
  triggerCelebration: (data: CelebrationData) => void;
  login: (username: string, password_hash: string) => Promise<boolean>;
  logout: () => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  activeProfile: null,
  activeAccount: null,
  setActiveProfile: () => {},
  refreshProfile: async () => {},
  clearProfile: () => {},
  triggerCelebration: () => {},
  login: async () => false,
  logout: () => {},
});

const STORAGE_KEY = "academia_estoica_profile_id";
const ACCOUNT_KEY = "academia_estoica_account_id";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [activeAccount, setActiveAccount] = useState<{ id: string; username: string } | null>(null);
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

  // Cargar el perfil y cuenta guardados al iniciar
  useEffect(() => {
    const savedAccountId = localStorage.getItem(ACCOUNT_KEY);
    const savedProfileId = localStorage.getItem(STORAGE_KEY);

    if (savedAccountId) {
      supabase
        .from("app_accounts")
        .select("id, username")
        .eq("id", savedAccountId)
        .single()
        .then(({ data }: { data: any }) => {
          if (data) {
            setActiveAccount(data);
            // Solo cargar perfil si la cuenta es válida
            if (savedProfileId) {
              supabase
                .from("profiles")
                .select("*")
                .eq("id", savedProfileId)
                .single()
                .then(({ data: pData }: { data: any }) => {
                  if (pData) setActiveProfileState(pData as Profile);
                });
            }
          }
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

  const login = async (username: string, pass: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("app_accounts")
        .select("id, username")
        .eq("username", username)
        .eq("password_hash", pass) // Simplificación solicitada
        .single();

      if (error || !data) return false;

      setActiveAccount(data);
      localStorage.setItem(ACCOUNT_KEY, data.id);
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    setActiveAccount(null);
    setActiveProfileState(null);
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/";
  };

  return (
    <ProfileContext.Provider
      value={{ 
        activeProfile, activeAccount, setActiveProfile, refreshProfile, clearProfile, triggerCelebration,
        login, logout 
      }}
    >
      {children}
      <CelebrationOverlay data={celebration} onClose={() => setCelebration(null)} />
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
