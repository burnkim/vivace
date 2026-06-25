import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MenuPage } from "../pages/MenuPage";
import { ScaleToFit } from "../view/ScaleToFit";
import { useMenuStore } from "../../state/menu-store";
import { exportPagePdf, exportAllPdfs } from "../../export/pdf";
import { PAGE_ORDER, PAGE_META, type PageId } from "../../data/section-layout";
import { PAGE_PX } from "../../menu/tokens";

const captureId = (p: PageId) => `vivace-capture-${p}`;

export function ExportPanel() {
  const { data } = useMenuStore();
  const [busy, setBusy] = useState<PageId | "all" | null>(null);

  const runOne = async (p: PageId) => {
    setBusy(p);
    try {
      await exportPagePdf(p, captureId(p));
      toast.success(`${PAGE_META[p].label} PDF 저장됨`);
    } catch (e) {
      toast.error(`내보내기 실패: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const runAll = async () => {
    setBusy("all");
    try {
      await exportAllPdfs(captureId);
      toast.success("5종 PDF 모두 저장됨");
    } catch (e) {
      toast.error(`내보내기 실패: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 className="font-medium">PDF 내보내기</h2>
          <p className="text-muted-foreground text-sm">5종 인쇄 포맷 · 정확한 용지 치수(A4/A3)</p>
        </div>
        <Button onClick={runAll} disabled={busy !== null}>
          {busy === "all" ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Download className="mr-1 size-4" />}
          전체 5종 내보내기
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-4 lg:grid-cols-3">
        {PAGE_ORDER.map((p) => {
          const px = PAGE_PX[PAGE_META[p].paper];
          return (
            <Card key={p} className="flex flex-col gap-3 p-3">
              <div className="bg-muted h-72 overflow-hidden rounded">
                <ScaleToFit contentWidth={px.w} contentHeight={px.h} mode="contain" padding={8}>
                  <MenuPage page={p} data={data} />
                </ScaleToFit>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{PAGE_META[p].label}</span>
                <Button variant="outline" size="sm" onClick={() => runOne(p)} disabled={busy !== null}>
                  {busy === p ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Off-screen native-size capture targets (real layout, just shifted away). */}
      <div aria-hidden style={{ position: "fixed", left: -100000, top: 0, pointerEvents: "none", opacity: 0 }}>
        {PAGE_ORDER.map((p) => (
          <MenuPage key={p} page={p} data={data} domId={captureId(p)} />
        ))}
      </div>
    </div>
  );
}
