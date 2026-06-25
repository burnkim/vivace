import { useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Monitor, Plus, GripVertical, Eye, FileDown, Save, X } from "lucide-react";
import {
  DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS, type Transform } from "@dnd-kit/utilities";
import { useStudio } from "../state/store";
import type { SyncStatus } from "../state/store";
import { walk, uid } from "../core/doc";
import { createBackup } from "../lib/backups";
import type { Bean, GroupBlock, HandDripBlock, MenuDocument, MenuItem, SectionBlock, TextBlock } from "../core/types";
import { PageSheet, ScaleToFit, pageSizePx } from "../render/Page";
import { ExportModal } from "./ExportModal";

/**
 * 수정모드 — a phone-friendly editor for content only (menu names / prices /
 * descriptions, hand-drip beans, text blocks). Long-press a row to drag-reorder.
 * 미리보기 / PDF / 백업 are here too, so the owner never has to open 관리자모드.
 * Edits the CANONICAL blocks (non-mirrors) so one change flows to every layout.
 */
function collectEditable(doc: MenuDocument) {
  const hasSource = (root: GroupBlock) => {
    let yes = false;
    walk(root, (b) => {
      if ((b.type === "section" && !b.itemsFrom) || (b.type === "handdrip" && !b.beansFrom)) yes = true;
    });
    return yes;
  };
  const sections: SectionBlock[] = [];
  const handdrips: HandDripBlock[] = [];
  const texts: TextBlock[] = [];
  for (const p of doc.pages) {
    if (p.mirror || !hasSource(p.root)) continue;
    walk(p.root, (b) => {
      if (b.type === "section" && !b.itemsFrom) sections.push(b);
      else if (b.type === "handdrip" && !b.beansFrom) handdrips.push(b);
      else if (b.type === "text") texts.push(b);
    });
  }
  return { sections, handdrips, texts };
}

