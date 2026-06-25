import { PageSheet, ScaleToFit, pageSizePx } from "../render/Page";
import { useStudio, currentPage } from "../state/store";

export function Canvas({ interactive = true }: { interactive?: boolean }) {
  const doc = useStudio((s) => s.doc);
  const page = useStudio(currentPage);
  const selectedId = useStudio((s) => s.selectedId);
  const select = useStudio((s) => s.select);
  const { w, h } = pageSizePx(page);

  return (
    <div className="h-full w-full bg-[#ece9e3]">
      <ScaleToFit width={w} height={h}>
        <PageSheet
          doc={doc}
          page={page}
          interactive={interactive}
          selectedId={selectedId}
          onSelect={select}
          onBackgroundClick={() => select(null)}
        />
      </ScaleToFit>
    </div>
  );
}

const SHEET_SHADOW = "0 4px 12px rgba(40,30,20,.06), 0 18px 50px rgba(40,30,20,.10)";

/** Two pages (e.g. A4 좌 + 우) side by side. Interactive in edit mode: click a
    block on either sheet to select+edit it. */
export function PairCanvas({ leftId, rightId, interactive = false }: { leftId: string; rightId: string; interactive?: boolean }) {
  const doc = useStudio((s) => s.doc);
  const selectedId = useStudio((s) => s.selectedId);
  const select = useStudio((s) => s.select);
  const left = doc.pages.find((p) => p.id === leftId);
  const right = doc.pages.find((p) => p.id === rightId);
  if (!left || !right) return null;
  const lp = pageSizePx(left);
  const rp = pageSizePx(right);
  const gap = 90;
  const totalW = lp.w + rp.w + gap;
  const totalH = Math.max(lp.h, rp.h);
  const sheet = (page: typeof left) => (
    <div style={{ boxShadow: SHEET_SHADOW, flexShrink: 0 }}>
      <PageSheet doc={doc} page={page} interactive={interactive} selectedId={selectedId} onSelect={select} onBackgroundClick={() => select(null)} />
    </div>
  );

  return (
    <div className="h-full w-full bg-[#ece9e3]">
      <ScaleToFit width={totalW} height={totalH} shadow={false}>
        <div style={{ display: "flex", gap, alignItems: "flex-start" }}>
          {sheet(left)}
          {sheet(right)}
        </div>
      </ScaleToFit>
    </div>
  );
}
