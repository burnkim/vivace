import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileDown, Check } from "lucide-react";
import { useStudio } from "../state/store";
import { PageSheet, pageSizePx } from "../render/Page";
import { pageMm } from "../core/tokens";

/** Native canvas is 300 DPI px; this scale maps it to CSS px (= mm-accurate). */
const PRINT_SCALE = 96 / 300;

/** Default save-as filename per page (the browser uses document.title). */
const FILENAME: Record<string, string> = {
  a4all: "Vivace_Menu_01A4All",
  a4l: "Vivace_Menu_02A4L",
  a4r: "Vivace_Menu_03A4R",
  a3l: "Vivace_Menu_04A3L",
  a3r: "Vivace_Menu_05A3R",
};
const fileNameFor = (p: { id: string; name: string }) => FILENAME[p.id] ?? `Vivace_Menu_${p.name.replace(/[^\w가-힣]+/g, "")}`;

export function ExportModal({ onClose }: { onClose: () => void }) {
  const doc = useStudio((s) => s.doc);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  /** Pages still to print, in order. The HEAD is the page printing right now;
      each `afterprint` shifts it off so the next page prints — one OS save
      dialog at a time, so every page lands in its OWN PDF file. */
  const [queue, setQueue] = useState<string[]>([]);

  const printId = queue[0] ?? null;
  const page = printId ? doc.pages.find((p) => p.id === printId) ?? null : null;
  const exporting = queue.length > 0;

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allOn = selected.size === doc.pages.length;
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(doc.pages.map((p) => p.id)));
  const start = () => {
    if (!selected.size) return;
    setQueue(doc.pages.filter((p) => selected.has(p.id)).map((p) => p.id)); // keep page order
  };

  useEffect(() => {
    if (!page) return;
    const mm = pageMm(page.paper, page.orientation, { widthMm: page.widthMm, heightMm: page.heightMm });
    let style = document.getElementById("print-page-size") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "print-page-size";
      document.head.appendChild(style);
    }
    style.textContent = `@page{size:${mm.w}mm ${mm.h}mm;margin:0}`;
    // The browser's "Save as PDF" default filename = document.title.
    const prevTitle = document.title;
    document.title = fileNameFor(page);
    const done = () => { document.title = prevTitle; setQueue((q) => q.slice(1)); }; // advance to next page
    window.addEventListener("afterprint", done, { once: true });
    const t = setTimeout(() => window.print(), 200); // let the print layer paint first
    return () => {
      clearTimeout(t);
      document.title = prevTitle;
      window.removeEventListener("afterprint", done);
    };
  }, [page]);

  const px = page ? pageSizePx(page) : null;
  const mm = page ? pageMm(page.paper, page.orientation, { widthMm: page.widthMm, heightMm: page.heightMm }) : null;
  const printedCount = exporting ? selected.size - queue.length + 1 : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a2723]/30 p-6 backdrop-blur-sm" onClick={exporting ? undefined : onClose}>
        <div onClick={(e) => e.stopPropagation()} className="w-[460px] rounded-xl border border-[#e6e2da] bg-[#ffffff] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px] font-semibold text-[#2a2723]">PDF 내보내기</div>
            <button onClick={onClose} disabled={exporting} className="rounded p-1 text-[#837e74] hover:bg-[#f1eee8] hover:text-[#2a2723] disabled:opacity-40"><X className="size-4" /></button>
          </div>
          <p className="mb-3 rounded-md bg-[#faf1e7] px-3 py-2 text-[11px] leading-relaxed text-[#a6712f]">내보낼 시트를 <b>체크</b>하고 아래 버튼을 누르세요. 선택한 수만큼 인쇄 대화상자가 순서대로 열립니다 — 각각 <b>대상 → PDF로 저장</b>을 선택하면 <b>파일이 따로따로</b> 저장됩니다. (벡터 텍스트·여백 0)</p>

          <button onClick={toggleAll} disabled={exporting} className="mb-1 flex w-full items-center gap-2 px-1 py-1 text-[12px] font-medium text-[#45413a] disabled:opacity-50">
            <Box on={allOn} /> 전체 선택
            <span className="ml-auto text-[11px] font-normal text-[#9a958b]">{selected.size}/{doc.pages.length} 선택됨</span>
          </button>

          <div className="space-y-1.5">
            {doc.pages.map((p) => {
              const on = selected.has(p.id);
              const isCurrent = exporting && p.id === printId;
              return (
                <button
                  key={p.id}
                  onClick={() => !exporting && toggle(p.id)}
                  disabled={exporting}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-[13px] text-[#2a2723] disabled:cursor-default ${on ? "border-[#c2603f] bg-[#fbf4ef]" : "border-[#e6e2da] bg-[#faf9f6] hover:border-[#d8d2c8]"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Box on={on} />
                    {p.name} <span className="text-[11px] text-[#9a958b]">· {p.paper.toUpperCase()}</span>
                  </span>
                  {isCurrent && <span className="text-[11px] font-medium text-[#a6712f]">저장 중…</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={start}
            disabled={selected.size === 0 || exporting}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#c2603f] py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#a94e31] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileDown className="size-4" />
            {exporting ? `내보내는 중… (${printedCount}/${selected.size})` : `선택한 ${selected.size || ""}개 PDF로 내보내기`}
          </button>
        </div>
      </div>

      {page && px && mm &&
        createPortal(
          <div className="print-layer">
            <div style={{ width: `${mm.w}mm`, height: `${mm.h}mm`, overflow: "hidden" }}>
              <div style={{ width: px.w, height: px.h, transform: `scale(${PRINT_SCALE})`, transformOrigin: "top left" }}>
                <PageSheet doc={doc} page={page} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Small square checkbox indicator (purely visual; the row button handles clicks). */
function Box({ on }: { on: boolean }) {
  return (
    <span className={`flex size-[18px] shrink-0 items-center justify-center rounded border ${on ? "border-[#c2603f] bg-[#c2603f] text-white" : "border-[#c8c2b6] bg-white"}`}>
      {on && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}
