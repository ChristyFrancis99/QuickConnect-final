import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  activities as initialActivities,
  handovers as initialHandovers,
  projects as initialProjects,
  sources as initialSources,
  verification as initialVerification,
  type Activity,
  type Handover,
  type Project,
} from "./data";
import { useOptionalTimeline } from "./timeline-store";

type VerificationAnswer = {
  id: string;
  handoverId: string;
  personId: string;
  question: string;
  answer: string;
  submittedAt: string;
};

type HandoverReview = {
  id: string;
  handoverId: string;
  reviewerId: string;
  action: "changes_requested" | "rejected";
  comment: string;
  reviewedAt: string;
};

type HandoverApproval = {
  id: string;
  handoverId: string;
  approvedBy: string;
  approvedAt: string;
};

type AnswerReview = {
  id: string;
  answerId: string;
  reviewerId: string;
  action: "reviewed" | "knowledge_gap";
  comment: string;
  reviewedAt: string;
};

type KnowledgeSource = {
  name: string;
  items: string;
  status: "Synced" | "Analyzing" | "Pending" | "Disconnected";
  connected: boolean;
  lastSyncedAt: string | null;
};

type AiFinding = {
  id: string;
  projectId: string;
  title: string;
  explanation: string;
  suggestedAction: string;
  source: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
};

export type QuickConnectData = {
  projects: Project[];
  sources: KnowledgeSource[];
  handovers: Handover[];
  verification: typeof initialVerification;
  answers: VerificationAnswer[];
  approvals: HandoverApproval[];
  reviews: HandoverReview[];
  answerReviews: AnswerReview[];
  aiFindings: AiFinding[];
  activities: Activity[];
};

type QuickConnectApi = QuickConnectData & {
  addHandover: (handover: Omit<Handover, "id" | "status">, actorId: string) => void;
  approveHandover: (id: string, approvedBy: string) => void;
  reviewHandover: (id: string, reviewerId: string, action: "changes_requested" | "rejected", comment: string) => void;
  resubmitHandover: (id: string, memberId: string, knowledge: Handover["knowledge"]) => void;
  submitAnswer: (answer: Omit<VerificationAnswer, "id" | "submittedAt">) => void;
  reviewAnswer: (answerId: string, reviewerId: string, action: "reviewed" | "knowledge_gap", comment: string) => void;
  connectSource: (name: string, actorId: string) => void;
  disconnectSource: (name: string, actorId: string) => void;
  simulateSourceSync: (name: string, actorId: string) => void;
  updateAiFindingStatus: (id: string, status: AiFinding["status"], actorId: string) => void;
};

const STORAGE_KEY = "quickconnect.dashboard.v1";
const initialData: QuickConnectData = {
  projects: initialProjects,
  sources: initialSources.map((source) => ({
    ...source,
    connected: source.status !== "Pending",
    lastSyncedAt: null,
  })),
  handovers: initialHandovers,
  verification: initialVerification,
  answers: [],
  approvals: [],
  reviews: [],
  answerReviews: [],
  aiFindings: [
    {
      id: "finding-refund-retry",
      projectId: "pay",
      title: "Refund retry logic is missing from shared documentation",
      explanation: "The sample project notes indicate that retry behavior is described in Alex's branch notes but is not captured in the team's central documentation. A successor may not know how to handle a payment that fails after capture.",
      suggestedAction: "Ask the payment owner to document the retry sequence, failure conditions, and recovery steps, then link the relevant code or pull request.",
      source: "Sample GitHub branch notes",
      priority: "High",
      status: "Open",
    },
    {
      id: "finding-design-tokens",
      projectId: "web",
      title: "Design token decision is not recorded centrally",
      explanation: "A sample Slack discussion records an agreement about design tokens on Oct 12, but the decision is not reflected in the website project's shared documentation.",
      suggestedAction: "Add the agreed token names, values, and rationale to the project design guide and link the original discussion.",
      source: "Sample Slack discussion · Oct 12",
      priority: "Medium",
      status: "In Progress",
    },
    {
      id: "finding-certificates",
      projectId: "mobile",
      title: "Push notification certificate expiry has no assigned owner",
      explanation: "The sample mobile project notes mention an upcoming certificate expiry on 2 Dec without naming a responsible maintainer. This could interrupt push notifications if renewal is missed.",
      suggestedAction: "Assign a certificate owner, record the renewal steps, and add a reminder before the expiry date.",
      source: "Sample mobile project notes",
      priority: "High",
      status: "Open",
    },
    {
      id: "finding-embedding-docs",
      projectId: "ai",
      title: "Embedding pipeline documentation is complete",
      explanation: "The sample knowledge base contains nine pages covering the embedding pipeline. The finding is marked resolved to demonstrate how a previously identified gap can be closed.",
      suggestedAction: "Keep the documentation owner and last-reviewed date current as the pipeline changes.",
      source: "Sample Confluence pages",
      priority: "Low",
      status: "Resolved",
    },
  ],
  activities: initialActivities,
};

const QuickConnectContext = createContext<QuickConnectApi | null>(null);

