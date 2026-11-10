import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity, BarChart3, Bell, BrainCircuit, ChevronDown, Database, FileText, FolderKanban,
  LayoutDashboard, Menu, Moon, Search, Settings, ShieldCheck, ShieldAlert, Sun, Users, Link2,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { navItems, people } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { useQuickConnect } from "@/lib/quick-connect-store";
import { toast } from "sonner";
import { UICtx, type UIApi } from "./ui-context";
import { Dialogs, type DialogState } from "./dialogs";
import { ActivityPanel } from "./Dashboard";

const roleNavigation: Record<string, string[]> = {
  "Outgoing Member": ["dashboard", "projects", "handovers", "activity"],
  "Incoming Member": ["dashboard", "projects", "verification", "timeline", "activity"],
  "Project Manager": ["dashboard", "projects", "team", "handovers", "verification", "readiness", "risk-radar", "timeline", "activity"],
  "Organisation Admin": navItems.map((item) => item.slug),
};

const icons = {
  dashboard: LayoutDashboard, projects: FolderKanban, team: Users, sources: Database, analysis: BrainCircuit,
  handovers: FileText, verification: ShieldCheck, readiness: BarChart3, "risk-radar": ShieldAlert, timeline: Activity, activity: Activity, settings: Settings,
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Link2 className="h-5 w-5" /></span>
      <div>
        <p className="text-base font-bold text-sidebar-accent-foreground">QuickConnect</p>
        <p className="text-[10px] text-sidebar-foreground/70">Connect Knowledge. Continue Work.</p>
      </div>
    </div>
  );
}

function SidebarBody({ active, dark, setDark, onNav }: { active: string; dark: boolean; setDark: (v: boolean) => void; onNav?: () => void }) {
  const { user, roleCategory, logout } = useAuth();
  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-5 text-sidebar-foreground">
      <Logo />
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.filter((item) => roleNavigation[roleCategory]?.includes(item.slug)).map((n) => {
          const Icon = icons[n.slug];
          const cls = cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            active === n.slug ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          );
          return n.slug === "dashboard" ? (
            <Link key={n.slug} to="/" onClick={onNav} className={cls}><Icon className="h-4 w-4" />{n.label}</Link>
          ) : (
            <Link key={n.slug} to="/$section" params={{ section: n.slug }} onClick={onNav} className={cls}><Icon className="h-4 w-4" />{n.label}</Link>
          );
        })}
      </nav>
      <div className="space-y-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border p-2.5 text-left transition hover:bg-sidebar-accent/50">
            <span className="relative">
              <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover shadow-xs" style={{ backgroundColor: user.bgColor }} />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-sidebar-accent-foreground">{user.name}</span>
              <span className="block truncate text-[11px] text-sidebar-foreground/70">{roleCategory} · Active</span>
            </span>
            <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2.5 py-2 border-b border-border/40 text-xs">
              <p className="font-semibold text-foreground">{user.name}</p>
              <p className="text-[11px] text-muted-foreground">{user.email}</p>
              <span className="mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/20 text-foreground">
                Role: {roleCategory}
              </span>
            </div>
            <DropdownMenuItem asChild><Link to="/login">Switch role or account</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/$section" params={{ section: "settings" }}>Account settings</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/$section" params={{ section: "activity" }}>My activity</Link></DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                logout();
                toast.success("Signed out of QuickConnect");
                window.location.href = "/login";
              }}
              className="text-danger focus:text-danger"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-sidebar-accent p-1 text-xs font-medium">
          <button onClick={() => setDark(false)} className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2", !dark && "bg-sidebar-primary text-sidebar-primary-foreground")}><Sun className="h-3.5 w-3.5" />Light</button>
          <button onClick={() => setDark(true)} className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2", dark && "bg-sidebar-primary text-sidebar-primary-foreground")}><Moon className="h-3.5 w-3.5" />Dark</button>
        </div>
      </div>
    </div>
  );
}

