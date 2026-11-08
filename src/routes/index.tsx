import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Music Radar" },
      { name: "description", content: "Private App zum Entdecken musikalischer Gemeinsamkeiten." },
      { property: "og:title", content: "Music Radar" },
      { property: "og:description", content: "Private App zum Entdecken musikalischer Gemeinsamkeiten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/karte" });
  },
});
