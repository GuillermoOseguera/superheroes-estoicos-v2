"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";

interface ProfileContextValue {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  activeProfile: null,
  setActiveProfile: () => {},
  refreshProfile: async () => {},
  clearProfile: () => {},
});

const STORAGE_KEY = "academia_estoica_profile_id";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);

  // Cargar el perfil guardado en localStorage al iniciar
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", savedId)
        .single()
        .then(({ data }) => {
          if (data) setActiveProfileState(data as Profile);
        });
    }
  }, []);

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
    if (data) setActiveProfileState(data as Profile);
  };

  const clearProfile = () => {
    setActiveProfileState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ProfileContext.Provider
      value={{ activeProfile, setActiveProfile, refreshProfile, clearProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
