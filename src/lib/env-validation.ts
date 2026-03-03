/**
 * Environment Configuration Utilities
 * Adapted for Appwrite Cloud
 */

export interface EnvironmentVariables {
  // Appwrite (required)
  VITE_APPWRITE_ENDPOINT: string;
  VITE_APPWRITE_PROJECT_ID: string;

  // Stripe (payment links)
  VITE_STRIPE_PAYMENT_LINK?: string;
  VITE_STRIPE_PAYMENT_LINK_YEARLY?: string;
  VITE_STRIPE_PAYMENT_LINK_MONTHLY?: string;

  // App configuration
  VITE_DOMAIN_NAME?: string;
  VITE_SUPPORT_EMAIL?: string;
  VITE_APP_VERSION?: string;
}

export interface EnvironmentValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Required environment variables for basic functionality
 */
const REQUIRED_CLIENT_VARS: (keyof EnvironmentVariables)[] = [
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID'
];

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_VARS: (keyof EnvironmentVariables)[] = [
  'VITE_STRIPE_PAYMENT_LINK_YEARLY',
  'VITE_STRIPE_PAYMENT_LINK_MONTHLY'
];

/**
 * Lightweight check for required client env vars (no Zod).
 * For full schema validation, use validateClientEnvironment from @/config/env.config.
 */
export function checkRequiredClientVars(): EnvironmentValidationResult {
  const missing = REQUIRED_CLIENT_VARS.filter(varName => !getEnvVar(varName));
  const warnings = RECOMMENDED_VARS.filter(varName => !getEnvVar(varName));

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Get environment variable (works in both client and server)
 */
function getEnvVar(varName: keyof EnvironmentVariables): string | undefined {
  // Client-side (Vite)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viteEnv = (import.meta as any)?.env;
    if (viteEnv) {
      return viteEnv[varName];
    }
  }

  // Server-side (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[varName];
  }

  return undefined;
}

/**
 * Get environment variable with fallback
 */
function getEnvVarWithFallback(
  varName: keyof EnvironmentVariables,
  fallback: string
): string {
  return getEnvVar(varName) || fallback;
}

/**
 * Get application configuration
 */
function getAppConfig() {
  return {
    supportEmail: getEnvVarWithFallback('VITE_SUPPORT_EMAIL', 'support@example.com'),
    version: getEnvVarWithFallback('VITE_APP_VERSION', '1.0.0'),
    domainName: getEnvVarWithFallback('VITE_DOMAIN_NAME', 'Social Transformer')
  };
}

/**
 * Export a typed interface for all environment access
 */
export const env = {
  // Configuration objects (lazy -- evaluated on access, not at import time)
  get app() { return getAppConfig() },
} as const;
