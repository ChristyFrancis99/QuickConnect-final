import { useCallback, useEffect, useState } from "react";

export type PreferenceKey =
  "handoverDueNotifications" | "knowledgeRiskAlerts" | "weeklyReadinessDigest";

export type Preferences = Record<PreferenceKey, boolean>;

export const DEFAULT_PREFERENCES: Preferences = {
  handoverDueNotifications: true,
  knowledgeRiskAlerts: true,
  weeklyReadinessDigest: false,
};

export const PREFERENCES_STORAGE_KEY = "quickconnect.preferences.v1";

type PreferenceStorageResult = {
  preferences: Preferences;
  error: unknown | null;
};

type SavePreferenceResult = {
  saved: boolean;
  error: unknown | null;
};

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function loadPreferences(
  storage: Storage | null = getBrowserStorage(),
): PreferenceStorageResult {
  if (!storage) return { preferences: DEFAULT_PREFERENCES, error: null };

  let saved: string | null;
  try {
    saved = storage.getItem(PREFERENCES_STORAGE_KEY);
  } catch (error) {
    return { preferences: DEFAULT_PREFERENCES, error };
  }

  if (!saved) return { preferences: DEFAULT_PREFERENCES, error: null };

  try {
    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed))
      return {
        preferences: DEFAULT_PREFERENCES,
        error: new Error("Saved preferences are not an object."),
      };

    return {
      preferences: {
        handoverDueNotifications:
          typeof parsed.handoverDueNotifications === "boolean"
            ? parsed.handoverDueNotifications
            : DEFAULT_PREFERENCES.handoverDueNotifications,
        knowledgeRiskAlerts:
          typeof parsed.knowledgeRiskAlerts === "boolean"
            ? parsed.knowledgeRiskAlerts
            : DEFAULT_PREFERENCES.knowledgeRiskAlerts,
        weeklyReadinessDigest:
          typeof parsed.weeklyReadinessDigest === "boolean"
            ? parsed.weeklyReadinessDigest
            : DEFAULT_PREFERENCES.weeklyReadinessDigest,
      },
      error: null,
    };
  } catch (error) {
    return { preferences: DEFAULT_PREFERENCES, error };
  }
}

export function savePreference(
  key: PreferenceKey,
  value: boolean,
  storage: Storage | null = getBrowserStorage(),
): SavePreferenceResult {
  if (!storage) return { saved: false, error: new Error("Browser storage is unavailable.") };

  try {
    const loaded = loadPreferences(storage);
    if (loaded.error) return { saved: false, error: loaded.error };
    const current = loaded.preferences;
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ ...current, [key]: value }));
    return { saved: true, error: null };
  } catch (error) {
    return { saved: false, error };
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loadError, setLoadError] = useState<unknown | null>(null);
  const [saveError, setSaveError] = useState<unknown | null>(null);

  useEffect(() => {
    const result = loadPreferences();
    setPreferences(result.preferences);
    setLoadError(result.error);
  }, []);

  const updatePreference = useCallback((key: PreferenceKey, value: boolean) => {
    const result = savePreference(key, value);

    if (!result.saved) {
      setSaveError(result.error);
      return false;
    }

    setPreferences((current) => ({ ...current, [key]: value }));
    setSaveError(null);
    return true;
  }, []);

  return { preferences, updatePreference, loadError, saveError };
}
