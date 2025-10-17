"use client";
export type TreguRole = "buyer" | "seller";
export type TreguProfile = { email?: string; role?: TreguRole; /* ... */ };

const PROFILE_KEY = "tregu_profile";

export function getProfile(): TreguProfile | null {
  try { const raw = localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
export function setProfile(p: TreguProfile) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }
export function clearProfile() { localStorage.removeItem(PROFILE_KEY); localStorage.removeItem("tregu_token"); }
export function isOnboarded(): boolean { const p = getProfile(); return !!(p?.email && p?.role); }
export function getRole(): TreguRole | undefined { return getProfile()?.role as TreguRole | undefined; }
export function getEmail(): string | undefined { return getProfile()?.email; }