function isQuickConnectData(value: unknown): value is QuickConnectData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return ["projects", "handovers", "verification", "answers", "approvals", "activities"].every(
    (key) => Array.isArray(data[key]),
  );
}

function loadSavedData(): { data: QuickConnectData; error: unknown | null } {
  if (typeof window === "undefined") return { data: initialData, error: null };
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { data: initialData, error: null };
    const parsed: unknown = JSON.parse(saved);
    if (!isQuickConnectData(parsed)) {
      return { data: initialData, error: new Error("Saved dashboard data has an invalid format.") };
    }
    const savedData = parsed as QuickConnectData;
    return {
      data: {
        ...savedData,
        sources: Array.isArray((parsed as Record<string, unknown>).sources)
          ? (parsed as QuickConnectData).sources
          : initialData.sources,
        reviews: Array.isArray((parsed as Record<string, unknown>).reviews) ? savedData.reviews : [],
        answerReviews: Array.isArray((parsed as Record<string, unknown>).answerReviews) ? savedData.answerReviews : [],
        aiFindings: Array.isArray((parsed as Record<string, unknown>).aiFindings) ? savedData.aiFindings : initialData.aiFindings,
      },
      error: null,
    };
  } catch (error) {
    return { data: initialData, error };
  }
}

function activity(who: string, text: string): Activity {
  return { id: crypto.randomUUID(), who, text, when: "Just now" };
}