export function EditMode() {
  const doc = useStudio((s) => s.doc);
  const syncStatus = useStudio((s) => s.syncStatus);
  const setUiMode = useStudio((s) => s.setUiMode);
  const { sections, handdrips, texts } = useMemo(() => collectEditable(doc), [doc]);

  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  // Long-press (220ms) to start a drag — a quick tap still expands the card.
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(PointerSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );
  const onItemDrag = (sectionId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    useStudio.getState().updateBlock(sectionId, (b) => {
      const arr = (b as SectionBlock).items;
      const from = arr.findIndex((x) => x.id === active.id);
      const to = arr.findIndex((x) => x.id === over.id);
      if (from >= 0 && to >= 0) (b as SectionBlock).items = arrayMove(arr, from, to);
    });
  };
  const onBeanDrag = (blockId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    useStudio.getState().updateBlock(blockId, (b) => {
      const arr = (b as HandDripBlock).beans;
      const from = arr.findIndex((x) => x.id === active.id);
      const to = arr.findIndex((x) => x.id === over.id);
      if (from >= 0 && to >= 0) (b as HandDripBlock).beans = arrayMove(arr, from, to);
    });
  };

  const backup = () => { createBackup(useStudio.getState().doc); setSavedAt(Date.now()); setTimeout(() => setSavedAt((t) => (Date.now() - t >= 2000 ? 0 : t)), 2100); };

  return (
    <div className="min-h-screen bg-[#f3f1ec] text-[#2a2723]">
      <header className="sticky top-0 z-10 border-b border-[#e6e2da] bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#c2603f] text-white shadow-sm" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>V</div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold text-[#2a2723]">메뉴 수정</div>
              <SyncLine status={syncStatus} />
            </div>
          </div>
          <button onClick={() => setUiMode("admin")} className="flex items-center gap-1.5 rounded-lg border border-[#e6e2da] bg-white px-3 py-1.5 text-[13px] text-[#45413a] active:bg-[#f1eee8]">
            <Monitor className="size-4" /> 관리자
          </button>
        </div>
        <div className="flex items-stretch gap-1.5 border-t border-[#f0ece5] px-3 py-2">
          <ToolBtn onClick={() => setPreview(true)} icon={<Eye className="size-4" />}>미리보기</ToolBtn>
          <ToolBtn onClick={() => setExporting(true)} icon={<FileDown className="size-4" />}>PDF</ToolBtn>
          <ToolBtn onClick={backup} icon={<Save className="size-4" />} accent>{savedAt ? "저장됨 ✓" : "백업 저장"}</ToolBtn>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] space-y-7 px-4 py-5 pb-24">
        <p className="rounded-lg bg-[#faf1e7] px-3 py-2.5 text-[12px] leading-relaxed text-[#a6712f]">
          메뉴 이름·가격·설명만 간단히 고칠 수 있어요. 여기서 바꾸면 <b>모든 인쇄본에 함께 적용</b>됩니다. 순서는 <b>꾹 눌러서 드래그</b>로 바꾸세요.
        </p>

        {sections.map((sec) => (
          <section key={sec.id}>
            <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wider text-[#a6712f]">{sec.titleEn}{sec.titleSub ? ` · ${sec.titleSub}` : ""}</h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDrag(sec.id)}>
              <SortableContext items={sec.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sec.items.map((it, i) => <ItemCard key={it.id} sectionId={sec.id} index={i} item={it} />)}
                </div>
              </SortableContext>
            </DndContext>
            <AddButton onClick={() => useStudio.getState().updateBlock(sec.id, (b) => void (b as SectionBlock).items.push({ id: uid("it"), nameEn: "New", nameKr: "새 메뉴", price: "0.0" }))}>메뉴 추가</AddButton>
          </section>
        ))}

        {handdrips.map((hd) => (
          <section key={hd.id}>
            <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wider text-[#a6712f]">{hd.titleEn} · 원두</h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onBeanDrag(hd.id)}>
              <SortableContext items={hd.beans.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {hd.beans.map((bn, i) => <BeanCard key={bn.id} blockId={hd.id} index={i} bean={bn} />)}
                </div>
              </SortableContext>
            </DndContext>
            <AddButton onClick={() => useStudio.getState().updateBlock(hd.id, (b) => void (b as HandDripBlock).beans.push({ id: uid("bn"), nameEn: "New Bean", price: "6.0" }))}>원두 추가</AddButton>
          </section>
        ))}

        {texts.length > 0 && (
          <section>
            <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wider text-[#a6712f]">텍스트</h2>
            <div className="space-y-2">
              {texts.map((t) => (
                <div key={t.id} className="rounded-xl border border-[#e6e2da] bg-white p-3">
                  <textarea
                    className="w-full resize-y rounded-lg border border-[#e0dcd3] bg-white px-3 py-2.5 text-[16px] leading-snug text-[#2a2723] outline-none focus:border-[#c2603f]"
                    rows={3}
                    value={t.text}
                    onChange={(e) => useStudio.getState().updateBlock(t.id, (b) => void ((b as TextBlock).text = e.target.value))}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {preview && <PreviewModal onClose={() => setPreview(false)} />}
      {exporting && <ExportModal onClose={() => setExporting(false)} />}
    </div>
  );
}

/* ----------------------------------------------------------------- cards -- */

function ItemCard({ sectionId, index, item }: { sectionId: string; index: number; item: MenuItem }) {
  const updateBlock = useStudio((s) => s.updateBlock);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [open, setOpen] = useState(false);
  const set = (recipe: (it: MenuItem) => void) => updateBlock(sectionId, (b) => { const it = (b as SectionBlock).items[index]; if (it) recipe(it); });
  return (
    <CardShell setNodeRef={setNodeRef} transform={transform} transition={transition} dragging={isDragging} hidden={item.hidden}
      handle={<div {...attributes} {...listeners} onClick={() => setOpen((o) => !o)} className="flex flex-1 cursor-pointer select-none items-center gap-2 py-3 pr-2" style={{ WebkitTouchCallout: "none" }}>
        <GripVertical className="size-4 shrink-0 text-[#c8c2b6]" />
        <span className="min-w-0 flex-1 truncate text-[15px]">
          <span className="font-semibold text-[#2a2723]">{item.nameEn || "(이름 없음)"}</span>
          {item.nameKr ? <span className="text-[#9a958b]"> {item.nameKr}</span> : null}
          {item.hidden ? <span className="text-[#b0aba0]"> · 숨김</span> : null}
        </span>
        <span className="shrink-0 text-[14px] font-semibold text-[#45413a]">{item.price}</span>
      </div>}>
      {open && (
        <div className="space-y-2.5 border-t border-[#efeae2] px-3 py-3">
          <Field label="이름 (영문)"><MInput value={item.nameEn} onChange={(v) => set((it) => void (it.nameEn = v))} /></Field>
          <Field label="이름 (한글)"><MInput value={item.nameKr} onChange={(v) => set((it) => void (it.nameKr = v))} /></Field>
          <Field label="가격"><MInput value={item.price} onChange={(v) => set((it) => void (it.price = v))} /></Field>
          <Field label="설명"><MInput value={item.desc ?? ""} placeholder="(없음)" onChange={(v) => set((it) => void (it.desc = v || undefined))} /></Field>
          <RowActions hidden={item.hidden} onToggle={() => set((it) => void (it.hidden = !it.hidden))} onDelete={() => updateBlock(sectionId, (b) => void (b as SectionBlock).items.splice(index, 1))} />
        </div>
      )}
    </CardShell>
  );
}

function BeanCard({ blockId, index, bean }: { blockId: string; index: number; bean: Bean }) {
  const updateBlock = useStudio((s) => s.updateBlock);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bean.id });
  const [open, setOpen] = useState(false);
  const set = (recipe: (bn: Bean) => void) => updateBlock(blockId, (b) => { const bn = (b as HandDripBlock).beans[index]; if (bn) recipe(bn); });
  return (
    <CardShell setNodeRef={setNodeRef} transform={transform} transition={transition} dragging={isDragging} hidden={bean.hidden}
      handle={<div {...attributes} {...listeners} onClick={() => setOpen((o) => !o)} className="flex flex-1 cursor-pointer select-none items-center gap-2 py-3 pr-2" style={{ WebkitTouchCallout: "none" }}>
        <GripVertical className="size-4 shrink-0 text-[#c8c2b6]" />
        <span className="min-w-0 flex-1 truncate text-[15px]">
          <span className="font-semibold text-[#2a2723]">{bean.nameEn || "(이름 없음)"}</span>
          {bean.grade ? <span className="text-[#9a958b]"> {bean.grade}</span> : null}
          {bean.hidden ? <span className="text-[#b0aba0]"> · 숨김</span> : null}
        </span>
        <span className="shrink-0 text-[14px] font-semibold text-[#45413a]">{bean.price}</span>
      </div>}>
      {open && (
        <div className="space-y-2.5 border-t border-[#efeae2] px-3 py-3">
          <Field label="이름"><MInput value={bean.nameEn} onChange={(v) => set((bn) => void (bn.nameEn = v))} /></Field>
          <div className="flex gap-2">
            <div className="flex-1"><Field label="등급/가공"><MInput value={bean.grade ?? ""} placeholder="(없음)" onChange={(v) => set((bn) => void (bn.grade = v || undefined))} /></Field></div>
            <div className="w-24"><Field label="가격"><MInput value={bean.price} onChange={(v) => set((bn) => void (bn.price = v))} /></Field></div>
          </div>
          <Field label="헤드카피"><MInput value={bean.headCopy ?? ""} placeholder="(없음)" onChange={(v) => set((bn) => void (bn.headCopy = v || undefined))} /></Field>
          <Field label="설명"><MTextArea value={bean.desc ?? ""} placeholder="(없음)" onChange={(v) => set((bn) => void (bn.desc = v || undefined))} /></Field>
          <RowActions hidden={bean.hidden} onToggle={() => set((bn) => void (bn.hidden = !bn.hidden))} onDelete={() => updateBlock(blockId, (b) => void (b as HandDripBlock).beans.splice(index, 1))} />
        </div>
      )}
    </CardShell>
  );
}

/** Shared draggable card frame. */
function CardShell({ setNodeRef, transform, transition, dragging, hidden, handle, children }: {
  setNodeRef: (el: HTMLElement | null) => void; transform: Transform | null; transition?: string; dragging: boolean; hidden?: boolean; handle: ReactNode; children: ReactNode;
}) {
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: dragging ? 20 : undefined }}
      className={`overflow-hidden rounded-xl border ${dragging ? "border-[#c2603f] shadow-xl" : "border-[#e6e2da]"} ${hidden ? "bg-[#f1eee8] opacity-70" : "bg-white"}`}>
      <div className="flex items-center pl-3">{handle}</div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- preview --- */

function PreviewModal({ onClose }: { onClose: () => void }) {
  const doc = useStudio((s) => s.doc);
  const [pid, setPid] = useState(doc.pages[0]?.id);
  const page = doc.pages.find((p) => p.id === pid) ?? doc.pages[0];
  const { w, h } = pageSizePx(page);
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[#2a2723]">
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-black/20 px-3 py-2.5">
        {doc.pages.map((p) => (
          <button key={p.id} onClick={() => setPid(p.id)} className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] ${pid === p.id ? "bg-white text-[#2a2723]" : "bg-white/10 text-white/80"}`}>
            {p.name.replace(/\s*\(.*\)$/, "")}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={onClose} className="shrink-0 rounded-md p-1.5 text-white/80 hover:bg-white/10"><X className="size-5" /></button>
      </div>
      <div className="min-h-0 flex-1 bg-[#3a3631]">
        <ScaleToFit width={w} height={h} padding={16}><PageSheet doc={doc} page={page} /></ScaleToFit>
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------- controls -- */

function ToolBtn({ children, icon, onClick, accent }: { children: ReactNode; icon: ReactNode; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-[13px] font-medium active:opacity-80 ${accent ? "border-[#e3c8ad] bg-[#fbf2e9] text-[#a6712f]" : "border-[#e6e2da] bg-white text-[#45413a]"}`}>
      {icon} {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="px-0.5 text-[12px] font-medium text-[#837e74]">{label}</span>
      {children}
    </label>
  );
}

const mInputCls = "w-full rounded-lg border border-[#e0dcd3] bg-white px-3 py-2.5 text-[16px] text-[#2a2723] outline-none focus:border-[#c2603f] placeholder:text-[#bcb6aa]";

function MInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className={mInputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function MTextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea className={mInputCls + " resize-y leading-snug"} rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function RowActions({ hidden, onToggle, onDelete }: { hidden?: boolean; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between pt-1">
      <button onClick={onToggle} className="rounded-lg border border-[#e6e2da] bg-white px-3 py-1.5 text-[13px] text-[#45413a] active:bg-[#f1eee8]">{hidden ? "숨김 해제" : "숨기기"}</button>
      <button onClick={() => { if (confirm("이 항목을 삭제할까요?")) onDelete(); }} className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#c84a30] active:bg-[#f8e9e4]">삭제</button>
    </div>
  );
}

function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#d8d2c8] bg-white/50 py-2.5 text-[13px] font-medium text-[#837e74] active:bg-[#f4f2ed]">
      <Plus className="size-4" /> {children}
    </button>
  );
}

function SyncLine({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, { label: string; dot: string; text: string }> = {
    local: { label: "로컬 저장", dot: "#9a958b", text: "#9a958b" },
    loading: { label: "불러오는 중…", dot: "#c2603f", text: "#a6712f" },
    saving: { label: "저장 중…", dot: "#c2603f", text: "#a6712f" },
    synced: { label: "저장됨", dot: "#2f9e6b", text: "#1d8f5e" },
    error: { label: "오프라인", dot: "#c98a3b", text: "#9a6b1e" },
  };
  const s = map[status] ?? map.local;
  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: s.text }}>
      <span className="size-1.5 rounded-full" style={{ background: s.dot }} /> {s.label}
    </span>
  );
}
