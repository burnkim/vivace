import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * App mode = who is using the app right now.
 *  - "design":  full control (layout, margins, fonts, style) — for the owner-operator
 *               who sets the template up once.
 *  - "operate": locked design; only menu content (add/remove items, names, prices).
 *               This is what the cafe owner uses day to day.
 *
 * UI-only state (not part of the menu document); persisted per browser.
 */
export type AppMode = "operate" | "design";

const KEY = "vivace-app-mode";

type Ctx = { mode: AppMode; setMode: (m: AppMode) => void };

const AppModeContext = createContext<Ctx | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      return (localStorage.getItem(KEY) as AppMode) || "design";
    } catch {
      return "design";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  return <AppModeContext.Provider value={{ mode, setMode }}>{children}</AppModeContext.Provider>;
}

export function useAppMode(): Ctx {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within an AppModeProvider");
  return ctx;
}
