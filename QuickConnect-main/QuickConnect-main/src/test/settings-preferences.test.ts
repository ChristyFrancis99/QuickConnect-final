import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  loadPreferences,
  savePreference,
} from "@/lib/preferences";

function createStorage(initial?: string): Storage {
  let value = initial ?? null;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key, nextValue) => {
      value = nextValue;
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(() => null),
    length: 0,
  };
}

describe("preferences storage", () => {
  it("uses the default preference values", () => {
    expect(loadPreferences(createStorage()).preferences).toEqual(DEFAULT_PREFERENCES);
  });

  it("loads saved preferences", () => {
    const storage = createStorage(
      JSON.stringify({ ...DEFAULT_PREFERENCES, weeklyReadinessDigest: true }),
    );
    expect(loadPreferences(storage).preferences.weeklyReadinessDigest).toBe(true);
  });

  it("merges partial preference objects with defaults", () => {
    const storage = createStorage(JSON.stringify({ weeklyReadinessDigest: true }));
    expect(loadPreferences(storage).preferences).toEqual({
      ...DEFAULT_PREFERENCES,
      weeklyReadinessDigest: true,
    });
  });

  it("recovers from invalid JSON", () => {
    const result = loadPreferences(createStorage("{"));
    expect(result.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(result.error).toBeInstanceOf(Error);
  });

  it("recovers invalid individual preference values", () => {
    const storage = createStorage(
      JSON.stringify({
        handoverDueNotifications: "yes",
        knowledgeRiskAlerts: null,
        weeklyReadinessDigest: true,
      }),
    );
    expect(loadPreferences(storage).preferences).toEqual({
      ...DEFAULT_PREFERENCES,
      weeklyReadinessDigest: true,
    });
  });

  it("updates one preference without losing the others", () => {
    const storage = createStorage();
    expect(savePreference("weeklyReadinessDigest", true, storage).saved).toBe(true);
    expect(JSON.parse(storage.getItem(PREFERENCES_STORAGE_KEY) as string)).toEqual({
      ...DEFAULT_PREFERENCES,
      weeklyReadinessDigest: true,
    });
  });

  it("persists preferences across reload-style reads", () => {
    const storage = createStorage();
    savePreference("knowledgeRiskAlerts", false, storage);
    expect(loadPreferences(storage).preferences.knowledgeRiskAlerts).toBe(false);
  });

  it("reports localStorage read failures", () => {
    const storage = createStorage();
    vi.mocked(storage.getItem).mockImplementation(() => {
      throw new Error("read failed");
    });
    const result = loadPreferences(storage);
    expect(result.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(result.error).toBeInstanceOf(Error);
  });

  it("does not overwrite data when localStorage cannot be read", () => {
    const storage = createStorage();
    vi.mocked(storage.getItem).mockImplementation(() => {
      throw new Error("read failed");
    });
    const result = savePreference("knowledgeRiskAlerts", false, storage);
    expect(result.saved).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("reports localStorage write failures", () => {
    const storage = createStorage();
    vi.mocked(storage.setItem).mockImplementation(() => {
      throw new Error("write failed");
    });
    const result = savePreference("knowledgeRiskAlerts", false, storage);
    expect(result.saved).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
