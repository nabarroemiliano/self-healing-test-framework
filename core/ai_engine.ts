import { config } from '../config/config';

export interface OllamaOptions {
  url: string;
  model: string;
  timeoutMs: number;
}

export type AIResponse = Record<string, unknown>;

/**
 * Handles communication with the local Ollama model.
 * Forces a JSON response and never throws: transport or parsing failures are
 * returned as a structured error object.
 */
export class AIEngine {
  constructor(private readonly options: OllamaOptions = config.ollama) {}

  async generate(prompt: string): Promise<AIResponse> {
    try {
      const response = await fetch(this.options.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: this.options.model, prompt, stream: false, format: 'json' }),
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
      if (!response.ok) {
        return failure(`Ollama responded with HTTP ${response.status}`);
      }
      const body = (await response.json()) as { response?: string };
      return parseModelOutput(body.response ?? '');
    } catch (error) {
      return failure(error instanceof Error ? error.message : String(error));
    }
  }
}

function parseModelOutput(raw: string): AIResponse {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as AIResponse;
    return failure(`Model returned non-object JSON: ${raw.trim()}`);
  } catch {
    return failure(raw.trim() || 'Model returned an empty response');
  }
}

function failure(reason: string): AIResponse {
  return { detected_error: 'AI Engine Failure', suggested_selector: 'N/A', reason };
}
