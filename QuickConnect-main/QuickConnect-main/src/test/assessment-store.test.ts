import { describe, expect, it } from "vitest";
import {
  calculateScore,
  deriveAssessmentStatus,
  generateQuestionsForHandover,
  loadAssessmentData,
  type Assessment,
  type AssessmentAnswer,
  type AssessmentAnswerReview,
} from "@/lib/assessment-store";
import type { Handover } from "@/lib/data";

const handover: Handover = {
  id: "handover-assessment",
  projectId: "web",
  project: "QuickFlow Website",
  date: "10",
  month: "Nov",
  from: "christy",
  to: "alex",
  time: "10:00",
  status: "Approved",
  knowledge: [
    { question: "Where is the deployment pipeline?", answer: "GitHub Actions" },
    { question: "Who owns release approvals?", answer: "The project manager" },
  ],
};

function answer(questionId: string, value: string, isCorrect: boolean | null): AssessmentAnswer {
  return {
    questionId,
    value,
    isCorrect,
    markedForReview: isCorrect === null,
    awardedMarks: 0,
    reviewStatus: isCorrect === null ? "awaiting_review" : "not_required",
  };
}

function assessment(): Assessment {
  return {
    id: "assessment-1",
    handoverId: handover.id,
    projectId: handover.projectId,
    personId: handover.to,
    questions: generateQuestionsForHandover(handover),
    answers: {},
    status: "submitted",
    submittedAt: new Date().toISOString(),
    score: null,
    createdAt: new Date().toISOString(),
  };
}

describe("assessment scoring and persistence", () => {
  it("generates typed questions and scores correct and incorrect answers", () => {
    const current = assessment();
    const [multipleChoice, descriptive] = current.questions;
    if (!multipleChoice || !descriptive) throw new Error("Expected generated questions");
    const answers = {
      [multipleChoice.id]: answer(multipleChoice.id, multipleChoice.correctOptionId ?? "", true),
      [descriptive.id]: answer(descriptive.id, "A useful explanation", null),
    };

    const score = calculateScore(current.questions, answers, [], current.id);

    expect(multipleChoice.points).toBe(1);
    expect(multipleChoice.knowledgeTopic).toContain("deployment");
    expect(score).toMatchObject({
      total: 2,
      answered: 2,
      correct: 1,
      incorrect: 0,
      pendingReview: 1,
      marksObtained: 1,
      maximumMarks: 2,
      percentage: 50,
    });
    expect(deriveAssessmentStatus({ ...current, answers }, [])).toBe("awaiting_review");
  });

  it("marks incorrect answers as knowledge gaps and clarification as unresolved", () => {
    const current = assessment();
    const [multipleChoice, descriptive] = current.questions;
    if (!multipleChoice || !descriptive) throw new Error("Expected generated questions");
    const answers = {
      [multipleChoice.id]: answer(multipleChoice.id, "wrong", false),
      [descriptive.id]: answer(descriptive.id, "Needs clarification", null),
    };
    const review: AssessmentAnswerReview = {
      id: "review-1",
      assessmentId: current.id,
      questionId: descriptive.id,
      reviewerId: "christy",
      action: "needs_clarification",
      comment: "Please include the approval step.",
      reviewedAt: new Date().toISOString(),
    };

    const score = calculateScore(current.questions, answers, [review], current.id);

    expect(score.incorrect).toBe(2);
    expect(score.knowledgeGaps).toEqual(expect.arrayContaining([multipleChoice.text, descriptive.text]));
    expect(deriveAssessmentStatus({ ...current, answers }, [review])).toBe("needs_improvement");
  });

  it("recovers from invalid persisted assessment data and storage failures", () => {
    const storage = {
      getItem: () => "{invalid",
    } as unknown as Storage;
    expect(loadAssessmentData(storage)).toEqual({ assessments: [], reviews: [] });

    const invalidRecordStorage = {
      getItem: () => JSON.stringify({ assessments: [{ id: "broken" }], reviews: [] }),
    } as unknown as Storage;
    expect(loadAssessmentData(invalidRecordStorage)).toEqual({ assessments: [], reviews: [] });

    const failingStorage = {
      getItem: () => {
        throw new Error("storage unavailable");
      },
    } as unknown as Storage;
    expect(loadAssessmentData(failingStorage)).toEqual({ assessments: [], reviews: [] });
  });
});
