import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/services/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Profil – Music Radar" },
      { name: "description", content: "Dein Music-Radar-Profil." },
      { property: "og:title", content: "Profil – Music Radar" },
      { property: "og:description", content: "Dein Music-Radar-Profil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilPage,
});

function ProfilPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
  });

  async function handleSignOut() {
    setBusy(true);
    setError("");
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await signOut();
      await navigate({ to: "/login", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Abmelden fehlgeschlagen.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold text-foreground">Profil</h1>
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <User className="h-8 w-8 shrink-0 text-primary" />
        <div className="min-w-0">
          {profile.data?.display_name && <p className="font-medium">{profile.data.display_name}</p>}
          <p className="break-all text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      {profile.isPending ? <p role="status" className="text-sm text-muted-foreground">Profil wird geladen …</p>
        : profile.isError ? <p role="alert" className="text-sm text-destructive">Dein Profil konnte nicht geladen werden.</p>
        : !profile.data.display_name && <p className="text-sm text-muted-foreground">Dein Profil ist noch leer.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button variant="outline" className="h-11 w-full" disabled={busy} onClick={handleSignOut}>
        {busy ? <Loader2 className="animate-spin" /> : <LogOut />} Abmelden
      </Button>
    </main>
  );
}
