import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { ScreenState } from "@/components/app/ScreenState";

export const Route = createFileRoute("/karte")({
  head: () => ({
    meta: [
      { title: "Karte – Music Radar" },
      { name: "description", content: "Musikalische Nachbarn auf der Karte entdecken." },
      { property: "og:title", content: "Karte – Music Radar" },
      { property: "og:description", content: "Musikalische Nachbarn auf der Karte entdecken." },
    ],
  }),
  component: KartePage,
});

function KartePage() {
  return (
    <ScreenState title="Karte" emptyText="Die Karte wird hier bald angezeigt." icon={<MapPin className="h-7 w-7" />} />
  );
}
