import { Copy, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block, CompactShow, HandDripBlock, ImageBlock, SectionBlock, Style, TextBlock, WordmarkBlock } from "../core/types";
import { findBlock, uid } from "../core/doc";
import { useStudio } from "../state/store";
import { Collapsible, ColorInput, Field, NumInput, Range, Row, Segmented, Select, TextArea, TextInput } from "./controls";

const ALIGN_OPTS = [
  { value: "left", label: "좌" },
  { value: "center", label: "중" },
  { value: "right", label: "우" },
  { value: "justify", label: "양끝" },
] as const;

export function Inspector() {
  const doc = useStudio((s) => s.doc);
  const selectedId = useStudio((s) => s.selectedId);
  const updateBlock = useStudio((s) => s.updateBlock);
  const removeBlock = useStudio((s) => s.removeBlock);
  const duplicateBlock = useStudio((s) => s.duplicateBlock);

  const block = selectedId ? findBlock(doc, selectedId) : null;
  if (!block) {
    return <div className="p-4 text-[12px] leading-relaxed text-[#9a958b]">캔버스에서 요소를 클릭하면<br />여기서 글꼴·크기·여백·정렬 등<br />모든 속성을 조절할 수 있어요.</div>;
  }

  const st: Style = block.style ?? {};
  const setS = (k: keyof Style, v: unknown) =>
    updateBlock(block.id, (b) => {
      b.style ??= {};
      if (v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v))) delete (b.style as Record<string, unknown>)[k];
      else (b.style as Record<string, unknown>)[k] = v;
    });

  const fontOpts = [{ value: "", label: "(기본)" }, ...doc.fonts.map((f) => ({ value: f.family, label: f.family }))];
  const badgeOpts = [{ value: "", label: "없음" }, ...doc.badges.map((b) => ({ value: b.id, label: b.label }))];

  const showTypography = ["text", "wordmark", "group", "section", "handdrip"].includes(block.type);
  const showLayout = block.type === "group";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#ebe7df] px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-[#2a2723]">{block.name ?? block.type}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#9a958b]">{block.type}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => duplicateBlock(block.id)} title="복제" className="rounded p-1.5 text-[#837e74] hover:bg-[#f1eee8] hover:text-[#2a2723]">
            <Copy className="size-4" />
          </button>
          <button onClick={() => removeBlock(block.id)} title="삭제" className="rounded p-1.5 text-[#c84a30] hover:bg-[#f8e9e4]">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="studio-scroll min-h-0 flex-1 overflow-y-auto">
        <ContentPanel block={block} badgeOpts={badgeOpts} />

        {showLayout && (
          <Collapsible title="레이아웃">
            <Field label="방향">
              <Segmented value={st.direction ?? "column"} onChange={(v) => setS("direction", v)} options={[{ value: "column", label: "세로" }, { value: "row", label: "가로" }]} />
            </Field>
            <Row>
              <Field label="간격(gap)"><NumInput value={st.gap} onChange={(v) => setS("gap", v)} /></Field>
              <Field label="그리드 열수"><NumInput value={st.columns} min={1} max={6} onChange={(v) => setS("columns", v)} /></Field>
            </Row>
            <Row>
              <Field label="가로 정렬(cross)">
                <Select value={st.align ?? "start"} onChange={(v) => setS("align", v)} options={[{ value: "start", label: "시작" }, { value: "center", label: "가운데" }, { value: "end", label: "끝" }, { value: "stretch", label: "채움" }]} />
              </Field>
              <Field label="세로 분배(main)">
                <Select value={st.justify ?? "start"} onChange={(v) => setS("justify", v)} options={[{ value: "start", label: "시작" }, { value: "center", label: "가운데" }, { value: "end", label: "끝" }, { value: "between", label: "균등" }, { value: "around", label: "여유" }]} />
              </Field>
            </Row>
            <Row>
              <Field label="늘어나기(grow)"><NumInput value={st.grow} min={0} onChange={(v) => setS("grow", v)} /></Field>
              <Field label="너비">
                <Segmented value={typeof st.width === "string" ? st.width : "auto"} onChange={(v) => setS("width", v)} options={[{ value: "auto", label: "auto" }, { value: "fill", label: "채움" }]} />
              </Field>
            </Row>
          </Collapsible>
        )}

        {showTypography && (
          <Collapsible title="타이포그래피">
            <Field label="글꼴"><Select value={(st.fontFamily as string) ?? ""} onChange={(v) => setS("fontFamily", v)} options={fontOpts} /></Field>
            <Row>
              <Field label="크기(px)"><NumInput value={st.fontSize} onChange={(v) => setS("fontSize", v)} /></Field>
              <Field label="굵기">
                <Select value={String(st.fontWeight ?? "")} onChange={(v) => setS("fontWeight", v === "" ? undefined : Number(v))} options={[{ value: "", label: "(기본)" }, ...[300, 400, 500, 600, 700, 800, 900].map((w) => ({ value: String(w), label: String(w) }))]} />
              </Field>
            </Row>
            <Row>
              <Field label="자간"><NumInput value={st.letterSpacing} step={0.5} onChange={(v) => setS("letterSpacing", v)} /></Field>
              <Field label="행간(배수)"><NumInput value={st.lineHeight} step={0.05} onChange={(v) => setS("lineHeight", v)} /></Field>
            </Row>
            <Field label="정렬"><Segmented value={st.textAlign} onChange={(v) => setS("textAlign", v)} options={ALIGN_OPTS as unknown as { value: string; label: string }[]} /></Field>
            <Field label="색상"><ColorInput value={st.color ?? "#111111"} onChange={(v) => setS("color", v)} /></Field>
          </Collapsible>
        )}

        <Collapsible title="여백 / 패딩" defaultOpen={false}>
          <Field label="바깥 여백 (위·우·아래·좌)">
            <div className="grid grid-cols-4 gap-1.5">
              <NumInput value={st.marginTop} onChange={(v) => setS("marginTop", v)} />
              <NumInput value={st.marginRight} onChange={(v) => setS("marginRight", v)} />
              <NumInput value={st.marginBottom} onChange={(v) => setS("marginBottom", v)} />
              <NumInput value={st.marginLeft} onChange={(v) => setS("marginLeft", v)} />
            </div>
          </Field>
          <Field label="안쪽 패딩 (위·우·아래·좌)">
            <div className="grid grid-cols-4 gap-1.5">
              <NumInput value={st.paddingTop} onChange={(v) => setS("paddingTop", v)} />
              <NumInput value={st.paddingRight} onChange={(v) => setS("paddingRight", v)} />
              <NumInput value={st.paddingBottom} onChange={(v) => setS("paddingBottom", v)} />
              <NumInput value={st.paddingLeft} onChange={(v) => setS("paddingLeft", v)} />
            </div>
          </Field>
        </Collapsible>

        <Collapsible title="배경 / 테두리" defaultOpen={false}>
          <Field label="배경색"><ColorInput value={st.background ?? "#ffffff"} onChange={(v) => setS("background", v)} /></Field>
          <Row>
            <Field label="테두리 두께"><NumInput value={st.borderWidth} step={0.5} onChange={(v) => setS("borderWidth", v)} /></Field>
            <Field label="모서리 반경"><NumInput value={st.borderRadius} onChange={(v) => setS("borderRadius", v)} /></Field>
          </Row>
          <Field label="테두리 색"><ColorInput value={st.borderColor ?? "#111111"} onChange={(v) => setS("borderColor", v)} /></Field>
          <Field label="투명도"><Range value={st.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => setS("opacity", v)} /></Field>
        </Collapsible>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- content panels - */

