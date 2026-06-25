import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Plus, Trash2, ChevronLeft, ChevronRight, X, Columns2, Rows3 } from "lucide-react";
import { useMenuStore } from "../../state/menu-store";
import { edit, newId, move } from "./edit-helpers";
import { LAYOUT_KEYS } from "../../data/section-layout";
import { allGroupIds, groupLabel } from "../../data/groups";
import type { LayoutKey, MenuData, VAlign, ColumnDef } from "../../data/menu-types";

const ALIGN_OPTS: { value: VAlign; label: string }[] = [
  { value: "start", label: "위 정렬" },
  { value: "center", label: "가운데" },
  { value: "end", label: "아래 정렬" },
  { value: "between", label: "꽉 차게 (균등)" },
];

export function LayoutEditor() {
  const { data, update } = useMenuStore();
  const [active, setActive] = useState<LayoutKey>("a4l");
  const layout = data.config.layouts[active];

  const setLayout = (fn: (d: MenuData) => void) => update(edit(data, fn));

  return (
    <div className="space-y-3">
      <Card className="space-y-2 p-3">
        <Label className="text-muted-foreground text-xs">편집할 레이아웃</Label>
        <div className="flex flex-wrap gap-1">
          {LAYOUT_KEYS.map(({ key, label }) => (
            <Button key={key} size="sm" variant={active === key ? "default" : "outline"} onClick={() => setActive(key)}>
              {label}
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">A3 좌/우는 각각 A4 좌/우 레이아웃을 그대로 확대해 사용합니다.</p>
      </Card>

      {layout.rows.map((row, rIdx) => (
        <Card key={row.id} className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rows3 className="size-4" />
              <span className="text-sm font-medium">행 {rIdx + 1}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-xs">
                <Switch
                  checked={row.grow}
                  onCheckedChange={(v) => setLayout((d) => (d.config.layouts[active].rows[rIdx].grow = v))}
                />
                높이 채움
              </label>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setLayout((d) => move(d.config.layouts[active].rows, rIdx, rIdx - 1))}>
                <ChevronLeft className="size-4 rotate-90" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setLayout((d) => move(d.config.layouts[active].rows, rIdx, rIdx + 1))}>
                <ChevronRight className="size-4 rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive"
                disabled={layout.rows.length <= 1}
                onClick={() => setLayout((d) => d.config.layouts[active].rows.splice(rIdx, 1))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(row.columns.length, 2)}, minmax(0,1fr))` }}>
            {row.columns.map((col, cIdx) => (
              <ColumnEditor
                key={col.id}
                col={col}
                data={data}
                canDelete={row.columns.length > 1}
                onChange={(fn) => setLayout((d) => fn(d.config.layouts[active].rows[rIdx].columns[cIdx]))}
                onDelete={() => setLayout((d) => d.config.layouts[active].rows[rIdx].columns.splice(cIdx, 1))}
                onMove={(dir) => setLayout((d) => move(d.config.layouts[active].rows[rIdx].columns, cIdx, cIdx + dir))}
              />
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() =>
              setLayout((d) =>
                d.config.layouts[active].rows[rIdx].columns.push({ id: newId("col"), align: "start", groups: [] }),
              )
            }
          >
            <Columns2 className="mr-1 size-4" /> 열 추가
          </Button>
        </Card>
      ))}

      <Button
        variant="secondary"
        className="w-full"
        onClick={() =>
          setLayout((d) =>
            d.config.layouts[active].rows.push({ id: newId("row"), grow: false, columns: [{ id: newId("col"), align: "start", groups: [] }] }),
          )
        }
      >
        <Plus className="mr-1 size-4" /> 행 추가
      </Button>
    </div>
  );
}

function ColumnEditor({
  col,
  data,
  canDelete,
  onChange,
  onDelete,
  onMove,
}: {
  col: ColumnDef;
  data: MenuData;
  canDelete: boolean;
  onChange: (fn: (c: ColumnDef) => void) => void;
  onDelete: () => void;
  onMove: (dir: number) => void;
}) {
  const used = new Set(col.groups);
  const available = allGroupIds(data).filter((g) => !used.has(g));

  return (
    <div className="bg-muted/40 space-y-2 rounded-md border p-2">
      <div className="flex items-center justify-between gap-1">
        <Select value={col.align} onValueChange={(v) => onChange((c) => (c.align = v as VAlign))}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALIGN_OPTS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onMove(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onMove(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive" disabled={!canDelete} onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {col.groups.length === 0 && <p className="text-muted-foreground py-2 text-center text-xs">그룹을 추가하세요</p>}
        {col.groups.map((g, gIdx) => (
          <div key={g} className="bg-background flex items-center justify-between gap-1 rounded border px-2 py-1">
            <span className="truncate text-xs">{groupLabel(g, data)}</span>
            <div className="flex shrink-0">
              <Button variant="ghost" size="icon" className="size-6" onClick={() => onChange((c) => move(c.groups, gIdx, gIdx - 1))}>
                <ChevronLeft className="size-3 rotate-90" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6" onClick={() => onChange((c) => move(c.groups, gIdx, gIdx + 1))}>
                <ChevronRight className="size-3 rotate-90" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => onChange((c) => c.groups.splice(gIdx, 1))}>
                <X className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {available.length > 0 && (
        <Select value="" onValueChange={(v) => onChange((c) => c.groups.push(v))}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="+ 그룹 추가" />
          </SelectTrigger>
          <SelectContent>
            {available.map((g) => (
              <SelectItem key={g} value={g}>
                {groupLabel(g, data)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
