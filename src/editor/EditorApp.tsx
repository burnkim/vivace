import { useEffect, useState, type ReactNode } from "react";
import { Columns2, Eye, FileDown, Pencil, RotateCcw, SlidersHorizontal, Smartphone, Layers, X } from "lucide-react";
import { useStudio } from "../state/store";
import { BrandMark, BrandWordmark } from "../Brand";
import { Canvas, PairCanvas } from "./Canvas";
import { LayersPanel } from "./LayersPanel";
import { Inspector } from "./Inspector";
import { DocSettings } from "./DocSettings";
import { ExportModal } from "./ExportModal";

/** Page pairs shown together in the side-by-side preview. */
const PAIR: Record<string, [string, string]> = {
  a4l: ["a4l", "a4r"],
  a4r: ["a4l", "a4r"],
  a3l: ["a3l", "a3r"],
  a3r: ["a3l", "a3r"],
};

/** True on phone-width screens, kept reactive across rotation/resize. */
function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const fn = () => setM(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return m;
}

const shortPage = (name: string) => name.replace(/\s*\(.*\)$/, "");

export function EditorApp() {
  const doc = useStudio((s) => s.doc);
  const currentPageId = useStudio((s) => s.currentPageId);
  const setPage = useStudio((s) => s.setPage);
  const resetDoc = useStudio((s) => s.resetDoc);
  const setUiMode = useStudio((s) => s.setUiMode);
  const syncStatus = useStudio((s) => s.syncStatus);
  const isMobile = useIsMobile();
  const pairIds = PAIR[currentPageId];
  const [preview, setPreview] = useState(false);
  const [pair, setPair] = useState(false);
  const [settings, setSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const btn = "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-[#45413a] hover:bg-[#f1eee8] md:px-2.5";
  const lbl = "hidden md:inline";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#f3f1ec] text-[#2a2723]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#e6e2da] bg-white px-2 md:px-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <BrandMark size={28} />
            <span className="hidden sm:block"><BrandWordmark height={20} /></span>
          </div>
          <div className="hidden h-5 w-px shrink-0 bg-[#e6e2da] md:block" />
          <div className="studio-scroll flex items-center gap-1 overflow-x-auto rounded-lg bg-[#f0ede7] p-0.5">
            {doc.pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[12px] transition-colors md:px-2.5 ${currentPageId === p.id ? "bg-white text-[#2a2723] shadow-sm" : "text-[#837e74] hover:text-[#2a2723]"}`}
              >
                {isMobile ? shortPage(p.name) : p.name}
              </button>
            ))}
          </div>
          {!isMobile && doc.pages.find((p) => p.id === currentPageId)?.mirror && (
            <span className="shrink-0 rounded-md bg-[#f6ece4] px-2.5 py-1 text-[11px] font-medium text-[#a94e31]">A4와 자동 연동 (내용 공유)</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 md:gap-1.5">
          <SyncBadge status={syncStatus} />
          <div className="mx-1 hidden h-5 w-px bg-[#e6e2da] md:block" />
          <button onClick={() => setUiMode("edit")} title="모바일 간편 수정모드로 전환" className={`${btn} text-[#a94e31]`}>
            <Smartphone className="size-3.5" /> <span className={lbl}>수정모드</span>
          </button>
          <button onClick={() => setPreview((v) => !v)} className={btn} title={preview ? "편집" : "미리보기"}>
            {preview ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
            <span className={lbl}>{preview ? "편집" : "미리보기"}</span>
          </button>
          {pairIds && (
            <button onClick={() => setPair((v) => !v)} title="좌우 함께 보기" className={`hidden md:flex ${pair ? "items-center gap-1.5 rounded-md bg-[#f6ece4] px-2.5 py-1.5 text-[12px] text-[#a94e31]" : btn}`}>
              <Columns2 className="size-3.5" /> <span className={lbl}>좌우 함께</span>
            </button>
          )}
          <button onClick={() => setSettings((s) => !s)} title="문서 설정" className={settings ? "flex items-center gap-1.5 rounded-md bg-[#f6ece4] px-2 py-1.5 text-[12px] text-[#a94e31] md:px-2.5" : btn}>
            <SlidersHorizontal className="size-3.5" /> <span className={lbl}>설정</span>
          </button>
          <button onClick={() => { if (confirm("기본 메뉴로 초기화할까요? 현재 변경사항이 사라집니다.")) resetDoc(); }} className="flex shrink-0 items-center rounded-md p-1.5 text-[#837e74] hover:bg-[#f1eee8] hover:text-[#2a2723]" title="기본 메뉴로 초기화">
            <RotateCcw className="size-4" />
          </button>
          <button onClick={() => setExporting(true)} title="PDF 내보내기" className="ml-0.5 flex shrink-0 items-center gap-1.5 rounded-md bg-[#c2603f] px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#a94e31] md:ml-1 md:px-3.5">
            <FileDown className="size-3.5" /> <span className={lbl}>내보내기</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1">
        {!preview && !isMobile && (
          <aside className="w-[230px] shrink-0 border-r border-[#ebe7df] bg-[#ffffff]">
            <LayersPanel />
          </aside>
        )}
        <main className="min-w-0 flex-1">
          {pair && pairIds ? <PairCanvas leftId={pairIds[0]} rightId={pairIds[1]} interactive={!preview} /> : <Canvas interactive={!preview} />}
        </main>
        {!preview && !isMobile && (
          <aside className="w-[300px] shrink-0 border-l border-[#ebe7df] bg-[#ffffff]">
            {settings ? <DocSettings onClose={() => setSettings(false)} /> : <Inspector />}
          </aside>
        )}

        {!preview && isMobile && <MobilePanels settings={settings} setSettings={setSettings} />}
      </div>

      {exporting && <ExportModal onClose={() => setExporting(false)} />}
    </div>
  );
}

/**
 * Mobile side panels — closed to the edges showing only a tab; tapping a tab
 * opens that panel as a side-anchored sheet capped at half the screen height.
 */
function MobilePanels({ settings, setSettings }: { settings: boolean; setSettings: (v: boolean) => void }) {
  const selectedId = useStudio((s) => s.selectedId);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Selecting a block on the canvas, or opening 설정, pops the right sheet.
  useEffect(() => { if (selectedId) setRightOpen(true); }, [selectedId]);
  useEffect(() => { if (settings) setRightOpen(true); }, [settings]);

  const closeRight = () => { setRightOpen(false); if (settings) setSettings(false); };

  return (
    <>
      {!leftOpen && <EdgeTab side="left" label="레이어" icon={<Layers className="size-4" />} onClick={() => setLeftOpen(true)} />}
      {!rightOpen && <EdgeTab side="right" label={settings ? "설정" : "편집"} icon={settings ? <SlidersHorizontal className="size-4" /> : <Pencil className="size-4" />} onClick={() => setRightOpen(true)} />}

      {(leftOpen || rightOpen) && <div className="fixed inset-0 z-30 bg-black/10" onClick={() => { setLeftOpen(false); closeRight(); }} />}

      <Drawer side="left" open={leftOpen} title="레이어" onClose={() => setLeftOpen(false)}>
        <LayersPanel />
      </Drawer>
      <Drawer side="right" open={rightOpen} title={settings ? "문서 설정" : "편집"} onClose={closeRight}>
        {settings ? <DocSettings onClose={closeRight} /> : <Inspector />}
      </Drawer>
    </>
  );
}

function EdgeTab({ side, label, icon, onClick }: { side: "left" | "right"; label: string; icon: ReactNode; onClick: () => void }) {
  const pos = side === "left" ? "left-0 rounded-r-xl border-l-0" : "right-0 rounded-l-xl border-r-0";
  return (
    <button onClick={onClick} className={`fixed top-1/2 ${pos} z-20 flex -translate-y-1/2 flex-col items-center gap-1.5 border border-[#e6e2da] bg-white/95 px-1.5 py-3 text-[10px] font-medium text-[#837e74] shadow-md backdrop-blur`}>
      {icon}
      <span style={{ writingMode: "vertical-rl" }}>{label}</span>
    </button>
  );
}

function Drawer({ side, open, title, onClose, children }: { side: "left" | "right"; open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  const pos = side === "left" ? "left-0 rounded-tr-2xl border-r" : "right-0 rounded-tl-2xl border-l";
  return (
    <div className={`fixed bottom-0 ${pos} z-40 flex w-[86vw] max-w-[340px] flex-col border-t border-[#e6e2da] bg-white shadow-2xl`} style={{ maxHeight: "50vh" }}>
      <div className="flex shrink-0 items-center justify-between border-b border-[#ebe7df] px-3 py-2">
        <span className="text-[12px] font-semibold text-[#45413a]">{title}</span>
        <button onClick={onClose} className="rounded p-1 text-[#837e74] hover:bg-[#f1eee8] hover:text-[#2a2723]"><X className="size-4" /></button>
      </div>
      <div className="studio-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function SyncBadge({ status }: { status: import("../state/store").SyncStatus }) {
  const map: Record<string, { label: string; dot: string; text: string }> = {
    local: { label: "로컬", dot: "#9a958b", text: "#837e74" },
    loading: { label: "동기화 중…", dot: "#c2603f", text: "#a6712f" },
    saving: { label: "저장 중…", dot: "#c2603f", text: "#a6712f" },
    synced: { label: "동기화됨", dot: "#2f9e6b", text: "#1d8f5e" },
    error: { label: "오프라인", dot: "#c98a3b", text: "#9a6b1e" },
  };
  const s = map[status] ?? map.local;
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-transparent px-1 py-1.5 text-[11px] md:border-[#e6e2da] md:px-2" style={{ color: s.text }}>
      <span className="size-1.5 rounded-full" style={{ background: s.dot }} /> <span className="hidden md:inline">{s.label}</span>
    </span>
  );
}
