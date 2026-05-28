---
name: create-migration
description: Scaffold a new PostgreSQL migration SQL file for the UniDormManager backend following the project's existing migration conventions.
disable-model-invocation: true
---

# create-migration

Create a new SQL migration for the UniDormManager backend.

## Context

- Schema migrations live in `UniDormManagerServer/migrations/` (e.g. `init.sql`, `auth_tables.sql`, `new_features.sql`) and are auto-loaded by Docker on init.
- Ad-hoc fixes/seed/index scripts live in `scripts/` (e.g. `performance_indexes.sql`, `seed_test_data.sql`).
- Backend uses **PostgreSQL** via pgx — write PostgreSQL syntax, NOT MySQL (ignore the outdated MySQL references in docker-compose.yml).
- Files use descriptive snake_case names, no numeric version prefix.

## Steps

1. Ask (or infer from `$ARGUMENTS`) what the migration does and whether it is a **schema change** (→ `migrations/`) or an **ad-hoc fix/index/seed** (→ `scripts/`).
2. Read an existing file in the chosen directory to match its header-comment style and formatting.
3. Create `<dir>/<descriptive_name>.sql` with:
   - A leading comment block: purpose, date (today), author.
   - Idempotent DDL where possible (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
   - PostgreSQL types (`SERIAL`/`BIGSERIAL`, `TIMESTAMPTZ`, `JSONB`, `UUID`).
   - Foreign keys with explicit `ON DELETE` behaviour matching existing tables.
4. Show the user how to apply it:
   ```bash
   docker compose exec -T postgres psql -U postgres -d unidorm < <path>
   ```
5. Remind: if it is a schema change, confirm whether models in `UniDormManagerServer/models/` and the store layer need matching updates.

## Output

Print the created file path and the apply command. Do not run the migration automatically.