function ContentPanel({ block, badgeOpts }: { block: Block; badgeOpts: { value: string; label: string }[] }) {
  const updateBlock = useStudio((s) => s.updateBlock);
  const upd = (recipe: (b: Block) => void) => updateBlock(block.id, recipe);

  if (block.type === "text") {
    return (
      <Collapsible title="내용">
        <Field label="텍스트 (블렌드 설명·안내문 등 자유 입력)">
          <TextArea value={(block as TextBlock).text} rows={5} onChange={(v) => upd((b) => void ((b as TextBlock).text = v))} />
        </Field>
      </Collapsible>
    );
  }

  if (block.type === "wordmark") {
    const wm = block as WordmarkBlock;
    return (
      <Collapsible title="내용">
        <Field label="텍스트"><TextInput value={wm.text} onChange={(v) => upd((b) => void ((b as WordmarkBlock).text = v))} /></Field>
        <Field label="형태">
          <Segmented value={wm.artVariant ?? "text"} onChange={(v) => upd((b) => void ((b as WordmarkBlock).artVariant = v))} options={[{ value: "text", label: "글자" }, { value: "symbol", label: "심볼(V)" }]} />
        </Field>
      </Collapsible>
    );
  }

  if (block.type === "image") {
    const im = block as ImageBlock;
    return (
      <Collapsible title="이미지">
        <Field label="이미지 업로드">
          <input
            type="file"
            accept="image/*"
            className="w-full text-[12px] text-[#837e74] file:mr-2 file:rounded file:border-0 file:bg-[#c2603f] file:px-2 file:py-1 file:text-white"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => upd((b) => void ((b as ImageBlock).src = String(reader.result)));
              reader.readAsDataURL(f);
            }}
          />
        </Field>
        <Field label="또는 이미지 URL"><TextInput value={im.src} onChange={(v) => upd((b) => void ((b as ImageBlock).src = v))} /></Field>
        <Field label="맞춤"><Segmented value={im.fit ?? "contain"} onChange={(v) => upd((b) => void ((b as ImageBlock).fit = v))} options={[{ value: "contain", label: "전체" }, { value: "cover", label: "채움" }]} /></Field>
        <Field label="너비">
          <Segmented
            value={typeof im.style?.width === "number" ? "fixed" : "fill"}
            onChange={(v) => upd((b) => { const x = b as ImageBlock; x.style ??= {}; if (v === "fixed") { x.style.width = 300; delete x.style.paddingLeft; delete x.style.paddingRight; } else { x.style.width = "fill"; } })}
            options={[{ value: "fill", label: "채움" }, { value: "fixed", label: "숫자 지정" }]}
          />
        </Field>
        {typeof im.style?.width === "number" && (
          <Row>
            <Field label="너비(px)"><NumInput value={im.style.width} onChange={(v) => upd((b) => { const x = b as ImageBlock; x.style ??= {}; x.style.width = v; })} /></Field>
            <Field label="높이(px)" hint="선택"><NumInput value={typeof im.style?.height === "number" ? im.style.height : undefined} onChange={(v) => upd((b) => { const x = b as ImageBlock; x.style ??= {}; x.style.height = Number.isNaN(v) ? undefined : v; })} /></Field>
          </Row>
        )}
        <Field label="정렬"><Segmented value={im.align ?? "left"} onChange={(v) => upd((b) => void ((b as ImageBlock).align = v))} options={[{ value: "left", label: "좌" }, { value: "center", label: "중" }, { value: "right", label: "우" }]} /></Field>
      </Collapsible>
    );
  }

  if (block.type === "section") return <SectionContent block={block as SectionBlock} badgeOpts={badgeOpts} />;
  if (block.type === "handdrip") return <HandDripContent block={block as HandDripBlock} badgeOpts={badgeOpts} />;
  return null;
}

