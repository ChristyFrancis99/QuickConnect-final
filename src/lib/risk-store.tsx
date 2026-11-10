import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Assessment, AssessmentAnswerReview } from "./assessment-store";
import { deriveAssessmentStatus, useOptionalAssessment } from "./assessment-store";
import type { Handover, Project } from "./data";
import { useQuickConnect, type QuickConnectData } from "./quick-connect-store";
import { useOptionalTimeline } from "./timeline-store";

export type RiskSeverity = "Critical" | "High" | "Medium" | "Low";
export type RiskCategory =
  | "Documentation"
  | "Ownership"
  | "Handover"
  | "Verification"
  | "Readiness";
export type RiskStatus = "Open" | "In Progress" | "Resolved" | "Accepted risk";

export interface RiskHistoryEntry {
  id: string;
  status: RiskStatus;
  note: string;
  actorId: string;
  updatedAt: string;
}

export interface KnowledgeRisk {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  explanation: string;
  severity: RiskSeverity;
  category: RiskCategory;
  detectionReason: string;
  relatedHandoverId?: string;
  relatedAssessmentId?: string;
  evidence: string[];
  suggestedMitigation: string;
  assignedOwnerId: string | null;
  mitigationNotes: string;
  status: RiskStatus;
  score: number;
  scoreFactors: {
    severity: number;
    impact: number;
    urgency: number;
    knowledgeAvailability: number;
  };
  createdAt: string;
  updatedAt: string;
  history: RiskHistoryEntry[];
}

type RiskMitigation = Pick<
  KnowledgeRisk,
  "assignedOwnerId" | "mitigationNotes" | "status" | "updatedAt" | "history"
>;

export interface RiskDetectionInput {
  projects: Project[];
  handovers: Handover[];
  assessments: Assessment[];
  assessmentReviews: AssessmentAnswerReview[];
  answers: QuickConnectData["answers"];
  answerReviews: QuickConnectData["answerReviews"];
  aiFindings: QuickConnectData["aiFindings"];
  now?: Date;
}

const STORAGE_KEY = "quickconnect.knowledge-risks.v1";
const severityBase: Record<RiskSeverity, number> = {
  Critical: 70,
  High: 55,
  Medium: 35,
  Low: 15,
};

function projectName(projects: Project[], projectId: string) {
  return projects.find((project) => project.id === projectId)?.name ?? "Unknown project";
}

export function calculateRiskScore(
  severity: RiskSeverity,
  impact: number,
  urgency: number,
  knowledgeAvailability: number,
) {
  return Math.min(100, severityBase[severity] + impact + urgency + knowledgeAvailability);
}

function makeRisk(
  input: Omit<KnowledgeRisk, "score" | "createdAt" | "updatedAt" | "history">,
  now: string,
): KnowledgeRisk {
  const scoreFactors = input.scoreFactors;
  return {
    ...input,
    score: calculateRiskScore(
      input.severity,
      scoreFactors.impact,
      scoreFactors.urgency,
      scoreFactors.knowledgeAvailability,
    ),
    createdAt: now,
    updatedAt: now,
    history: [],
  };
}

function parseDueDate(handover: Handover, now: Date) {
  const month = new Date(`${handover.month} 1, ${now.getFullYear()}`).getMonth();
  const day = Number.parseInt(handover.date, 10);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(now.getFullYear(), month, day, 23, 59, 59);
}

