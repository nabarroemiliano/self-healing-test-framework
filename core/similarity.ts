/**
 * Ratcliff/Obershelp similarity, equivalent to Python's difflib.SequenceMatcher.ratio()
 * for short strings (no junk heuristics). Returns 2 * matches / (len(a) + len(b)).
 */
export function similarityRatio(a: string, b: string): number {
  const total = a.length + b.length;
  if (total === 0) return 1;
  return (2 * countMatches(a, 0, a.length, b, 0, b.length)) / total;
}

interface Match {
  aStart: number;
  bStart: number;
  size: number;
}

function countMatches(a: string, aLo: number, aHi: number, b: string, bLo: number, bHi: number): number {
  const match = findLongestMatch(a, aLo, aHi, b, bLo, bHi);
  if (match.size === 0) return 0;
  return (
    match.size +
    countMatches(a, aLo, match.aStart, b, bLo, match.bStart) +
    countMatches(a, match.aStart + match.size, aHi, b, match.bStart + match.size, bHi)
  );
}

/** Longest common substring within the given ranges; ties resolve to the earliest a, then earliest b. */
function findLongestMatch(a: string, aLo: number, aHi: number, b: string, bLo: number, bHi: number): Match {
  let best: Match = { aStart: aLo, bStart: bLo, size: 0 };
  let previous = new Map<number, number>();

  for (let i = aLo; i < aHi; i++) {
    const current = new Map<number, number>();
    for (let j = bLo; j < bHi; j++) {
      if (a[i] !== b[j]) continue;
      const size = (previous.get(j - 1) ?? 0) + 1;
      current.set(j, size);
      if (size > best.size) {
        best = { aStart: i - size + 1, bStart: j - size + 1, size };
      }
    }
    previous = current;
  }
  return best;
}