function SearchBox({ ui }: { ui: UIApi }) {
  const [q, setQ] = useState("");
  const { projects } = useQuickConnect();
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return [
      ...projects.filter((p) => p.name.toLowerCase().includes(s)).map((p) => ({ key: p.id, label: p.name, sub: "Project", go: () => ui.openProject(p.id) })),
      ...people.filter((p) => (p.name + p.role).toLowerCase().includes(s)).map((p) => ({ key: p.id, label: p.name, sub: p.role, go: () => ui.openProfile(p.id) })),
    ].slice(0, 6);
  }, [q, ui, projects]);
  return (
    <div className="relative flex-1 min-w-0 sm:w-64 sm:flex-initial">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search projects or people"
        aria-label="Search projects or people"
        className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
      />
      {q && (
        <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-2xl border border-border bg-popover shadow-soft animate-in fade-in-50 zoom-in-95">
          {results.length ? results.map((r) => (
            <button key={r.sub + r.key} onClick={() => { r.go(); setQ(""); }} className="flex w-full justify-between px-4 py-2.5 text-left text-sm transition hover:bg-muted active:bg-muted/80">
              <span>{r.label}</span><span className="text-xs text-muted-foreground">{r.sub}</span>
            </button>
          )) : <p className="px-4 py-3 text-sm text-muted-foreground">No matches</p>}
        </div>
      )}
    </div>
  );
}

export function AppShell({ active, title, subtitle, children, aside }: { active: string; title: string; subtitle?: string | undefined; children: ReactNode; aside?: ReactNode }) {
  const { user, roleCategory } = useAuth();
  const [dlg, setDlg] = useState<DialogState>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const ui = useMemo<UIApi>(() => ({
    openProfile: (id) => setDlg({ kind: "profile", id }),
    openProject: (id) => setDlg({ kind: "project", id }),
    openHandover: () => setDlg({ kind: "handover" }),
    openVerify: (id = "priya") => setDlg({ kind: "verify", id }),
    openNotifications: () => setActivityOpen(true),
  }), []);

  return (
    <UICtx.Provider value={ui}>
      <div className="h-dvh min-h-screen w-full overflow-hidden bg-background">
        <div className="flex h-full w-full overflow-hidden bg-sidebar">
          <aside className="hidden w-64 shrink-0 lg:block"><SidebarBody active={active} dark={dark} setDark={setDark} /></aside>
          <Sheet open={mobileNav} onOpenChange={setMobileNav}>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody active={active} dark={dark} setDark={setDark} onNav={() => setMobileNav(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background xl:flex-row xl:overflow-hidden">
            <main className="w-full min-w-0 flex-none p-4 sm:p-7 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
              <header className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <button onClick={() => setMobileNav(true)} className="mt-1 rounded-lg bg-card p-2 shadow-soft lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
                    {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                  </div>
                </div>
                <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:shrink-0 sm:gap-3">
                  <SearchBox ui={ui} />
                  <button onClick={ui.openNotifications} className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card shadow-soft transition hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Notifications">
                    <Bell className="h-4 w-4" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger" />
                  </button>
                  <Link
                    to="/login"
                    title="Switch role or account"
                    className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-soft hover:bg-muted transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate max-w-[100px]">{user.name.split(" ")[0]}</span>
                    <span className="rounded-md px-1.5 py-0.2 text-[10px] font-medium bg-primary/15 text-foreground">{roleCategory}</span>
                  </Link>
                </div>
              </header>
              {children}
            </main>

          </div>
        </div>
      </div>
      <Sheet open={activityOpen} onOpenChange={setActivityOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto border-0 bg-panel p-5 sm:max-w-[400px] sm:p-7">
          <SheetTitle className="sr-only">My Activity</SheetTitle>
          <ActivityPanel />
        </SheetContent>
      </Sheet>
      <Dialogs state={dlg} close={() => setDlg(null)} />
    </UICtx.Provider>
  );
}
