// Reference: Replit Auth blueprint
// NOTE: This hook is for legacy API-based auth (/api/auth/user)
// For Supabase auth, use @/auth/AuthProvider instead
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

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