export function detectKnowledgeRisks(input: RiskDetectionInput): KnowledgeRisk[] {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const risks: KnowledgeRisk[] = [];
  const add = (risk: Omit<KnowledgeRisk, "score" | "createdAt" | "updatedAt" | "history">) =>
    risks.push(makeRisk(risk, timestamp));

  for (const handover of input.handovers) {
    const name = handover.project || projectName(input.projects, handover.projectId);
    if (handover.knowledge.length < 2) {
      add({
        id: `documentation-${handover.id}`,
        projectId: handover.projectId,
        projectName: name,
        title: "Handover documentation is incomplete",
        explanation: `${name} has only ${handover.knowledge.length} documented knowledge item${handover.knowledge.length === 1 ? "" : "s"}.`,
        severity: handover.knowledge.length === 0 ? "Critical" : "High",
        category: "Documentation",
        detectionReason: "A handover contains fewer than two knowledge items.",
        relatedHandoverId: handover.id,
        evidence: [`${handover.knowledge.length} knowledge item(s) recorded`, `Handover status: ${handover.status}`],
        suggestedMitigation: "Ask the outgoing member to document ownership, workflows, failure recovery, and decision context before approval.",
        assignedOwnerId: handover.from || null,
        mitigationNotes: "",
        status: "Open",
        scoreFactors: { severity: 0, impact: 18, urgency: handover.status === "Pending approval" ? 15 : 8, knowledgeAvailability: 20 },
      });
    }

    const due = parseDueDate(handover, now);
    if (due && due < now && handover.status !== "Approved") {
      add({
        id: `overdue-${handover.id}`,
        projectId: handover.projectId,
        projectName: name,
        title: "Handover is overdue and awaiting action",
        explanation: `${name} was scheduled for ${handover.date} ${handover.month} and is still ${handover.status.toLowerCase()}.`,
        severity: "High",
        category: "Handover",
        detectionReason: "The scheduled handover date has passed without approval.",
        relatedHandoverId: handover.id,
        evidence: [`Scheduled date: ${handover.date} ${handover.month}`, `Current status: ${handover.status}`],
        suggestedMitigation: "Review the handover, request missing information, and agree a new transfer date.",
        assignedOwnerId: handover.to || null,
        mitigationNotes: "",
        status: "Open",
        scoreFactors: { severity: 0, impact: 15, urgency: 20, knowledgeAvailability: 10 },
      });
    }
  }

  for (const assessment of input.assessments) {
    const status = deriveAssessmentStatus(assessment, input.assessmentReviews);
    if (status !== "awaiting_review" && status !== "needs_improvement") continue;
    const handover = input.handovers.find((item) => item.id === assessment.handoverId);
    const name = handover?.project ?? projectName(input.projects, assessment.projectId);
    const pending = assessment.score?.pendingReview ?? 0;
    const gaps = assessment.score?.knowledgeGaps.length ?? 0;
    const clarification = status === "needs_improvement";
    add({
      id: `assessment-${assessment.id}`,
      projectId: assessment.projectId,
      projectName: name,
      title: clarification ? "Assessment has unresolved knowledge gaps" : "Assessment answers need manager review",
      explanation: clarification
        ? `${gaps || 1} assessment answer(s) require clarification before the incoming member can be verified.`
        : `${pending || 1} descriptive assessment answer(s) are awaiting a manager decision.`,
      severity: clarification ? "High" : "Medium",
      category: "Verification",
      detectionReason: clarification ? "A manager requested clarification or the assessment contains critical gaps." : "Submitted descriptive answers have not been accepted.",
      relatedHandoverId: assessment.handoverId,
      relatedAssessmentId: assessment.id,
      evidence: [`Assessment status: ${status}`, `${pending} answer(s) awaiting review`, `${gaps} knowledge gap(s)`],
      suggestedMitigation: clarification ? "Review the feedback with the incoming member and resubmit the affected understanding." : "Review each descriptive response and record an acceptance or clarification request.",
      assignedOwnerId: handover?.to || assessment.personId || null,
      mitigationNotes: "",
      status: "Open",
      scoreFactors: { severity: 0, impact: 17, urgency: clarification ? 18 : 10, knowledgeAvailability: 15 },
    });
  }

  for (const answerReview of input.answerReviews.filter((review) => review.action === "knowledge_gap")) {
    const answer = input.answers.find((item) => item.id === answerReview.answerId);
    if (!answer) continue;
    const handover = input.handovers.find((item) => item.id === answer.handoverId);
    if (!handover) continue;
    add({
      id: `legacy-gap-${answerReview.answerId}`,
      projectId: handover.projectId,
      projectName: handover.project,
      title: "Verification answer flagged as a knowledge gap",
      explanation: answerReview.comment || "A manager marked this verification answer as incomplete.",
      severity: "High",
      category: "Verification",
      detectionReason: "A manager explicitly flagged a submitted verification answer.",
      relatedHandoverId: handover.id,
      evidence: [`Question: ${answer.question}`, `Answer: ${answer.answer}`],
      suggestedMitigation: "Schedule a focused walkthrough and update the handover knowledge item with the missing explanation.",
      assignedOwnerId: answer.personId,
      mitigationNotes: "",
      status: "Open",
      scoreFactors: { severity: 0, impact: 15, urgency: 12, knowledgeAvailability: 18 },
    });
  }

  for (const finding of input.aiFindings.filter((item) => item.status !== "Resolved")) {
    if (!/owner|assigned/i.test(`${finding.title} ${finding.explanation}`)) continue;
    add({
      id: `owner-${finding.id}`,
      projectId: finding.projectId,
      projectName: projectName(input.projects, finding.projectId),
      title: "Work has no documented responsible owner",
      explanation: finding.explanation,
      severity: finding.priority === "High" ? "High" : finding.priority === "Medium" ? "Medium" : "Low",
      category: "Ownership",
      detectionReason: "The existing demo finding explicitly identifies missing ownership.",
      evidence: [`Demo finding: ${finding.title}`, `Sample source: ${finding.source}`],
      suggestedMitigation: finding.suggestedAction,
      assignedOwnerId: null,
      mitigationNotes: "",
      status: "Open",
      scoreFactors: { severity: 0, impact: 18, urgency: finding.priority === "High" ? 15 : 7, knowledgeAvailability: 12 },
    });
  }

  const approvedByProject = new Map<string, Handover[]>();
  for (const handover of input.handovers.filter((item) => item.status === "Approved")) {
    approvedByProject.set(handover.projectId, [...(approvedByProject.get(handover.projectId) ?? []), handover]);
  }
  for (const project of input.projects) {
    const handovers = approvedByProject.get(project.id) ?? [];
    const assessments = input.assessments.filter((item) => item.projectId === project.id);
    const hasIncomplete = handovers.some((handover) => {
      const assessment = assessments.find((item) => item.handoverId === handover.id);
      return !assessment || deriveAssessmentStatus(assessment, input.assessmentReviews) !== "verified";
    });
    if (!hasIncomplete || handovers.length === 0) continue;
    add({
      id: `readiness-${project.id}`,
      projectId: project.id,
      projectName: project.name,
      title: "Project readiness is incomplete",
      explanation: `${project.name} has an approved handover whose incoming member has not reached Verified status.`,
      severity: "Medium",
      category: "Readiness",
      detectionReason: "Approved handover readiness is not fully verified.",
      evidence: [`Approved handovers: ${handovers.length}`, `Assessments for project: ${assessments.length}`],
      suggestedMitigation: "Review outstanding assessments and resolve knowledge gaps before the incoming member takes ownership.",
      assignedOwnerId: project.owner || null,
      mitigationNotes: "",
      status: "Open",
      scoreFactors: { severity: 0, impact: 16, urgency: 10, knowledgeAvailability: 12 },
    });
  }

  return risks;
}

