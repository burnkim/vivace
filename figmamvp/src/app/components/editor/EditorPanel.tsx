import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Trash2, Plus, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useMenuStore } from "../../state/menu-store";
import { useAppMode } from "../../state/app-mode";
import { edit, newId, move } from "./edit-helpers";
import { LayoutEditor } from "./LayoutEditor";
import { StyleEditor } from "./StyleEditor";
import type { BadgeKind, MenuData, MenuSection } from "../../data/menu-types";

const BADGE_CYCLE: (BadgeKind | undefined)[] = [undefined, "signature", "best"];

function nextBadge(b?: BadgeKind): BadgeKind | undefined {
  const i = BADGE_CYCLE.indexOf(b);
  return BADGE_CYCLE[(i + 1) % BADGE_CYCLE.length];
}

function badgeLabel(b?: BadgeKind) {
  return b ? (b === "best" ? "Best" : "signature") : "뱃지 없음";
}

export function EditorPanel() {
  const { data, update, reset, status } = useMenuStore();
  const { mode } = useAppMode();
  const showDesign = mode === "design";

  const setData = (next: MenuData) => update(next);

  const firstTab = data.sections[0]?.id ?? "handdrip";
  const [tab, setTab] = useState(firstTab);
  // If the design-only tabs get hidden while one is active, fall back to content.
  useEffect(() => {
    if (!showDesign && (tab === "layout" || tab === "style")) setTab(firstTab);
  }, [showDesign, tab, firstTab]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 className="font-medium">메뉴 편집</h2>
          <p className="text-muted-foreground text-sm">
            {status === "saving" ? "저장 중…" : status === "error" ? "저장 오류 — 로컬에는 보관됨" : "변경 즉시 미리보기에 반영"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            reset();
            toast.success("기본 메뉴로 초기화했습니다");
          }}
        >
          <RotateCcw className="mr-1 size-4" /> 초기화
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="m-3 flex flex-wrap justify-start gap-1">
          {data.sections.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              {s.titleEn}
            </TabsTrigger>
          ))}
          <TabsTrigger value="handdrip">핸드드립</TabsTrigger>
          <TabsTrigger value="blends">블렌드 · 안내문</TabsTrigger>
          {showDesign && <TabsTrigger value="layout">레이아웃</TabsTrigger>}
          {showDesign && <TabsTrigger value="style">스타일</TabsTrigger>}
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
          {data.sections.map((section, sIdx) => (
            <TabsContent key={section.id} value={section.id} className="mt-0 space-y-3">
              <SectionEditor
                section={section}
                onChange={(fn) => setData(edit(data, (d) => fn(d.sections[sIdx])))}
              />
            </TabsContent>
          ))}

          <TabsContent value="handdrip" className="mt-0 space-y-3">
            <HandDripEditor data={data} setData={setData} />
          </TabsContent>

          <TabsContent value="blends" className="mt-0 space-y-3">
            <BlendsEditor data={data} setData={setData} />
          </TabsContent>

          {showDesign && (
            <TabsContent value="layout" className="mt-0">
              <LayoutEditor />
            </TabsContent>
          )}

          {showDesign && (
            <TabsContent value="style" className="mt-0">
              <StyleEditor />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
}: {
  section: MenuSection;
  onChange: (fn: (s: MenuSection) => void) => void;
}) {
  return (
    <>
      <Card className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="섹션명 (EN)">
            <Input value={section.titleEn} onChange={(e) => onChange((s) => (s.titleEn = e.target.value))} />
          </Field>
          <Field label="부제 (예: Hot / Ice)">
            <Input
              value={section.titleSub ?? ""}
              onChange={(e) => onChange((s) => (s.titleSub = e.target.value || undefined))}
            />
          </Field>
        </div>
        <Field label="섹션 안내문 (선택)">
          <Textarea
            value={section.note ?? ""}
            onChange={(e) => onChange((s) => (s.note = e.target.value || undefined))}
            rows={2}
          />
        </Field>
      </Card>

      {section.items.map((item, i) => (
        <Card key={item.id} className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">#{i + 1}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={() => onChange((s) => move(s.items, i, i - 1))}>
                <ChevronUp className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => onChange((s) => move(s.items, i, i + 1))}>
                <ChevronDown className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => onChange((s) => s.items.splice(i, 1))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="이름 (EN)">
              <Input value={item.nameEn} onChange={(e) => onChange((s) => (s.items[i].nameEn = e.target.value))} />
            </Field>
            <Field label="이름 (KR)">
              <Input value={item.nameKr} onChange={(e) => onChange((s) => (s.items[i].nameKr = e.target.value))} />
            </Field>
            <Field label="가격">
              <Input value={item.price} onChange={(e) => onChange((s) => (s.items[i].price = e.target.value))} />
            </Field>
            <Field label="가격 보조 (예: take out 3.5)">
              <Input
                value={item.priceNote ?? ""}
                onChange={(e) => onChange((s) => (s.items[i].priceNote = e.target.value || undefined))}
              />
            </Field>
          </div>
          <Field label="설명 (선택)">
            <Textarea value={item.desc ?? ""} onChange={(e) => onChange((s) => (s.items[i].desc = e.target.value || undefined))} rows={2} />
          </Field>
          <Button variant="outline" size="sm" onClick={() => onChange((s) => (s.items[i].badge = nextBadge(s.items[i].badge)))}>
            뱃지: {badgeLabel(item.badge)}
          </Button>
        </Card>
      ))}

      <Button
        variant="secondary"
        className="w-full"
        onClick={() =>
          onChange((s) => s.items.push({ id: newId(s.id), nameEn: "New Item", nameKr: "새 메뉴", price: "0.0" }))
        }
      >
        <Plus className="mr-1 size-4" /> 항목 추가
      </Button>
    </>
  );
}

