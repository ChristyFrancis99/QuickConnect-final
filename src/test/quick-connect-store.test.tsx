import { QuickConnectProvider, useQuickConnect } from "@/lib/quick-connect-store";
import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

const storageValues = new Map<string, string>();
const localStorageMock: Storage = {
  getItem: (key) => storageValues.get(key) ?? null,
  setItem: (key, value) => {
    storageValues.set(key, value);
  },
  removeItem: (key) => {
    storageValues.delete(key);
  },
  clear: () => {
    storageValues.clear();
  },
  key: (index) => Array.from(storageValues.keys())[index] ?? null,
  get length() {
    return storageValues.size;
  },
};

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: localStorageMock,
});

function StoreCapture({
  onUpdate,
}: {
  onUpdate: (api: ReturnType<typeof useQuickConnect>) => void;
}) {
  onUpdate(useQuickConnect());
  return null;
}

function renderStore(onUpdate: (api: ReturnType<typeof useQuickConnect>) => void) {
  return render(
    <QuickConnectProvider>
      <StoreCapture onUpdate={onUpdate} />
    </QuickConnectProvider>,
  );
}

function handoverInput() {
  return {
    projectId: "pay",
    project: "Payment Integration",
    date: "10",
    month: "Nov",
    from: "alex",
    to: "priya",
    time: "2:30 PM",
    knowledge: [{ question: "What is being handed over?", answer: "Payment integration." }],
  };
}

describe("QuickConnect handover activity attribution", () => {
  beforeEach(() => {
    storageValues.clear();
  });

  it.each([
    ["Alex", "alex"],
    ["Christy", "christy"],
  ])("%s is recorded as the handover activity actor", async (_name, actorId) => {
    let api: ReturnType<typeof useQuickConnect> | undefined;
    renderStore((current) => {
      api = current;
    });

    await waitFor(() => expect(api).toBeDefined());
    act(() => {
      api?.addHandover(handoverInput(), actorId);
    });

    await waitFor(() => expect(api?.activities[0].who).toBe(actorId));
    expect(api?.activities[0].text).toBe("created a handover for Payment Integration");
  });

  it("adds a new handover with Pending approval status", async () => {
    let api: ReturnType<typeof useQuickConnect> | undefined;
    renderStore((current) => {
      api = current;
    });

    await waitFor(() => expect(api).toBeDefined());
    const initialCount = api?.handovers.length ?? 0;
    act(() => {
      api?.addHandover(handoverInput(), "alex");
    });

    await waitFor(() => expect(api?.handovers).toHaveLength(initialCount + 1));
    expect(api?.handovers[0].status).toBe("Pending approval");
    expect(api?.handovers[0].project).toBe("Payment Integration");
  });

  it("preserves revision and approval workflows after handover creation", async () => {
    let api: ReturnType<typeof useQuickConnect> | undefined;
    renderStore((current) => {
      api = current;
    });

    await waitFor(() => expect(api).toBeDefined());
    act(() => {
      api?.addHandover(handoverInput(), "alex");
    });
    await waitFor(() => expect(api?.handovers[0].status).toBe("Pending approval"));

    const handoverId = api?.handovers[0].id;
    expect(handoverId).toBeDefined();

    act(() => {
      api?.reviewHandover(handoverId!, "arjun", "changes_requested", "Add deployment notes.");
    });
    await waitFor(() => expect(api?.handovers[0].status).toBe("Changes requested"));

    act(() => {
      api?.resubmitHandover(handoverId!, "alex", [
        {
          question: "What is being handed over?",
          answer: "Payment integration and deployment notes.",
        },
      ]);
    });
    await waitFor(() => expect(api?.handovers[0].status).toBe("Pending approval"));

    act(() => {
      api?.approveHandover(handoverId!, "arjun");
    });
    await waitFor(() => expect(api?.handovers[0].status).toBe("Approved"));
    expect(api?.approvals[0].approvedBy).toBe("arjun");
  });
});