export function filterKnowledgeRisks(
  risks: KnowledgeRisk[],
  filters: {
    severity?: RiskSeverity | "all";
    projectId?: string | "all";
    category?: RiskCategory | "all";
    status?: RiskStatus | "all";
    query?: string;
  },
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return risks.filter((risk) =>
    (!filters.severity || filters.severity === "all" || risk.severity === filters.severity)
    && (!filters.projectId || filters.projectId === "all" || risk.projectId === filters.projectId)
    && (!filters.category || filters.category === "all" || risk.category === filters.category)
    && (!filters.status || filters.status === "all" || risk.status === filters.status)
    && (!query || `${risk.title} ${risk.explanation}`.toLowerCase().includes(query))
  );
}

function isRiskMitigation(value: unknown): value is RiskMitigation {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (record["assignedOwnerId"] === null || typeof record["assignedOwnerId"] === "string")
    && typeof record["mitigationNotes"] === "string"
    && ["Open", "In Progress", "Resolved", "Accepted risk"].includes(String(record["status"]))
    && typeof record["updatedAt"] === "string"
    && Array.isArray(record["history"]);
}

export function loadRiskMitigations(storage: Storage | null = typeof window === "undefined" ? null : window.localStorage): Record<string, RiskMitigation> {
  if (!storage) return {};
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, value]) => isRiskMitigation(value)),
    ) as Record<string, RiskMitigation>;
  } catch {
    return {};
  }
}

export interface RiskApi {
  risks: KnowledgeRisk[];
  updateRisk: (id: string, update: { ownerId?: string | null; notes?: string; status?: RiskStatus; actorId: string }) => void;
}

