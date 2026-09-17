import type { Page } from '@playwright/test';
import { attachment, step } from 'allure-js-commons';
import { config } from '../config/config';
import type { ActionKind } from '../core/dom_scanner';
import { HealResult, SelectorHealer } from '../core/selector_healer';
import { rewriteSelector } from '../core/selector_rewriter';

export interface BaseActionsOptions {
  healer?: SelectorHealer;
  healingEnabled?: boolean;
  persistHealedSelectors?: boolean;
  actionTimeoutMs?: number;
}

/**
 * Page interactions with self-healing selectors.
 * When an action fails, the selector is healed, the action retried and the healed
 * selector written back into the page object source file that declared it.
 */
export class BaseActions {
  private readonly healer: SelectorHealer;
  private readonly healingEnabled: boolean;
  private readonly persistHealedSelectors: boolean;
  private readonly actionTimeoutMs: number;

  constructor(
    private readonly page: Page,
    private readonly sourceFile: string,
    options: BaseActionsOptions = {},
  ) {
    this.healer = options.healer ?? new SelectorHealer();
    this.healingEnabled = options.healingEnabled ?? config.healing.enabled;
    this.persistHealedSelectors = options.persistHealedSelectors ?? config.healing.persist;
    this.actionTimeoutMs = options.actionTimeoutMs ?? config.actionTimeoutMs;
  }

  async click(selector: string): Promise<void> {
    await step(`Click on the locator: ${selector}`, () =>
      this.withHealing(selector, 'clickable', (target) => this.page.click(target, { timeout: this.actionTimeoutMs })),
    );
  }

  async fill(selector: string, text: string): Promise<void> {
    await step(`Enter text into locator: ${selector}`, () =>
      this.withHealing(selector, 'fillable', (target) =>
        this.page.fill(target, text, { timeout: this.actionTimeoutMs }),
      ),
    );
  }

  private async withHealing(
    selector: string,
    kind: ActionKind,
    action: (target: string) => Promise<void>,
  ): Promise<void> {
    try {
      await action(selector);
      return;
    } catch (originalError) {
      if (!this.healingEnabled) throw originalError;

      const healed = await this.healer.heal(this.page, selector, kind);
      if (!healed) throw originalError;

      await action(healed.healedSelector);
      await this.report(selector, healed);
    }
  }

  private async report(failedSelector: string, healed: HealResult): Promise<void> {
    await attachment(
      'Healing Match Info',
      JSON.stringify({ failedSelector, ...healed }, null, 2),
      'application/json',
    );
    if (!this.persistHealedSelectors) return;

    const result = rewriteSelector(this.sourceFile, failedSelector, healed.healedSelector);
    await attachment(
      'Selector Persisted',
      JSON.stringify({ sourceFile: this.sourceFile, failedSelector, healedSelector: healed.healedSelector, ...result }, null, 2),
      'application/json',
    );
  }
}
