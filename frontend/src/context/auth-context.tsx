"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { UserProfile } from "@/types";
import { fetchMyProfileFromBackend, updateMyProfileOnBackend } from "@/lib/api";

interface SignUpMetadata {
  fullName: string;
  barEnrollmentNumber?: string;
  chamberName?: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error?: string; requiresEmailConfirmation?: boolean; confirmationLink?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile from backend when session is present
  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setProfile(null);
      return;
    }

    const res = await fetchMyProfileFromBackend();
    if (res.success && res.data) {
      setProfile(res.data);
    } else {
      // Identity-driven fallback derived directly from authenticated Supabase JWT
      const authUser = currentSession.user;
      const meta = authUser.user_metadata || {};
      const fullName = meta.full_name || meta.name || (authUser.email ? authUser.email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "");
      setProfile({
        id: authUser.id,
        name: fullName,
        email: authUser.email || "",
        role: "Senior Empaneled Advocate",
        barEnrollmentNumber: meta.bar_enrollment_number || "",
        chamberName: meta.chamber_name || "",
        phone: meta.phone || "",
        address: meta.address || "",
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession) {
            await loadProfile(initialSession);
          }
        }
      } catch (err) {
        console.error("[Auth] Error restoring session:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to Supabase auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await loadProfile(newSession);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      setSession(data.session);
      setUser(data.user);
      await loadProfile(data.session);
      setIsLoading(false);
      return {};
    } catch (err: unknown) {
      setIsLoading(false);
      return { error: err instanceof Error ? err.message : "Authentication failed." };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: SignUpMetadata
  ): Promise<{ error?: string; requiresEmailConfirmation?: boolean; confirmationLink?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.fullName,
            name: metadata.fullName,
            bar_enrollment_number: metadata.barEnrollmentNumber || "",
            chamber_name: metadata.chamberName || "",
            phone: metadata.phone || "",
            address: metadata.address || "",
          },
        },
      });

      if (error) {
        // Handle Supabase email rate limits in development by generating an official confirmation link via backend
        const isRateLimit = error.message?.toLowerCase().includes("rate limit") || (error as any).status === 429;
        if (isRateLimit) {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
            const devRes = await fetch(`${apiBase}/api/v1/auth/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email.trim(),
                password,
                fullName: metadata.fullName,
                barEnrollmentNumber: metadata.barEnrollmentNumber || "",
                chamberName: metadata.chamberName || "",
                phone: metadata.phone || "",
                address: metadata.address || "",
              }),
            });
            const devData = await devRes.json();
            if (devRes.ok && devData.success) {
              setIsLoading(false);
              return {
                requiresEmailConfirmation: true,
                confirmationLink: devData.confirmationLink,
              };
            }
            setIsLoading(false);
            return { error: devData.detail || "Registration failed." };
          } catch (devErr: unknown) {
            setIsLoading(false);
            return { error: devErr instanceof Error ? devErr.message : "Registration failed." };
          }
        }

        setIsLoading(false);
        return { error: error.message };
      }

      // Check if email confirmation is required (session is null if email confirmation enabled)
      if (data.user && !data.session) {
        setIsLoading(false);
        return { requiresEmailConfirmation: true };
      }

      setSession(data.session);
      setUser(data.user);

      // Persist profile to backend
      if (data.session) {
        await updateMyProfileOnBackend({
          name: metadata.fullName,
          email,
          barEnrollmentNumber: metadata.barEnrollmentNumber || "",
          chamberName: metadata.chamberName || "",
          phone: metadata.phone || "",
          address: metadata.address || "",
        });
        await loadProfile(data.session);
      }

      setIsLoading(false);
      return {};
    } catch (err: unknown) {
      setIsLoading(false);
      return { error: err instanceof Error ? err.message : "Sign-up failed." };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Auth] Sign out error:", err);
    } finally {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("lsr_cases");
          localStorage.removeItem("lsr_documents");
          localStorage.removeItem("lsr_findings");
          localStorage.removeItem("lsr_queries");
          localStorage.removeItem("lsr_reports");
        } catch {
          // Ignore localStorage errors
        }
      }
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      router.push("/login");
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<{ error?: string }> => {
    const res = await updateMyProfileOnBackend(data);
    if (!res.success) {
      return { error: res.error || "Failed to update profile." };
    }
    if (res.data) {
      setProfile(res.data);
    }
    return {};
  };

  const refreshProfile = async () => {
    if (session) {
      await loadProfile(session);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
