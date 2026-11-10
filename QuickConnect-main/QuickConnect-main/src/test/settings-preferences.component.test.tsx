import { UICtx, type UIApi } from "@/components/qc/ui-context";
import { SectionView } from "@/components/qc/Sections";
import { AuthProvider } from "@/lib/auth-store";
import { PREFERENCES_STORAGE_KEY } from "@/lib/preferences";
import { QuickConnectProvider } from "@/lib/quick-connect-store";
import { AssessmentProvider } from "@/lib/assessment-store";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("sonner", () => ({ toast }));

const ui: UIApi = {
  openProfile: vi.fn(),
  openProject: vi.fn(),
  openHandover: vi.fn(),
  openVerify: vi.fn(),
  openNotifications: vi.fn(),
};

const storageValues = new Map<string, string>();
const baseSetItem = (key: string, value: string) => {
  storageValues.set(key, value);
};
const localStorageMock: Storage = {
  getItem: vi.fn((key) => storageValues.get(key) ?? null),
  setItem: vi.fn(baseSetItem),
  removeItem: vi.fn((key) => {
    storageValues.delete(key);
  }),
  clear: vi.fn(() => {
    storageValues.clear();
  }),
  key: vi.fn((index) => Array.from(storageValues.keys())[index] ?? null),
  get length() {
    return storageValues.size;
  },
};

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: localStorageMock,
});

function renderSettings() {
  return render(
    <UICtx.Provider value={ui}>
      <AuthProvider>
        <QuickConnectProvider>
          <AssessmentProvider>
            <SectionView slug="settings" />
          </AssessmentProvider>
        </QuickConnectProvider>
      </AuthProvider>
    </UICtx.Provider>,
  );
}

function getSwitches() {
  return screen.getAllByRole("switch");
}

describe("Settings preferences", () => {
  beforeEach(() => {
    storageValues.clear();
    localStorageMock.setItem = vi.fn(baseSetItem);
    vi.clearAllMocks();
  });

  it("renders the Organisation Admin settings with the default switch states", async () => {
    renderSettings();

    await waitFor(() => {
      expect(getSwitches()).toHaveLength(3);
    });

    expect(getSwitches()[0]).toHaveAttribute("aria-checked", "true");
    expect(getSwitches()[1]).toHaveAttribute("aria-checked", "true");
    expect(getSwitches()[2]).toHaveAttribute("aria-checked", "false");
  });

  it("toggles one switch without changing the others", async () => {
    renderSettings();
    await waitFor(() => expect(getSwitches()).toHaveLength(3));
    const switches = getSwitches();

    fireEvent.click(switches[0]);

    expect(switches[0]).toHaveAttribute("aria-checked", "false");
    expect(switches[1]).toHaveAttribute("aria-checked", "true");
    expect(switches[2]).toHaveAttribute("aria-checked", "false");
  });

  it("shows success feedback after saving a preference", async () => {
    renderSettings();
    await waitFor(() => expect(getSwitches()).toHaveLength(3));
    const switches = getSwitches();

    fireEvent.click(switches[2]);

    expect(toast.success).toHaveBeenCalledWith("Browser-local preference saved.");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows an error instead of success feedback when saving fails", async () => {
    localStorageMock.setItem = vi.fn((key, value) => {
      if (key === PREFERENCES_STORAGE_KEY) {
        throw new Error("write failed");
      }
      baseSetItem(key, value);
    });

    renderSettings();
    await waitFor(() => expect(getSwitches()).toHaveLength(3));
    const switches = getSwitches();

    fireEvent.click(switches[0]);

    expect(toast.error).toHaveBeenCalledWith("Could not save this browser-local preference.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(
      screen.getByText("A preference could not be saved in this browser."),
    ).toBeInTheDocument();
  });

  it("restores saved preferences after remounting", async () => {
    const firstRender = renderSettings();
    await waitFor(() => expect(getSwitches()).toHaveLength(3));
    const switches = getSwitches();

    fireEvent.click(switches[0]);
    await waitFor(() => {
      expect(switches[0]).toHaveAttribute("aria-checked", "false");
    });

    firstRender.unmount();
    renderSettings();
    await waitFor(() => expect(getSwitches()).toHaveLength(3));
    const remountedSwitches = getSwitches();

    expect(remountedSwitches[0]).toHaveAttribute("aria-checked", "false");
    expect(remountedSwitches[1]).toHaveAttribute("aria-checked", "true");
    expect(remountedSwitches[2]).toHaveAttribute("aria-checked", "false");
  });
});