export function QuickConnectProvider({ children }: { children: ReactNode }) {
  const timeline = useOptionalTimeline();
  const recordEvent = timeline?.recordEvent ?? (() => {});
  const [data, setData] = useState(initialData);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState<unknown | null>(null);

  useEffect(() => {
    const saved = loadSavedData();
    setData(saved.data);
    setStorageError(saved.error);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (storageError) toast.error("Saved dashboard data could not be loaded. The sample data is shown instead.");
  }, [storageError]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStorageError(null);
    } catch (error) {
      console.error("Could not save QuickConnect dashboard data.", error);
      toast.error("Dashboard changes could not be saved in this browser.");
    }
  }, [data, loaded]);

  const api = useMemo<QuickConnectApi>(() => ({
    ...data,
    addHandover: (handover, actorId) => {
      const newHandover: Handover = {
        ...handover,
        id: crypto.randomUUID(),
        status: "Pending approval",
      };
      setData((current) => ({
        ...current,
        handovers: [newHandover, ...current.handovers],
        activities: [activity(actorId, `created a handover for ${newHandover.project}`), ...current.activities],
      }));
      recordEvent({
        id: `handover-created:${newHandover.id}`,
        projectId: newHandover.projectId,
        category: "Handover",
        type: "handover_created",
        title: "Handover created",
        description: `${newHandover.project} handover was created.`,
        actorId,
        handoverId: newHandover.id,
      });
    },
    reviewHandover: (id, reviewerId, action, comment) => {
      const trimmedComment = comment.trim();
      if (!trimmedComment) return;
      const target = data.handovers.find((item) => item.id === id);
      if (!target || target.status === "Approved" || target.status === "Rejected") return;
      setData((current) => {
        const handover = current.handovers.find((item) => item.id === id);
        if (!handover || handover.status === "Approved" || handover.status === "Rejected") return current;
        const now = new Date().toISOString();
        const status = action === "changes_requested" ? "Changes requested" : "Rejected";
        const activityText = action === "changes_requested" ? `requested changes to the ${handover.project} handover` : `rejected the ${handover.project} handover`;
        return {
          ...current,
          handovers: current.handovers.map((item) => item.id === id ? { ...item, status } : item),
          reviews: [...(current.reviews ?? []), { id: crypto.randomUUID(), handoverId: id, reviewerId, action, comment: trimmedComment, reviewedAt: now }],
          activities: [activity(reviewerId, activityText), ...current.activities],
        };
      });
      recordEvent({
        id: `handover-${action}:${id}`,
        projectId: target.projectId,
        category: "Handover",
        type: action === "changes_requested" ? "handover_changes_requested" : "handover_rejected",
        title: action === "changes_requested" ? "Handover changes requested" : "Handover rejected",
        description: trimmedComment,
        actorId: reviewerId,
        handoverId: id,
      });
    },
    resubmitHandover: (id, memberId, knowledge) => {
      const target = data.handovers.find((item) => item.id === id);
      if (!target || target.from !== memberId || target.status !== "Changes requested") return;
      setData((current) => {
        const handover = current.handovers.find((item) => item.id === id);
        if (!handover || handover.from !== memberId || handover.status !== "Changes requested") return current;
        const cleanedKnowledge = knowledge
          .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
          .filter((item) => item.question && item.answer);
        if (cleanedKnowledge.length === 0) return current;
        return {
          ...current,
          handovers: current.handovers.map((item) => item.id === id
            ? { ...item, knowledge: cleanedKnowledge, status: "Pending approval" }
            : item),
          activities: [activity(memberId, `updated and resubmitted the ${handover.project} handover`), ...current.activities],
        };
      });
      if (target) recordEvent({
        id: `handover-resubmitted:${id}:${knowledge.map((item) => item.question).join("|")}`,
        projectId: target.projectId,
        category: "Handover",
        type: "handover_resubmitted",
        title: "Handover revised and resubmitted",
        description: `${target.project} handover was updated and resubmitted.`,
        actorId: memberId,
        handoverId: id,
      });
    },
    approveHandover: (id, approvedBy) => {
      const target = data.handovers.find((item) => item.id === id);
      if (!target || target.status === "Approved" || target.status === "Rejected") return;
      setData((current) => {
        const handover = current.handovers.find((item) => item.id === id);
        if (!handover || handover.status === "Approved" || handover.status === "Rejected") return current;
        const now = new Date().toISOString();
        return {
          ...current,
          handovers: current.handovers.map((item) => item.id === id ? { ...item, status: "Approved" } : item),
          approvals: [...current.approvals, { id: crypto.randomUUID(), handoverId: id, approvedBy, approvedAt: now }],
          activities: [activity(approvedBy, `approved the ${handover.project} handover`), ...current.activities],
        };
      });
      if (target) recordEvent({
        id: `handover-approved:${id}:${approvedBy}`,
        projectId: target.projectId,
        category: "Handover",
        type: "handover_approved",
        title: "Handover approved",
        description: `${target.project} handover was approved.`,
        actorId: approvedBy,
        handoverId: id,
      });
    },
    submitAnswer: (answer) => {
      setData((current) => {
        const handover = current.handovers.find((item) => item.id === answer.handoverId);
        const alreadyAnswered = current.answers.some((item) =>
          item.personId === answer.personId && item.handoverId === answer.handoverId && item.question === answer.question,
        );
        if (!handover || handover.status !== "Approved" || handover.to !== answer.personId || alreadyAnswered || !answer.answer.trim()) {
          return current;
        }
        return {
          ...current,
          answers: [...current.answers, { ...answer, answer: answer.answer.trim(), id: crypto.randomUUID(), submittedAt: new Date().toISOString() }],
          activities: [activity(answer.personId, "submitted a knowledge verification answer"), ...current.activities],
        };
      });
    },
    connectSource: (name, actorId) => {
      setData((current) => {
        const source = current.sources.find((item) => item.name === name);
        if (!source || source.connected) return current;
        return {
          ...current,
          sources: current.sources.map((item) => item.name === name
            ? { ...item, connected: true, status: "Pending" }
            : item),
          activities: [activity(actorId, `connected the ${name} demo source`), ...current.activities],
        };
      });
    },
    disconnectSource: (name, actorId) => {
      setData((current) => {
        const source = current.sources.find((item) => item.name === name);
        if (!source || !source.connected) return current;
        return {
          ...current,
          sources: current.sources.map((item) => item.name === name
            ? { ...item, connected: false, status: "Disconnected" }
            : item),
          activities: [activity(actorId, `disconnected the ${name} demo source`), ...current.activities],
        };
      });
    },
    simulateSourceSync: (name, actorId) => {
      setData((current) => {
        const source = current.sources.find((item) => item.name === name);
        if (!source || !source.connected) return current;
        const lastSyncedAt = new Date().toISOString();
        return {
          ...current,
          sources: current.sources.map((item) => item.name === name
            ? { ...item, status: "Synced", lastSyncedAt }
            : item),
          activities: [activity(actorId, `completed a demo sync for ${name}`), ...current.activities],
        };
      });
    },
    updateAiFindingStatus: (id, status, actorId) => {
      setData((current) => {
        const finding = current.aiFindings.find((item) => item.id === id);
        if (!finding || finding.status === status) return current;
        return {
          ...current,
          aiFindings: current.aiFindings.map((item) => item.id === id ? { ...item, status } : item),
          activities: [activity(actorId, `changed an AI analysis finding to ${status.toLowerCase()}`), ...current.activities],
        };
      });
    },
    reviewAnswer: (answerId, reviewerId, action, comment) => {
      const trimmedComment = comment.trim();
      if (action === "knowledge_gap" && !trimmedComment) return;
      setData((current) => {
        const answer = current.answers.find((item) => item.id === answerId);
        if (!answer) return current;
        const latestReview = (current.answerReviews ?? []).filter((item) => item.answerId === answerId).slice(-1)[0];
        if (latestReview?.action === "knowledge_gap" || latestReview?.action === "reviewed") return current;
        const reviewedAt = new Date().toISOString();
        const activityText = action === "knowledge_gap"
          ? "flagged a knowledge gap in a verification answer"
          : "reviewed a knowledge verification answer";
        return {
          ...current,
          answerReviews: [...(current.answerReviews ?? []), {
            id: crypto.randomUUID(),
            answerId,
            reviewerId,
            action,
            comment: trimmedComment,
            reviewedAt,
          }],
          activities: [activity(reviewerId, activityText), ...current.activities],
        };
      });
    },
  }), [data, recordEvent]);

  return <QuickConnectContext.Provider value={api}>{children}</QuickConnectContext.Provider>;
}

export function useQuickConnect() {
  const value = useContext(QuickConnectContext);
  if (!value) throw new Error("useQuickConnect must be used within QuickConnectProvider");
  return value;
}
