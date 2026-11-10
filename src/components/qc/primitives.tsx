import type { ReactNode } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { personById } from "@/lib/data";
import { useUI } from "./ui-context";

export function Avatar({ id, size = 36, ring = false, status = false }: { id: string; size?: number; ring?: boolean; status?: boolean }) {
  const ui = useUI();
  const p = personById(id);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); ui.openProfile(id); }}
      className={cn("relative shrink-0 rounded-full transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-xs overflow-hidden", ring && "ring-2 ring-card")}
      style={{ width: size, height: size, backgroundColor: p.bgColor }}
      aria-label={`Open ${p.name}'s profile`}
    >
      <img src={p.avatar} alt={p.name} className="h-full w-full rounded-full object-cover" />
      {status && (
        <span className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card", p.status === "active" ? "bg-success" : "bg-warning")} />
      )}
    </button>
  );
}

export function AiAvatar({ size = 36 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-accent/20 text-accent" style={{ width: size, height: size }}>
      <Bot className="h-1/2 w-1/2" />
    </span>
  );
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn("rounded-2xl bg-card p-5 text-card-foreground shadow-soft", onClick && "cursor-pointer transition hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      {children}
    </div>
  );
}

export function Bar({ value, color = "var(--primary)" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

const tones = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-secondary-foreground",
  danger: "bg-danger/15 text-danger",
  accent: "bg-accent/15 text-accent",
  neutral: "bg-secondary text-secondary-foreground",
};
export type Tone = keyof typeof tones;
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}

export const readinessTone = (v: number): Tone => (v >= 80 ? "success" : v >= 65 ? "warning" : "danger");
export const readinessLabel = (v: number) => (v >= 80 ? "Ready" : v >= 65 ? "On track" : "Needs support");

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold">{title}</h3>
      {action && (
        <button onClick={onAction} className="text-xs font-medium text-primary hover:underline">{action}</button>
      )}
    </div>
  );
}
