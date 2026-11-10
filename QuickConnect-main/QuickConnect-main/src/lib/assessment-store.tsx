/**
 * Assessment store — Knowledge Verification Workspace
 *
 * Manages structured assessments for incoming members. Each assessment is
 * generated deterministically from approved handover knowledge items and
 * includes both multiple-choice and descriptive questions.
 *
 * DEMO NOTE: Question generation is deterministic/sample-based.
 * No live AI model is called. Descriptive answers are always sent for
 * manager review; they are never auto-graded.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Handover } from "./data";
import { useOptionalTimeline } from "./timeline-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestionType = "multiple_choice" | "descriptive";

export interface AssessmentOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  handoverId: string;
  /** Original knowledge item index within handover.knowledge */
  knowledgeIndex: number;
  type: QuestionType;
  text: string;
  points: number;
  knowledgeTopic: string;
  /** Only present for multiple_choice questions */
  options?: AssessmentOption[];
  /** Only present for multiple_choice questions */
  correctOptionId?: string;
  /** Reference answer text drawn from handover knowledge */
  referenceAnswer: string;
}

export type AssessmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "awaiting_review"
  | "needs_improvement"
  | "verified";

export interface AssessmentAnswer {
  questionId: string;
  /** For multiple_choice: option id. For descriptive: free text. */
  value: string;
  /** true only for multiple_choice questions where value === correctOptionId */
  isCorrect: boolean | null;
  /** Descriptive answers are always null until a manager reviews them */
  markedForReview: boolean;
  awardedMarks: number;
  reviewStatus: "not_required" | "awaiting_review" | "accepted" | "needs_clarification";
  feedback?: string;
}

export interface Assessment {
  id: string;
  handoverId: string;
  projectId: string;
  personId: string;
  questions: AssessmentQuestion[];
  answers: Record<string, AssessmentAnswer>;
  status: AssessmentStatus;
  submittedAt: string | null;
  score: AssessmentScore | null;
  createdAt: string;
}

export interface AssessmentScore {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  pendingReview: number;
  marksObtained: number;
  maximumMarks: number;
  percentage: number;
  knowledgeGaps: string[];
}

export type ManagerReviewAction = "accepted" | "needs_clarification";

export interface AssessmentAnswerReview {
  id: string;
  assessmentId: string;
  questionId: string;
  reviewerId: string;
  action: ManagerReviewAction;
  comment: string;
  reviewedAt: string;
}

// ---------------------------------------------------------------------------
// Deterministic question generation from handover knowledge
// ---------------------------------------------------------------------------

/**
 * Generates distractor options for a multiple-choice question by mixing
 * the correct answer with plausible alternatives drawn from other knowledge
 * items in the same handover. This is deterministic demo generation — no AI.
 */
function generateOptions(
  correctAnswer: string,
  otherAnswers: string[],
  correctId: string
): AssessmentOption[] {
  // Truncate long answers to 80 chars for option display
  const shorten = (s: string) =>
    s.length > 80 ? s.slice(0, 77) + "…" : s;

  const distractors = otherAnswers
    .filter((a) => a !== correctAnswer)
    .slice(0, 3)
    .map((a, i) => ({ id: `opt-${i}`, text: shorten(a) }));

  // Always have at least 2 distractors by using generic ones when unavailable
  const fallbacks = [
    "This information was not documented in the handover.",
    "The handover did not cover this topic in detail.",
    "No specific owner was assigned for this area.",
  ];

  while (distractors.length < 3) {
    const fb = fallbacks[distractors.length] ?? "No specific owner was assigned for this area.";
    if (!distractors.some((d) => d.text === fb)) {
      distractors.push({ id: `opt-fb-${distractors.length}`, text: fb });
    } else {
      break;
    }
  }

  const allOptions: AssessmentOption[] = [
    { id: correctId, text: shorten(correctAnswer) },
    ...distractors,
  ];

  // Shuffle options deterministically using correctId hash
  const seed = correctId.charCodeAt(correctId.length - 1) % 4;
  const rotated = [
    ...allOptions.slice(seed),
    ...allOptions.slice(0, seed),
  ];
  return rotated;
}

