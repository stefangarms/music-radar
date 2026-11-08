import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, LogIn, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser, signIn } from "@/services/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Anmelden – Music Radar" },
      { name: "description", content: "Melde dich bei Music Radar an." },
      { property: "og:title", content: "Anmelden – Music Radar" },
      { property: "og:description", content: "Melde dich bei Music Radar an." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void getCurrentUser().then((user) => {
      if (active && user) void navigate({ to: "/karte", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
      setPassword("");
      await navigate({ to: "/karte", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Die Anmeldung ist fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
        <Radar className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Music Radar</h1>
      <form onSubmit={handleSubmit} className="mt-4 flex w-full flex-col gap-5 text-left">
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} className="h-11" aria-describedby={error ? "login-error" : undefined} />
        </div>
        {error && <p id="login-error" role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="h-11 w-full">
          {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
          {busy ? "Anmelden …" : "Anmelden"}
        </Button>
      </form>
    </main>
  );
}
