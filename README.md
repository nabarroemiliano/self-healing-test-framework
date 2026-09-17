# Self-Healing Playwright Framework

AI-powered self-healing test automation framework built with **TypeScript + Playwright**,
targeting https://www.demoblaze.com. It reduces failures caused by selector changes by
detecting and healing broken selectors at runtime, then writing the healed selector back
into the page object so the next run does not need healing.

## Setup

```bash
npm ci
npx playwright install chrome          
brew install allure           

# Local LLM used as healing fallback
curl -fsSL https://ollama.com/install.sh | sh   # or download from https://ollama.com
ollama pull mistral
```

## Running tests

```bash
npm test                 
npm run test:e2e         # Runs the 3 e2e tests
npm run report           # generate and open the Allure report
```

Add `--headed` to any Playwright command to watch the browser.

## How self-healing works

When `click()` or `fill()` in `pages/base_actions.ts` fails:

1. The exception is caught.
2. `core/dom_scanner.ts` scans the DOM for candidates of the same kind:
   - clickable: `button`, `input[type=submit]`, `input[type=button]`, `a[href]`, `[role=button]`
   - fillable: `input`, `textarea`, `select`
3. It extracts `id`, `name`, `data-test` and `data-test-id` from each candidate.
4. `core/selector_healer.ts` fuzzy-matches the failed selector against those values using a
   Ratcliff/Obershelp ratio.
5. If the best match scores at least `0.75`, the action is retried with the healed selector.
6. Otherwise `ai_agents/selector_healing_agent.ts` sends the failed selector, the candidates and a
   DOM excerpt to Mistral through `core/ai_engine.ts` and validates that the suggested selector
   resolves on the page before retrying.
7. On success, `core/selector_rewriter.ts` replaces the selector literal in the page object source
   file that declared it, and both the match and the rewrite outcome are attached to the Allure report.
8. If nothing heals, the original error is rethrown.


Only selector healing is supported. Other healing factors (network, timing) are out of scope for now.

### Try it locally

1. Open `pages/login_modal.ts` and change `'#loginusername'` to `'#loginuser'`.
2. Run `npm run test:e2e -- -g "log in"`.
3. The test passes, the Allure report shows the `Healing Match Info` attachment, and the file
   is back to `'#loginusername'`.

## Configuration

Every value in `config/config.ts` can be overridden with an environment variable.

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://www.demoblaze.com` | Application under test |
| `API_URL` | `https://api.demoblaze.com` | Used only to register a throwaway user per login test |
| `OLLAMA_URL` | `http://localhost:11434/api/generate` | Ollama endpoint |
| `OLLAMA_MODEL` | `mistral` | Ollama model |
| `SELF_HEALING` | `true` | Master switch for healing. CI sets `false` |
| `HEALING_PERSIST` | `true` | Write healed selectors back to page object files |

## CI

`.github/workflows/tests.yml` runs type checking and the e2e tests on every push
and pull request with `SELF_HEALING=false`, then uploads the Allure report and raw results as
artifacts. Healing, including the Ollama fallback, is a local-only workflow.

## Project layout

```
ai_agents/   selector_healing_agent.ts
config/      config.ts
core/        ai_engine.ts, dom_scanner.ts, similarity.ts, selector_healer.ts, selector_rewriter.ts
pages/       base_actions.ts, home_page.ts, login_modal.ts, product_page.ts, cart_page.ts
tests/       e2e/
fixtures.ts  Playwright fixtures: page objects, dialog capture, throwaway demoblaze user
```
