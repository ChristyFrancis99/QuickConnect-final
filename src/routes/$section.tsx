import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/qc/AppShell";
import { SectionView } from "@/components/qc/Sections";
import { navItems } from "@/lib/data";

const subtitles: Record<string, string> = {
  projects: "Every project and how ready it is for a handover.",
  team: "People across your projects and their roles.",
  sources: "Tools QuickFlow reads to capture team knowledge.",
  analysis: "Knowledge gaps and coverage found by AI.",
  handovers: "Scheduled and in-progress handover reports.",
  verification: "Check how well incoming members understand their work.",
  readiness: "Readiness scores for incoming team members.",
  "risk-radar": "Explainable risks found across knowledge handovers and verification.",
  timeline: "Chronological evidence of project continuity events.",
  activity: "Everything that happened recently.",
  settings: "Notifications and preferences.",
};

export const Route = createFileRoute("/$section")({
  loader: ({ params }) => {
    const item = navItems.find((n) => n.slug === params.section && n.slug !== "dashboard");
    if (!item) throw notFound();
    return { label: item.label };
  },
  head: ({ loaderData, params }) => {
    const title = loaderData ? `${loaderData.label} · QuickFlow` : "QuickFlow";
    const desc = subtitles[params.section] ?? "QuickFlow knowledge handover platform.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: SectionPage,
});

function SectionPage() {
  const { section } = Route.useParams();
  const { label } = Route.useLoaderData();
  return (
    <AppShell active={section} title={label} subtitle={subtitles[section]}>
      <SectionView slug={section} />
    </AppShell>
  );
}
