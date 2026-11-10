import { describe, expect, it } from "vitest";
import {
  filterTimelineEvents,
  loadTimelineEvents,
  sortTimelineEvents,
  type TimelineEvent,
} from "@/lib/timeline-store";

const events: TimelineEvent[] = [
  {
    id: "older",
    projectId: "pay",
    category: "Handover",
    type: "handover_created",
    title: "Handover created",
    description: "Payment handover created",
    actorId: "alex",
    timestamp: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "newer",
    projectId: "pay",
    category: "Knowledge verification",
    type: "assessment_submitted",
    title: "Assessment submitted",
    description: "Priya submitted answers",
    actorId: "priya",
    timestamp: "2026-11-02T10:00:00.000Z",
  },
];

describe("timeline store helpers", () => {
  it("orders events newest first and filters by project, category, dates, and search", () => {
    expect(sortTimelineEvents(events).map((event) => event.id)).toEqual(["newer", "older"]);
    expect(filterTimelineEvents(events, { projectId: "pay", category: "Handover" })).toHaveLength(1);
    expect(filterTimelineEvents(events, { query: "priya" })[0]?.id).toBe("newer");
    expect(filterTimelineEvents(events, { from: "2026-11-02" })).toHaveLength(1);
  });

  it("recovers safely from malformed persisted records", () => {
    const invalidJson = { getItem: () => "{broken" } as unknown as Storage;
    expect(loadTimelineEvents(invalidJson)).toEqual([]);
    const partial = { getItem: () => JSON.stringify([{ id: "missing-fields" }, events[0]]) } as unknown as Storage;
    expect(loadTimelineEvents(partial)).toEqual([events[0]]);
  });
});
