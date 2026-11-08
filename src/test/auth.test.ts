import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ getUser: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { getCurrentUser, signIn, signOut } from "@/services/auth";
import { Route as gate } from "@/routes/_authenticated/route";

describe("Private Anmeldung", () => {
  beforeEach(() => vi.resetAllMocks());

  it("uses email/password sign-in and trims the email", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "existing-user" }, session: {} }, error: null });
    await signIn(" person@example.org ", "password-input");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "person@example.org", password: "password-input" });
  });

  it("rejects an incorrect password", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials" } });
    await expect(signIn("person@example.org", "wrong")).rejects.toThrow();
  });

  it("validates an existing persisted session with getUser", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "existing-user" } }, error: null });
    expect(await getCurrentUser()).toEqual({ id: "existing-user" });
    expect(auth.getUser).toHaveBeenCalledOnce();
  });

  it("redirects signed-out users to /login", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const beforeLoad = gate.options.beforeLoad;
    if (typeof beforeLoad !== "function") throw new Error("Missing guard");
    await expect(beforeLoad({} as Parameters<typeof beforeLoad>[0])).rejects.toMatchObject({ options: { to: "/login", replace: true } });
  });

  it("permits a validated signed-in user", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "existing-user" } }, error: null });
    const beforeLoad = gate.options.beforeLoad;
    if (typeof beforeLoad !== "function") throw new Error("Missing guard");
    expect(await beforeLoad({} as Parameters<typeof beforeLoad>[0])).toEqual({ user: { id: "existing-user" } });
  });

  it("clears the Supabase session on logout", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
});