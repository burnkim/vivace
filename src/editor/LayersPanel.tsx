import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronUp, ChevronDown, Eye, EyeOff, Plus, Layers, Type, Image as ImageIcon, Minus, Square, Coffee, FileText, Columns, GripVertical } from "lucide-react";
import type { Block } from "../core/types";
import { ADDABLE, newBlock } from "../core/factory";
import { findBlock, pageRoot } from "../core/doc";
import { useStudio, currentPage } from "../state/store";
import { flattenTree, getProjection, type FlatItem } from "./treeDnd";

const INDENT = 16;

const ICON: Record<Block["type"], typeof Type> = {
  group: Columns,
  section: Coffee,
  handdrip: Coffee,
  text: FileText,
  image: ImageIcon,
  divider: Minus,
  spacer: Square,
  wordmark: Type,
};

function Row({ item }: { item: FlatItem }) {
  const { block, depth } = item;
  const selectedId = useStudio((s) => s.selectedId);
  const select = useStudio((s) => s.select);
  const moveBlock = useStudio((s) => s.moveBlock);
  const updateBlock = useStudio((s) => s.updateBlock);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const Icon = ICON[block.type];
  const selected = selectedId === block.id;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, paddingLeft: 6 + depth * INDENT }}
      onClick={() => select(block.id)}
      className={`group flex items-center gap-1 rounded px-1.5 py-1 text-[12px] ${selected ? "bg-[#f6ece4] text-[#a94e31] font-medium" : "text-[#56524a] hover:bg-[#f4f2ed]"}`}
    >
      <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab text-[#b0aba0] hover:text-[#837e74] active:cursor-grabbing" title="드래그">
        <GripVertical className="size-3.5" />
      </button>
      <Icon className="size-3.5 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1 truncate">{block.name ?? block.type}</span>
      <span className="hidden items-center gap-0.5 group-hover:flex">
        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} className="rounded p-0.5 hover:bg-[#e6e2da]"><ChevronUp className="size-3" /></button>
        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} className="rounded p-0.5 hover:bg-[#e6e2da]"><ChevronDown className="size-3" /></button>
        <button onClick={(e) => { e.stopPropagation(); updateBlock(block.id, (b) => void (b.hidden = !b.hidden)); }} className="rounded p-0.5 hover:bg-[#e6e2da]">
          {block.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
        </button>
      </span>
    </div>
  );
}

export function LayersPanel() {
  const doc = useStudio((s) => s.doc);
  const page = useStudio(currentPage);
  const selectedId = useStudio((s) => s.selectedId);
  const addBlock = useStudio((s) => s.addBlock);
  const moveBlockTo = useStudio((s) => s.moveBlockTo);
  const [showAdd, setShowAdd] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const root = pageRoot(doc, page);
  const flat = flattenTree(root);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const sel = selectedId ? findBlock(doc, selectedId) : null;
  const targetId = sel?.type === "group" ? sel.id : root.id;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over, delta } = e;
    if (!over || active.id === over.id) return;
    const proj = getProjection(flat, root.id, String(active.id), String(over.id), delta.x, INDENT);
    if (proj) moveBlockTo(String(active.id), proj.parentId, proj.index);
  };

  const activeItem = flat.find((f) => f.id === activeId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 border-b border-[#ebe7df] px-3 py-2.5 text-[12px] font-semibold text-[#45413a]">
        <Layers className="size-4" /> 레이어
        <span className="ml-auto text-[10px] font-normal text-[#9a958b]">드래그로 이동·중첩</span>
      </div>
      <div className="studio-scroll min-h-0 flex-1 overflow-y-auto p-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <SortableContext items={flat.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {flat.map((f) => (
              <Row key={f.id} item={f} />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeItem ? (
              <div className="flex items-center gap-1.5 rounded border border-[#e6e2da] bg-white px-2 py-1 text-[12px] text-[#2a2723] shadow-xl">
                <GripVertical className="size-3.5" /> {activeItem.block.name ?? activeItem.block.type}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <div className="relative border-t border-[#ebe7df] p-2">
        <button onClick={() => setShowAdd((v) => !v)} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#c2603f] py-1.5 text-[12px] font-medium text-white hover:bg-[#a94e31]">
          <Plus className="size-4" /> 블록 추가
        </button>
        {showAdd && (
          <div className="absolute bottom-12 left-2 right-2 z-10 overflow-hidden rounded-lg border border-[#e6e2da] bg-[#ffffff] shadow-2xl">
            {ADDABLE.map((a) => (
              <button key={a.type} onClick={() => { addBlock(targetId, newBlock(a.type)); setShowAdd(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#45413a] hover:bg-[#f6ece4]">
                {a.label}
              </button>
            ))}
            <div className="border-t border-[#e6e2da] px-3 py-1.5 text-[10px] text-[#9a958b]">{sel?.type === "group" ? `"${sel.name}" 안에 추가` : "페이지에 추가"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
