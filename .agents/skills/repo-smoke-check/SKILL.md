---
name: repo-smoke-check
description: 'Run a quick repository smoke check for FuelWatchPH. Use when validating local setup, pre-PR sanity checks, broken dev environment reports, command drift, or when frontend/backend behavior seems out of sync.'
argument-hint: 'Optional scope: full | frontend-only | backend-only | docs-sync'
---

# Repo Smoke Check (FuelWatchPH)

## What This Skill Produces
A fast pass/fail summary for core repo health with actionable fixes for:
- frontend run/build/lint viability
- backend run/test viability
- workspace script correctness
- docs vs real command consistency

## When to Use
Use this for:
- "quick sanity check" before opening a PR
- "my setup is broken" triage
- validating onboarding docs after command/script changes
- verifying no obvious regressions after refactors

## Inputs
Optional scope argument:
- `full` (default): run all checks below
- `frontend-only`: skip backend checks
- `backend-only`: skip frontend checks
- `docs-sync`: only verify docs command accuracy and env var references

## Procedure
1. Confirm workspace and scope.
2. Read command truth from `package.json`, `client/package.json`, `backend/README.md`, and `SETUP.md`.
3. Run root/frontend checks:
- `npm run dev --workspace=@fuelwatchph/client -- --host 127.0.0.1 --port 5173` (startup check only; stop after successful boot)
- `npm run build`
- `npm run lint --workspace=@fuelwatchph/client`
4. Run backend checks:
- `pip install -r backend/requirements.txt` (if dependencies are missing)
- `pytest backend/tests`
- `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend` (startup check only; stop after successful boot)
5. Run docs-sync checks:
- Verify README/SETUP/AGENTS commands match current scripts and actual behavior.
- Verify env variable docs include both `VITE_API_URL` and `VITE_BACKEND_API_URL` if the client reads `VITE_API_URL`.
6. Report results by category (`frontend`, `backend`, `docs-sync`) with:
- pass/fail
- exact failing command
- root cause hypothesis
- minimal fix

## Decision Rules
- If root `npm run lint` fails because no root lint script exists, run `npm run lint --workspace=@fuelwatchph/client` and report the script mismatch.
- If backend tests fail on API contract assumptions, classify as `contract drift` instead of forcing production code to match stale tests.
- If uvicorn starts but API requests fail, treat startup as pass and continue with endpoint-specific diagnostics.
- If scope is `docs-sync`, do not run build/test commands unless command text is ambiguous.

## Completion Criteria
A smoke check is complete only when:
- requested scope checks have all been executed or explicitly skipped with reason
- each failure includes a proposed minimal fix
- docs-sync mismatches (if any) are listed with exact file targets
- no destructive commands were used

## Output Format
- Scope used
- Summary table: check, status, evidence, fix
- Follow-up actions (numbered, minimal)

## FuelWatchPH-Specific Pitfalls
- Root workspace has `dev`, `build`, `preview`; lint is client-workspace scoped.
- `archive/` is reference-only, not active runtime code.
- Backend and frontend docs can drift from script reality; verify commands before trusting prose.
