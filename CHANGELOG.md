# Changelog

## SHF-001 - Initial self-healing framework (2026-09-15)

Created the framework from scratch, mirroring the directory layout and healing approach of the
Python reference project `../ai-playwright-framework`.

### Added

- **Configuration** (`config/config.ts`): env-overridable settings for base URL, Ollama, and
  healing switches (`SELF_HEALING`, `HEALING_PERSIST`).
- **Similarity** (`core/similarity.ts`): Ratcliff/Obershelp ratio equivalent to Python's
  `SequenceMatcher.ratio()`, so the 0.75 threshold behaves like the reference.
- **DOM scanner** (`core/dom_scanner.ts`): extracts clickable/fillable candidates with
  `id`, `name`, `data-test`, `data-test-id` and text. Links and `role=button` are included because
  demoblaze uses `<a>` for navigation actions.
- **Selector healer** (`core/selector_healer.ts`): fuzzy match first, Ollama fallback second,
  AI suggestions validated against the live page. Never throws.
- **AI engine and agent** (`core/ai_engine.ts`, `ai_agents/selector_healing_agent.ts`): JSON-forced
  Ollama client with structured failure objects; prompt building and response sanitising.
- **Selector rewriter** (`core/selector_rewriter.ts`): rewrites the healed selector literal in the
  page object source file only when it occurs exactly once.
- **BaseActions** (`pages/base_actions.ts`): `click`/`fill` with healing, retry, Allure attachments
  (`Healing Match Info`, `Selector Persisted`) and source persistence. One shared code path instead of
  the duplicated blocks in the reference.
- **Page objects**: `home_page.ts`, `login_modal.ts`, `product_page.ts`, `cart_page.ts`.
- **Fixtures** (`fixtures.ts`): page objects, automatic dialog acceptance with message capture, and a
  throwaway demoblaze user registered via the real signup API.
- **Tests**
  - e2e: login with valid credentials, add product to cart, filter by Laptops (3 tests)
- **CI** (`.github/workflows/tests.yml`): type check + e2e with `SELF_HEALING=false`,
  Allure report uploaded as artifact.
- **Docs**: `README.md`.

### Removed

- Unit, integration and Ollama round-trip test tiers, at the user's request. The repository keeps the
  e2e tests and the healing mechanism, which is exercised through the healing demo under "Verified".

### Verified

- Breaking `'#loginusername'` to `'#loginuser'` in `pages/login_modal.ts` and running the login e2e
  test heals the selector at runtime, passes, and restores the literal in the file.
- The same broken selector with `SELF_HEALING=false` fails with the original Playwright error.

### Fixed

- CI `npm ci` failed with `ETIMEDOUT` because `package-lock.json` was generated against Miro's
  internal Artifactory registry, which GitHub runners cannot reach. Added `.npmrc` pinning
  `registry.npmjs.org` so the corporate global `~/.npmrc` no longer leaks into this repo, and
  regenerated the lockfile. All 33 `resolved` URLs now point at public npm; every `integrity` hash
  is unchanged, confirming identical tarballs.

### Known limitations

- String fuzzy matching cannot heal an element whose identifying attribute was removed entirely;
  only the Ollama fallback can, and it is not available in CI.
- Rewrites happen only when the selector literal occurs exactly once in the file.
- Login tests depend on the public demoblaze signup API.
