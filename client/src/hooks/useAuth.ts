// Reference: Replit Auth blueprint
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

/**
 * Stable hook used by App router to determine authentication state.
 * Returns:
 *  - user: User | undefined
 *  - isLoading: boolean
 *  - isAuthenticated: boolean
 */
export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user");
      if (!res.ok) throw new Error("Failed to fetch user");
      return (await res.json()) as User;
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}