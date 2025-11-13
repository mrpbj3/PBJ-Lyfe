// server/health.ts

/**
 * Simple health check endpoint
 * Returns server status and current timestamp
 */
export async function getHealthStatus() {
  return {
    ok: true,
    time: Date.now(),
    timestamp: new Date().toISOString(),
    status: 'healthy'
  };
}