export function updateRiskMitigation(
  current: Record<string, RiskMitigation>,
  id: string,
  update: { ownerId?: string | null; notes?: string; status?: RiskStatus; actorId: string },
) {
  const existing = current[id];
  const status = update.status ?? existing?.status ?? "Open";
  const now = new Date().toISOString();
  const history = update.status && update.status !== existing?.status
    ? [...(existing?.history ?? []), { id: crypto.randomUUID(), status: update.status, note: update.notes ?? existing?.mitigationNotes ?? "", actorId: update.actorId, updatedAt: now }]
    : existing?.history ?? [];
  return {
    ...current,
    [id]: {
      assignedOwnerId: update.ownerId !== undefined ? update.ownerId : existing?.assignedOwnerId ?? null,
      mitigationNotes: update.notes !== undefined ? update.notes : existing?.mitigationNotes ?? "",
      status,
      updatedAt: now,
      history,
    },
  };
}

const RiskContext = createContext<RiskApi | null>(null);

export function RiskProvider({ children }: { children: ReactNode }) {
  const { projects, handovers, answers, answerReviews, aiFindings } = useQuickConnect();
  const assessmentContext = useOptionalAssessment();
  const assessments = assessmentContext?.assessments ?? [];
  const reviews = assessmentContext?.reviews ?? [];
  const timeline = useOptionalTimeline();
  const events = timeline?.events ?? [];
  const recordEvent = timeline?.recordEvent ?? (() => {});
  const [mitigations, setMitigations] = useState<Record<string, RiskMitigation>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMitigations(loadRiskMitigations());
    setLoaded(true);
  }, []);

  const detected = useMemo(
    () => detectKnowledgeRisks({ projects, handovers, assessments, assessmentReviews: reviews, answers, answerReviews, aiFindings }),
    [projects, handovers, assessments, reviews, answers, answerReviews, aiFindings],
  );
  const risks = useMemo(
    () => detected.map((risk) => ({ ...risk, ...(mitigations[risk.id] ?? {}) })),
    [detected, mitigations],
  );

  useEffect(() => {
    for (const risk of detected) {
      if (events.some((event) => event.id === `risk-detected:${risk.id}`)) continue;
      recordEvent({
        id: `risk-detected:${risk.id}`,
        projectId: risk.projectId,
        category: "Knowledge risks",
        type: "risk_detected",
        title: "Knowledge risk detected",
        description: risk.title,
        actorId: "system",
        riskId: risk.id,
      });
    }
  }, [detected, events, recordEvent]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mitigations));
    } catch {
      // The risk register remains usable for the current session.
    }
  }, [mitigations, loaded]);

  const api = useMemo<RiskApi>(() => ({
    risks,
    updateRisk: (id, update) => {
      setMitigations((current) => {
        const next = updateRiskMitigation(current, id, update);
        const risk = risks.find((item) => item.id === id);
        if (risk) {
          if (update.ownerId !== undefined && update.ownerId !== risk.assignedOwnerId) {
            recordEvent({
              id: `risk-owner:${id}:${update.ownerId ?? "unassigned"}`,
              projectId: risk.projectId,
              category: "Knowledge risks",
              type: "risk_owner_changed",
              title: "Risk owner changed",
              description: update.ownerId ? "A responsible owner was assigned." : "The risk was unassigned.",
              actorId: update.actorId,
              riskId: id,
            });
          }
          if (update.status && update.status !== risk.status) {
            const type = update.status === "Resolved" ? "risk_resolved" : update.status === "Accepted risk" ? "risk_accepted" : risk.status === "Resolved" ? "risk_reopened" : "risk_mitigation_started";
            recordEvent({
              id: `risk-status:${id}:${update.status}`,
              projectId: risk.projectId,
              category: "Knowledge risks",
              type,
              title: `Risk ${update.status.toLowerCase()}`,
              description: update.notes ?? risk.title,
              actorId: update.actorId,
              riskId: id,
            });
          }
        }
        return next;
      });
    },
  }), [risks]);

  return <RiskContext.Provider value={api}>{children}</RiskContext.Provider>;
}

export function useRisk() {
  const context = useContext(RiskContext);
  if (!context) throw new Error("useRisk must be used within RiskProvider");
  return context;
}

export const riskSeverityOrder: RiskSeverity[] = ["Critical", "High", "Medium", "Low"];
