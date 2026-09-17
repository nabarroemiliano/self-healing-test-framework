import { readFileSync, writeFileSync } from 'node:fs';

export interface RewriteResult {
  status: 'rewritten' | 'not_found' | 'ambiguous';
  occurrences: number;
}

const QUOTES = ["'", '"', '`'];

/**
 * Replaces the quoted selector literal in a source file with the healed selector.
 * Rewrites only when the literal occurs exactly once, so an unexpected duplicate
 * never gets silently changed.
 */
export function rewriteSelector(sourceFile: string, oldSelector: string, newSelector: string): RewriteResult {
  const source = readFileSync(sourceFile, 'utf8');
  const pattern = new RegExp(QUOTES.map((quote) => `${quote}${escapeRegExp(oldSelector)}${quote}`).join('|'), 'g');
  const occurrences = source.match(pattern)?.length ?? 0;

  if (occurrences === 0) return { status: 'not_found', occurrences };
  if (occurrences > 1) return { status: 'ambiguous', occurrences };

  const rewritten = source.replace(pattern, (literal) => `${literal[0]}${newSelector}${literal[0]}`);
  writeFileSync(sourceFile, rewritten);
  return { status: 'rewritten', occurrences };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
