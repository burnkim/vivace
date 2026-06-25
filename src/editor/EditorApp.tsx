import { useState } from "react";
import { Columns2, Eye, FileDown, Pencil, RotateCcw, SlidersHorizontal, Smartphone } from "lucide-react";
import { useStudio } from "../state/store";
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

export function EditorApp() {
  const doc = useStudio((s) => s.doc);
  const currentPageId = useStudio((s) => s.currentPageId);
  const setPage = useStudio((s) => s.setPage);
  const resetDoc = useStudio((s) => s.resetDoc);
  const setUiMode = useStudio((s) => s.setUiMode);
  const syncStatus = useStudio((s) => s.syncStatus);
  const pairIds = PAIR[currentPageId];
  const [preview, setPreview] = useState(false);
  const [pair, setPair] = useState(false);
  const [settings, setSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#f3f1ec] text-[#2a2723]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e6e2da] bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#c2603f] text-white shadow-sm" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>V</div>
            <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-[19px] font-bold tracking-tight text-[#2a2723]">Vivace</span>
          </div>
          <div className="h-5 w-px bg-[#e6e2da]" />
          <div className="flex items-center gap-1 rounded-lg bg-[#f0ede7] p-0.5">
            {doc.pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`rounded-md px-2.5 py-1 text-[12px] transition-colors ${currentPageId === p.id ? "bg-white text-[#2a2723] shadow-sm" : "text-[#837e74] hover:text-[#2a2723]"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          {doc.pages.find((p) => p.id === currentPageId)?.mirror && (
            <span className="rounded-md bg-[#f6ece4] px-2.5 py-1 text-[11px] font-medium text-[#a94e31]">A4와 자동 연동 (내용 공유)</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <SyncBadge status={syncStatus} />
          <div className="mx-1 h-5 w-px bg-[#e6e2da]" />
          <button onClick={() => setUiMode("edit")} title="모바일 간편 수정모드로 전환" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-[#45413a] hover:bg-[#f1eee8]">
            <Smartphone className="size-3.5" /> 수정모드
          </button>
          <button onClick={() => setPreview((v) => !v)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-[#45413a] hover:bg-[#f1eee8]">
            {preview ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
            {preview ? "편집" : "미리보기"}
          </button>
          {pairIds && (
            <button onClick={() => setPair((v) => !v)} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] ${pair ? "bg-[#f6ece4] text-[#a94e31]" : "text-[#45413a] hover:bg-[#f1eee8]"}`}>
              <Columns2 className="size-3.5" /> 좌우 함께
            </button>
          )}
          <button onClick={() => setSettings((s) => !s)} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] ${settings ? "bg-[#f6ece4] text-[#a94e31]" : "text-[#45413a] hover:bg-[#f1eee8]"}`}>
            <SlidersHorizontal className="size-3.5" /> 설정
          </button>
          <button onClick={() => { if (confirm("기본 메뉴로 초기화할까요? 현재 변경사항이 사라집니다.")) resetDoc(); }} className="flex items-center rounded-md p-1.5 text-[#837e74] hover:bg-[#f1eee8] hover:text-[#2a2723]" title="기본 메뉴로 초기화">
            <RotateCcw className="size-4" />
          </button>
          <button onClick={() => setExporting(true)} className="ml-1 flex items-center gap-1.5 rounded-md bg-[#c2603f] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#a94e31]">
            <FileDown className="size-3.5" /> 내보내기
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {!preview && (
          <aside className="w-[230px] shrink-0 border-r border-[#ebe7df] bg-[#ffffff]">
            <LayersPanel />
          </aside>
        )}
        <main className="min-w-0 flex-1">
          {pair && pairIds ? <PairCanvas leftId={pairIds[0]} rightId={pairIds[1]} interactive={!preview} /> : <Canvas interactive={!preview} />}
        </main>
        {!preview && (
          <aside className="w-[300px] shrink-0 border-l border-[#ebe7df] bg-[#ffffff]">
            {settings ? <DocSettings onClose={() => setSettings(false)} /> : <Inspector />}
          </aside>
        )}
      </div>

      {exporting && <ExportModal onClose={() => setExporting(false)} />}
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
    <span className="flex items-center gap-1.5 rounded-md border border-[#e6e2da] px-2 py-1.5 text-[11px]" style={{ color: s.text }}>
      <span className="size-1.5 rounded-full" style={{ background: s.dot }} /> {s.label}
    </span>
  );
}
