// NOTE: This file used to be the API-backed useAuth hook.
// We keep a shim here that re-exports the API-backed hook under a new name (useApiAuth).
// Import the Supabase provider (recommended): import { useAuth } from '@/auth/AuthProvider';

import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

/**
 * API-backed hook retained for server-backed endpoints.
 * Use this via: import { useApiAuth } from '@/hooks/useAuth';
 *
 * Prefer using: import { useAuth } from '@/auth/AuthProvider' (Supabase session)
 */
export function useApiAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

// Backwards-compat: default export for old imports (still returns API-backed state).
// Warning: prefer importing the Supabase provider's hook instead.
export const useAuth = useApiAuth;