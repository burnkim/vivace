import { PAGE_META, PAGE_ORDER, type PageId } from "../data/section-layout";
import { PAPER_MM } from "../menu/tokens";

/**
 * Capture an off-screen page node and emit a single-page PDF at the exact paper
 * size (mm). Pages are rendered at native px (~300 DPI) so the capture is print
 * sharp. Libraries are imported dynamically to keep them out of the main bundle.
 */
async function pageToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");
  // Ensure web fonts are loaded before rasterizing, or text falls back.
  if (document.fonts?.ready) await document.fonts.ready;
  return html2canvas(node, {
    backgroundColor: "#ffffff",
    scale: 1, // node is already at native (300 DPI) px
    useCORS: true,
    logging: false,
    width: node.offsetWidth,
    height: node.offsetHeight,
    windowWidth: node.offsetWidth,
    windowHeight: node.offsetHeight,
  });
}

async function canvasToPdf(canvas: HTMLCanvasElement, page: PageId) {
  const { jsPDF } = await import("jspdf");
  const meta = PAGE_META[page];
  const { w, h } = PAPER_MM[meta.paper];
  const pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "mm", format: [w, h] });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, w, h);
  return pdf;
}

/** Render a single PageId (looked up by DOM id) to a downloaded PDF file. */
export async function exportPagePdf(page: PageId, domId: string): Promise<void> {
  const node = document.getElementById(domId);
  if (!node) throw new Error(`Export node "${domId}" not found`);
  const canvas = await pageToCanvas(node);
  const pdf = await canvasToPdf(canvas, page);
  pdf.save(`${PAGE_META[page].fileStem}.pdf`);
}

/** Export all five formats, each as its own PDF file. `domIdFor` maps a page to its node id. */
export async function exportAllPdfs(domIdFor: (p: PageId) => string): Promise<void> {
  for (const page of PAGE_ORDER) {
    // sequential to avoid html2canvas contention
    // eslint-disable-next-line no-await-in-loop
    await exportPagePdf(page, domIdFor(page));
  }
}
