import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { useMenuStore } from "../../state/menu-store";
import { edit } from "./edit-helpers";
import { GOOGLE_FONTS, ensureFontLoaded } from "../../menu/fonts";
import { STYLE_DEFAULTS, type MenuData, type StyleConfig } from "../../data/menu-types";

const SERIF = GOOGLE_FONTS.filter((f) => f.type === "serif");
const SANS = GOOGLE_FONTS.filter((f) => f.type === "sans");

export function StyleEditor() {
  const { data, update } = useMenuStore();
  const style = data.config.style;
  const set = (fn: (s: StyleConfig) => void) => update(edit(data, (d: MenuData) => fn(d.config.style)));

  return (
    <div className="space-y-3">
      <Card className="space-y-3 p-3">
        <FontPicker
          label="메뉴 타이틀 폰트"
          value={style.titleFont}
          onChange={(v) => {
            ensureFontLoaded(v);
            set((s) => (s.titleFont = v));
          }}
        />
        <FontPicker
          label="상세 메뉴 폰트"
          value={style.bodyFont}
          onChange={(v) => {
            ensureFontLoaded(v);
            set((s) => (s.bodyFont = v));
          }}
        />
        <p className="text-muted-foreground text-xs">한글은 자동으로 Noto Sans/Serif KR로 보완됩니다.</p>
      </Card>

      <Card className="space-y-4 p-3">
        <p className="text-muted-foreground text-xs font-medium">여백 / 간격 (px @ A4 기준, A3는 자동 확대)</p>
        <SliderRow label="페이지 여백 — 좌우" value={style.pagePadX ?? STYLE_DEFAULTS.pagePadX} min={40} max={360} step={2} onChange={(v) => set((s) => (s.pagePadX = v))} />
        <SliderRow label="페이지 여백 — 상하" value={style.pagePadY ?? STYLE_DEFAULTS.pagePadY} min={40} max={400} step={2} onChange={(v) => set((s) => (s.pagePadY = v))} />
        <SliderRow label="단(컬럼) 간격" value={style.columnGap ?? STYLE_DEFAULTS.columnGap} min={16} max={200} step={2} onChange={(v) => set((s) => (s.columnGap = v))} />
        <SliderRow label="그룹 간격" value={style.groupGap} min={16} max={160} step={2} onChange={(v) => set((s) => (s.groupGap = v))} />
        <SliderRow label="메뉴 항목 간격 (행간)" value={style.itemGap} min={8} max={100} step={2} onChange={(v) => set((s) => (s.itemGap = v))} />
        <SliderRow label="설명 줄 높이" value={style.lineHeight} min={1} max={2} step={0.05} onChange={(v) => set((s) => (s.lineHeight = v))} format={(v) => v.toFixed(2)} />
      </Card>

      <Card className="flex items-center justify-between p-3">
        <div>
          <Label>블렌드 안내문 표시</Label>
          <p className="text-muted-foreground text-xs">[A]/[B] Blend 설명 박스 켜기/끄기</p>
        </div>
        <Switch checked={style.showBlends} onCheckedChange={(v) => set((s) => (s.showBlends = v))} />
      </Card>
    </div>
  );
}

function FontPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Serif</SelectLabel>
            {SERIF.map((f) => (
              <SelectItem key={f.name} value={f.name}>
                {f.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Sans</SelectLabel>
            {SANS.map((f) => (
              <SelectItem key={f.name} value={f.name}>
                {f.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs">{label}</Label>
        <span className="text-xs tabular-nums">{format ? format(value) : Math.round(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
