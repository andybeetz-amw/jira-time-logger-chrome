# Migration Progress

Companion to `MIGRATION-PLAN.md` (the *what and why*). This file is the *where are we*: the plan cut into
steps small enough to be one commit each. Work top to bottom; do not skip ahead.

## Rules for every session

1. Read this file, then the relevant phase in `MIGRATION-PLAN.md`. Take the **first unchecked step**.
2. One step = one commit. Never bundle steps. If a step turns out too big, split it here first (own commit),
   then do the first piece.
3. Before committing: verify the step's **Done when** check. After committing: tick the box and add the
   short hash in the same commit's follow-up (`docs: progress step X.Y`) or amend before pushing — keep
   the tracker accurate.
4. Commit message format: `P<phase>.<step>: <imperative summary>` (e.g. `P0.2: Remove committed .crx and .pem`).
5. Stop after each step and report; the user decides whether to continue. No pushing, force-pushing or
   history rewriting without explicit say-so.
6. If reality contradicts the plan (a file/line reference is stale, a grep finds a caller), note it under
   **Deviations** below and fix the plan doc in a separate `docs:` commit.
7. The extension must stay loadable (as MV2) until P2 flips the manifest — each commit before that
   should leave `src/` working.

## Steps

### P0 — Repo hygiene + security
- [x] P0.1 Commit `MIGRATION-PLAN.md` and this file. *Done when:* both tracked, tree clean.
- [x] P0.2 `git rm` `jira-time-logger-chrome.crx` and `.pem` (no history purge yet). *Done when:* neither in `git ls-files`.
- [x] P0.3 Update `.gitignore` (`dist/`, `node_modules/`, `*.zip`, `*.crx`, `*.pem`, `.web-ext-artifacts/`). *Done when:* entries present.
- [x] P0.4 Delete `src/js/jquery.base64.min.js` after grep proves zero references. *Done when:* grep empty, popup loads.
- [x] P0.5 Add the used Gumby grid/button/form CSS subset to `src/css/app.css` (additive; gumby still present). *Done when:* popup looks identical with gumby.css link removed locally.
- [x] P0.6 Replace the 7 entypo icons with an inline SVG sprite. *Done when:* icons render without the font.
- [x] P0.7 Drop `gumby.css`/Gumby script tags from `index.html` and `config.html`; system font stack. *Done when:* no remote URL or `@import` in `src/`.
- [x] P0.8 Delete `src/gumby/` and `src/js/modernizr.min.js`. *Done when:* popup + config page still work.
- [x] P0.9 Replace the `jqueryColor` `.animate` highlight (`View/Index.js:154-158`) with a CSS transition; delete `jquery.color.min.js` and its dep at `:11`. *Done when:* log-entry highlight still fades.
- [ ] P0.10 *(deferred, owner's call)* **User-run:** purge `.pem`/`.crx` from history with `git filter-repo`, force-push, announce to collaborators. *Done when:* user confirms.

### P1 — Build + packaging
- [x] P1.1 Add `package.json` + `package-lock.json` with no scripts beyond placeholders; `.nvmrc`/engines.
- [x] P1.2 Add esbuild; `npm run build` copies `src/` static files to `dist/` unchanged (still MV2, still loads).
- [x] P1.3 Add icon generation with `sharp` (16/32/48 from the 128px logo); commit generated icons.
- [x] P1.4 Add eslint with a minimal config; `npm run lint` passes.
- [x] P1.5 Add `web-ext` + `npm run dist` producing a ZIP.
- [x] P1.6 Add `.github/workflows/ci.yml` (`npm ci` → lint → build → upload ZIP).

### P2 — MV3 shell + RPC core
*(Split into steps when P1 is done — needs a fresh look at the code then. Outline:)*
- [x] P2.1 *(split — see P2.1a–h)* Convert AMD modules to ESM, bundled by esbuild; page still MV2.
  Constraint: esbuild cannot bundle AMD `define()` files, and each commit must leave `src/` loadable, so the
  bundler goes in first with a bridge for not-yet-converted modules, then modules convert leaf-first.
  - [x] P2.1a Bundle the 3 entry points (`index.js`, `ui-index.js`, `ui-config.js`) with esbuild into `dist/js/`, using a
    small build-time plugin that resolves legacy AMD modules by name from `src/js` (baseUrl) and stubs `jquery`
    to the global `$`; `json!/config/config.json` handled in the plugin. `src/index.html`, `src/config.html`
    and `manifest.json` keep working because `build.mjs` emits the same filenames; RequireJS no longer loaded in `dist/`.
    *Done when:* `npm run dist` ZIP loads unpacked (popup, config page, background all work) with no `require.js` in `dist/`.
  - [x] P2.1b ESM-convert no-dependency leaves: `Logger`, `JiraConstants`, `StopwatchTime`, `AppConstants`, `ConfigConstants`, `ActivityLog`. *Done when:* build + lint pass, popup loads.
  - [x] P2.1c ESM-convert `Stopwatch`, `Container/Abstract`, `Storage/Abstract`, `Container/ChromeExt`, `Storage/ChromeExt`.
  - [x] P2.1d ESM-convert `Container/Factory`, `Storage/Factory` (keep the dynamic `require` for now; P2.2 replaces it) — may need to be combined with P2.2 if the bundler can't resolve them; decide then.
  - [x] P2.1e ESM-convert `Event/Dispatcher/*` and `Event/Listener/Abstract`.
  - [x] P2.1f ESM-convert `Config`, `Reminder`, `Jira` (`json!` → JSON import).
  - [x] P2.1g ESM-convert `View/Config`, `View/Index`, `Event/Listener/Config`, `Event/Listener/Index`, `App`.
  - [x] P2.1h ESM-convert the 3 entry points; remove the AMD bridge plugin from `build.mjs`. *Done when:* no `define(` or `require(` left in `src/js` outside RequireJS itself and its plugins.
- [ ] P2.2 Replace `Container/Factory.js` / `Storage/Factory.js` dynamic requires with static maps.
- [ ] P2.3 Delete RequireJS + plugins; `config.json` via esbuild import.
- [ ] P2.4 Add `sw.js` with synchronous top-level listeners (not yet wired to manifest).
- [ ] P2.5 Typed RPC envelope + always-`sendResponse` handler.
- [ ] P2.6 Replace `getBackgroundPage()` calls in `Container/ChromeExt.js` with RPC.
- [ ] P2.7 Fix `getURL`, `runtime.reload`, `management`, `mailto:`, `sendMessage` `.catch()`.
- [ ] P2.8 Flip `manifest.json` to MV3 (version 4.0.0 deferred to P7).

### P3 — Transport (one cutover; split only into prep commits + one cutover commit)
- [ ] P3.1 Delete dead subtask code in `Jira.js` + matching `JiraConstants`.
- [ ] P3.2 Add promise-based `request()` with fetch/auth/timeout/429 behind tests; not yet used.
- [ ] P3.3 Cutover: all `Jira.js` methods + all callers async; delete `ajaxValues`.
- [ ] P3.4 Replace `alert()`/`confirm()`/`document` use per plan.

### P4 — Durable stopwatch + reminders
- [ ] P4.1 Persist stopwatch state (`startMs`, `deductedMs`) in `chrome.storage.local`.
- [ ] P4.2 `computeElapsed` pure function; popup renders from `now - startMs`.
- [ ] P4.3 `chrome.alarms` tick replaces `setInterval`.
- [ ] P4.4 Reminder logic in alarm handler with persisted `lastReminderMinute`.
- [ ] P4.5 Badge text.
- [ ] P4.6 Persist `loggedTotal`/`dayKey` + midnight auto-reset; persist `activityLogs`.
- [ ] P4.7 Notification lifecycle in SW (onClicked, alarm-based clear).

### P5 — Config, migration, self-hosted hosts
- [ ] P5.1 Config schema: `authMode`, `apiToken`, `email`.
- [ ] P5.2 Auth header per mode in `Jira.js`.
- [ ] P5.3 Options page UI: auth selector, token field, Test connection.
- [ ] P5.4 `permissions.request` for non-atlassian hosts.
- [ ] P5.5 Legacy config migration on `onInstalled` + re-auth call-to-action.
- [ ] P5.6 Debounce + cache `getIssueSummary`.

### P6 — Tests (each item lands with, or immediately after, the phase it covers)
- [ ] P6.1 Vitest setup + chrome/fetch stubs; delete old `tests/` harness.
- [ ] P6.2 Port Stopwatch / Reminder specs.
- [ ] P6.3 Port Jira / Config / App specs.
- [ ] P6.4 Regression tests listed in plan §P6.

### P7 — Publish + docs
- [ ] P7.1 Bump to 4.0.0 in manifest/package; `CHANGELOG.md` entry.
- [ ] P7.2 README rewrite (install, token setup, caveats).
- [ ] P7.3 **User-run:** CWS + Edge Add-ons submission.

## Deviations from the plan
- P2.1a: `src/` is no longer loadable directly (RequireJS tags removed); only the built `dist/` loads. Already the load target since P1.2. `index.js` now sets `appInstance`/`configInstance` on `globalThis` (IIFE bundle) until P2.6 removes `getBackgroundPage()`.
- P0.10 deferred: the repo (`Lilchef/jira-time-logger-chrome`) is not owned by the migrating user, so the history purge
  and force-push are left to the repo owner. The `.pem` private key remains in history until they decide. Does not block P1+.

## Log
*(append: date — step — commit hash — one-line note)*
- 2026-10-14 — P1.1 — 5b5dd55 — package.json (placeholder scripts), lockfile, .nvmrc (Node 20)
- 2026-10-14 — P1.2 — d897e92 — esbuild devDep; scripts/build.mjs copies src/ to dist/ (no bundling yet)
- 2026-10-14 — P1.3 — 761194a — sharp devDep; scripts/make-icons.mjs (npm run icons); icon16/32/48/128.png committed, manifest not yet wired
- 2026-10-14 — P1.4 — 79f9e2d — eslint flat config; vendored libs + tests/ ignored; legacy style rules downgraded to warnings (7 warnings, 0 errors)
- 2026-10-14 — P1.5 — 9c55077 — web-ext devDep; npm run dist builds then zips dist/ to .web-ext-artifacts/ (gitignored); ZIP extracted and loaded unpacked by user, works; npm run dev verified on Edge with --chromium-binary (no Chrome on dev machine)
- 2026-10-14 — P1.6 — 6288738 — .github/workflows/ci.yml; no test step until P6.1; first CI run failed at upload (hidden dir); fixed in ebc1878
- 2026-10-14 — P2.1a — b522a4b — esbuild bundles 3 entries via AMD bridge plugin in build.mjs; require.js/jquery tags dropped from html/manifest; verified loaded by user
- 2026-10-14 — P2.1b — de1e878 — Logger/JiraConstants/StopwatchTime/AppConstants/ConfigConstants/ActivityLog now ESM (IIFE body + export default); bridge passes ESM through; eslint sourceType module; verified popup/config/issue lookup (log-time not exercised); Jira Cloud needs an API token, not a password
- 2026-10-14 — P2.1c — 0c0ae2a — Stopwatch, Container/Abstract+ChromeExt, Storage/Abstract+ChromeExt now ESM with real imports; verified stopwatch ticks, config persists, issue lookup works; known/expected console error "listener indicated an asynchronous response..." (unconditional return true in onMessage, fixed in P2.5)
- 2026-10-14 — P2.1d — b613723 — Container/Factory and Storage/Factory now ESM; dynamic require replaced by static `Factory.TYPES` map (so P2.2 is mostly done; revisit when reaching it); build + lint pass, verified loaded by user
- 2026-10-14 — P2.1e — 41984c4 — Event/Dispatcher/{Abstract,Config,Index} and Event/Listener/Abstract now ESM; build + lint pass, verified loaded by user
- 2026-10-14 — P2.1f — 76eced6 — Config, Reminder, Jira now ESM; config.json imported directly; build + lint pass (new warning: Config's StorageAbstract import is unused, was an unreported unused AMD param); verified loaded by user
- 2026-10-15 — P2.1g — cfe8a9e — View/Config+Index, Event/Listener/Config+Index, App now ESM; Listener/Config's reassigned `view` import became a local var (esbuild forbids assigning imports); build + lint pass (0 errors, 6 warnings); verified loaded by user
- 2026-10-15 — P2.1h — 458819b — index/ui-index/ui-config now ESM; AMD bridge plugin removed from build.mjs, replaced by a jquery alias + wrapper plugin; build + lint pass (0 errors, 6 warnings); verified loaded by user
