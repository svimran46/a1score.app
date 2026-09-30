# Supabase Row Level Security (RLS) Policy Guide

This document specifies the exact SQL policies required to secure all application tables in Supabase PostgreSQL and enforce read-only access for anonymous users (`anon`) and authenticated clients (`authenticated`), while prohibiting arbitrary writes.

---

## 1. Enable RLS on All Tables

Execute the following SQL in the **Supabase Dashboard SQL Editor** to activate Row Level Security across all application data tables:

```sql
ALTER TABLE "Club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Player" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "League" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketValueHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeasonStats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Injury" ENABLE ROW LEVEL SECURITY;
```

---

## 2. Drop Any Pre-Existing Overly Permissive Policies

If permissive write policies exist from previous setups, drop them:

```sql
DROP POLICY IF EXISTS "Allow public read-only access on Club" ON "Club";
DROP POLICY IF EXISTS "Allow public read-only access on Player" ON "Player";
DROP POLICY IF EXISTS "Allow public read-only access on League" ON "League";
DROP POLICY IF EXISTS "Allow public read-only access on Transfer" ON "Transfer";
DROP POLICY IF EXISTS "Allow public read-only access on MarketValueHistory" ON "MarketValueHistory";
DROP POLICY IF EXISTS "Allow public read-only access on SeasonStats" ON "SeasonStats";
DROP POLICY IF EXISTS "Allow public read-only access on Injury" ON "Injury";

DROP POLICY IF EXISTS "Enable read access for all users" ON "Club";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Player";
DROP POLICY IF EXISTS "Enable read access for all users" ON "League";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Transfer";
DROP POLICY IF EXISTS "Enable read access for all users" ON "MarketValueHistory";
DROP POLICY IF EXISTS "Enable read access for all users" ON "SeasonStats";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Injury";
```

---

## 3. Create Read-Only `SELECT` Policies

Create public read-only policies allowing `SELECT` queries for `anon` and `authenticated` roles. Do **not** create any policies for `INSERT`, `UPDATE`, or `DELETE`. When RLS is enabled with only `SELECT` policies, all write mutations via the REST API or client SDK are rejected by default with PostgreSQL error code `42501` (`insufficient_privilege`).

```sql
CREATE POLICY "Allow public read-only access on Club"
ON "Club"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read-only access on Player"
ON "Player"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read-only access on League"
ON "League"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read-only access on Transfer"
ON "Transfer"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read-only access on MarketValueHistory"
ON "MarketValueHistory"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read-only access on SeasonStats"
ON "SeasonStats"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read-only access on Injury"
ON "Injury"
FOR SELECT
TO anon, authenticated
USING (true);
```

---

## 4. Verification

Run the automated verification script:

```bash
npx tsx scripts/check-rls.ts
```

The script attempts `INSERT`, `UPDATE`, and `DELETE` operations using the configured `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If RLS is properly active, all mutation requests will be denied and the check will pass.
