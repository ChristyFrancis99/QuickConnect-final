import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type TimelineCategory = "Handover" | "Knowledge verification" | "Knowledge risks" | "Project continuity";
export type TimelineEventType =
  | "handover_created" | "handover_approved" | "handover_rejected" | "handover_changes_requested" | "handover_resubmitted"
  | "assessment_started" | "assessment_submitted" | "manager_review_completed" | "clarification_requested"
  | "knowledge_verified" | "needs_improvement"
  | "risk_detected" | "risk_owner_changed" | "risk_mitigation_started" | "risk_resolved"
  | "risk_accepted" | "risk_reopened" | "readiness_milestone";

export interface TimelineEvent {
  id: string;
  projectId: string;
  category: TimelineCategory;
  type: TimelineEventType;
  title: string;
  description: string;
  actorId: string;
  timestamp: string;
  handoverId?: string;
  assessmentId?: string;
  riskId?: string;
  metadata?: Record<string, string | number | boolean>;
}

const STORAGE_KEY = "quickconnect.timeline.v1";

function isTimelineEvent(value: unknown): value is TimelineEvent {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record["id"] === "string"
    && typeof record["projectId"] === "string"
    && ["Handover", "Knowledge verification", "Knowledge risks", "Project continuity"].includes(String(record["category"]))
    && typeof record["type"] === "string"
    && typeof record["title"] === "string"
    && typeof record["description"] === "string"
    && typeof record["actorId"] === "string"
    && typeof record["timestamp"] === "string"
    && (record["metadata"] === undefined || (typeof record["metadata"] === "object" && record["metadata"] !== null));
}

export function loadTimelineEvents(storage: Storage | null = typeof window === "undefined" ? null : window.localStorage): TimelineEvent[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTimelineEvent);
  } catch {
    return [];
  }
}

export interface TimelineApi {
  events: TimelineEvent[];
  recordEvent: (event: Omit<TimelineEvent, "id" | "timestamp"> & { id?: string; timestamp?: string }) => void;
}

const TimelineContext = createContext<TimelineApi | null>(null);

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEvents(loadTimelineEvents());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Timeline actions remain available for the current session.
    }
  }, [events, loaded]);

  const recordEvent = useCallback((event: Omit<TimelineEvent, "id" | "timestamp"> & { id?: string; timestamp?: string }) => {
    setEvents((current) => {
      const id = event.id ?? `${event.type}:${event.projectId}:${event.handoverId ?? event.assessmentId ?? event.riskId ?? ""}`;
      if (current.some((item) => item.id === id)) return current;
      return [...current, {
        ...event,
        id,
        timestamp: event.timestamp ?? new Date().toISOString(),
      }];
    });
  }, []);

  const api = useMemo(() => ({ events, recordEvent }), [events, recordEvent]);
  return <TimelineContext.Provider value={api}>{children}</TimelineContext.Provider>;
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (!context) throw new Error("useTimeline must be used within TimelineProvider");
  return context;
}

export function useOptionalTimeline() {
  return useContext(TimelineContext);
}

export function sortTimelineEvents(events: TimelineEvent[]) {
  return [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  filters: { projectId?: string; category?: TimelineCategory | "all"; query?: string; from?: string; to?: string },
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return sortTimelineEvents(events).filter((event) =>
    (!filters.projectId || filters.projectId === "all" || event.projectId === filters.projectId)
    && (!filters.category || filters.category === "all" || event.category === filters.category)
    && (!query || `${event.title} ${event.description} ${event.actorId}`.toLowerCase().includes(query))
    && (!filters.from || event.timestamp >= filters.from)
    && (!filters.to || event.timestamp <= `${filters.to}T23:59:59.999Z`),
  );
}
