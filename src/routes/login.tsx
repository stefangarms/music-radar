import { createFileRoute } from "@tanstack/react-router";
import { Radar } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Anmelden – Music Radar" },
      { name: "description", content: "Melde dich bei Music Radar an." },
      { property: "og:title", content: "Anmelden – Music Radar" },
      { property: "og:description", content: "Melde dich bei Music Radar an." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
        <Radar className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Music Radar</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Die Anmeldung wird in einem späteren Schritt eingerichtet.
      </p>
    </main>
  );
}
