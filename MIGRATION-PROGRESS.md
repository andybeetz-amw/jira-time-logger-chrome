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
- [x] P2.2 Replace `Container/Factory.js` / `Storage/Factory.js` dynamic requires with static maps.
- [x] P2.3 Delete RequireJS + plugins; `config.json` via esbuild import.
- [x] P2.4 Add `sw.js` with synchronous top-level listeners (not yet wired to manifest).
- [x] P2.5 Typed RPC envelope + always-`sendResponse` handler.
- [x] P2.6 *(split — see P2.6a–e)* Replace `getBackgroundPage()` calls in `Container/ChromeExt.js` with RPC.
  Constraint: the popup calls ~20 `App` methods synchronously (`View/Index`, `Event/Listener/Index`), so each
  group converts to async RPC separately; the page must keep working (still MV2) after every commit.
  - [x] P2.6a Add `rpcCall(source, type, data)` client to `Rpc.js` (promise; resolves `result`, rejects on `{ok:false}` or a missing receiver) and register an RPC listener in `index.js` (background) with an empty handler map. *Done when:* build + lint pass, node test of the client against the listener, popup still works.
  - [x] P2.6b Add read-only handlers (`getVersion`, `getLoggedTotalAsString`, `getDayGrandTotalAsString`, `getTimeAutoAsString`, `getActivityLogs`, `getIssueSummary`) and convert the matching `View/Index` calls to async RPC.
  - [x] P2.6c *(split — see P2.6c1–3)* Convert `Event/Listener/Index` + remaining `View/Index` App calls to RPC.
    - [x] P2.6c1 Fire-and-forget mutators that need no return value: `setTimeManual` (time click, time-logged event), `resetLoggedTotal`, `reconfigure`, `bugRequest`. Add handlers, call via `rpcCall`.
    - [x] P2.6c2 `getTimeManual`-dependent logic: add `getTimeManual` handler; make `View.validateTimeForm`, `View.getTimeFormValues` (also uses `getTimeAutoAsString`) and the clear-button handler (`resetTime`, `setTimeManual`) async.
    - [x] P2.6c3 Form submit chain: `alertUser`, `logTime` (returns success), then `deductTime`/`resetTime`, as one async sequence.
  - [x] P2.6d `Reminder.show` uses its own app reference instead of `getAppInstance()` (runs in the background/SW); `closeConfiguration` stays page-side.
  - [x] P2.6e Delete `getAppInstance`/`getConfigInstance` (Abstract + ChromeExt) and the `globalThis.appInstance`/`configInstance` exports in `index.js`. *Done when:* no `getBackgroundPage` in `src/`.
- [x] P2.7 *(split — see P2.7a–b)* Fix `getURL`, `runtime.reload`, `management`, `mailto:`, `sendMessage` `.catch()`.
  - [x] P2.7a `chrome.extension.getURL` → `runtime.getURL` (also wrap `config.html` and the notification icon); `mailto:` opened page-side (popup) instead of `tabs.create`; `.catch()` on the `dispatchEvent` `sendMessage`; confirm no `chrome.management` use (`fatal()` is already a no-op).
  - [x] P2.7b Drop `chrome.runtime.reload()`: `configurationChanged` sends a `configChanged` RPC; the background re-reads config and `App.start()` re-tests the connection (idempotent for the stopwatch listener).
- [ ] P2.8 Flip `manifest.json` to MV3 (version 4.0.0 deferred to P7).

