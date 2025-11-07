// New hook: fetch the current user's profile (if endpoint exists).
// If the profile endpoint does not exist (404), the hook returns `profile === null`
// to indicate the "profile page doesn't exist yet" situation described in the prompt.
import { useQuery } from "@tanstack/react-query";

export function useProfile() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (res.status === 404) {
        // Indicate endpoint missing (temporary state) by returning explicit null
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch profile");
      }
      return res.json();
    },
    // We don't want aggressive retries here to avoid redirect loops
    retry: false,
  });

  // hasProfile: true if profile exists and contains a truthy value.
  // data === null => profile endpoint missing (treat as "profile page not present yet")
  const hasProfile = !!data;

  return {
    profile: data, // null means endpoint missing; undefined means loading
    hasProfile,
    isLoading,
    isError,
  };
}