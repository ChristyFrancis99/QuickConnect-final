import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Search, ShieldCheck } from "lucide-react";
import { Card, Pill } from "./primitives";
import { people, projects } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { useQuickConnect } from "@/lib/quick-connect-store";
import { deriveAssessmentStatus, useAssessment } from "@/lib/assessment-store";
import { useRisk } from "@/lib/risk-store";
import { filterTimelineEvents, useTimeline, type TimelineCategory } from "@/lib/timeline-store";

const categories: TimelineCategory[] = ["Handover", "Knowledge verification", "Knowledge risks", "Project continuity"];

function iconFor(category: TimelineCategory) {
  if (category === "Handover") return ClipboardList;
  if (category === "Knowledge verification") return ShieldCheck;
  if (category === "Knowledge risks") return AlertTriangle;
  return CheckCircle2;
}

export function ContinuityTimeline() {
  const { user, roleCategory } = useAuth();
  const { events } = useTimeline();
  const { projects: storedProjects, handovers } = useQuickConnect();
  const { assessments, reviews } = useAssessment();
  const { risks } = useRisk();
  const [projectId, setProjectId] = useState("all");
  const [category, setCategory] = useState<TimelineCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const visibleProjectIds = useMemo(() => {
    if (roleCategory === "Project Manager" || roleCategory === "Organisation Admin") return new Set(storedProjects.map((project) => project.id));
    return new Set(handovers.filter((handover) => handover.from === user.id || handover.to === user.id).map((handover) => handover.projectId));
  }, [roleCategory, storedProjects, handovers, user.id]);
  const visibleEvents = useMemo(() => events.filter((event) => visibleProjectIds.has(event.projectId)), [events, visibleProjectIds]);
  const filtered = useMemo(() => filterTimelineEvents(visibleEvents, { projectId, category, query, from, to }), [visibleEvents, projectId, category, query, from, to]);
  const selectedProject = storedProjects.find((project) => project.id === projectId);
  const projectEvents = projectId === "all" ? visibleEvents : visibleEvents.filter((event) => event.projectId === projectId);
  const latestHandover = projectEvents.find((event) => event.category === "Handover");
  const latestVerification = projectEvents.find((event) => event.category === "Knowledge verification");
  const projectAssessments = assessments.filter((assessment) => assessment.projectId === projectId);
  const readiness = projectId === "all" ? null : projectAssessments.length === 0 ? null : deriveAssessmentStatus(projectAssessments[projectAssessments.length - 1]!, reviews);
  const openRisks = risks.filter((risk) => (projectId === "all" || risk.projectId === projectId) && risk.status !== "Resolved" && risk.status !== "Accepted risk").length;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-start gap-3">
          <Activity className="mt-1 h-5 w-5 text-primary" />
          <div><p className="font-semibold">Continuity timeline</p><p className="text-sm text-muted-foreground">Recorded handover, verification, risk, and readiness actions. Events are based on local demo workflows, not external integrations.</p></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Recorded events</p><p className="text-xl font-semibold">{projectEvents.length}</p></div>
          <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Latest handover</p><p className="truncate text-sm font-semibold">{latestHandover?.title ?? "Unavailable"}</p></div>
          <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Latest verification</p><p className="truncate text-sm font-semibold">{latestVerification?.title ?? "Unavailable"}</p></div>
          <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">{selectedProject ? "Current readiness" : "Open risks"}</p><p className="text-xl font-semibold">{selectedProject ? readiness ?? "Unavailable" : openRisks}</p></div>
        </div>
      </Card>
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, descriptions, or actors..." className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm" /></div>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="all">All projects</option>{storedProjects.filter((project) => visibleProjectIds.has(project.id)).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
          <select value={category} onChange={(event) => setCategory(event.target.value as TimelineCategory | "all")} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="all">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" aria-label="Events from date" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" aria-label="Events to date" />
        </div>
        {filtered.length === 0 ? <div className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">No continuity events match the selected filters.</div> : <div className="space-y-2">{filtered.map((event) => {
          const Icon = iconFor(event.category);
          const actor = people.find((person) => person.id === event.actorId);
          return <div key={event.id} className="rounded-xl border border-border p-3">
            <button onClick={() => setExpanded(expanded === event.id ? null : event.id)} className="flex w-full items-start gap-3 text-left">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{event.title}</span><span className="block text-xs text-muted-foreground">{event.category} · {actor?.name ?? event.actorId} · {new Date(event.timestamp).toLocaleString()}</span></span>
              <Pill tone="neutral">{expanded === event.id ? "Hide" : "Details"}</Pill>
            </button>
            {expanded === event.id && <div className="ml-12 mt-3 space-y-2 border-t border-border pt-3 text-sm"><p>{event.description}</p><p className="text-xs text-muted-foreground">Project: {projects.find((project) => project.id === event.projectId)?.name ?? event.projectId}{event.handoverId ? ` · Handover ${event.handoverId}` : ""}{event.assessmentId ? ` · Assessment ${event.assessmentId}` : ""}{event.riskId ? ` · Risk ${event.riskId}` : ""}</p></div>}
          </div>;
        })}</div>}
      </Card>
    </div>
  );
}
