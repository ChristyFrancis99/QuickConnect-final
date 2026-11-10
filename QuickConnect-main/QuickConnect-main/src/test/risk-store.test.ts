import { describe, expect, it } from "vitest";
import {
  calculateRiskScore,
  detectKnowledgeRisks,
  filterKnowledgeRisks,
  loadRiskMitigations,
  updateRiskMitigation,
  type RiskDetectionInput,
} from "@/lib/risk-store";
import type { Assessment } from "@/lib/assessment-store";
import type { Handover, Project } from "@/lib/data";

const projects: Project[] = [{
  id: "pay",
  name: "Payment Integration",
  progress: 65,
  color: "var(--chart-2)",
  owner: "david",
  due: "15 Nov",
  members: ["david", "alex", "priya"],
  description: "Payments",
  risk: "high",
}];

const handover: Handover = {
  id: "h1",
  projectId: "pay",
  project: "Payment Integration",
  date: "01",
  month: "Nov",
  from: "alex",
  to: "priya",
  time: "10:00 AM",
  status: "Pending approval",
  knowledge: [{ question: "Who owns payments?", answer: "David" }],
};

const input = (overrides: Partial<RiskDetectionInput> = {}) => ({
  projects,
  handovers: [handover],
  assessments: [],
  assessmentReviews: [],
  answers: [],
  answerReviews: [],
  aiFindings: [],
  now: new Date("2026-11-11T12:00:00Z"),
  ...overrides,
}) as unknown as RiskDetectionInput;

function submittedAssessment(): Assessment {
  return {
    id: "assessment-1",
    handoverId: "h1",
    projectId: "pay",
    personId: "priya",
    questions: [{
      id: "q1",
      handoverId: "h1",
      knowledgeIndex: 0,
      type: "descriptive",
      text: "Who owns payments?",
      points: 1,
      knowledgeTopic: "Ownership",
      referenceAnswer: "David",
    }],
    answers: {
      q1: {
        questionId: "q1",
        value: "Not sure",
        isCorrect: null,
        markedForReview: true,
        awardedMarks: 0,
        reviewStatus: "awaiting_review",
      },
    },
    status: "submitted",
    submittedAt: "2026-11-11T12:00:00Z",
    score: { total: 1, answered: 1, correct: 0, incorrect: 0, pendingReview: 1, marksObtained: 0, maximumMarks: 1, percentage: 0, knowledgeGaps: [] },
    createdAt: "2026-11-11T12:00:00Z",
  };
}

describe("knowledge risk radar", () => {
  it("detects incomplete handovers and overdue pending handovers", () => {
    const risks = detectKnowledgeRisks(input());
    expect(risks.map((risk) => risk.category)).toEqual(expect.arrayContaining(["Documentation", "Handover"]));
    expect(risks.every((risk) => risk.projectId === "pay")).toBe(true);
  });

  it("detects unresolved assessment answers and incomplete readiness", () => {
    const risks = detectKnowledgeRisks(input({
      handovers: [{ ...handover, status: "Approved" }],
      assessments: [submittedAssessment()],
    }));
    expect(risks.some((risk) => risk.category === "Verification" && risk.relatedAssessmentId === "assessment-1")).toBe(true);
    expect(risks.some((risk) => risk.category === "Readiness")).toBe(true);
  });

  it("calculates transparent severity priority scores", () => {
    expect(calculateRiskScore("High", 18, 15, 12)).toBe(100);
    expect(calculateRiskScore("Low", 1, 1, 1)).toBe(18);
  });

  it("uses stable IDs and removes duplicate detection records", () => {
    const first = detectKnowledgeRisks(input());
    const second = detectKnowledgeRisks(input());
    expect(first.map((risk) => risk.id)).toEqual(second.map((risk) => risk.id));
    expect(new Set(first.map((risk) => risk.id)).size).toBe(first.length);
  });

  it("filters by severity, project, category, status, and search text", () => {
    const risks = detectKnowledgeRisks(input());
    expect(filterKnowledgeRisks(risks, { severity: "High" }).every((risk) => risk.severity === "High")).toBe(true);
    expect(filterKnowledgeRisks(risks, { projectId: "pay" }).length).toBe(risks.length);
    expect(filterKnowledgeRisks(risks, { category: "Documentation" }).every((risk) => risk.category === "Documentation")).toBe(true);
    expect(filterKnowledgeRisks(risks, { status: "Open" }).length).toBe(risks.length);
    expect(filterKnowledgeRisks(risks, { query: "documentation" }).length).toBeGreaterThan(0);
  });

  it("assigns, resolves, and reopens risks with history", () => {
    const assigned = updateRiskMitigation({}, "documentation-h1", { ownerId: "david", notes: "Document recovery steps", status: "In Progress", actorId: "christy" });
    const resolved = updateRiskMitigation(assigned, "documentation-h1", { status: "Resolved", actorId: "christy" });
    const reopened = updateRiskMitigation(resolved, "documentation-h1", { status: "Open", actorId: "christy" });
    const risk = reopened["documentation-h1"];
    if (!risk) throw new Error("Expected mitigation record");
    expect(risk.assignedOwnerId).toBe("david");
    expect(risk.status).toBe("Open");
    expect(risk.history).toHaveLength(3);
  });

  it("ignores malformed persisted mitigation data", () => {
    const storage = { getItem: () => JSON.stringify({ broken: { status: "Unknown" }, valid: { assignedOwnerId: null, mitigationNotes: "", status: "Resolved", updatedAt: "now", history: [] } }) } as unknown as Storage;
    expect(loadRiskMitigations(storage)).toEqual({
      valid: { assignedOwnerId: null, mitigationNotes: "", status: "Resolved", updatedAt: "now", history: [] },
    });
  });
});
