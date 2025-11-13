// client/src/lib/apiClient.ts
/**
 * Simple API client for making fetch requests to backend endpoints
 * Includes credentials for authentication
 */
export async function apiClient(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
}
