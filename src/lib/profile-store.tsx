"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, setSessionToken, getSessionToken, type Profile } from "@/lib/supabase";
import { CelebrationOverlay, type CelebrationData } from "@/components/ui/celebration-overlay";
import { ALL_ACHIEVEMENTS } from "@/lib/data-logros";

interface ProfileContextValue {
  activeProfile: Profile | null;
  activeAccount: { id: string; username: string } | null;
  /** true mientras se valida la sesión guardada al arrancar; evita redirigir antes de tiempo */
  sessionLoading: boolean;
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
  sessionLoading: true,
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
  const [sessionLoading, setSessionLoading] = useState(true);
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

  // Cargar el perfil y cuenta guardados al iniciar, validando el token de sesión
  useEffect(() => {
    const savedProfileId = localStorage.getItem(STORAGE_KEY);
    const token = getSessionToken();
    if (!token) {
      setSessionLoading(false);
      return;
    }

    supabase
      .rpc("validate_session", { p_token: token })
      .then(({ data }: { data: any }) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          // Token vencido o inválido: limpiar sesión local
          setSessionToken(null);
          document.cookie = "academia_session=; path=/; max-age=0";
          localStorage.removeItem(ACCOUNT_KEY);
          localStorage.removeItem(STORAGE_KEY);
          setSessionLoading(false);
          return;
        }

        // Reponer la cookie del middleware por si el navegador la perdió:
        // el token en localStorage sigue siendo la fuente de verdad.
        document.cookie = `academia_session=${token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;

        const account = { id: row.account_id, username: row.username };
        setActiveAccount(account);
        if (savedProfileId) {
          supabase
            .from("profiles")
            .select("*")
            .eq("id", savedProfileId)
            .single()
            .then(({ data: pData }: { data: any }) => {
              if (pData) setActiveProfileState(pData as Profile);
              setSessionLoading(false);
            });
        } else {
          setSessionLoading(false);
        }
      })
      .catch(() => setSessionLoading(false));
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
      const { data, error } = await supabase.rpc("login", {
        p_username: username,
        p_password: pass,
      });

      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row || !row.session_token) return false;

      setSessionToken(row.session_token);
      const account = { id: row.account_id, username: row.username };
      setActiveAccount(account);
      localStorage.setItem(ACCOUNT_KEY, account.id);

      // Le avisamos al backend/middleware que hay sesión activa (cookie no-httpOnly,
      // solo para que el middleware de rutas sepa que debe dejar pasar).
      document.cookie = `academia_session=${row.session_token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;

      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    const token = getSessionToken();
    if (token) {
      supabase.rpc("logout_session", { p_token: token }).catch(() => {});
    }
    setSessionToken(null);
    document.cookie = "academia_session=; path=/; max-age=0";
    setActiveAccount(null);
    setActiveProfileState(null);
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/";
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfile, activeAccount, sessionLoading, setActiveProfile, refreshProfile, clearProfile, triggerCelebration,
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