/**
 * Builds a list of AssessmentQuestions from an approved handover.
 * Uses alternating question types: even indices → multiple_choice,
 * odd indices → descriptive. Requires at least 1 knowledge item.
 */
export function generateQuestionsForHandover(
  handover: Handover
): AssessmentQuestion[] {
  const knowledge = handover.knowledge;
  if (knowledge.length === 0) return [];

  const allAnswers = knowledge.map((k) => k.answer);

  return knowledge.map((item, index): AssessmentQuestion => {
    const qId = `q-${handover.id}-${index}`;
    const isMultiChoice = index % 2 === 0;

    if (isMultiChoice) {
      const correctId = `${qId}-correct`;
      const otherAnswers = allAnswers.filter((_, i) => i !== index);
      return {
        id: qId,
        handoverId: handover.id,
        knowledgeIndex: index,
        type: "multiple_choice",
        text: item.question,
        points: 1,
        knowledgeTopic: item.question,
        options: generateOptions(item.answer, otherAnswers, correctId),
        correctOptionId: correctId,
        referenceAnswer: item.answer,
      };
    }

    return {
      id: qId,
      handoverId: handover.id,
      knowledgeIndex: index,
      type: "descriptive",
      text: item.question,
      points: 1,
      knowledgeTopic: item.question,
      referenceAnswer: item.answer,
    };
  });
}

/**
 * Calculate a score for a submitted assessment.
 * Multiple-choice: auto-graded.
 * Descriptive: always "pending review" — never auto-graded.
 */
export function calculateScore(
  questions: AssessmentQuestion[],
  answers: Record<string, AssessmentAnswer>,
  reviews: AssessmentAnswerReview[],
  assessmentId: string
): AssessmentScore {
  let correct = 0;
  let incorrect = 0;
  let pendingReview = 0;
  let answered = 0;
  let marksObtained = 0;
  const maximumMarks = questions.reduce((sum, question) => sum + question.points, 0);
  const knowledgeGaps: string[] = [];

  for (const q of questions) {
    const answer = answers[q.id];
    if (!answer) {
      pendingReview++;
      continue;
    }
    answered++;

    if (q.type === "multiple_choice") {
      if (answer.isCorrect) {
        correct++;
        marksObtained += q.points;
      } else {
        incorrect++;
        knowledgeGaps.push(q.text);
      }
    } else {
      // Descriptive — check if manager has reviewed
      const review = reviews.find(
        (r) => r.assessmentId === assessmentId && r.questionId === q.id
      );
      if (review) {
        if (review.action === "accepted") {
          correct++;
          marksObtained += q.points;
        } else {
          incorrect++;
          knowledgeGaps.push(q.text);
        }
      } else {
        pendingReview++;
      }
    }
  }

  const total = questions.length;
  const percentage = maximumMarks > 0 ? Math.round((marksObtained / maximumMarks) * 100) : 0;

  return { total, answered, correct, incorrect, pendingReview, marksObtained, maximumMarks, percentage, knowledgeGaps };
}

/**
 * Derive readiness status from an assessment and its reviews.
 */
export function deriveAssessmentStatus(
  assessment: Assessment,
  reviews: AssessmentAnswerReview[]
): AssessmentStatus {
  if (assessment.status === "not_started") return "not_started";
  if (assessment.status === "in_progress") return "in_progress";

  // After submission
  const score = calculateScore(
    assessment.questions,
    assessment.answers,
    reviews,
    assessment.id
  );

  const hasClarificationRequest = reviews.some(
    (review) => review.assessmentId === assessment.id && review.action === "needs_clarification",
  );
  if (hasClarificationRequest) return "needs_improvement";
  if (score.pendingReview > 0) return "awaiting_review";
  if (score.percentage < 70) return "needs_improvement";
  return "verified";
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export const ASSESSMENT_STORAGE_KEY = "quickconnect.assessments.v1";

interface AssessmentStoreData {
  assessments: Assessment[];
  reviews: AssessmentAnswerReview[];
}

function isAssessmentStoreData(value: unknown): value is AssessmentStoreData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return Array.isArray(data["assessments"]) && data["assessments"].every(isAssessment)
    && Array.isArray(data["reviews"]) && data["reviews"].every(isAssessmentAnswerReview);
}

