---
name: project-cleanup
description: Triage and organize the loose status/report/plan Markdown files and stray artifacts scattered in the UniDormManager repo root into a clean docs/ structure.
disable-model-invocation: true
---

# project-cleanup

The repo root has accumulated 40+ loose `.md` files (TEST_REPORT, OPTIMIZATION_PLAN, UPDATE_SUMMARY, DEVELOPMENT_PLAN, etc.) plus stray artifacts (`.bak`, `.patch`, `.png`, `fix-tabbar.bat`). This skill triages them into a clean structure — it does not delete anything without confirmation.

## Steps

1. List root-level `.md` files and loose artifacts (`*.bak`, `*.patch`, `*.png`, one-off scripts). Use `git log -1 --format=%cr -- <file>` to see how stale each is.
2. Classify each file:
   - **Keep at root**: `README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `Makefile`, compose/env files.
   - **Move to `docs/`**: durable guides (DATABASE_INIT, DOCKER, MIGRATION_GUIDE, DESIGN_SYSTEM_v3, ROLE_BASED_DESIGN, API_*).
   - **Move to `docs/archive/`**: point-in-time reports & plans (TEST_REPORT*, *_PLAN*, *_SUMMARY, UPDATE_*, BUG_FIX_REPORT, *_STATUS).
   - **Propose deletion** (ask first): obvious throwaways (`.bak`, applied `.patch`, screenshots in root, `.bat` on a Linux project).
3. Present the classification as a table for the user to approve/adjust **before** moving anything.
4. On approval, use `git mv` to preserve history; create `docs/` / `docs/archive/` if missing.
5. Update any references (links in README/CLAUDE.md) to moved files.
6. Summarize: N kept, N moved, N proposed for deletion (await separate confirmation for deletes).

## Rules

- Never delete without explicit per-file confirmation.
- Prefer `git mv` over plain `mv`.
- Do not touch files inside the four sub-project directories — root level only.