### P3 — Transport (one cutover; split only into prep commits + one cutover commit)
- [ ] P3.1 Delete dead subtask code in `Jira.js` + matching `JiraConstants`.
- [ ] P3.2 Add promise-based `request()` with fetch/auth/timeout/429 behind tests; not yet used. Use `credentials: 'omit'` so a browser Jira session cookie cannot mask wrong credentials (see P2.7b log).
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
- 2026-10-15 — P2.2 — b0a583e — no code change needed beyond removing stale comments: static Factory.TYPES maps landed in P2.1d; grep finds no dynamic require( in src/js outside RequireJS; build + lint pass
- 2026-10-15 — P2.3 — 3a6d88f — removed require.js, require-setup.js, require-plugin/; eslint AMD globals/ignores dropped; config.json import was already done in P2.1f; tests/ harness still references RequireJS (deleted in P6.1); build + lint pass; verified loaded by user
- 2026-10-15 — P2.4 — c268cb1 — src/js/background/sw.js with 6 top-level placeholder listeners, added as 4th esbuild entry (dist/js/background/sw.js, IIFE); not in manifest; build + lint pass; ran bundle under a stubbed chrome in node: all 6 listeners register synchronously; extension behaviour unchanged
- 2026-10-15 — P2.5 — 0573e82 — src/js/Rpc.js (envelope {id,source,type,data}, response {ok,result|error}, createMessageListener that always responds); sw.js uses it with empty handlers; ChromeExt.setupMessageListener fixed (sendResponse, no return true, Event(request.type)) — should remove the 'asynchronous response' console error noted in P2.1c; dispatcher still sends the old {type,data} shape, migrated with P2.6; node-tested Rpc (sync/async/throw/reject/unknown/non-envelope); build + lint pass; verified loaded by user (console error from P2.1c gone; remaining console noise is Request failure on lookups, sendMessage "Receiving end does not exist" (P2.7) and MV2 deprecation (P2.8))
- 2026-10-15 — P2.6 split — 33a52f2 — P2.6 was too big for one commit (popup makes ~20 sync App calls); split into P2.6a–e in the tracker
- 2026-10-15 — P2.6a — ef96844 — Rpc.rpcCall (callback-form sendMessage → Promise) + index.js registers createMessageListener({}); node-tested resolve/handler error/unknown type/no receiver; build + lint pass; no caller yet so behaviour unchanged; verified loaded by user
- 2026-10-15 — P2.6b — fa9174f — 6 read-only handlers in index.js (ActivityLogs serialised to plain objects), View/Index updateLoggedTotal/updateDayGrandTotal/updateTimeAuto/_setVersion/_populateActivityLog/_checkIssueKey now async via rpcCall (stale-lookup guard on issue check); fixed ChromeExt.setupMessageListener to ignore messages without listeners (it would otherwise throw/answer first for envelopes). Left for P2.6c: getTimeAutoAsString in getFormValues (View/Index) with getTimeManual. build + lint pass; verified loaded by user (version top-right, activity log restored on reopen, lookups work, no new errors)
- 2026-10-15 — P2.6c split — 12edc43 — P2.6c split into c1–c3 (fire-and-forget mutators / getTimeManual-dependent logic / submit chain)
- 2026-10-15 — P2.6c1 — daa3559 — handlers setTimeManual/resetLoggedTotal/reconfigure/bugRequest; Listener/Index sends via new `send()` helper (logs failures); build + lint pass; verified loaded by user
- 2026-10-15 — P2.6c2 — a4d2666 — getTimeManual handler; View.validateTimeForm/getTimeFormValues return Promises; Listener form-submit chains on them (logTime/getTimeManual/deductTime/resetTime still direct app calls until c3); clear button uses RPC getTimeManual (its resetTime(true) still direct until c3); build + lint pass; verified loaded by user (all six popup scenarios)
- 2026-10-15 — P2.6c3 — 715bdf8 — handlers alertUser/logTime/deductTime/resetTime; Listener/Index submit chain + clear button fully over RPC (no app reference left in Listener/Index); manual flag read BEFORE logTime (time-logged event resets it, would race); alert()/confirm() still run in the background page (P3.4); build + lint pass; verified loaded by user (submit, manual deduct, validation, both Reset paths)
- 2026-10-15 — P2.6d — 679cf51 — Reminder.show now takes the JIRA time string (App converts it) instead of calling getAppInstance(); only View/Index and Listener/Index getApp() definitions (now unused) still call getAppInstance — removed in P2.6e; closeConfiguration stays page-side; build + lint pass; verified loaded by user (reminder notification shown)
- 2026-10-15 — P2.6e — 85ba9c4 — removed getAppInstance/getConfigInstance, unused getApp() helpers + containerFactory imports, globalThis exports; grep finds no getBackgroundPage/appInstance/configInstance in src/ (only jquery.min); P2.6 complete; build + lint pass; verified loaded by user
- 2026-10-15 — P2.7 split — 4e0a200 — P2.7 split into a/b: runtime.reload is how the background picks up new config, so removing it needs in-place re-init (P2.7b)
- 2026-10-15 — P2.7a — 626dcc6 — chrome.extension.getURL → runtime.getURL (config.html, notification icon); App.bugRequest → getBugReportUrl, popup opens mailto via window.open (tabs.create rejects mailto:); dispatchEvent sendMessage promise .catch()ed; no chrome.management use exists; build + lint pass; verified loaded by user
- 2026-10-15 — P2.7b — 3a1696c, 38f43e2 (0e0683f reverted in c94039e) — runtime.reload replaced by `configChanged` RPC → background `config.init('index-reload')` → `app.start()`; start() re-tests the connection every call (alert + config tab on failure) but only registers the stopwatch listener once; stopwatch/logged total now survive a config save (reload used to reset them); build + lint pass; verified by user (unreachable URL alerts, restoring the real URL works). Finding: a bad password is NOT detected on this Jira Cloud site because the browser's `tenant.session.token` cookie authenticates the request ahead of the Basic header; P3.2 `request()` should use `fetch` with `credentials: 'omit'`. P2.7 complete
