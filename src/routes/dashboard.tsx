import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/qc/AppShell";
import { DashboardMain } from "@/components/qc/Dashboard";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · QuickConnect" },
      { name: "description", content: "Track projects, knowledge handovers and team readiness in QuickFlow." },
      { property: "og:title", content: "Dashboard · QuickFlow" },
      { property: "og:description", content: "Track projects, knowledge handovers and team readiness in QuickFlow." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <AppShell
      active="dashboard"
      title={`Welcome back, ${user.name.split(" ")[0]}!`}
      subtitle="Here's what's happening across your projects and knowledge handovers."
    >
      <DashboardMain />
    </AppShell>
  );
}
