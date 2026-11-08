// SQL contract regressions. Live catalog checks complement these tests;
// they do not replace an authenticated, end-to-end database test.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../../supabase/migrations/20261108165117_35e52cde-d0d9-4c41-a1c3-826f2cf32a70.sql", import.meta.url), "utf8");
const original = readFileSync(new URL("../../supabase/migrations/20261108150228_86632ce6-1a86-4756-964a-5c0cb64b1bd7.sql", import.meta.url), "utf8");
const grants = readFileSync(new URL("../../supabase/migrations/20261108170346_b0e54b9d-fa30-49dd-9f53-4f6c38fcd14f.sql", import.meta.url), "utf8");
const all = `${original}\n${schema}`;

describe("Database access migration contracts", () => {
  it.each(["profiles", "pairs", "presence", "current_media"])("enables RLS on %s", (table) => {
    expect(schema).toMatch(new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i"));
  });

  it.each(["SELECT", "INSERT", "UPDATE", "DELETE"])("restricts profile %s to its owner", (command) => {
    const policy = all.match(new RegExp(`CREATE POLICY \\w+ ON public\\.profiles\\s+FOR ${command} TO authenticated[\\s\\S]*?;`, "i"))?.[0];
    expect(policy).toBeDefined();
    expect(policy).toMatch(/auth\.uid\(\)\) = id/i);
    if (command === "INSERT" || command === "UPDATE") expect(policy).toMatch(/WITH CHECK/i);
  });

  it.each(["SELECT", "INSERT", "UPDATE", "DELETE"])("restricts presence %s to its owner", (command) => {
    const policy = schema.match(new RegExp(`CREATE POLICY \\w+ ON public\\.presence\\s+FOR ${command} TO authenticated[\\s\\S]*?;`, "i"))?.[0];
    expect(policy).toBeDefined();
    expect(policy).toMatch(/auth\.uid\(\)\) = user_id/i);
    if (command === "INSERT" || command === "UPDATE") expect(policy).toMatch(/WITH CHECK/i);
  });

  it("allows only both pair participants to read", () => {
    expect(schema).toMatch(/FOR SELECT TO authenticated\s+USING \(\(SELECT auth\.uid\(\)\) IN \(user_a, user_b\)\)/i);
    expect(grants).toMatch(/GRANT SELECT ON public\.pairs TO authenticated/i);
    expect(grants).not.toMatch(/GRANT (?:INSERT|UPDATE|DELETE|ALL)[^;]*public\.pairs TO authenticated/i);
  });

  it("exposes no current_media client policies or privileges", () => {
    expect(schema).not.toMatch(/CREATE POLICY[^;]*ON public\.current_media/i);
    expect(grants).toMatch(/REVOKE ALL ON public\.pairs, public\.presence, public\.current_media FROM PUBLIC, anon, authenticated/i);
    expect(grants).not.toMatch(/GRANT[^;]*current_media TO (?:anon|authenticated)/i);
  });

  it("creates missing profiles idempotently on successful login", () => {
    expect(schema).toMatch(/INSERT INTO public\.profiles \(id\)\s+VALUES \(NEW\.id\)\s+ON CONFLICT \(id\) DO NOTHING/i);
    expect(schema).toMatch(/AFTER UPDATE OF last_sign_in_at ON auth\.users/i);
    expect(schema).toMatch(/NEW\.last_sign_in_at IS NOT NULL\s+AND NEW\.last_sign_in_at IS DISTINCT FROM OLD\.last_sign_in_at/i);
    expect(schema).toMatch(/SECURITY DEFINER\s+SET search_path = ''/i);
  });

  it("limits alias to 30 characters", () => {
    expect(schema).toMatch(/IF NEW\.alias IS NULL OR char_length\(NEW\.alias\) > 30 THEN\s+RAISE EXCEPTION/i);
    expect(schema).toMatch(/BEFORE INSERT OR UPDATE ON public\.profiles/i);
  });

  it("limits bio to 200 characters", () => {
    expect(schema).toMatch(/IF NEW\.bio IS NOT NULL AND char_length\(NEW\.bio\) > 200 THEN\s+RAISE EXCEPTION/i);
  });

  it("timestamps presence updates on the server", () => {
    expect(schema).toMatch(/NEW\.updated_at = now\(\)/i);
    expect(schema).toMatch(/BEFORE UPDATE ON public\.presence[\s\S]*?EXECUTE FUNCTION public\.presence_set_updated_at\(\)/i);
  });
});