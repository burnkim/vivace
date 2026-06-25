import type { Block, BlockType } from "./types";
import { uid } from "./doc";

export const ADDABLE: { type: BlockType; label: string }[] = [
  { type: "group", label: "그룹 (단/박스)" },
  { type: "section", label: "메뉴 섹션" },
  { type: "handdrip", label: "핸드드립" },
  { type: "text", label: "텍스트" },
  { type: "image", label: "이미지" },
  { type: "wordmark", label: "워드마크" },
  { type: "divider", label: "구분선" },
  { type: "spacer", label: "여백(스페이서)" },
];

export function newBlock(type: BlockType): Block {
  const id = uid(type.slice(0, 3));
  switch (type) {
    case "group":
      return { id, type: "group", name: "그룹", style: { direction: "column", gap: 24 }, children: [] };
    case "section":
      return {
        id,
        type: "section",
        name: "새 섹션",
        titleEn: "Section",
        items: [{ id: uid("it"), nameEn: "New Item", nameKr: "새 메뉴", price: "0.0" }],
      };
    case "handdrip":
      return {
        id,
        type: "handdrip",
        name: "핸드드립",
        titleEn: "Filter Coffee",
        titleSub: "Hot / Ice",
        variant: "detailed",
        beans: [{ id: uid("bn"), nameEn: "New Bean", price: "6.0", headCopy: "", desc: "" }],
      };
    case "text":
      return { id, type: "text", name: "텍스트", text: "텍스트를 입력하세요", style: { fontSize: 28, lineHeight: 1.5 } };
    case "image":
      return { id, type: "image", name: "이미지", src: "", fit: "contain", style: { width: "fill" } };
    case "wordmark":
      return { id, type: "wordmark", name: "워드마크", text: "Vivace", artVariant: "text" };
    case "divider":
      return { id, type: "divider", name: "구분선", style: { marginTop: 12, marginBottom: 12 } };
    case "spacer":
      return { id, type: "spacer", name: "여백" };
  }
}