function isAssessment(value: unknown): value is Assessment {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item["id"] === "string"
    && typeof item["handoverId"] === "string"
    && typeof item["projectId"] === "string"
    && typeof item["personId"] === "string"
    && Array.isArray(item["questions"])
    && item["questions"].every(isAssessmentQuestion)
    && typeof item["answers"] === "object"
    && item["answers"] !== null
    && Object.values(item["answers"] as Record<string, unknown>).every(isAssessmentAnswer)
    && ["not_started", "in_progress", "submitted"].includes(String(item["status"]))
    && (item["submittedAt"] === null || typeof item["submittedAt"] === "string")
    && (item["score"] === null || isAssessmentScore(item["score"]))
    && typeof item["createdAt"] === "string";
}

function isAssessmentAnswer(value: unknown): value is AssessmentAnswer {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item["questionId"] === "string"
    && typeof item["value"] === "string"
    && (item["isCorrect"] === null || typeof item["isCorrect"] === "boolean")
    && typeof item["markedForReview"] === "boolean"
    && typeof item["awardedMarks"] === "number"
    && ["not_required", "awaiting_review", "accepted", "needs_clarification"].includes(String(item["reviewStatus"]))
    && (item["feedback"] === undefined || typeof item["feedback"] === "string");
}

function isAssessmentQuestion(value: unknown): value is AssessmentQuestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item["id"] === "string"
    && typeof item["handoverId"] === "string"
    && typeof item["knowledgeIndex"] === "number"
    && (item["type"] === "multiple_choice" || item["type"] === "descriptive")
    && typeof item["text"] === "string"
    && typeof item["points"] === "number"
    && typeof item["knowledgeTopic"] === "string"
    && typeof item["referenceAnswer"] === "string";
}

function isAssessmentScore(value: unknown): value is AssessmentScore {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["total", "answered", "correct", "incorrect", "pendingReview", "marksObtained", "maximumMarks", "percentage"].every(
    (key) => typeof item[key] === "number",
  ) && Array.isArray(item["knowledgeGaps"]) && item["knowledgeGaps"].every((gap) => typeof gap === "string");
}

function isAssessmentAnswerReview(value: unknown): value is AssessmentAnswerReview {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item["id"] === "string"
    && typeof item["assessmentId"] === "string"
    && typeof item["questionId"] === "string"
    && typeof item["reviewerId"] === "string"
    && (item["action"] === "accepted" || item["action"] === "needs_clarification")
    && typeof item["comment"] === "string"
    && typeof item["reviewedAt"] === "string";
}

export function loadAssessmentData(storage?: Storage | null): AssessmentStoreData {
  try {
    const target = storage === undefined
      ? (typeof window === "undefined" ? null : window.localStorage)
      : storage;
    if (!target) return { assessments: [], reviews: [] };
    const saved = target.getItem(ASSESSMENT_STORAGE_KEY);
    if (!saved) return { assessments: [], reviews: [] };
    const parsed: unknown = JSON.parse(saved);
    if (!isAssessmentStoreData(parsed)) return { assessments: [], reviews: [] };
    return parsed;
  } catch {
    return { assessments: [], reviews: [] };
  }
}

// ---------------------------------------------------------------------------
// Context API
// ---------------------------------------------------------------------------

