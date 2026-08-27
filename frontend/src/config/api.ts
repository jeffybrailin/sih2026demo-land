/**
 * Centralised API configuration.
 * In development: reads from .env  → VITE_API_URL=http://127.0.0.1:8000
 * In production:  reads from Vercel env var → VITE_API_URL=https://your-backend.onrender.com
 */
const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export const API = {
  base: BASE,
  reportHazard: `${BASE}/api/v1/report-hazard`,
} as const;
