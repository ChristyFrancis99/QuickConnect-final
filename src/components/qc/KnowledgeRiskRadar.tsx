import { useMemo, useState } from "react";
import { AlertTriangle, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, Card, Pill } from "./primitives";
import { people } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { filterKnowledgeRisks, useRisk, riskSeverityOrder, type KnowledgeRisk, type RiskCategory, type RiskSeverity, type RiskStatus } from "@/lib/risk-store";

const categories: RiskCategory[] = ["Documentation", "Ownership", "Handover", "Verification", "Readiness"];
const statuses: RiskStatus[] = ["Open", "In Progress", "Resolved", "Accepted risk"];

function severityTone(severity: RiskSeverity) {
  return severity === "Critical" ? "danger" : severity === "High" ? "warning" : severity === "Medium" ? "accent" : "neutral";
}

function riskFactors(risk: KnowledgeRisk) {
  return `Severity ${risk.scoreFactors.severity || "base"} + impact ${risk.scoreFactors.impact} + urgency ${risk.scoreFactors.urgency} + knowledge availability ${risk.scoreFactors.knowledgeAvailability}`;
}

export function KnowledgeRiskRadar() {
  const { user } = useAuth();
  const { risks, updateRisk } = useRisk();
  const [selectedId, setSelectedId] = useState<string | null>(risks[0]?.id ?? null);
  const [severity, setSeverity] = useState<RiskSeverity | "all">("all");
  const [project, setProject] = useState("all");
  const [category, setCategory] = useState<RiskCategory | "all">("all");
  const [status, setStatus] = useState<RiskStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [ownerDraft, setOwnerDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<RiskStatus>("Open");
  const [notesDraft, setNotesDraft] = useState("");

  const filteredRisks = useMemo(() => filterKnowledgeRisks(risks, {
    severity,
    projectId: project,
    category,
    status,
    query,
  }).sort((a, b) => b.score - a.score), [risks, severity, project, category, status, query]);
  const selected = risks.find((risk) => risk.id === selectedId) ?? filteredRisks[0] ?? null;

  const counts = riskSeverityOrder.map((item) => ({
    severity: item,
    count: risks.filter((risk) => risk.severity === item).length,
  }));
  const unresolvedGaps = risks.filter((risk) => risk.category === "Verification" && risk.status !== "Resolved" && risk.status !== "Accepted risk").length;
  const unassigned = risks.filter((risk) => risk.category === "Ownership" && !risk.assignedOwnerId).length;

  function selectRisk(risk: KnowledgeRisk) {
    setSelectedId(risk.id);
    setOwnerDraft(risk.assignedOwnerId ?? "");
    setStatusDraft(risk.status);
    setNotesDraft(risk.mitigationNotes);
  }

  function save() {
    if (!selected) return;
    updateRisk(selected.id, { ownerId: ownerDraft || null, notes: notesDraft, status: statusDraft, actorId: user.id });
    toast.success("Risk mitigation saved.");
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><ShieldAlert className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold">Knowledge Risk Radar</p>
            <p className="text-sm text-muted-foreground">Explainable demo risks derived from handovers, verification, readiness, and existing sample findings. No live AI or external source is queried.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {counts.map((item) => <Card key={item.severity} className="p-3"><p className="text-xs text-muted-foreground">{item.severity} risks</p><p className="mt-1 text-2xl font-semibold">{item.count}</p></Card>)}
        <Card className="p-3"><p className="text-xs text-muted-foreground">Unresolved gaps</p><p className="mt-1 text-2xl font-semibold">{unresolvedGaps}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Unassigned tasks</p><p className="mt-1 text-2xl font-semibold">{unassigned}</p></Card>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search risks..." className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm" />
          </div>
          <select value={severity} onChange={(event) => setSeverity(event.target.value as RiskSeverity | "all")} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="all">All severities</option>{riskSeverityOrder.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={project} onChange={(event) => setProject(event.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="all">All projects</option>{[...new Map(risks.map((risk) => [risk.projectId, risk.projectName])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          <select value={category} onChange={(event) => setCategory(event.target.value as RiskCategory | "all")} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="all">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value as RiskStatus | "all")} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="all">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        {filteredRisks.length === 0 ? <div className="rounded-xl bg-muted p-5 text-sm text-muted-foreground">No risks match these filters.</div> : <div className="grid gap-2">{filteredRisks.map((risk) => (
          <button key={risk.id} onClick={() => selectRisk(risk)} className={`grid gap-2 rounded-xl border p-3 text-left transition hover:border-primary sm:grid-cols-[1fr_auto_auto_auto] ${selected?.id === risk.id ? "border-primary bg-primary/5" : "border-border"}`}>
            <span className="min-w-0"><span className="block truncate text-sm font-semibold">{risk.title}</span><span className="block truncate text-xs text-muted-foreground">{risk.projectName} · {risk.category}</span></span>
            <Pill tone={severityTone(risk.severity)}>{risk.severity}</Pill><Pill tone={risk.status === "Resolved" ? "success" : risk.status === "In Progress" ? "accent" : "neutral"}>{risk.status}</Pill><span className="text-xs font-semibold text-muted-foreground">Score {risk.score}</span>
          </button>
        ))}</div>}
      </Card>

      {selected && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-5 w-5 text-warning" /><div><h3 className="font-semibold">{selected.title}</h3><p className="text-sm text-muted-foreground">{selected.projectName} · Updated {new Date(selected.updatedAt).toLocaleString()}</p></div></div>
            <Pill tone={severityTone(selected.severity)}>{selected.severity} · {selected.score}/100</Pill>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explanation</p><p className="mt-1">{selected.explanation}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why detected</p><p className="mt-1">{selected.detectionReason}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence</p><ul className="mt-1 list-inside list-disc text-muted-foreground">{selected.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended action</p><p className="mt-1">{selected.suggestedMitigation}</p></div>
          </div>
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Priority score: <b className="text-foreground">{selected.score}/100</b>. {riskFactors(selected)}. This is a transparent demo prioritisation, not an AI prediction.</div>
          <div className="grid gap-3 border-t border-border pt-4 md:grid-cols-3">
            <label className="text-sm">Responsible owner<select value={ownerDraft} onChange={(event) => setOwnerDraft(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"><option value="">Unassigned</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
            <label className="text-sm">Resolution status<select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value as RiskStatus)} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-sm">{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm md:col-span-1">Mitigation notes<textarea value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1 text-sm" placeholder="Record the next action..." /></label>
          </div>
          <div className="flex justify-end"><Button onClick={save}>Save mitigation</Button></div>
          {selected.assignedOwnerId && <p className="text-xs text-muted-foreground">Current owner: <span className="inline-flex items-center gap-1"><Avatar id={selected.assignedOwnerId} size={20} />{people.find((person) => person.id === selected.assignedOwnerId)?.name}</span></p>}
          {selected.history.length > 0 && <div className="border-t border-border pt-3"><p className="text-sm font-semibold">Resolution history</p>{selected.history.map((entry) => <p key={entry.id} className="mt-1 text-xs text-muted-foreground">{entry.status} · {new Date(entry.updatedAt).toLocaleString()} {entry.note && `· ${entry.note}`}</p>)}</div>}
        </Card>
      )}
    </div>
  );
}
