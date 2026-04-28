
# Agent Docs — How Agents Should Use These Files

This directory contains concise guidance and reference material for AI coding
agents and human reviewers. The content is intentionally short and link-first —
refer back to code and the root README for implementation details.

Start here
- Read the repository-level [AGENTS.md](../../AGENTS.md) for high-level conventions and dev commands.
- Review `.github/agent-docs/rules.md` for operational rules and constraints.
- Read `.github/agent-docs/architecture.md` for domain boundaries, data model suggestions, and offline strategy.

Recommended agent workflow
1. Discover relevant files: search under `client/src/features` for the feature area.
2. Propose a minimal change with a short plan (1–3 bullets) and ask for approval for larger modifications.
3. When adding data fields or tables, update `backend/supabase/seed.sql` and provide a migration or seed change summary.
4. Run local dev server and tests as needed: from repo root run

```bash
npm install
npm run dev
```

When to ask for human review
- Any change that touches Supabase service keys, production migrations, or destructive DB operations.
- Changes that modify verification, reputation, or anti-abuse heuristics.

Notes for maintainers
- Keep these docs minimal and update links to new docs rather than copying content.

