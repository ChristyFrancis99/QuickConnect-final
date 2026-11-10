/**
 * Assessment Workspace — Knowledge Verification Workspace UI
 *
 * This module provides the full incoming-member assessment experience:
 * - AssessmentWorkspace: main dialog for taking an assessment
 * - AssessmentResults: results screen after submission
 * - ManagerAssessmentReview: manager-facing review of submitted assessments
 *
 * DEMO NOTE: Multiple-choice questions are auto-graded.
 * Descriptive answers are always sent for manager review — never auto-graded.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AiAvatar, Bar, Pill } from "./primitives";
import { personById } from "@/lib/data";
import {
  useAssessment,
  statusLabel,
  statusTone,
  deriveAssessmentStatus,
  type Assessment,
  type AssessmentQuestion,
  type AssessmentAnswerReview,
} from "@/lib/assessment-store";
import { useAuth } from "@/lib/auth-store";
import type { Handover } from "@/lib/data";
import { useQuickConnect } from "@/lib/quick-connect-store";

// ---------------------------------------------------------------------------
// AssessmentWorkspace dialog — incoming member experience
// ---------------------------------------------------------------------------

interface AssessmentWorkspaceProps {
  handover: Handover;
  personId: string;
  onClose: () => void;
}

export function AssessmentWorkspace({
  handover,
  personId,
  onClose,
}: AssessmentWorkspaceProps) {
  const { startAssessment, saveAnswer, submitAssessment, assessments, reviews } =
    useAssessment();

  const existingAssessment = assessments.find(
    (a) => a.handoverId === handover.id && a.personId === personId,
  );
  const [assessmentId, setAssessmentId] = useState(existingAssessment?.id ?? null);
  const assessment = assessments.find((item) => item.id === assessmentId);

  useEffect(() => {
    if (assessmentId) return;
    const created = startAssessment(handover, personId, personId);
    setAssessmentId(created.id);
  }, [assessmentId, handover, personId, startAssessment]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [descriptiveText, setDescriptiveText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(
    existingAssessment?.status === "submitted"
  );

  const person = personById(personId);
  useEffect(() => {
    if (!assessment) return;
    const firstUnanswered = assessment.questions.findIndex((q) => !assessment.answers[q.id]);
    setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setShowResults(assessment.status === "submitted");
  }, [assessment?.id]);

  useEffect(() => {
    const currentQuestion = assessment?.questions[currentIndex];
    if (currentQuestion?.type === "descriptive") {
      setDescriptiveText(assessment?.answers[currentQuestion.id]?.value ?? "");
    } else {
      setDescriptiveText("");
    }
  }, [assessment?.id, currentIndex]);

  if (!assessment) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Preparing knowledge assessment</DialogTitle>
            <DialogDescription>{handover.project} · For {person.name}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Loading the assessment workspace…</p>
        </DialogContent>
      </Dialog>
    );
  }

  const questions = assessment.questions;
  const currentQuestion: AssessmentQuestion | undefined = questions[currentIndex];
  const answeredCount = Object.keys(assessment.answers).length;
  const totalCount = questions.length;
  const isSubmitted = assessment.status === "submitted";

  if (questions.length === 0) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Knowledge assessment</DialogTitle>
            <DialogDescription>
              {handover.project} · For {person.name}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-muted p-5 text-sm">
            <p className="font-semibold">No questions available</p>
            <p className="mt-1 text-muted-foreground">
              This handover does not contain any knowledge items to generate
              questions from. Contact the outgoing member or manager.
            </p>
            <Button className="mt-4" size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (showResults) {
    const derivedStatus = deriveAssessmentStatus(assessment, reviews);
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <AssessmentResults
            assessment={assessment}
            reviews={reviews}
            derivedStatus={derivedStatus}
            onClose={onClose}
            onReview={() => {
              setShowResults(false);
              setCurrentIndex(0);
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  const currentAnswer = currentQuestion ? assessment.answers[currentQuestion.id] : undefined;

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion || currentQuestion.type !== "multiple_choice" || isSubmitted) return;
    const isCorrect = optionId === currentQuestion.correctOptionId;
    saveAnswer(assessment.id, {
      questionId: currentQuestion.id,
      value: optionId,
      isCorrect,
      markedForReview: false,
      awardedMarks: 0,
      reviewStatus: "not_required",
    });
  };

  const handleDescriptiveSubmit = () => {
    if (!currentQuestion || !descriptiveText.trim() || isSubmitted) return;
    saveAnswer(assessment.id, {
      questionId: currentQuestion.id,
      value: descriptiveText.trim(),
      isCorrect: null,
      markedForReview: true, // Always marked for manager review
      awardedMarks: 0,
      reviewStatus: "awaiting_review",
    });
    setDescriptiveText("");
  };

  const handleSubmitAssessment = () => {
    if (isSubmitting || isSubmitted || !canSubmit) return;
    setIsSubmitting(true);
    setTimeout(() => {
      submitAssessment(assessment.id, personId);
      setIsSubmitting(false);
      setShowResults(true);
      toast.success("Assessment submitted. Results are ready to view.");
    }, 400);
  };

  const canSubmit = answeredCount === totalCount;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Knowledge assessment</DialogTitle>
          <DialogDescription>
            {handover.project} · For {person.name}
          </DialogDescription>
        </DialogHeader>

        {/* Progress header */}
        <div className="space-y-2 rounded-2xl bg-muted p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span>
              <b>{answeredCount}</b>
              <span className="text-muted-foreground">/{totalCount} answered</span>
            </span>
          </div>
          <Bar value={progressPct} />
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <span>
              {questions.filter((q) => !assessment.answers[q.id]).length} unanswered
            </span>
            <span>·</span>
            <span>
              {questions.filter((q) => assessment.answers[q.id]?.reviewStatus === "awaiting_review").length} pending manager review
            </span>
          </div>
        </div>

        {/* Question navigation bar */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const answered = !!assessment.answers[q.id];
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => {
                  if (currentQuestion?.type === "descriptive" && descriptiveText) {
                    setDescriptiveText("");
                  }
                  setCurrentIndex(i);
                }}
                aria-label={`Question ${i + 1}${answered ? " (answered)" : ""}`}
                className={[
                  "h-7 w-7 rounded-full text-xs font-semibold transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : answered
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground hover:bg-secondary",
                ].join(" ")}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Current question */}
        {currentQuestion && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Question {currentIndex + 1} of {totalCount}
                </span>
                <Pill tone={currentQuestion.type === "multiple_choice" ? "accent" : "neutral"}>
                  {currentQuestion.type === "multiple_choice"
                    ? "Multiple choice"
                    : "Descriptive"}
                </Pill>
              </div>
              <div className="flex gap-2">
                <AiAvatar size={28} />
                <p className="rounded-2xl bg-muted px-3 py-2 text-sm">
                  {currentQuestion.text}
                </p>
              </div>
              {currentQuestion.type === "descriptive" && (
                <p className="pl-9 text-xs text-muted-foreground">
                  Your written answer will be sent to the manager for review.
                </p>
              )}
            </div>

            {/* Multiple choice options */}
            {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((opt) => {
                  const selected = currentAnswer?.value === opt.id;
                  const isCorrect = opt.id === currentQuestion.correctOptionId;
                  const showFeedback = selected && isSubmitted;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={isSubmitted}
                      className={[
                        "w-full rounded-xl border p-3 text-left text-sm transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:cursor-default",
                        selected
                          ? showFeedback
                            ? isCorrect
                              ? "border-success bg-success/10 font-medium text-success"
                              : "border-danger bg-danger/10 font-medium text-danger"
                            : "border-primary bg-secondary font-medium"
                          : "border-border hover:border-primary/60 active:scale-[0.99]",
                      ].join(" ")}
                    >
                      {opt.text}
                    </button>
                  );
                })}
                {currentAnswer && (
                  <p className="text-xs text-muted-foreground">
                    {currentAnswer.isCorrect
                      ? "✓ Correct answer selected."
                      : "✗ Incorrect — the correct answer will appear in your results."}
                  </p>
                )}
              </div>
            )}

            {/* Descriptive answer */}
            {currentQuestion.type === "descriptive" && (
              <>
                {isSubmitted && currentAnswer ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Your answer (saved for review)
                    </p>
                    <p>{currentAnswer.value}</p>
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={descriptiveText}
                      onChange={(e) => setDescriptiveText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && descriptiveText.trim()) {
                          e.preventDefault();
                          handleDescriptiveSubmit();
                        }
                      }}
                      placeholder={currentAnswer ? "Update your answer… (Ctrl+Enter to save)" : "Type your answer… (Ctrl+Enter to save)"}
                      aria-label="Your descriptive answer"
                      rows={3}
                      className="rounded-xl"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!descriptiveText.trim()}
                        onClick={handleDescriptiveSubmit}
                      >
                        {currentAnswer ? "Update answer" : "Save answer"}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Navigation + submit */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => {
              setDescriptiveText("");
              setCurrentIndex((i) => i - 1);
            }}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          {currentIndex < totalCount - 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDescriptiveText("");
                setCurrentIndex((i) => i + 1);
              }}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!canSubmit || isSubmitted}
              loading={isSubmitting}
              onClick={handleSubmitAssessment}
            >
              Submit assessment
            </Button>
          )}
        </div>

        {!canSubmit && (
          <p className="text-center text-xs text-muted-foreground">
            Answer all {totalCount} questions before submitting.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// AssessmentResults component
// ---------------------------------------------------------------------------

interface AssessmentResultsProps {
  assessment: Assessment;
  reviews: AssessmentAnswerReview[];
  derivedStatus: ReturnType<typeof deriveAssessmentStatus>;
  onClose: () => void;
  onReview: () => void;
}

function AssessmentResults({
  assessment,
  reviews,
  derivedStatus,
  onClose,
  onReview,
}: AssessmentResultsProps) {
  const score = assessment.score;
  const { questions } = assessment;

  const statusToneValue = statusTone[derivedStatus];
  const statusLabelValue = statusLabel[derivedStatus];

  const correctMCQ = questions.filter(
    (q) =>
      q.type === "multiple_choice" && assessment.answers[q.id]?.isCorrect === true
  ).length;
  const totalMCQ = questions.filter((q) => q.type === "multiple_choice").length;
  const totalDescriptive = questions.filter((q) => q.type === "descriptive").length;
  const reviewedCount = reviews.filter(
    (r) => r.assessmentId === assessment.id
  ).length;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Assessment results</DialogTitle>
        <DialogDescription>
          Submitted{" "}
          {assessment.submittedAt
            ? new Date(assessment.submittedAt).toLocaleString()
            : ""}
        </DialogDescription>
      </DialogHeader>

      {/* Status banner */}
      <div
        className={[
          "rounded-2xl p-4 text-center",
          derivedStatus === "verified"
            ? "bg-success/10"
            : derivedStatus === "needs_improvement"
            ? "bg-danger/10"
            : "bg-warning/10",
        ].join(" ")}
      >
        <Pill tone={statusToneValue}>{statusLabelValue}</Pill>
        <p className="mt-2 text-2xl font-bold">
          {score ? `${score.percentage}%` : "—"}
        </p>
        <p className="text-sm text-muted-foreground">
          {score ? `${score.marksObtained}/${score.maximumMarks} marks · ${score.answered}/${score.total} answered` : ""}
          {" · "}Based on {totalMCQ} auto-graded question{totalMCQ !== 1 ? "s" : ""}
          {totalDescriptive > 0
            ? ` · ${totalDescriptive} descriptive answer${totalDescriptive !== 1 ? "s" : ""} pending manager review`
            : ""}
        </p>
      </div>

      {/* Score breakdown */}
      {score && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">Maximum marks</p>
            <p className="mt-1 text-xl font-bold">{score.maximumMarks}</p>
          </div>
          <div className="rounded-xl bg-success/10 p-3 text-center">
            <p className="text-xs text-success">Correct</p>
            <p className="mt-1 text-xl font-bold text-success">{correctMCQ}</p>
          </div>
          <div className="rounded-xl bg-danger/10 p-3 text-center">
            <p className="text-xs text-danger">Incorrect</p>
            <p className="mt-1 text-xl font-bold text-danger">
              {totalMCQ - correctMCQ}
            </p>
          </div>
          <div className="rounded-xl bg-warning/10 p-3 text-center">
            <p className="text-xs text-secondary-foreground">For review</p>
            <p className="mt-1 text-xl font-bold">{totalDescriptive - reviewedCount}</p>
          </div>
        </div>
      )}

      {/* Knowledge gaps */}
      {score && score.knowledgeGaps.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <p className="text-sm font-semibold">Knowledge gaps identified</p>
          </div>
          <ul className="space-y-1">
            {score.knowledgeGaps.map((gap, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                · {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions pending manager review */}
      {totalDescriptive > 0 && (
        <div className="rounded-xl border border-border p-3">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Descriptive answers pending review</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {reviewedCount} of {totalDescriptive} reviewed by a manager. Remaining
            answers require manual review before your score is finalised.
          </p>
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Question breakdown
        </p>
        {questions.map((q, i) => {
          const answer = assessment.answers[q.id];
          const review = reviews.find(
            (r) => r.assessmentId === assessment.id && r.questionId === q.id
          );

          let icon = <Clock className="h-4 w-4 text-muted-foreground" />;
          let statusText = "Unanswered";

          if (answer) {
            if (q.type === "multiple_choice") {
              icon = answer.isCorrect ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-danger" />
              );
              statusText = answer.isCorrect ? "Correct" : "Incorrect";
            } else {
              if (review) {
                icon =
                  review.action === "accepted" ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-danger" />
                  );
                statusText =
                  review.action === "accepted" ? "Accepted" : "Needs clarification";
              } else {
                icon = <Clock className="h-4 w-4 text-warning" />;
                statusText = "Awaiting review";
              }
            }
          }

          return (
            <div key={q.id} className="flex items-start gap-2 rounded-xl bg-muted/50 p-2">
              {icon}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">
                  Q{i + 1}: {q.text}
                </p>
                {answer && q.type === "multiple_choice" && !answer.isCorrect && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Reference: {q.referenceAnswer}
                  </p>
                )}
                {review?.comment && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Manager: {review.comment}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {statusText}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onReview}>
          Review answers
        </Button>
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Inline Assessment Card — used in the verification section list
// ---------------------------------------------------------------------------

interface AssessmentCardProps {
  handover: Handover;
  personId: string;
  onStart: () => void;
}

export function AssessmentCard({ handover, personId, onStart }: AssessmentCardProps) {
  const { assessments, reviews } = useAssessment();
  const assessment = assessments.find(
    (a) => a.handoverId === handover.id && a.personId === personId
  );

  const status = assessment
    ? deriveAssessmentStatus(assessment, reviews)
    : "not_started";
  const tone = statusTone[status];
  const label = statusLabel[status];

  const answered = assessment ? Object.keys(assessment.answers).length : 0;
  const total = handover.knowledge.length;

  const buttonLabel =
    status === "not_started"
      ? "Start assessment"
      : status === "submitted" || status === "awaiting_review" || status === "verified"
      ? "View results"
      : "Continue assessment";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{handover.project}</p>
          <p className="text-xs text-muted-foreground">
            From {personById(handover.from).name} · {handover.date} {handover.month}
          </p>
        </div>
        <Pill tone={tone}>{label}</Pill>
      </div>
      {assessment && assessment.status !== "not_started" && (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Questions answered</span>
            <b>
              {answered}/{total}
            </b>
          </div>
          <Bar value={total > 0 ? (answered / total) * 100 : 0} />
        </>
      )}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onStart}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manager Assessment Review panel — embedded in Sections.tsx
// ---------------------------------------------------------------------------

export function ManagerAssessmentReviewPanel() {
  const { assessments, reviews, reviewAssessmentAnswer } = useAssessment();
  const { handovers } = useQuickConnect();
  const { user } = useAuth();
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  // Only show submitted assessments
  const submittedAssessments = assessments.filter(
    (a) => a.status === "submitted"
  );

  if (submittedAssessments.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-soft">
        <p className="font-medium">No submitted assessments yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Incoming members' assessment submissions will appear here once they
          complete their knowledge verification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submittedAssessments.map((assessment) => {
        const handover = handovers.find((h) => h.id === assessment.handoverId);
        const person = personById(assessment.personId);
        const derivedStatus = deriveAssessmentStatus(assessment, reviews);
        const descriptiveQuestions = assessment.questions.filter(
          (q) => q.type === "descriptive"
        );
        const pendingQuestions = descriptiveQuestions.filter(
          (q) => !reviews.some(
            (r) => r.assessmentId === assessment.id && r.questionId === q.id
          )
        );

        return (
          <div key={assessment.id} className="rounded-2xl bg-card p-5 shadow-soft space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar id={assessment.personId} size={40} />
                <div>
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {handover?.project ?? "Handover"} · Submitted{" "}
                    {assessment.submittedAt
                      ? new Date(assessment.submittedAt).toLocaleString()
                      : ""}
                  </p>
                </div>
              </div>
              <Pill tone={statusTone[derivedStatus]}>
                {statusLabel[derivedStatus]}
              </Pill>
            </div>

            {/* Score summary */}
            {assessment.score && (
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-muted p-2">
                  <span className="text-muted-foreground">Total</span>
                  <p className="mt-1 font-semibold">{assessment.score.total}</p>
                </div>
                <div className="rounded-lg bg-success/10 p-2">
                  <span className="text-success">Correct (MC)</span>
                  <p className="mt-1 font-semibold text-success">
                    {assessment.score.correct}
                  </p>
                </div>
                <div className="rounded-lg bg-danger/10 p-2">
                  <span className="text-danger">Incorrect</span>
                  <p className="mt-1 font-semibold text-danger">
                    {assessment.questions.filter(
                      (q) =>
                        q.type === "multiple_choice" &&
                        assessment.answers[q.id]?.isCorrect === false
                    ).length}
                  </p>
                </div>
                <div className="rounded-lg bg-warning/10 p-2">
                  <span className="text-secondary-foreground">Pending review</span>
                  <p className="mt-1 font-semibold">{pendingQuestions.length}</p>
                </div>
              </div>
            )}

            {/* Knowledge gaps from MC questions */}
            {assessment.score && assessment.score.knowledgeGaps.length > 0 && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
                <p className="mb-1 text-xs font-semibold text-secondary-foreground">
                  Knowledge gaps (auto-detected from multiple choice)
                </p>
                <ul className="space-y-0.5">
                  {assessment.score.knowledgeGaps.map((gap, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      · {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Descriptive questions needing review */}
            {pendingQuestions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  Descriptive answers requiring review ({pendingQuestions.length})
                </p>
                <p className="text-xs text-muted-foreground">
                  Mark each descriptive answer as accepted or flag it as needing
                  clarification. Feedback is returned to the incoming member.
                  <br />
                  <span className="italic">
                    Note: This is manual review. Answers are not AI-graded.
                  </span>
                </p>
                {pendingQuestions.map((q) => {
                  const answer = assessment.answers[q.id];
                  const draftKey = `${assessment.id}-${q.id}`;
                  const draft = commentDrafts[draftKey] ?? "";
                  return (
                    <div
                      key={q.id}
                      className="space-y-2 rounded-xl border border-border p-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        Question
                      </p>
                      <div className="flex gap-2">
                        <AiAvatar size={24} />
                        <p className="rounded-xl bg-muted px-3 py-1.5 text-sm">
                          {q.text}
                        </p>
                      </div>
                      <div className="rounded-xl bg-secondary p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Incoming member's answer
                        </p>
                        <p className="text-sm">{answer?.value ?? "No answer submitted"}</p>
                      </div>
                      {answer && (
                        <div className="space-y-2">
                          <Textarea
                            rows={2}
                            value={draft}
                            onChange={(e) =>
                              setCommentDrafts((c) => ({
                                ...c,
                                [draftKey]: e.target.value,
                              }))
                            }
                            placeholder="Add a review comment. Required when requesting clarification."
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                reviewAssessmentAnswer(
                                  assessment.id,
                                  q.id,
                                  user.id,
                                  "accepted",
                                  draft
                                );
                                setCommentDrafts((c) => {
                                  const next = { ...c };
                                  delete next[draftKey];
                                  return next;
                                });
                                toast.success("Answer accepted.");
                              }}
                            >
                              Accept answer
                            </Button>
                            <Button
                              size="sm"
                              disabled={!draft.trim()}
                              onClick={() => {
                                reviewAssessmentAnswer(
                                  assessment.id,
                                  q.id,
                                  user.id,
                                  "needs_clarification",
                                  draft
                                );
                                setCommentDrafts((c) => {
                                  const next = { ...c };
                                  delete next[draftKey];
                                  return next;
                                });
                                toast.success("Clarification requested.");
                              }}
                            >
                              Request clarification
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Already-reviewed descriptive answers */}
            {descriptiveQuestions
              .filter((q) =>
                reviews.some(
                  (r) => r.assessmentId === assessment.id && r.questionId === q.id
                )
              )
              .map((q) => {
                const review = reviews.find(
                  (r) => r.assessmentId === assessment.id && r.questionId === q.id
                );
                if (!review) return null;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Q: {q.text}
                      </p>
                      <Pill
                        tone={review.action === "accepted" ? "success" : "warning"}
                      >
                        {review.action === "accepted" ? "Accepted" : "Needs clarification"}
                      </Pill>
                    </div>
                    {review.comment && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Reviewed by {personById(review.reviewerId).name} ·{" "}
                      {new Date(review.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
