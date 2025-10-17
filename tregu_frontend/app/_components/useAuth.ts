"use client";
import { useEffect, useState } from "react";

export type TreguRole = "buyer" | "seller";
export type TreguProfile = {
  name?: string;
  email?: string;
  role?: TreguRole;
  phone?: string;
  company?: string;
  companyEmail?: string;
  companyPhone?: string;
  age?: string;
  gender?: string;
  location?: string;
  accountNumber?: string;
};

const PROFILE_KEY = "tregu_profile";

export function getProfile(): TreguProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as TreguProfile) : null;
  } catch {
    return null;
  }
}

export function setProfile(p: TreguProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem("tregu_token");
}

export function isOnboarded(): boolean {
  const p = getProfile();
  return !!(p?.email && p?.role);
}

export function getRole(): TreguRole | undefined {
  const p = getProfile();
  return p?.role as TreguRole | undefined;
}

export function getEmail(): string | undefined {
  return getProfile()?.email;
}

/* Optional React helper */
export function useAuth() {
  const [profile, setProfileState] = useState<TreguProfile | null>(null);
  useEffect(() => {
    setProfileState(getProfile());
  }, []);
  return {
    profile,
    role: profile?.role,
    isOnboarded: !!(profile?.email && profile?.role),
    saveProfile: (p: TreguProfile) => {
      setProfile(p);
      setProfileState(p);
    },
    signOut: () => {
      clearProfile();
      setProfileState(null);
    },
  };
}
