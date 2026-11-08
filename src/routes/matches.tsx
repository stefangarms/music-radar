import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ScreenState } from "@/components/app/ScreenState";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Matches – Music Radar" },
      { name: "description", content: "Deine musikalischen Matches im Überblick." },
      { property: "og:title", content: "Matches – Music Radar" },
      { property: "og:description", content: "Deine musikalischen Matches im Überblick." },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  return <ScreenState title="Matches" emptyText="Noch keine Matches vorhanden." icon={<Heart className="h-7 w-7" />} />;
}
