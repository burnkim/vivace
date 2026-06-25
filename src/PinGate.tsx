import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Delete } from "lucide-react";
import { useStudio } from "./state/store";

/** SHA-256 of `vivace:000000` — the default PIN when none has been set. */
export const DEFAULT_PIN_HASH = "235e41fdfea3b1b1872922ee7cff03c83cdde8de116c19e83b7577fd1899dccf";

/** Hash a 6-digit PIN the same way the gate stores it (salted SHA-256, hex). */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode("vivace:" + pin);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SESSION_KEY = "vivace-unlocked";

/**
 * Soft access gate. Shows a 6-digit PIN lock screen before the app; once
 * entered correctly it stays unlocked for the browser session. The expected PIN
 * lives in the synced document (`doc.security.pinHash`), so the owner sets it
 * once and it applies on every device. Client-side only — a deterrent, not
 * real security (the menu data is anon-readable).
 */
export function PinGate({ children }: { children: ReactNode }) {
  const pinHash = useStudio((s) => s.doc.security?.pinHash);
  const syncStatus = useStudio((s) => s.syncStatus);
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
  });
  const unlock = useCallback(() => {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
    setUnlocked(true);
  }, []);

  if (unlocked) return <>{children}</>;
  return <LockScreen loading={syncStatus === "loading"} target={pinHash || DEFAULT_PIN_HASH} onUnlock={unlock} />;
}

function LockScreen({ loading, target, onUnlock }: { loading: boolean; target: string; onUnlock: () => void }) {
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const busy = loading || checking;

  useEffect(() => {
    if (entry.length !== 6) return;
    let alive = true;
    setChecking(true);
    hashPin(entry).then((h) => {
      if (!alive) return;
      if (h === target) onUnlock();
      else { setError(true); setEntry(""); setChecking(false); setTimeout(() => { if (alive) setError(false); }, 700); }
    });
    return () => { alive = false; };
  }, [entry, target, onUnlock]);

  const press = (d: string) => setEntry((e) => (busy || e.length >= 6 ? e : e + d));
  const back = () => setEntry((e) => (busy ? e : e.slice(0, -1)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f1ec] px-6 text-[#2a2723]">
      <div className="flex w-full max-w-[320px] flex-col items-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#c2603f] text-white shadow-sm" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>V</div>
        <div className="text-[16px] font-semibold">Vivace 메뉴</div>
        <div className="mb-7 mt-1 text-[13px] text-[#837e74]">{loading ? "불러오는 중…" : error ? "비밀번호가 틀렸습니다" : "비밀번호 6자리를 입력하세요"}</div>

        <div className="mb-9 flex gap-3.5" style={{ animation: error ? "vivace-shake 0.4s" : undefined }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="size-3.5 rounded-full border" style={{ borderColor: error ? "#c84a30" : "#c8c2b6", background: i < entry.length ? (error ? "#c84a30" : "#2a2723") : "transparent" }} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <KeyBtn key={d} onClick={() => press(d)} disabled={busy}>{d}</KeyBtn>
          ))}
          <span />
          <KeyBtn onClick={() => press("0")} disabled={busy}>0</KeyBtn>
          <KeyBtn onClick={back} disabled={busy} label="한 자리 지우기"><Delete className="size-5" /></KeyBtn>
        </div>
      </div>
    </div>
  );
}

function KeyBtn({ children, onClick, disabled, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button aria-label={label} onClick={onClick} disabled={disabled} className="flex size-16 items-center justify-center rounded-full border border-[#e6e2da] bg-white text-[22px] font-medium text-[#2a2723] shadow-sm transition-colors active:bg-[#efe7df] disabled:opacity-40">
      {children}
    </button>
  );
}
