import { AIEngine, AIResponse } from '../core/ai_engine';
import type { ElementCandidate } from '../core/dom_scanner';

export interface SelectorSuggestion {
  selector: string;
  reason: string;
}

/**
 * AI agent that proposes a replacement selector when deterministic healing finds no match.
 */
export class SelectorHealingAgent {
  constructor(private readonly engine: AIEngine = new AIEngine()) {}

  async suggest(
    failedSelector: string,
    elements: ElementCandidate[],
    domExcerpt: string,
  ): Promise<SelectorSuggestion | null> {
    const response = await this.engine.generate(buildPrompt(failedSelector, elements, domExcerpt));
    return parseSuggestion(response);
  }
}

export function buildPrompt(failedSelector: string, elements: ElementCandidate[], domExcerpt: string): string {
  return `You are a Playwright self-healing engine.

The following selector failed to match any element:
${failedSelector}

Interactive elements currently present on the page (JSON):
${JSON.stringify(elements, null, 2)}

DOM excerpt:
${domExcerpt}

Choose the element that most likely replaced the one the failed selector targeted and
return a single valid CSS selector for it. Prefer id, then data-test-id, then data-test,
then name attributes. Do not use markdown. Do not explain outside the JSON.

Return ONLY valid JSON in this exact format:
{
  "suggested_selector": "<single-line CSS selector>",
  "reason": "<short explanation>"
}`;
}

export function parseSuggestion(response: AIResponse): SelectorSuggestion | null {
  const rawSelector = response.suggested_selector;
  if (typeof rawSelector !== 'string') return null;
  const selector = sanitizeSelector(rawSelector);
  if (!selector || selector === 'N/A') return null;
  const reason = typeof response.reason === 'string' ? response.reason : '';
  return { selector, reason };
}

/** Strips markdown fences/backticks and keeps the first non-empty line. */
export function sanitizeSelector(raw: string): string {
  const firstLine = raw
    .replace(/```[a-z]*/gi, '')
    .replace(/`/g, '')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return firstLine ?? '';
}
