import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { ScreenState } from "@/components/app/ScreenState";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil – Music Radar" },
      { name: "description", content: "Dein Music-Radar-Profil." },
      { property: "og:title", content: "Profil – Music Radar" },
      { property: "og:description", content: "Dein Music-Radar-Profil." },
    ],
  }),
  component: ProfilPage,
});

function ProfilPage() {
  return <ScreenState title="Profil" emptyText="Dein Profil ist noch leer." icon={<User className="h-7 w-7" />} />;
}
