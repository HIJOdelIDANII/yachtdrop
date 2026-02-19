/**
 * Environment helpers — works on both server and client.
 *
 * NEXT_PUBLIC_APP_ENV values:
 *   "development" — local dev (.env.local)
 *   "preview"     — Vercel preview deployments
 *   "production"  — Vercel production
 */

export type AppEnv = "development" | "preview" | "production";

export const APP_ENV = (process.env.NEXT_PUBLIC_APP_ENV ?? "development") as AppEnv;

export const isDev = APP_ENV === "development";
export const isProd = APP_ENV === "production";
export const isPreview = APP_ENV === "preview";