function HandDripEditor({ data, setData }: { data: MenuData; setData: (d: MenuData) => void }) {
  const hd = data.handdrip;
  return (
    <>
      <Card className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="섹션명 (EN)">
            <Input value={hd.titleEn} onChange={(e) => setData(edit(data, (d) => (d.handdrip.titleEn = e.target.value)))} />
          </Field>
          <Field label="부제">
            <Input
              value={hd.titleSub ?? ""}
              onChange={(e) => setData(edit(data, (d) => (d.handdrip.titleSub = e.target.value || undefined)))}
            />
          </Field>
        </div>
        <Field label="하단 안내문 (로스팅 철학)">
          <Textarea value={hd.footerNote} onChange={(e) => setData(edit(data, (d) => (d.handdrip.footerNote = e.target.value)))} rows={3} />
        </Field>
      </Card>

      {hd.beans.map((bean, i) => (
        <Card key={bean.id} className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">#{i + 1}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setData(edit(data, (d) => move(d.handdrip.beans, i, i - 1)))}>
                <ChevronUp className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setData(edit(data, (d) => move(d.handdrip.beans, i, i + 1)))}>
                <ChevronDown className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setData(edit(data, (d) => d.handdrip.beans.splice(i, 1)))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="원두명 (EN)">
              <Input value={bean.nameEn} onChange={(e) => setData(edit(data, (d) => (d.handdrip.beans[i].nameEn = e.target.value)))} />
            </Field>
            <Field label="가공/등급">
              <Input value={bean.grade ?? ""} onChange={(e) => setData(edit(data, (d) => (d.handdrip.beans[i].grade = e.target.value || undefined)))} />
            </Field>
            <Field label="가격">
              <Input value={bean.price} onChange={(e) => setData(edit(data, (d) => (d.handdrip.beans[i].price = e.target.value)))} />
            </Field>
          </div>
          <Field label="헤드카피">
            <Input value={bean.headCopy} onChange={(e) => setData(edit(data, (d) => (d.handdrip.beans[i].headCopy = e.target.value)))} />
          </Field>
          <Field label="설명 (줄바꿈 가능)">
            <Textarea value={bean.desc} onChange={(e) => setData(edit(data, (d) => (d.handdrip.beans[i].desc = e.target.value)))} rows={3} />
          </Field>
        </Card>
      ))}

      <Button
        variant="secondary"
        className="w-full"
        onClick={() =>
          setData(edit(data, (d) => d.handdrip.beans.push({ id: newId("bean"), nameEn: "New Bean", price: "0.0", headCopy: "", desc: "" })))
        }
      >
        <Plus className="mr-1 size-4" /> 원두 추가
      </Button>
    </>
  );
}

function BlendsEditor({ data, setData }: { data: MenuData; setData: (d: MenuData) => void }) {
  return (
    <>
      {data.blends.map((blend, i) => (
        <Card key={blend.id} className="space-y-2 p-3">
          <Field label="라벨">
            <Input value={blend.label} onChange={(e) => setData(edit(data, (d) => (d.blends[i].label = e.target.value)))} />
          </Field>
          <Field label="설명">
            <Textarea value={blend.desc} onChange={(e) => setData(edit(data, (d) => (d.blends[i].desc = e.target.value)))} rows={4} />
          </Field>
        </Card>
      ))}
      <Separator />
      <Card className="space-y-2 p-3">
        <Field label="에스프레소 안내문 (디카페인 / 샷 추가)">
          <Textarea value={data.notes.espresso} onChange={(e) => setData(edit(data, (d) => (d.notes.espresso = e.target.value)))} rows={2} />
        </Field>
      </Card>
    </>
  );
}
