import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Music Radar" },
      { name: "description", content: "Private App zum Entdecken musikalischer Gemeinsamkeiten." },
      { property: "og:title", content: "Music Radar" },
      { property: "og:description", content: "Private App zum Entdecken musikalischer Gemeinsamkeiten." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/karte" });
  },
});
