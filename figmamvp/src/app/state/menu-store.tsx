import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { MENU_SEED } from "../data/menu-seed";
import type { MenuData } from "../data/menu-types";
import {
  loadRemote,
  saveRemote,
  isRemoteEnabled,
} from "./menu-sync";

const LOCAL_KEY = "vivace-menu-data-v2";

/** Backfill any missing config (older saved docs predate the layout system). */
function normalize(data: MenuData): MenuData {
  if (data.config?.layouts && data.config?.style) return data;
  return { ...data, config: structuredClone(MENU_SEED.config) };
}

type Status = "loading" | "ready" | "saving" | "error";

type State = { data: MenuData; status: Status };

type Action =
  | { type: "hydrate"; data: MenuData }
  | { type: "set"; data: MenuData }
  | { type: "status"; status: Status };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
    case "set":
      return { ...state, data: action.data };
    case "status":
      return { ...state, status: action.status };
  }
}

type StoreValue = {
  data: MenuData;
  status: Status;
  /** Replace the whole menu (used by the editor on every field change). */
  update: (next: MenuData) => void;
  /** Reset to the seeded menu. */
  reset: () => void;
};

const MenuStoreContext = createContext<StoreValue | null>(null);

function readLocal(): MenuData | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? normalize(JSON.parse(raw) as MenuData) : null;
  } catch {
    return null;
  }
}

function writeLocal(data: MenuData) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function MenuStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    data: MENU_SEED,
    status: "loading",
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial hydration: prefer remote (Supabase) -> local -> seed.
  // When remote is enabled but empty, initialize it from local/seed so other
  // devices have data before the first edit.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isRemoteEnabled()) {
        try {
          const remoteRaw = await loadRemote();
          if (cancelled) return;
          const remote = remoteRaw ? normalize(remoteRaw) : null;
          if (remote) {
            dispatch({ type: "hydrate", data: remote });
            writeLocal(remote);
            dispatch({ type: "status", status: "ready" });
            return;
          }
          // Remote empty: seed it with whatever we have locally (or the seed).
          const initial = readLocal() ?? MENU_SEED;
          dispatch({ type: "hydrate", data: initial });
          writeLocal(initial);
          try {
            await saveRemote(initial);
          } catch {
            /* leave for the next edit to retry */
          }
          if (!cancelled) dispatch({ type: "status", status: "ready" });
          return;
        } catch {
          /* network/remote failure -> fall through to local */
        }
      }
      const local = readLocal();
      if (!cancelled) {
        if (local) dispatch({ type: "hydrate", data: local });
        dispatch({ type: "status", status: "ready" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (next: MenuData) => {
    writeLocal(next);
    if (!isRemoteEnabled()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    dispatch({ type: "status", status: "saving" });
    saveTimer.current = setTimeout(async () => {
      try {
        await saveRemote(next);
        dispatch({ type: "status", status: "ready" });
      } catch {
        dispatch({ type: "status", status: "error" });
      }
    }, 600);
  };

  const value: StoreValue = {
    data: state.data,
    status: state.status,
    update: (next) => {
      dispatch({ type: "set", data: next });
      persist(next);
    },
    reset: () => {
      dispatch({ type: "set", data: MENU_SEED });
      persist(MENU_SEED);
    },
  };

  return <MenuStoreContext.Provider value={value}>{children}</MenuStoreContext.Provider>;
}

export function useMenuStore(): StoreValue {
  const ctx = useContext(MenuStoreContext);
  if (!ctx) throw new Error("useMenuStore must be used within a MenuStoreProvider");
  return ctx;
}