const SLOT_KEYS = ["style", "itemStyle", "priceStyle", "descStyle"] as const;

function SectionContent({ block, badgeOpts }: { block: SectionBlock; badgeOpts: { value: string; label: string }[] }) {
  const updateBlock = useStudio((s) => s.updateBlock);
  const upd = (recipe: (b: SectionBlock) => void) => updateBlock(block.id, (b) => recipe(b as SectionBlock));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onItemDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    upd((b) => {
      const ids = b.items.map((x) => x.id);
      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      if (from < 0 || to < 0) return;
      b.items = arrayMove(b.items, from, to);
    });
  };

  const setSlot = (slot: (typeof SLOT_KEYS)[number], key: keyof Style, v: number | undefined) =>
    upd((b) => {
      const target = (b[slot] ??= {} as Style);
      if (v === undefined || Number.isNaN(v)) delete (target as Record<string, unknown>)[key];
      else (target as Record<string, unknown>)[key] = v;
    });

  return (
    <>
      <Collapsible title="섹션">
        <Row>
          <Field label="제목(EN)"><TextInput value={block.titleEn} onChange={(v) => upd((b) => void (b.titleEn = v))} /></Field>
          <Field label="부제"><TextInput value={block.titleSub ?? ""} onChange={(v) => upd((b) => void (b.titleSub = v || undefined))} /></Field>
        </Row>
        <Field label="뱃지"><Select value={block.badge ?? ""} onChange={(v) => upd((b) => void (b.badge = v || undefined))} options={badgeOpts} /></Field>
        <Field label="안내문" hint="띄어쓰기를 여러 칸 하면 그대로 띄어집니다"><TextArea value={block.note ?? ""} rows={3} onChange={(v) => upd((b) => void (b.note = v || undefined))} /></Field>
        <Field label="안내문 정렬">
          <Segmented value={block.noteStyle?.textAlign ?? "right"} onChange={(v) => upd((b) => { (b.noteStyle ??= {}).textAlign = v; })} options={[{ value: "left", label: "좌" }, { value: "center", label: "중앙" }, { value: "right", label: "우" }]} />
        </Field>
      </Collapsible>
      <Collapsible title="섹션 글자 크기 (이 섹션 일괄)">
        <Row>
          <Field label="제목 크기" hint="비우면 글로벌"><NumInput value={block.style?.fontSize} onChange={(v) => setSlot("style", "fontSize", v)} /></Field>
          <Field label="항목 간격"><NumInput value={block.style?.gap} onChange={(v) => setSlot("style", "gap", v)} /></Field>
        </Row>
        <Row>
          <Field label="항목 이름 크기"><NumInput value={block.itemStyle?.fontSize} onChange={(v) => setSlot("itemStyle", "fontSize", v)} /></Field>
          <Field label="가격 크기"><NumInput value={block.priceStyle?.fontSize} onChange={(v) => setSlot("priceStyle", "fontSize", v)} /></Field>
        </Row>
        <Field label="설명 크기"><NumInput value={block.descStyle?.fontSize} onChange={(v) => setSlot("descStyle", "fontSize", v)} /></Field>
      </Collapsible>
      {block.itemsFrom ? (
        <Collapsible title="메뉴 항목 (자동 연동)">
          <p className="rounded-md bg-[#eef5ef] px-3 py-2 text-[11px] leading-relaxed text-[#3f7a52]">
            이 섹션의 메뉴는 <b>A4 좌 (메인)</b>에서 자동으로 가져옵니다. 이름·가격·설명을 바꾸려면 거기서(또는 수정모드에서) 수정하면 여기에도 바로 반영됩니다. (제목·글자 크기는 위에서 따로 설정)
          </p>
        </Collapsible>
      ) : (
        <Collapsible title={`메뉴 항목 (${block.items.length})`}>
          <p className="mb-2 text-[10px] text-[#9a958b]">손잡이(⠿)를 드래그해 순서를 바꿉니다.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
            <SortableContext items={block.items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {block.items.map((it, i) => (
                  <ItemEditor key={it.id} index={i} item={it} badgeOpts={badgeOpts} block={block} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button
            onClick={() => upd((b) => void b.items.push({ id: uid("it"), nameEn: "New", nameKr: "새 메뉴", price: "0.0" }))}
            className="mt-2 w-full rounded-md border border-dashed border-[#e6e2da] py-1.5 text-[12px] text-[#837e74] hover:border-[#c2603f] hover:text-[#c2603f]"
          >
            + 항목 추가
          </button>
        </Collapsible>
      )}
    </>
  );
}

function ItemEditor({ item, index, block, badgeOpts }: { item: SectionBlock["items"][number]; index: number; block: SectionBlock; badgeOpts: { value: string; label: string }[] }) {
  const updateBlock = useStudio((s) => s.updateBlock);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const upd = (recipe: (it: SectionBlock["items"][number]) => void) =>
    updateBlock(block.id, (b) => {
      const target = (b as SectionBlock).items[index];
      if (target) recipe(target);
    });
  const remove = () => updateBlock(block.id, (b) => void (b as SectionBlock).items.splice(index, 1));

  return (
    <details ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} className="rounded-md border border-[#e6e2da] bg-[#faf9f6]">
      <summary className="flex cursor-pointer items-center gap-1 px-2 py-1.5 text-[12px] text-[#45413a]">
        <button {...attributes} {...listeners} onClick={(e) => e.preventDefault()} title="드래그로 순서 변경" className="cursor-grab text-[#b0aba0] hover:text-[#837e74] active:cursor-grabbing"><GripVertical className="size-3.5" /></button>
        <span className="min-w-0 flex-1 truncate">{item.nameEn || "(이름 없음)"} · {item.price}</span>
        <button onClick={(e) => { e.preventDefault(); remove(); }} className="text-[#c84a30] hover:text-red-400"><Trash2 className="size-3.5" /></button>
      </summary>
      <div className="space-y-2 px-2 pb-2">
        <Row>
          <Field label="이름(EN)"><TextInput value={item.nameEn} onChange={(v) => upd((it) => void (it.nameEn = v))} /></Field>
          <Field label="이름(KR)"><TextInput value={item.nameKr} onChange={(v) => upd((it) => void (it.nameKr = v))} /></Field>
        </Row>
        <Row>
          <Field label="가격"><TextInput value={item.price} onChange={(v) => upd((it) => void (it.price = v))} /></Field>
          <Field label="뱃지"><Select value={item.badge ?? ""} onChange={(v) => upd((it) => void (it.badge = v || undefined))} options={badgeOpts} /></Field>
        </Row>
        <Field label="설명"><TextInput value={item.desc ?? ""} onChange={(v) => upd((it) => void (it.desc = v || undefined))} /></Field>
        <Field label="이 항목만 글자 크기 (비우면 섹션값)">
          <NumInput value={item.style?.fontSize} onChange={(v) => upd((it) => { it.style ??= {}; if (v === undefined || Number.isNaN(v)) delete it.style.fontSize; else it.style.fontSize = v; })} />
        </Field>
      </div>
    </details>
  );
}

const HD_SLOTS: { slot: keyof HandDripBlock & string; label: string; hint?: string }[] = [
  { slot: "nameStyle", label: "원두 이름 크기" },
  { slot: "gradeStyle", label: "등급/가공 크기" },
  { slot: "priceStyle", label: "가격 크기" },
  { slot: "headStyle", label: "헤드카피 크기" },
  { slot: "descStyle", label: "설명 크기" },
];

const COMPACT_TOGGLES: [keyof CompactShow, string][] = [
  ["grade", "등급/가공"],
  ["headCopy", "헤드카피"],
  ["desc", "설명"],
];

function HandDripContent({ block, badgeOpts }: { block: HandDripBlock; badgeOpts: { value: string; label: string }[] }) {
  const updateBlock = useStudio((s) => s.updateBlock);
  const upd = (recipe: (b: HandDripBlock) => void) => updateBlock(block.id, (b) => recipe(b as HandDripBlock));
  const setSlot = (slot: keyof HandDripBlock & string, key: keyof Style, v: number | undefined) =>
    upd((b) => {
      const target = ((b as unknown as Record<string, Style>)[slot] ??= {} as Style);
      if (v === undefined || Number.isNaN(v)) delete (target as Record<string, unknown>)[key];
      else (target as Record<string, unknown>)[key] = v;
    });
  const compact: CompactShow = block.compactShow ?? { headCopy: true };
  const setCompact = (k: keyof CompactShow, on: boolean) => upd((b) => void (b.compactShow = { ...(b.compactShow ?? { headCopy: true }), [k]: on }));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onBeanDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    upd((b) => {
      const ids = b.beans.map((x) => x.id);
      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      if (from < 0 || to < 0) return;
      b.beans = arrayMove(b.beans, from, to);
    });
  };
  const mirrored = !!block.beansFrom;

  return (
    <>
      <Collapsible title="핸드드립">
        <Row>
          <Field label="제목(EN)"><TextInput value={block.titleEn} onChange={(v) => upd((b) => void (b.titleEn = v))} /></Field>
          <Field label="부제"><TextInput value={block.titleSub ?? ""} onChange={(v) => upd((b) => void (b.titleSub = v || undefined))} /></Field>
        </Row>
        <Row>
          <Field label="뱃지"><Select value={block.badge ?? ""} onChange={(v) => upd((b) => void (b.badge = v || undefined))} options={badgeOpts} /></Field>
          <Field label="표시"><Segmented value={block.variant ?? "detailed"} onChange={(v) => upd((b) => void (b.variant = v))} options={[{ value: "detailed", label: "상세" }, { value: "compact", label: "간단" }]} /></Field>
        </Row>
        {block.variant === "compact" && (
          <div className="space-y-2 rounded-md border border-[#f0e3d6] bg-[#faf1e7] p-2">
            <div className="text-[11px] font-medium text-[#a6712f]">간단 모드 표시 항목</div>
            {COMPACT_TOGGLES.map(([k, label]) => (
              <Row key={k}>
                <span className="self-center text-[11px] text-[#837e74]">{label}</span>
                <Segmented value={compact[k] ? "on" : "off"} onChange={(v) => setCompact(k, v === "on")} options={[{ value: "on", label: "표시" }, { value: "off", label: "숨김" }]} />
              </Row>
            ))}
          </div>
        )}
        <Field label="하단 안내문" hint="띄어쓰기를 여러 칸 하면 그대로 띄어집니다"><TextArea value={block.footerNote ?? ""} rows={3} onChange={(v) => upd((b) => void (b.footerNote = v || undefined))} /></Field>
        <Field label="안내문 정렬">
          <Segmented value={block.footerStyle?.textAlign ?? "left"} onChange={(v) => upd((b) => { (b.footerStyle ??= {}).textAlign = v; })} options={[{ value: "left", label: "좌" }, { value: "center", label: "중앙" }, { value: "right", label: "우" }]} />
        </Field>
      </Collapsible>

      <Collapsible title="글자 크기 (이 블록 일괄)" defaultOpen={false}>
        <Row>
          <Field label="제목 크기" hint="비우면 글로벌"><NumInput value={block.style?.fontSize} onChange={(v) => setSlot("style", "fontSize", v)} /></Field>
          <Field label="원두 간격"><NumInput value={block.style?.gap} onChange={(v) => setSlot("style", "gap", v)} /></Field>
        </Row>
        <div className="grid grid-cols-2 gap-2">
          {HD_SLOTS.map(({ slot, label }) => (
            <Field key={slot} label={label}>
              <NumInput value={(block as unknown as Record<string, Style>)[slot]?.fontSize} onChange={(v) => setSlot(slot, "fontSize", v)} />
            </Field>
          ))}
        </div>
      </Collapsible>

      {mirrored ? (
        <Collapsible title="원두 (자동 연동)">
          <p className="rounded-md bg-[#eef5ef] px-3 py-2 text-[11px] leading-relaxed text-[#3f7a52]">
            이 블록의 원두는 <b>A4 우 (핸드드립)</b>에서 자동으로 가져옵니다. 순서·내용·설명을 바꾸려면 거기서 수정하면 여기에도 바로 반영됩니다. (표시 방식·글자 크기는 위에서 따로 설정)
          </p>
        </Collapsible>
      ) : (
        <Collapsible title={`원두 (${block.beans.length})`} defaultOpen={false}>
          <p className="mb-2 text-[10px] text-[#9a958b]">손잡이(⠿)를 드래그해 순서를 바꿉니다.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onBeanDragEnd}>
            <SortableContext items={block.beans.map((bn) => bn.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {block.beans.map((bn, i) => (
                  <SortableBean key={bn.id} bn={bn} index={i} upd={upd} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button onClick={() => upd((b) => void b.beans.push({ id: uid("bn"), nameEn: "New Bean", price: "6.0" }))} className="mt-2 w-full rounded-md border border-dashed border-[#e6e2da] py-1.5 text-[12px] text-[#837e74] hover:border-[#c2603f] hover:text-[#c2603f]">
            + 원두 추가
          </button>
        </Collapsible>
      )}
    </>
  );
}

function SortableBean({ bn, index: i, upd }: { bn: HandDripBlock["beans"][number]; index: number; upd: (recipe: (b: HandDripBlock) => void) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bn.id });
  return (
    <details ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} className={`rounded-md border border-[#e6e2da] ${bn.hidden ? "bg-[#f1eee8] opacity-60" : "bg-[#faf9f6]"}`}>
      <summary className="flex cursor-pointer items-center justify-between gap-1 px-2 py-1.5 text-[12px] text-[#45413a]">
        <button {...attributes} {...listeners} onClick={(e) => e.preventDefault()} title="드래그로 순서 변경" className="cursor-grab text-[#b0aba0] hover:text-[#837e74] active:cursor-grabbing"><GripVertical className="size-3.5" /></button>
        <span className="min-w-0 flex-1 truncate">{bn.nameEn} · {bn.price}{bn.hidden ? " · 숨김" : ""}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          <button title={bn.hidden ? "표시" : "숨기기"} onClick={(e) => { e.preventDefault(); upd((b) => void (b.beans[i].hidden = !b.beans[i].hidden)); }} className="rounded p-0.5 text-[#837e74] hover:bg-[#e6e2da]">{bn.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}</button>
          <button title="삭제" onClick={(e) => { e.preventDefault(); upd((b) => void b.beans.splice(i, 1)); }} className="rounded p-0.5 text-[#c84a30] hover:bg-[#f8e9e4]"><Trash2 className="size-3.5" /></button>
        </div>
      </summary>
      <div className="space-y-2 px-2 pb-2">
        <Row>
          <Field label="이름"><TextInput value={bn.nameEn} onChange={(v) => upd((b) => void (b.beans[i].nameEn = v))} /></Field>
          <Field label="가격"><TextInput value={bn.price} onChange={(v) => upd((b) => void (b.beans[i].price = v))} /></Field>
        </Row>
        <Field label="등급/가공"><TextInput value={bn.grade ?? ""} onChange={(v) => upd((b) => void (b.beans[i].grade = v || undefined))} /></Field>
        <Field label="헤드카피"><TextInput value={bn.headCopy ?? ""} onChange={(v) => upd((b) => void (b.beans[i].headCopy = v || undefined))} /></Field>
        <Field label="설명"><TextArea value={bn.desc ?? ""} rows={2} onChange={(v) => upd((b) => void (b.beans[i].desc = v || undefined))} /></Field>
      </div>
    </details>
  );
}
