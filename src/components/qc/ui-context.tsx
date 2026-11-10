import { createContext, useContext } from "react";

export type UIApi = {
  openProfile: (id: string) => void;
  openProject: (id: string) => void;
  openHandover: () => void;
  openVerify: (personId?: string) => void;
  openNotifications: () => void;
};

export const UICtx = createContext<UIApi | null>(null);
export const useUI = () => {
  const v = useContext(UICtx);
  if (!v) throw new Error("useUI outside AppShell");
  return v;
};
