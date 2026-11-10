import { useState } from "react";
import { toast } from "sonner";
import { Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { people, personById, type Handover } from "@/lib/data";
import { AiAvatar, Avatar, Bar, Card, Pill, readinessLabel, readinessTone } from "./primitives";
import { useUI } from "./ui-context";
import { useAuth } from "@/lib/auth-store";
import { useQuickConnect } from "@/lib/quick-connect-store";
import { usePreferences, type PreferenceKey } from "@/lib/preferences";
import { useAssessment, statusLabel, statusTone, deriveAssessmentStatus } from "@/lib/assessment-store";
import { AssessmentWorkspace, AssessmentCard, ManagerAssessmentReviewPanel } from "./AssessmentWorkspace";
import { KnowledgeRiskRadar } from "./KnowledgeRiskRadar";
import { ContinuityTimeline } from "./ContinuityTimeline";

const preferenceOptions: { label: string; key: PreferenceKey }[] = [
  { label: "Email me when a handover is due", key: "handoverDueNotifications" },
  { label: "Alert on single-person knowledge risks", key: "knowledgeRiskAlerts" },
  { label: "Weekly readiness digest", key: "weeklyReadinessDigest" },
];

export function SectionView({ slug }: { slug: string }) {
  const ui = useUI();
  const { user, roleCategory } = useAuth();
  const { preferences, updatePreference, loadError, saveError } = usePreferences();
  const { projects, sources: knowledgeSources, connectSource, disconnectSource, simulateSourceSync, handovers, activities, verification, answers, approvals, reviews, answerReviews, aiFindings, updateAiFindingStatus, approveHandover, reviewHandover, resubmitHandover, reviewAnswer } = useQuickConnect();
  const { assessments, reviews: assessmentReviews } = useAssessment();
  const visibleHandovers = handovers.filter((handover) => roleCategory !== "Outgoing Member" || handover.from === user.id);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [answerReviewDrafts, setAnswerReviewDrafts] = useState<Record<string, string>>({});
  const [editingHandover, setEditingHandover] = useState<string | null>(null);
  const [knowledgeDrafts, setKnowledgeDrafts] = useState<Record<string, { question: string; answer: string }[]>>({});
  const [analysisProjectId, setAnalysisProjectId] = useState("all");
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);
  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const [activeAssessmentHandoverId, setActiveAssessmentHandoverId] = useState<string | null>(null);
  const allowedSections: Record<string, string[]> = {
    "Outgoing Member": ["projects", "handovers", "activity"],
    "Incoming Member": ["projects", "verification", "activity"],
    "Project Manager": ["projects", "team", "handovers", "verification", "readiness", "risk-radar", "timeline", "activity"],
    "Organisation Admin": ["projects", "team", "sources", "analysis", "handovers", "verification", "readiness", "risk-radar", "timeline", "activity", "settings"],
  };
  if (!allowedSections[roleCategory]?.includes(slug)) {
    return <Card><p className="font-semibold">This section is not available for your demo role.</p><p className="mt-1 text-sm text-muted-foreground">Switch to a role with access to continue.</p></Card>;
  }

  switch (slug) {
    case "timeline":
      return <ContinuityTimeline />;
    case "risk-radar":
      return <KnowledgeRiskRadar />;
    case "projects":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.length === 0 ? <Card><p className="font-semibold">No projects available</p><p className="mt-1 text-sm text-muted-foreground">Projects will appear here when they are added to this workspace.</p></Card> : projects.map((p) => (
            <Card key={p.id} onClick={() => ui.openProject(p.id)}>
              <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">{p.name}</h3><Pill tone={p.risk === "high" ? "danger" : p.risk === "medium" ? "warning" : "success"}>{p.risk} risk</Pill></div>
              <p className="mb-4 text-sm text-muted-foreground">{p.description}</p>
              <div className="mb-1.5 flex justify-between text-sm"><span>Progress</span><b>{p.progress}%</b></div>
              <Bar value={p.progress} color={p.color} />
              <div className="mt-4 flex items-center justify-between"><div className="flex -space-x-2">{p.members.map((m) => <Avatar key={m} id={m} size={30} ring />)}</div><span className="text-xs text-muted-foreground">Handover {p.due}</span></div>
            </Card>
          ))}
        </div>
      );
    case "team":
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {people.length === 0 ? <Card><p className="font-semibold">No team members found</p><p className="mt-1 text-sm text-muted-foreground">Team members will appear here when they are added.</p></Card> : people.map((p) => (
            <Card key={p.id} onClick={() => ui.openProfile(p.id)} className="flex items-center gap-4">
              <img src={p.avatar} alt={p.name} className="h-14 w-14 shrink-0 rounded-full object-cover shadow-xs" style={{ backgroundColor: p.bgColor }} />
              <div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className="text-sm text-muted-foreground">{p.role}</p><Pill tone={p.status === "active" ? "success" : "warning"}>{p.status}</Pill></div>
            </Card>
          ))}
        </div>
      );
    case "sources":
      return (
        <div className="space-y-4">
          <Card className="space-y-1">
            <p className="font-semibold">Knowledge source connections</p>
            <p className="text-sm text-muted-foreground">Manage the sample connections used in this demo. Connect, disconnect, and simulate a refresh without accessing external accounts or services.</p>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {knowledgeSources.length === 0 ? <Card><p className="font-semibold">No knowledge sources configured</p><p className="mt-1 text-sm text-muted-foreground">Sample source connections will appear here when configured.</p></Card> : knowledgeSources.map((source) => (
              <Card key={source.name} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Database className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="font-semibold">{source.name}</p><p className="text-xs text-muted-foreground">{source.items}</p></div>
                  <Pill tone={source.status === "Synced" ? "success" : source.status === "Analyzing" ? "accent" : source.status === "Disconnected" ? "danger" : "warning"}>{source.status}</Pill>
                </div>
                <div className="text-xs text-muted-foreground">
                  {source.lastSyncedAt
                    ? `Last demo refresh: ${new Date(source.lastSyncedAt).toLocaleString()}`
                    : source.connected ? "No demo refresh recorded yet" : "This sample source is disconnected"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {source.connected ? (
                    <>
                      <Button
                        size="sm"
                        loading={syncingSource === source.name}
                        onClick={() => {
                          setSyncingSource(source.name);
                          setTimeout(() => {
                            simulateSourceSync(source.name, user.id);
                            setSyncingSource(null);
                            toast.success(`${source.name} demo refresh completed.`);
                          }, 600);
                        }}
                      >
                        {syncingSource === source.name ? "Syncing..." : "Simulate sync"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={syncingSource === source.name}
                        onClick={() => {
                          disconnectSource(source.name, user.id);
                          toast.success(`${source.name} demo source disconnected.`);
                        }}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        connectSource(source.name, user.id);
                        toast.success(`${source.name} demo source connected.`);
                      }}
                    >
                      Connect source
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    case "analysis": {
      const filteredFindings = aiFindings.filter((finding) =>
        analysisProjectId === "all" || finding.projectId === analysisProjectId,
      );
      const openCount = filteredFindings.filter((finding) => finding.status === "Open").length;
      const inProgressCount = filteredFindings.filter((finding) => finding.status === "In Progress").length;
      const resolvedCount = filteredFindings.filter((finding) => finding.status === "Resolved").length;
      const statusTone = (status: string) => status === "Resolved" ? "success" as const : status === "In Progress" ? "warning" as const : "danger" as const;
      return (
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Knowledge gap analysis</p>
                <p className="text-sm text-muted-foreground">Explore sample findings by project and track the follow-up status.</p>
              </div>
              <Pill tone="accent">Demo analysis · Sample data</Pill>
            </div>
            <label className="block max-w-sm space-y-1.5 text-sm font-medium">
              Project
              <select
                value={analysisProjectId}
                onChange={(event) => setAnalysisProjectId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal"
              >
                <option value="all">All projects</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Open</p><p className="text-xl font-semibold">{openCount}</p></div>
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">In progress</p><p className="text-xl font-semibold">{inProgressCount}</p></div>
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Resolved</p><p className="text-xl font-semibold">{resolvedCount}</p></div>
            </div>
          </Card>
          <div className="space-y-3">
            {filteredFindings.length === 0 ? (
              <Card><p className="font-medium">No sample findings for this project</p><p className="mt-1 text-sm text-muted-foreground">Choose another project to inspect its demo analysis.</p></Card>
            ) : filteredFindings.map((finding) => {
              const project = projects.find((item) => item.id === finding.projectId);
              const expanded = expandedFindingId === finding.id;
              return (
                <Card key={finding.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AiAvatar />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{finding.title}</p>
                        <Pill tone={statusTone(finding.status)}>{finding.status}</Pill>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{project?.name ?? "Project"} · {finding.priority} priority · {finding.source}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button size="sm" variant="outline" onClick={() => setExpandedFindingId(expanded ? null : finding.id)}>
                      {expanded ? "Hide details" : "View finding"}
                    </Button>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Status
                      <select
                        aria-label={`Status for ${finding.title}`}
                        value={finding.status}
                        onChange={(event) => updateAiFindingStatus(finding.id, event.target.value as "Open" | "In Progress" | "Resolved", user.id)}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </label>
                  </div>
                  {expanded && (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                      <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this matters</p><p className="mt-1 text-sm">{finding.explanation}</p></div>
                      <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested next action</p><p className="mt-1 text-sm">{finding.suggestedAction}</p></div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">These findings and source references are illustrative sample content. No live source ingestion, AI analysis, or automatic gap detection is running.</p>
        </div>
      );
    }
    case "handovers":
      return (
        <div className="space-y-3">
          {(roleCategory === "Outgoing Member" || roleCategory === "Organisation Admin") && <Button onClick={ui.openHandover}>Create New Handover</Button>}
          {visibleHandovers.length === 0 ? <Card><p className="font-semibold">No handovers to show</p><p className="mt-1 text-sm text-muted-foreground">{roleCategory === "Outgoing Member" ? "Handovers you create will appear here." : "Handovers will appear here when a team member creates one."}</p></Card> : visibleHandovers.map((h) => (
            <Card key={h.id} className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
              <FileText className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1"><p className="font-semibold">{h.project}</p><p className="text-xs text-muted-foreground">{h.date} {h.month} · {h.time}</p></div>
              <div className="flex items-center gap-2"><Avatar id={h.from} size={30} /><span className="text-muted-foreground">→</span><Avatar id={h.to} size={30} /></div>
              <Pill tone={h.status === "Approved" ? "success" : h.status === "Rejected" ? "danger" : h.status === "Changes requested" ? "warning" : "accent"}>{h.status}</Pill>
              {reviews.filter((review) => review.handoverId === h.id).slice(-1).map((review) => (
                <p key={review.id} className="w-full rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                  Latest feedback: {review.comment} · {personById(review.reviewerId).name}
                </p>
              ))}
              {h.status === "Approved" ? (
                <span className="text-xs text-muted-foreground">Approved by {personById(approvals.find((approval) => approval.handoverId === h.id)?.approvedBy ?? "christy").name}</span>
              ) : h.status === "Rejected" ? (
                <span className="text-xs text-muted-foreground">Rejected</span>
              ) : roleCategory === "Project Manager" || roleCategory === "Organisation Admin" ? (
                <div className="w-full space-y-2">
                  <Textarea
                    value={reviewDrafts[h.id] ?? ""}
                    onChange={(event) => setReviewDrafts((current) => ({ ...current, [h.id]: event.target.value }))}
                    placeholder="Add review feedback or explain what needs to change..."
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => { approveHandover(h.id, user.id); setReviewDrafts((current) => ({ ...current, [h.id]: "" })); }}>Approve handover</Button>
                    <Button size="sm" variant="outline" disabled={!(reviewDrafts[h.id] ?? "").trim()} onClick={() => { reviewHandover(h.id, user.id, "changes_requested", reviewDrafts[h.id] ?? ""); setReviewDrafts((current) => ({ ...current, [h.id]: "" })); }}>Request changes</Button>
                    <Button size="sm" variant="ghost" disabled={!(reviewDrafts[h.id] ?? "").trim()} onClick={() => { reviewHandover(h.id, user.id, "rejected", reviewDrafts[h.id] ?? ""); setReviewDrafts((current) => ({ ...current, [h.id]: "" })); }}>Reject</Button>
                  </div>
                </div>
              ) : roleCategory === "Outgoing Member" && h.status === "Changes requested" ? (
                <div className="w-full space-y-3">
                  {editingHandover === h.id ? (
                    <>
                      {(knowledgeDrafts[h.id] ?? h.knowledge).map((item, index) => (
                        <div key={index} className="space-y-2 rounded-xl border border-border p-3">
                          <label className="block space-y-1 text-xs font-medium">
                            Knowledge question
                            <Textarea rows={2} value={item.question} onChange={(event) => setKnowledgeDrafts((current) => ({
                              ...current,
                              [h.id]: (current[h.id] ?? h.knowledge).map((entry, itemIndex) => itemIndex === index ? { ...entry, question: event.target.value } : entry),
                            }))} />
                          </label>
                          <label className="block space-y-1 text-xs font-medium">
                            Answer
                            <Textarea rows={3} value={item.answer} onChange={(event) => setKnowledgeDrafts((current) => ({
                              ...current,
                              [h.id]: (current[h.id] ?? h.knowledge).map((entry, itemIndex) => itemIndex === index ? { ...entry, answer: event.target.value } : entry),
                            }))} />
                          </label>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" disabled={!(knowledgeDrafts[h.id] ?? h.knowledge).some((item) => item.question.trim() && item.answer.trim())} onClick={() => {
                          resubmitHandover(h.id, user.id, knowledgeDrafts[h.id] ?? h.knowledge);
                          setEditingHandover(null);
                          setKnowledgeDrafts((current) => { const next = { ...current }; delete next[h.id]; return next; });
                        }}>Save and resubmit</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingHandover(null); setKnowledgeDrafts((current) => { const next = { ...current }; delete next[h.id]; return next; }); }}>Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => {
                      setKnowledgeDrafts((current) => ({ ...current, [h.id]: h.knowledge.map((item) => ({ ...item })) }));
                      setEditingHandover(h.id);
                    }}>Edit and resubmit</Button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Awaiting manager review</span>
              )}
            </Card>
          ))}
        </div>
      );
    case "verification":
      if (roleCategory === "Incoming Member") {
        const myHandovers = handovers.filter((item) => item.status === "Approved" && item.to === user.id);
        const totalQuestions = myHandovers.reduce((total, item) => total + item.knowledge.length, 0);
        const myAssessments = assessments.filter((a) => a.personId === user.id && myHandovers.some((h) => h.id === a.handoverId));
        const totalAnswered = myAssessments.reduce((total, a) => total + Object.keys(a.answers).length, 0);
        const activeHandover = activeAssessmentHandoverId ? myHandovers.find((h) => h.id === activeAssessmentHandoverId) : null;
        return (
          <div className="space-y-4">
            {activeHandover && (
              <AssessmentWorkspace
                handover={activeHandover}
                personId={user.id}
                onClose={() => setActiveAssessmentHandoverId(null)}
              />
            )}
            <Card className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Your verification progress</p>
                  <p className="text-xs text-muted-foreground">Across all approved handovers assigned to you</p>
                </div>
                <b className="text-lg">{totalAnswered}/{totalQuestions}</b>
              </div>
              <Bar value={totalQuestions ? (totalAnswered / totalQuestions) * 100 : 0} />
              <p className="text-xs text-muted-foreground">
                {totalQuestions
                  ? (Math.round((totalAnswered / totalQuestions) * 100) + "% completed")
                  : "Verification will appear here when a manager approves a handover for you."}
              </p>
            </Card>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assessment workspace</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Each approved handover generates a structured assessment with multiple-choice and descriptive questions.
                Multiple-choice answers are auto-graded. Descriptive answers are always sent to your manager for review.
              </p>
            </div>
            {myHandovers.length === 0 ? (
              <Card>
                <p className="font-semibold">No approved handovers yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once a project manager approves a handover addressed to you, its knowledge assessment will appear here.
                </p>
              </Card>
            ) : myHandovers.map((handover) => (
              <Card key={handover.id} className="space-y-3">
                <AssessmentCard
                  handover={handover}
                  personId={user.id}
                  onStart={() => setActiveAssessmentHandoverId(handover.id)}
                />
              </Card>
            ))}
            <p className="text-xs text-muted-foreground">
              Demo: Question generation is deterministic from handover content. No live AI model is used.
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-5">
          <section className="space-y-3">
            <div>
              <h3 className="font-semibold">Assessment review queue</h3>
              <p className="text-sm text-muted-foreground">
                Review submitted assessments. Accept descriptive answers or request clarification.
                Multiple-choice answers are already auto-graded. This is manual review, not AI grading.
              </p>
            </div>
            <ManagerAssessmentReviewPanel />
          </section>
          <section className="space-y-3">
            <div>
              <h3 className="font-semibold">Legacy verification answers</h3>
              <p className="text-sm text-muted-foreground">Answers submitted through the previous verification flow.</p>
            </div>
            {answers.length === 0 ? (
              <Card><p className="font-medium">No submitted answers yet</p><p className="mt-1 text-sm text-muted-foreground">Incoming members' responses will appear here after they complete verification questions.</p></Card>
            ) : answers.map((answer) => {
              const handover = handovers.find((item) => item.id === answer.handoverId);
              const latestReview = answerReviews.filter((item) => item.answerId === answer.id).slice(-1)[0];
              return (
                <Card key={answer.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2"><Avatar id={answer.personId} size={34} /><div className="min-w-0"><p className="text-sm font-semibold">{personById(answer.personId).name}</p><p className="text-xs text-muted-foreground">{handover?.project ?? "Project handover"} · Submitted {new Date(answer.submittedAt).toLocaleString()}</p></div></div>
                    {latestReview ? (
                      <Pill tone={latestReview.action === "knowledge_gap" ? "warning" : "success"}>{latestReview.action === "knowledge_gap" ? "Knowledge gap flagged" : "Reviewed"}</Pill>
                    ) : <Pill tone="accent">Needs review</Pill>}
                  </div>
                  <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Question</p><p className="text-sm">{answer.question}</p></div>
                  <div className="space-y-1 rounded-xl bg-muted p-3"><p className="text-xs font-medium text-muted-foreground">Incoming member's answer</p><p className="text-sm">{answer.answer}</p></div>
                  {latestReview ? (
                    <div className="rounded-xl border border-border p-3 text-sm">
                      <p className="font-medium">{latestReview.action === "knowledge_gap" ? "Manager feedback — knowledge gap" : "Manager review complete"}</p>
                      {latestReview.comment && <p className="mt-1 text-muted-foreground">{latestReview.comment}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">Reviewed by {personById(latestReview.reviewerId).name} · {new Date(latestReview.reviewedAt).toLocaleString()}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        rows={2}
                        value={answerReviewDrafts[answer.id] ?? ""}
                        onChange={(event) => setAnswerReviewDrafts((current) => ({ ...current, [answer.id]: event.target.value }))}
                        placeholder="Optional feedback for the incoming member. Required when flagging a knowledge gap."
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => { reviewAnswer(answer.id, user.id, "reviewed", answerReviewDrafts[answer.id] ?? ""); setAnswerReviewDrafts((current) => ({ ...current, [answer.id]: "" })); }}>Mark reviewed</Button>
                        <Button size="sm" disabled={!(answerReviewDrafts[answer.id] ?? "").trim()} onClick={() => { reviewAnswer(answer.id, user.id, "knowledge_gap", answerReviewDrafts[answer.id] ?? ""); setAnswerReviewDrafts((current) => ({ ...current, [answer.id]: "" })); }}>Flag knowledge gap</Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">Sample readiness indicators</h3>
            {verification.map((v) => (
              <Card key={v.who} className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <div className="flex min-w-[180px] flex-1 items-center gap-3">
                  <Avatar id={v.who} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex justify-between text-sm"><b>{personById(v.who).name}</b><span>{v.readiness}%</span></div>
                    <Bar value={v.readiness} color={"var(--" + readinessTone(v.readiness) + ")"} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={readinessTone(v.readiness)}>{readinessLabel(v.readiness)}</Pill>
                  <Button size="sm" variant="outline" onClick={() => ui.openVerify(v.who)}>Ask questions</Button>
                </div>
              </Card>
            ))}
          </section>
        </div>
      );
    case "readiness": {
      const incomingMemberIds = [...new Set(handovers.map((handover) => handover.to))];
      const approvedHandovers = handovers.filter((handover) => handover.status === "Approved");
      const pendingHandovers = handovers.filter((handover) =>
        handover.status === "Pending approval" || handover.status === "Changes requested",
      );
      const rejectedHandovers = handovers.filter((handover) => handover.status === "Rejected");
      const reviewedAnswerIds = new Set(answerReviews.map((review) => review.answerId));
      const knowledgeGapAnswerIds = new Set(
        answerReviews.filter((review) => review.action === "knowledge_gap").map((review) => review.answerId),
      );
      const unreviewedAnswerCount = answers.filter((answer) => !reviewedAnswerIds.has(answer.id)).length;
      // Count assessments pending manager review
      const pendingAssessmentReviews = assessments.filter((a) => {
        const derived = deriveAssessmentStatus(a, assessmentReviews);
        return derived === "awaiting_review";
      }).length;
      const memberReadiness = incomingMemberIds.map((memberId) => {
        const memberHandovers = approvedHandovers.filter((handover) => handover.to === memberId);
        const memberHandoverIds = new Set(memberHandovers.map((handover) => handover.id));
        const expectedQuestions = memberHandovers.reduce((total, handover) => total + handover.knowledge.length, 0);
        const memberAnswers = answers.filter((answer) =>
          answer.personId === memberId && memberHandoverIds.has(answer.handoverId),
        );
        const memberAssessments = assessments
          .filter((a) => a.personId === memberId && memberHandoverIds.has(a.handoverId))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const assessmentAnswerCount = memberAssessments.reduce(
          (total, assessment) => total + Object.keys(assessment.answers).length,
          0,
        );
        const completedQuestions = Math.min(
          Math.max(memberAnswers.length, assessmentAnswerCount),
          expectedQuestions,
        );
        const reviewedCount = memberAnswers.filter((answer) => reviewedAnswerIds.has(answer.id)).length
          + memberAssessments.reduce(
            (total, assessment) => total + Object.values(assessment.answers)
              .filter((answer) => answer.reviewStatus === "accepted").length,
            0,
          );
        const gapCount = memberAnswers.filter((answer) => knowledgeGapAnswerIds.has(answer.id)).length
          + memberAssessments.reduce(
            (total, assessment) => total + (assessment.score?.knowledgeGaps.length ?? 0),
            0,
          );
        const awaitingHandoverCount = handovers.filter((handover) =>
          handover.to === memberId && (handover.status === "Pending approval" || handover.status === "Changes requested"),
        ).length;
        const rejectedCount = handovers.filter((handover) => handover.to === memberId && handover.status === "Rejected").length;
        const latestAssessment = memberAssessments[0];
        const latestAssessmentStatus = latestAssessment
          ? deriveAssessmentStatus(latestAssessment, assessmentReviews)
          : (expectedQuestions > 0 ? "not_started" : null);
        return {
          memberId,
          memberHandovers,
          expectedQuestions,
          completedQuestions,
          progress: expectedQuestions ? Math.round((completedQuestions / expectedQuestions) * 100) : 0,
          reviewedCount,
          gapCount,
          awaitingHandoverCount,
          rejectedCount,
          unreviewedCount: memberAnswers.filter((answer) => !reviewedAnswerIds.has(answer.id)).length,
          latestAssessmentStatus,
        };
      });
      return (
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Knowledge transfer readiness</p>
                <p className="text-sm text-muted-foreground">Progress is calculated from approved handovers, submitted assessments, and manager review records in this demo.</p>
              </div>
              <Pill tone="accent">Demo metrics</Pill>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Approved handovers</p><p className="text-xl font-semibold">{approvedHandovers.length}</p></div>
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Awaiting approval / changes</p><p className="text-xl font-semibold">{pendingHandovers.length}</p></div>
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Assessments pending review</p><p className="text-xl font-semibold">{pendingAssessmentReviews + unreviewedAnswerCount}</p></div>
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Knowledge gaps flagged</p><p className="text-xl font-semibold">{knowledgeGapAnswerIds.size}</p></div>
            </div>
            {rejectedHandovers.length > 0 && <p className="text-xs text-muted-foreground">{rejectedHandovers.length} handover(s) have been rejected and need follow-up before knowledge transfer can proceed.</p>}
          </Card>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">Incoming member progress</h3>
              <p className="text-xs text-muted-foreground">Completion = submitted answers ÷ questions in approved handovers. Assessment status reflects structured assessment results where available.</p>
            </div>
            {memberReadiness.length === 0 ? (
              <Card><p className="font-medium">No incoming handovers yet</p><p className="mt-1 text-sm text-muted-foreground">Member progress will appear here once handovers are created.</p></Card>
            ) : memberReadiness.map((member) => (
              <Card key={member.memberId} className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar id={member.memberId} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{personById(member.memberId).name}</p>
                    <p className="text-xs text-muted-foreground">{member.memberHandovers.length} approved handover(s) · {member.completedQuestions}/{member.expectedQuestions} questions answered</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {member.latestAssessmentStatus && (
                      <Pill tone={statusTone[member.latestAssessmentStatus]}>
                        {statusLabel[member.latestAssessmentStatus]}
                      </Pill>
                    )}
                    {member.expectedQuestions > 0
                      ? <Pill tone={member.progress === 100 ? "success" : member.progress > 0 ? "warning" : "danger"}>{member.progress}% complete</Pill>
                      : <Pill tone="neutral">Not started</Pill>}
                  </div>
                </div>
                <Bar value={member.progress} color={"var(--" + (member.progress === 100 ? "chart-2" : "chart-1") + ")"} />
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-md bg-muted p-2"><span className="text-muted-foreground">Reviewed</span><p className="mt-1 font-semibold">{member.reviewedCount}</p></div>
                  <div className="rounded-md bg-muted p-2"><span className="text-muted-foreground">Knowledge gaps</span><p className="mt-1 font-semibold">{member.gapCount}</p></div>
                  <div className="rounded-md bg-muted p-2"><span className="text-muted-foreground">Awaiting review</span><p className="mt-1 font-semibold">{member.unreviewedCount}</p></div>
                  <div className="rounded-md bg-muted p-2"><span className="text-muted-foreground">Handover actions</span><p className="mt-1 font-semibold">{member.awaitingHandoverCount + member.rejectedCount}</p></div>
                </div>
                {(member.gapCount > 0 || member.awaitingHandoverCount > 0 || member.rejectedCount > 0) && (
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">Follow-up needed</p>
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      {member.gapCount > 0 && <li>{member.gapCount} answer(s) flagged as knowledge gaps</li>}
                      {member.awaitingHandoverCount > 0 && <li>{member.awaitingHandoverCount} handover(s) awaiting approval or resubmission</li>}
                      {member.rejectedCount > 0 && <li>{member.rejectedCount} rejected handover(s)</li>}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => ui.openVerify(member.memberId)}>View verification</Button>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">These are local demo metrics based on browser data. They do not assess answer correctness, source evidence, or production readiness.</p>
        </div>
      );
    }
    case "activity":
      return (
        <div className="space-y-3">
          {activities.length === 0 ? <Card><p className="font-semibold">No activity yet</p><p className="mt-1 text-sm text-muted-foreground">Workspace actions will appear here as the team uses the demo.</p></Card> : activities.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center gap-3"><Avatar id={a.who} size={38} status /><p className="min-w-0 flex-1 break-words text-sm"><b>{personById(a.who).name}</b> {a.text}</p><span className="ml-auto text-xs text-muted-foreground">{a.when}</span></Card>
          ))}
        </div>
      );
    case "settings":
      return (
        <Card className="max-w-xl space-y-5">
          <div>
            <p className="font-semibold">Browser-local demo preferences</p>
            <p className="mt-1 text-xs text-muted-foreground">These settings are saved only in this browser. They do not send real emails or deliver notifications.</p>
          </div>
          {preferenceOptions.map(({ label, key }) => (
            <label key={key} className="flex items-center justify-between gap-4 text-sm">
              {label}
              <Switch
                checked={preferences[key]}
                onCheckedChange={(checked) => {
                  if (updatePreference(key, checked)) {
                    toast.success("Browser-local preference saved.");
                  } else {
                    toast.error("Could not save this browser-local preference.");
                  }
                }}
              />
            </label>
          ))}
          {Boolean(loadError || saveError) && (
            <p className="text-xs text-danger">
              {saveError ? "A preference could not be saved in this browser." : "Saved preferences could not be read; default values are shown."}
            </p>
          )}
        </Card>
      );
    default:
      return null;
  }
}
