import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-[#e6e2da] bg-[#faf9f6] px-2 py-1.5 text-[13px] text-[#2a2723] outline-none focus:border-[#c2603f] placeholder:text-[#b0aba0]";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-[#837e74]">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-[#9a958b]">{hint}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function TextArea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className={inputCls + " resize-y leading-snug"} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function NumInput({ value, onChange, step = 1, min, max }: { value: number | undefined; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <input
      type="number"
      className={inputCls}
      value={value ?? ""}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value))}
    />
  );
}

export function Range({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" className="h-1 flex-1 accent-[#c2603f]" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-[#837e74]">{Math.round(value * 100) / 100}</span>
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T | undefined; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-[#e6e2da]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 px-2 py-1.5 text-[12px] transition-colors ${value === o.value ? "bg-[#c2603f] text-white" : "bg-[#faf9f6] text-[#837e74] hover:bg-[#f1eee8]"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" className="h-7 w-9 shrink-0 cursor-pointer rounded border border-[#e6e2da] bg-transparent" value={value} onChange={(e) => onChange(e.target.value)} />
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Collapsible({ title, children, defaultOpen = true, right }: { title: string; children: ReactNode; defaultOpen?: boolean; right?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#ebe7df]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-semibold tracking-wide text-[#45413a] hover:bg-[#f4f2ed]">
        <span className="flex items-center gap-1.5">
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          {title}
        </span>
        {right}
      </button>
      {open && <div className="space-y-3 px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
