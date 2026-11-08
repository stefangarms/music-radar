import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/services/auth";
import { BottomNav } from "@/components/app/BottomNav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login", replace: true });
    return { user };
  },
  component: () => <><Outlet /><BottomNav /></>,
});