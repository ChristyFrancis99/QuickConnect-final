import { Link, useNavigate } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle, ClipboardList, FolderKanban, GraduationCap, Lightbulb, Users, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { people, personById } from "@/lib/data";
import { AiAvatar, Avatar, Bar, Card, Pill, SectionHead, readinessLabel, readinessTone } from "./primitives";
import { useUI } from "./ui-context";
import { useQuickConnect } from "@/lib/quick-connect-store";
import { useAuth } from "@/lib/auth-store";

export function DashboardMain() {
  const ui = useUI();
  const { user, roleCategory } = useAuth();
  const { projects, handovers, verification, answers } = useQuickConnect();
  const avg = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  const averageReadiness = verification.length ? Math.round(verification.reduce((sum, item) => sum + item.readiness, 0) / verification.length) : 0;
  const pendingHandovers = handovers.filter((item) => item.status !== "Approved").length;
  const paymentHandover = handovers.find((item) => item.projectId === "pay");
  const paymentAnswers = paymentHandover ? answers.filter((item) => item.handoverId === paymentHandover.id).length : 0;
  const roleStats = [
    { value: String(projects.length).padStart(2, "0"), label: "Active Projects", icon: FolderKanban, section: "projects", roles: ["Outgoing Member", "Incoming Member", "Project Manager", "Organisation Admin"] },
    { value: String(people.length).padStart(2, "0"), label: "Team Members", icon: Users, section: "team", roles: ["Project Manager", "Organisation Admin"] },
    { value: String(pendingHandovers).padStart(2, "0"), label: "Pending Handovers", icon: ClipboardList, section: "handovers", roles: ["Outgoing Member", "Project Manager", "Organisation Admin"] },
    { value: `${averageReadiness}%`, label: "Average Readiness", icon: GraduationCap, section: "readiness", roles: ["Project Manager", "Organisation Admin"] },
  ] as const;
  const stats = roleStats.filter((item) => item.roles.includes(roleCategory));
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5 rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold sm:text-2xl">Good to see you, {user.name.split(" ")[0]}!</h2>
          <p className="mt-1 max-w-md text-sm opacity-90">{handovers.length} handovers are due this month. Capture what your team knows before people move on, so work keeps moving.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(roleCategory === "Outgoing Member" || roleCategory === "Organisation Admin") && <Button variant="secondary" className="rounded-xl bg-card text-foreground hover:bg-card/90" onClick={ui.openHandover}>Create New Handover</Button>}
            {(roleCategory === "Incoming Member" || roleCategory === "Project Manager" || roleCategory === "Organisation Admin") && <Button variant="ghost" className="rounded-xl text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" onClick={() => ui.openVerify(roleCategory === "Incoming Member" ? user.id : undefined)}>Start verification</Button>}
          </div>
        </div>
        <div className="hidden -space-x-4 sm:flex">
          {["priya", "alex", "david"].map((id) => <Avatar key={id} id={id} size={64} ring />)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to="/$section" params={{ section: s.section }} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><s.icon className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block text-xl font-bold leading-tight">{s.value}</span><span className="block truncate text-[11px] text-muted-foreground">{s.label}</span></span>
          </Link>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Project Overview</h3>
          <span className="text-sm font-semibold">{projects.length} projects</span>
        </div>
        {projects.length === 0 ? <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No project data is available yet. Projects will appear here when added to the workspace.</p> : <div className="grid items-center gap-6 md:grid-cols-[200px_1fr]">
          <div className="relative mx-auto h-[200px] w-[200px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={projects} dataKey="progress" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                  {projects.map((p) => <Cell key={p.id} fill={p.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><p className="text-2xl font-bold">{avg}%</p><p className="text-[11px] text-muted-foreground">avg. complete</p></div>
            </div>
          </div>
          <div className="space-y-4">
            {projects.map((p) => (
              <button key={p.id} onClick={() => ui.openProject(p.id)} className="block w-full text-left">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name}</span>
                  <span className="font-semibold">{p.progress}%</span>
                </div>
                <Bar value={p.progress} color={p.color} />
              </button>
            ))}
          </div>
        </div>} 
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <SectionHead title="Knowledge Loss Alerts" />
          <div className="space-y-2.5">
            {[
              { t: "Payment module knowledge depends on one developer.", tone: "danger" as const, l: "Critical" },
              { t: "4 project decisions in Slack are undocumented.", tone: "warning" as const, l: "Undocumented" },
              { t: "Only Alex knows the mobile release process.", tone: "danger" as const, l: "Single person" },
            ].map((a) => (
              <div key={a.t} className="flex items-start gap-3 rounded-xl bg-muted p-3">
                <AlertTriangle className={a.tone === "danger" ? "mt-0.5 h-4 w-4 shrink-0 text-danger" : "mt-0.5 h-4 w-4 shrink-0 text-warning"} />
                <div className="min-w-0 flex-1 text-sm">{a.t}</div>
                <Pill tone={a.tone}>{a.l}</Pill>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHead title="AI Handover Status" action="Open" onAction={() => ui.openProject("pay")} />
          <p className="mb-3 text-xs text-muted-foreground">Payment Integration · Alex → Priya</p>
          <ol className="space-y-3">
            {[
            { l: "Handover sources", d: paymentHandover ? `${paymentHandover.knowledge.length} knowledge points` : "No handover yet", done: !!paymentHandover },
            { l: "Handover approved", d: paymentHandover?.status === "Approved" ? "Approved" : "Awaiting approval", done: paymentHandover?.status === "Approved" },
            { l: "Knowledge verified", d: paymentHandover ? `${paymentAnswers} of ${paymentHandover.knowledge.length} answers` : "No answers yet", done: !!paymentHandover && paymentAnswers >= paymentHandover.knowledge.length },
            { l: "Manager approval", d: paymentHandover?.status === "Approved" ? "David Chen" : "Pending", done: paymentHandover?.status === "Approved" },
            ].map((s) => (
              <li key={s.l} className="flex items-center gap-3 text-sm">
                {s.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className="flex-1">{s.l}</span><span className="text-xs text-muted-foreground">{s.d}</span>
              </li>
            ))}
          </ol>
        </Card>
        {(roleCategory === "Incoming Member" || roleCategory === "Project Manager" || roleCategory === "Organisation Admin") && <Card>
          <SectionHead title="Knowledge Verification" action="Start session" onAction={() => ui.openVerify(roleCategory === "Incoming Member" ? user.id : undefined)} />
          <div className="space-y-4">
            {verification.map((v) => {
              const p = personById(v.who);
              return (
                <div key={v.who} className="flex items-center gap-3">
                  <Avatar id={v.who} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-sm"><span className="truncate font-medium">{p.name}</span><span className="font-semibold">{v.readiness}%</span></div>
                    <Bar value={v.readiness} color={`var(--${readinessTone(v.readiness)})`} />
                  </div>
                  <button onClick={() => ui.openVerify(roleCategory === "Incoming Member" ? user.id : v.who)}><Pill tone={readinessTone(v.readiness)}>{readinessLabel(v.readiness)}</Pill></button>
                </div>
              );
            })}
          </div>
        </Card>}
        <Card>
          <SectionHead title="AI Insights" />
          <div className="space-y-2.5">
            {["3 undocumented decisions detected", "2 critical task dependencies identified", "1 project requires immediate handover review"].map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-xl bg-accent/10 p-3 text-sm">
                <AiAvatar size={30} /><span className="flex-1">{t}</span><Lightbulb className="h-4 w-4 text-accent" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ActivityPanel() {
  const ui = useUI();
  const nav = useNavigate();
  const { handovers, activities } = useQuickConnect();
  const go = (section: string) => nav({ to: "/$section", params: { section } });
  const team = ["arjun", "meera", "david", "priya"];
  return (
    <div className="space-y-7">
      <h2 className="text-2xl font-bold tracking-tight">My Activity</h2>
      <section>
        <SectionHead title="Upcoming Handovers" action="View all" onAction={() => go("handovers")} />
        <div className="space-y-2.5">
          {handovers.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-center leading-none text-secondary-foreground">
                <div><p className="text-base font-bold">{h.date}</p><p className="text-[9px] uppercase">{h.month}</p></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{h.project}</p>
                <p className="truncate text-[11px] text-muted-foreground">{h.time} · {personById(h.from).name.split(" ")[0]} → {personById(h.to).name.split(" ")[0]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionHead title="Recent Activities" action="View all" onAction={() => go("activity")} />
        <div className="space-y-2.5">
          {activities.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
              <Avatar id={a.who} size={36} status />
              <div className="min-w-0"><p className="text-sm"><b>{personById(a.who).name.split(" ")[0]}</b> {a.text}</p><p className="text-[11px] text-muted-foreground">{a.when}</p></div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionHead title="Team Members" action="View all" onAction={() => go("team")} />
        <div className="space-y-2.5">
          {team.map((id) => {
            const p = people.find((x) => x.id === id)!;
            return (
              <div key={id} className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-soft">
                <Avatar id={id} size={36} status />
                <button onClick={() => ui.openProfile(id)} className="min-w-0 text-left hover:text-primary">
                  <p className="truncate text-sm font-semibold">{p.name}</p><p className="text-[11px] text-muted-foreground">{p.role}</p>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
