import { Link } from "@tanstack/react-router";
import { Map, Heart, User } from "lucide-react";

const items = [
  { to: "/karte", label: "Karte", icon: Map },
  { to: "/matches", label: "Matches", icon: Heart },
  { to: "/profil", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
