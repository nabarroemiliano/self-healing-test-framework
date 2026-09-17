import type { Page } from '@playwright/test';
import { SelectorHealingAgent } from '../ai_agents/selector_healing_agent';
import { config } from '../config/config';
import { ActionKind, AttributeCandidate, DomScanner, toAttributeCandidates } from './dom_scanner';
import { similarityRatio } from './similarity';

export interface HealResult {
  healedSelector: string;
  strategy: 'fuzzy' | 'ai';
  score?: number;
  candidate?: AttributeCandidate;
  reason?: string;
}

export interface SelectorHealerOptions {
  similarityThreshold?: number;
  agent?: SelectorHealingAgent;
}

/**
 * Finds a replacement for a selector that no longer matches:
 * deterministic fuzzy matching first, AI suggestion as fallback.
 * Never throws; returns null when no confident replacement exists.
 */
export class SelectorHealer {
  private readonly threshold: number;
  private readonly agent: SelectorHealingAgent;

  constructor(options: SelectorHealerOptions = {}) {
    this.threshold = options.similarityThreshold ?? config.healing.similarityThreshold;
    this.agent = options.agent ?? new SelectorHealingAgent();
  }

  async heal(page: Page, failedSelector: string, kind: ActionKind): Promise<HealResult | null> {
    try {
      const scanner = new DomScanner(page);
      const elements = await scanner.extractCandidates(kind);
      const candidates = toAttributeCandidates(elements);
      if (candidates.length === 0) return null;

      const fuzzy = bestFuzzyMatch(failedSelector, candidates);
      if (fuzzy && fuzzy.score >= this.threshold) {
        return { healedSelector: fuzzy.candidate.selector, strategy: 'fuzzy', score: fuzzy.score, candidate: fuzzy.candidate };
      }

      const suggestion = await this.agent.suggest(failedSelector, elements, await scanner.getScopedDom());
      if (!suggestion) return null;
      if ((await page.locator(suggestion.selector).count()) === 0) return null;
      return { healedSelector: suggestion.selector, strategy: 'ai', reason: suggestion.reason };
    } catch {
      return null;
    }
  }
}

function bestFuzzyMatch(
  failedSelector: string,
  candidates: AttributeCandidate[],
): { candidate: AttributeCandidate; score: number } | null {
  const raw = rawSelectorValue(failedSelector);
  let best: { candidate: AttributeCandidate; score: number } | null = null;
  for (const candidate of candidates) {
    const score = similarityRatio(raw, candidate.value);
    if (!best || score > best.score) best = { candidate, score };
  }
  return best;
}

/**
 * Reduces a selector to the value it identifies an element by, so it can be compared
 * against attribute values: `#login-button` -> `login-button`, `[name='user']` -> `user`.
 * For compound selectors the last simple segment is used.
 */
export function rawSelectorValue(selector: string): string {
  const segments = selector.trim().split(/\s*[>+~]\s*|\s+/).filter(Boolean);
  const last = segments[segments.length - 1] ?? selector;
  const attribute = last.match(/\[[\w-]+\s*[*^$|~]?=\s*['"]?([^'"\]]+)['"]?\]/);
  if (attribute) return attribute[1];
  const idOrClass = last.match(/^[#.]([\w-]+)/);
  if (idOrClass) return idOrClass[1];
  return last;
}
