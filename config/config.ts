/**
 * Framework configuration. Every value can be overridden with an environment variable.
 */
function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return raw.toLowerCase() !== 'false';
}

export const config = {
  baseUrl: process.env.BASE_URL ?? 'https://www.demoblaze.com',
  apiUrl: process.env.API_URL ?? 'https://api.demoblaze.com',
  actionTimeoutMs: 5000,
  ollama: {
    url: process.env.OLLAMA_URL ?? 'http://localhost:11434/api/generate',
    model: process.env.OLLAMA_MODEL ?? 'mistral',
    timeoutMs: 60000,
  },
  healing: {
    /** CI sets SELF_HEALING=false to run plain Playwright. */
    enabled: envFlag('SELF_HEALING', true),
    /** Rewrite the healed selector into the page object source file. */
    persist: envFlag('HEALING_PERSIST', true),
    /** Minimum ratio for a deterministic (fuzzy) heal. */
    similarityThreshold: 0.75,
  },
};

export type Config = typeof config;
