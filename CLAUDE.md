# Project guidance

## MV3 migration (branch `mv3_migration`)

The migration is done in very small steps over many sessions. At the start of any migration work:

1. Read `MIGRATION-PROGRESS.md`, then the matching phase in `MIGRATION-PLAN.md`.
2. Do only the first unchecked step — one step, one commit, message `P<phase>.<step>: <summary>`.
3. Verify the step's "Done when", tick it in `MIGRATION-PROGRESS.md`, report, and stop.
4. Never push, force-push or rewrite history unless explicitly told to.

Full rules are at the top of `MIGRATION-PROGRESS.md`.
