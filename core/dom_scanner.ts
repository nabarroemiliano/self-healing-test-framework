import type { Page } from '@playwright/test';

export type ActionKind = 'clickable' | 'fillable';

export interface ElementCandidate {
  tag: string;
  id: string;
  name: string;
  dataTest: string;
  dataTestId: string;
  text: string;
}

export interface AttributeCandidate {
  attr: 'id' | 'name' | 'data-test' | 'data-test-id';
  value: string;
  selector: string;
}

const CANDIDATE_SELECTORS: Record<ActionKind, string> = {
  clickable: 'button, input[type=submit], input[type=button], a[href], [role=button]',
  fillable: 'input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select',
};

const DOM_EXCERPT_LIMIT = 3000;

/**
 * Extracts the interactive elements of the current page that are candidates for healing.
 */
export class DomScanner {
  constructor(private readonly page: Page) {}

  async extractCandidates(kind: ActionKind): Promise<ElementCandidate[]> {
    return this.page.$$eval(CANDIDATE_SELECTORS[kind], (elements) =>
      elements.map((element) => ({
        tag: element.tagName.toLowerCase(),
        id: element.id,
        name: element.getAttribute('name') ?? '',
        dataTest: element.getAttribute('data-test') ?? '',
        dataTestId: element.getAttribute('data-test-id') ?? '',
        text: (element.textContent ?? '').trim().slice(0, 80),
      })),
    );
  }

  /** Inner HTML of the parent (or the whole page), truncated for use in prompts. */
  async getScopedDom(parentSelector?: string): Promise<string> {
    const html = parentSelector
      ? await this.page.locator(parentSelector).first().innerHTML()
      : await this.page.content();
    return html.slice(0, DOM_EXCERPT_LIMIT);
  }
}

/** Turns element candidates into one attribute candidate per identifying attribute. */
export function toAttributeCandidates(elements: ElementCandidate[]): AttributeCandidate[] {
  const candidates: AttributeCandidate[] = [];
  for (const element of elements) {
    if (element.id) candidates.push({ attr: 'id', value: element.id, selector: `#${element.id}` });
    if (element.name) candidates.push({ attr: 'name', value: element.name, selector: `[name='${element.name}']` });
    if (element.dataTest) {
      candidates.push({ attr: 'data-test', value: element.dataTest, selector: `[data-test='${element.dataTest}']` });
    }
    if (element.dataTestId) {
      candidates.push({
        attr: 'data-test-id',
        value: element.dataTestId,
        selector: `[data-test-id='${element.dataTestId}']`,
      });
    }
  }
  return candidates;
}