export interface AssessmentApi extends AssessmentStoreData {
  /** Create or return an existing assessment for a given handover + person */
  startAssessment: (handover: Handover, personId: string, actorId?: string) => Assessment;
  /** Save an answer (called on each selection, not just at submit time) */
  saveAnswer: (assessmentId: string, answer: AssessmentAnswer) => void;
  /** Submit the full assessment and calculate its score */
  submitAssessment: (assessmentId: string, actorId?: string) => void;
  /** Manager: accept or flag a descriptive answer */
  reviewAssessmentAnswer: (
    assessmentId: string,
    questionId: string,
    reviewerId: string,
    action: ManagerReviewAction,
    comment: string
  ) => void;
  /** Get latest derived status for an assessment */
  getAssessmentStatus: (assessmentId: string) => AssessmentStatus;
}

const AssessmentContext = createContext<AssessmentApi | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const timeline = useOptionalTimeline();
  const recordEvent = timeline?.recordEvent ?? (() => {});
  const [data, setData] = useState<AssessmentStoreData>({
    assessments: [],
    reviews: [],
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadAssessmentData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // non-critical — user loses draft but app does not crash
    }
  }, [data, loaded]);

  const api = useMemo<AssessmentApi>(() => ({
    ...data,

    startAssessment: (handover, personId, actorId = personId) => {
      // Return existing assessment if one already exists
      const existing = data.assessments.find(
        (a) => a.handoverId === handover.id && a.personId === personId
      );
      if (existing) return existing;

      const questions = generateQuestionsForHandover(handover);
      const newAssessment: Assessment = {
        id: crypto.randomUUID(),
        handoverId: handover.id,
        projectId: handover.projectId,
        personId,
        questions,
        answers: {},
        status: "not_started",
        submittedAt: null,
        score: null,
        createdAt: new Date().toISOString(),
      };

      setData((current) => ({
        ...current,
        assessments: [...current.assessments, newAssessment],
      }));
      recordEvent({
        id: `assessment-started:${newAssessment.id}`,
        projectId: handover.projectId,
        category: "Knowledge verification",
        type: "assessment_started",
        title: "Assessment started",
        description: `${handover.project} assessment was started.`,
        actorId,
        handoverId: handover.id,
        assessmentId: newAssessment.id,
      });

      return newAssessment;
    },

    saveAnswer: (assessmentId, answer) => {
      setData((current) => {
        const idx = current.assessments.findIndex((a) => a.id === assessmentId);
        if (idx === -1) return current;
        const assessment = current.assessments[idx];
        if (!assessment || assessment.status === "submitted") return current;

        const updatedAssessment: Assessment = {
          ...assessment,
          status: "in_progress",
          answers: {
            ...assessment.answers,
            [answer.questionId]: {
              ...answer,
              awardedMarks: 0,
              reviewStatus: answer.markedForReview ? "awaiting_review" : "not_required",
            },
          },
        };
        const updated = [...current.assessments];
        updated[idx] = updatedAssessment;
        return { ...current, assessments: updated };
      });
    },

    submitAssessment: (assessmentId, actorId = "system") => {
      setData((current) => {
        const idx = current.assessments.findIndex((a) => a.id === assessmentId);
        if (idx === -1) return current;
        const assessment = current.assessments[idx];
        if (!assessment || assessment.status === "submitted") return current;

        const score = calculateScore(
          assessment.questions,
          assessment.answers,
          current.reviews,
          assessmentId
        );
        const answers: Record<string, AssessmentAnswer> = Object.fromEntries(
          Object.entries(assessment.answers).map(([questionId, answer]) => {
            const question = assessment.questions.find((item) => item.id === questionId);
            const isDescriptive = question?.type === "descriptive";
            return [
              questionId,
              {
                ...answer,
                awardedMarks: !isDescriptive && answer.isCorrect && question ? question.points : 0,
                reviewStatus: isDescriptive ? "awaiting_review" : "not_required",
              },
            ];
          }),
        );

        const updatedAssessment: Assessment = {
          ...assessment,
          answers,
          status: "submitted",
          submittedAt: new Date().toISOString(),
          score,
        };
        const updated = [...current.assessments];
        updated[idx] = updatedAssessment;
        return { ...current, assessments: updated };
      });
      const submitted = data.assessments.find((item) => item.id === assessmentId);
      if (submitted) recordEvent({
        id: `assessment-submitted:${assessmentId}`,
        projectId: submitted.projectId,
        category: "Knowledge verification",
        type: "assessment_submitted",
        title: "Assessment submitted",
        description: "An incoming member submitted an assessment for review.",
        actorId,
        handoverId: submitted.handoverId,
        assessmentId,
      });
    },

    reviewAssessmentAnswer: (assessmentId, questionId, reviewerId, action, comment) => {
      const trimmed = comment.trim();
      // For needs_clarification, comment is required
      if (action === "needs_clarification" && !trimmed) return;

      setData((current) => {
        const review: AssessmentAnswerReview = {
          id: crypto.randomUUID(),
          assessmentId,
          questionId,
          reviewerId,
          action,
          comment: trimmed,
          reviewedAt: new Date().toISOString(),
        };

        // Recalculate score on the assessment
        const idx = current.assessments.findIndex((a) => a.id === assessmentId);
        if (idx === -1) return { ...current, reviews: [...current.reviews, review] };

        const assessment = current.assessments[idx];
        if (!assessment) return current;
        const newReviews = current.reviews.filter(
          (existingReview) =>
            existingReview.assessmentId !== assessmentId ||
            existingReview.questionId !== questionId,
        );
        newReviews.push(review);
        const score = calculateScore(
          assessment.questions,
          assessment.answers,
          newReviews,
          assessmentId
        );

        const answer = assessment.answers[questionId];
        const updatedAssessment: Assessment = {
          ...assessment,
          answers: answer
            ? {
                ...assessment.answers,
                [questionId]: {
                  ...answer,
                  awardedMarks: action === "accepted"
                    ? assessment.questions.find((question) => question.id === questionId)?.points ?? 0
                    : 0,
                  reviewStatus: action === "accepted" ? "accepted" : "needs_clarification",
                  feedback: trimmed,
                },
              }
            : assessment.answers,
          score,
        };
        const updated = [...current.assessments];
        updated[idx] = updatedAssessment;

        return { ...current, assessments: updated, reviews: newReviews };
      });
      const reviewed = data.assessments.find((item) => item.id === assessmentId);
      if (reviewed) recordEvent({
        id: `assessment-review:${assessmentId}:${questionId}:${action}`,
        projectId: reviewed.projectId,
        category: "Knowledge verification",
        type: action === "accepted" ? "manager_review_completed" : "clarification_requested",
        title: action === "accepted" ? "Manager review completed" : "Clarification requested",
        description: comment.trim(),
        actorId: reviewerId,
        handoverId: reviewed.handoverId,
        assessmentId,
      });
    },

    getAssessmentStatus: (assessmentId) => {
      const assessment = data.assessments.find((a) => a.id === assessmentId);
      if (!assessment) return "not_started";
      return deriveAssessmentStatus(assessment, data.reviews);
    },
  }), [data, recordEvent]);

  return (
    <AssessmentContext.Provider value={api}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}

export function useOptionalAssessment() {
  return useContext(AssessmentContext);
}

// ---------------------------------------------------------------------------
// Helpers for components
// ---------------------------------------------------------------------------

export const statusLabel: Record<AssessmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  awaiting_review: "Awaiting manager review",
  needs_improvement: "Needs improvement",
  verified: "Verified",
};

export const statusTone: Record<
  AssessmentStatus,
  "neutral" | "accent" | "warning" | "danger" | "success"
> = {
  not_started: "neutral",
  in_progress: "accent",
  submitted: "accent",
  awaiting_review: "warning",
  needs_improvement: "danger",
  verified: "success",
};
