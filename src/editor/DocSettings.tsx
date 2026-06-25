import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { BadgeDef, FontDef, MenuDocument } from "../core/types";
import { uid } from "../core/doc";
import { badgeStyle } from "../render/badge";
import { hashPin } from "../PinGate";
import { listBackups, createBackup, deleteBackup, backupSummary, type Backup } from "../lib/backups";
import { useStudio } from "../state/store";
import { Field, NumInput, Range, Row, Segmented, Select, ColorInput, TextInput } from "./controls";

type Tab = "fonts" | "badges" | "type" | "security" | "backups";

/** Date label for a backup (local time). */
export function fmtBackupDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Renders inside the right panel (replaces the inspector) so edits preview live
    on the canvas. */
export function DocSettings({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("type");
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#ebe7df] px-3 py-2.5">
        <div className="text-[13px] font-semibold text-[#2a2723]">문서 설정</div>
        <button onClick={onClose} title="닫기 (인스펙터로)" className="rounded p-1 text-[#837e74] hover:bg-[#f1eee8] hover:text-[#2a2723]"><X className="size-4" /></button>
      </div>
      <div className="flex gap-1 border-b border-[#ebe7df] px-3 py-2">
        {([["type", "타입"], ["fonts", "폰트"], ["badges", "뱃지"], ["security", "보안"], ["backups", "백업"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 whitespace-nowrap rounded-md px-1.5 py-1 text-[12px] transition-colors ${tab === t ? "bg-[#f6ece4] font-medium text-[#a94e31]" : "text-[#837e74] hover:bg-[#f4f2ed]"}`}>{label}</button>
        ))}
      </div>
      <div className="studio-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "type" && <TypeScale />}
        {tab === "fonts" && <FontsTab />}
        {tab === "badges" && <BadgesTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "backups" && <BackupsTab />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Global type scale --- */

const TOKEN_FIELDS: { key: keyof MenuDocument["tokens"]["font"]; label: string }[] = [
  { key: "wordmark", label: "워드마크" },
  { key: "sectionTitle", label: "섹션 제목" },
  { key: "sectionSub", label: "섹션 부제" },
  { key: "itemNameEn", label: "항목 이름(EN)" },
  { key: "itemNameKr", label: "항목 이름(KR)" },
  { key: "itemPrice", label: "항목 가격" },
  { key: "itemDesc", label: "항목 설명" },
  { key: "note", label: "안내문" },
  { key: "beanNameEn", label: "원두 이름" },
  { key: "beanGrade", label: "원두 등급/가공" },
  { key: "beanPrice", label: "원두 가격" },
  { key: "headCopy", label: "헤드카피" },
  { key: "beanDesc", label: "원두 설명" },
  { key: "text", label: "텍스트 블록" },
];

function TypeScale() {
  const tokens = useStudio((s) => s.doc.tokens);
  const fonts = useStudio((s) => s.doc.fonts);
  const updateDoc = useStudio((s) => s.updateDoc);
  const fontOpts = fonts.map((f) => ({ value: f.family, label: f.family }));
  const fontOptsOpt = [{ value: "", label: "(기본)" }, ...fontOpts];

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-[#faf1e7] px-3 py-2 text-[11px] text-[#a6712f]">여기서 바꾸면 <b>모든 페이지의 모든 섹션</b>에 한 번에 적용됩니다. 개별 블록만 다르게 하려면 해당 블록을 선택해 인스펙터에서 덮어쓰세요.</p>
      <Row>
        <Field label="기본 제목 글꼴"><Select value={tokens.fonts.display} onChange={(v) => updateDoc((d) => void (d.tokens.fonts.display = v))} options={fontOpts} /></Field>
        <Field label="기본 본문 글꼴"><Select value={tokens.fonts.body} onChange={(v) => updateDoc((d) => void (d.tokens.fonts.body = v))} options={fontOpts} /></Field>
      </Row>
      <Row>
        <Field label="가격 글꼴" hint="비우면 제목 글꼴 사용"><Select value={tokens.fonts.price ?? ""} onChange={(v) => updateDoc((d) => void (d.tokens.fonts.price = v || undefined))} options={fontOptsOpt} /></Field>
        <Field label="한글 글꼴" hint="비우면 Pretendard"><Select value={tokens.fonts.kr ?? ""} onChange={(v) => updateDoc((d) => void (d.tokens.fonts.kr = v || undefined))} options={fontOptsOpt} /></Field>
      </Row>
      <Row>
        <Field label="등급/가공 글꼴" hint="원두 Washed/Natural"><Select value={tokens.fonts.grade ?? ""} onChange={(v) => updateDoc((d) => void (d.tokens.fonts.grade = v || undefined))} options={fontOptsOpt} /></Field>
      </Row>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {TOKEN_FIELDS.map((f) => (
          <Field key={f.key} label={`${f.label} (px)`}>
            <NumInput value={tokens.font[f.key]} onChange={(v) => updateDoc((d) => void (d.tokens.font[f.key] = v))} />
          </Field>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 border-t border-[#ebe7df] pt-3">
        <Field label="섹션 간격"><NumInput value={tokens.space.sectionGap} onChange={(v) => updateDoc((d) => void (d.tokens.space.sectionGap = v))} /></Field>
        <Field label="항목 간격"><NumInput value={tokens.space.itemGap} onChange={(v) => updateDoc((d) => void (d.tokens.space.itemGap = v))} /></Field>
        <Field label="단 간격"><NumInput value={tokens.space.columnGap} onChange={(v) => updateDoc((d) => void (d.tokens.space.columnGap = v))} /></Field>
      </div>
      <Field label={`원두 설명 너비 — ${tokens.beanCopyWidth ?? 66}%`} hint="핸드드립 헤드카피·설명이 줄바꿈되는 가로 지점 (가격 전까지)">
        <Range value={tokens.beanCopyWidth ?? 66} min={30} max={100} step={1} onChange={(v) => updateDoc((d) => void (d.tokens.beanCopyWidth = v))} />
      </Field>
      <Field label="헤드카피 두께" hint="핸드드립 헤드카피 굵기 — 모든 원두에 일괄 적용">
        <Select value={String(tokens.headCopyWeight ?? 700)} onChange={(v) => updateDoc((d) => void (d.tokens.headCopyWeight = Number(v)))} options={[300, 400, 500, 600, 700, 800, 900].map((w) => ({ value: String(w), label: String(w) }))} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="잉크(기본 글자색)"><ColorInput value={tokens.color.ink} onChange={(v) => updateDoc((d) => void (d.tokens.color.ink = v))} /></Field>
        <Field label="보조 글자색"><ColorInput value={tokens.color.muted} onChange={(v) => updateDoc((d) => void (d.tokens.color.muted = v))} /></Field>
        <Field label="선 색"><ColorInput value={tokens.color.line} onChange={(v) => updateDoc((d) => void (d.tokens.color.line = v))} /></Field>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Fonts -- */

function FontsTab() {
  const fonts = useStudio((s) => s.doc.fonts);
  const updateDoc = useStudio((s) => s.updateDoc);
  const [source, setSource] = useState<FontDef["source"]>("google");
  const [family, setFamily] = useState("");
  const [href, setHref] = useState("");
  const [role, setRole] = useState<FontDef["role"]>("display");

  const add = (extra?: Partial<FontDef>) => {
    const fam = (extra?.family ?? family).trim();
    if (!fam) return;
    updateDoc((d) => void d.fonts.push({ id: uid("f"), family: fam, role, source, href: extra?.href ?? (href || undefined) }));
    setFamily("");
    setHref("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {fonts.map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded-md border border-[#e6e2da] bg-[#faf9f6] px-3 py-2 text-[12px]">
            <span style={{ fontFamily: `'${f.family}', sans-serif` }} className="flex-1 text-[#2a2723]">{f.family} <span className="text-[15px]">Aa 가나</span></span>
            <span className="rounded bg-[#f6ece4] px-1.5 py-0.5 text-[10px] text-[#a6712f]">{f.role === "display" ? "제목" : "본문"}·{f.source}</span>
            <button onClick={() => updateDoc((d) => void (d.fonts = d.fonts.filter((x) => x.id !== f.id)))} className="text-[#c84a30]"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-[#e6e2da] p-3">
        <div className="text-[12px] font-semibold text-[#45413a]">폰트 추가</div>
        <Field label="종류"><Segmented value={source} onChange={(v) => setSource(v)} options={[{ value: "google", label: "Google" }, { value: "adobe", label: "Adobe" }, { value: "custom", label: "업로드" }]} /></Field>
        <Row>
          <Field label="패밀리 이름"><TextInput value={family} onChange={setFamily} placeholder={source === "google" ? "예: Cormorant Garamond" : "CSS font-family 이름"} /></Field>
          <Field label="역할"><Segmented value={role} onChange={(v) => setRole(v)} options={[{ value: "display", label: "제목" }, { value: "body", label: "본문" }]} /></Field>
        </Row>
        {source === "adobe" && <Field label="Typekit kit ID" hint="fonts.adobe.com → 웹 프로젝트 → 임베드 코드의 use.typekit.net/XXXX.css 의 XXXX"><TextInput value={href} onChange={setHref} placeholder="예: abc1def" /></Field>}
        {source === "custom" && (
          <Field label="폰트 파일(.woff2/.ttf/.otf)">
            <input type="file" accept=".woff2,.woff,.ttf,.otf" className="w-full text-[12px] text-[#837e74] file:mr-2 file:rounded file:border-0 file:bg-[#c2603f] file:px-2 file:py-1 file:text-white"
              onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => add({ href: String(r.result) }); r.readAsDataURL(f); }} />
          </Field>
        )}
        {source !== "custom" && (
          <button onClick={() => add()} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#c2603f] py-1.5 text-[12px] font-medium text-white hover:bg-[#a94e31]"><Plus className="size-4" /> 추가</button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Badges -- */

function BadgesTab() {
  const badges = useStudio((s) => s.doc.badges);
  const updateDoc = useStudio((s) => s.updateDoc);
  const setB = (id: string, recipe: (b: BadgeDef) => void) => updateDoc((d) => { const b = d.badges.find((x) => x.id === id); if (b) recipe(b); });

  return (
    <div className="space-y-3">
      {badges.map((b) => (
        <div key={b.id} className="space-y-2 rounded-lg border border-[#e6e2da] p-3">
          <div className="flex items-center gap-2">
            <span style={{ ...badgeStyle(b, (n) => n * 0.62), fontSize: 12 }}>{b.label}</span>
            <div className="flex-1" />
            <button onClick={() => updateDoc((d) => void (d.badges = d.badges.filter((x) => x.id !== b.id)))} className="text-[#c84a30]"><Trash2 className="size-3.5" /></button>
          </div>
          <Row>
            <Field label="라벨"><TextInput value={b.label} onChange={(v) => setB(b.id, (x) => void (x.label = v))} /></Field>
            <Field label="모양"><Select value={b.shape} onChange={(v) => setB(b.id, (x) => void (x.shape = v))} options={[{ value: "pill", label: "알약" }, { value: "ellipse", label: "타원(찌부)" }, { value: "tag", label: "태그" }, { value: "outline", label: "외곽선" }, { value: "sawtooth", label: "톱니" }]} /></Field>
          </Row>
          <Row>
            <Field label="배경색"><ColorInput value={b.bg} onChange={(v) => setB(b.id, (x) => void (x.bg = v))} /></Field>
            <Field label="글자색"><ColorInput value={b.fg} onChange={(v) => setB(b.id, (x) => void (x.fg = v))} /></Field>
          </Row>
        </div>
      ))}
      <button onClick={() => updateDoc((d) => void d.badges.push({ id: uid("badge"), label: "New", bg: "#111111", fg: "#ffffff", shape: "pill" }))} className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[#e6e2da] py-2 text-[12px] text-[#837e74] hover:border-[#c2603f] hover:text-[#c2603f]"><Plus className="size-4" /> 뱃지 추가</button>
    </div>
  );
}

/* -------------------------------------------------------------- Security -- */

function SecurityTab() {
  const pinHash = useStudio((s) => s.doc.security?.pinHash);
  const updateDoc = useStudio((s) => s.updateDoc);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const isDefault = !pinHash;
  const valid = /^\d{6}$/.test(pin) && pin === confirm;
  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 6);
  const pinCls = "w-full rounded-md border border-[#e6e2da] bg-[#faf9f6] px-2 py-2 text-center text-[18px] tracking-[0.4em] text-[#2a2723] outline-none focus:border-[#c2603f] placeholder:tracking-normal placeholder:text-[#bcb6aa]";

  const save = async () => {
    if (!valid) return;
    const h = await hashPin(pin);
    updateDoc((d) => { d.security = { pinHash: h }; });
    setPin(""); setConfirm(""); setDone(true);
    setTimeout(() => setDone(false), 2600);
  };

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-[#faf1e7] px-3 py-2 text-[11px] leading-relaxed text-[#a6712f]">
        앱을 열 때 입력하는 <b>6자리 숫자 비밀번호</b>입니다. 한 번 바꾸면 <b>모든 기기에 함께</b> 적용됩니다. {isDefault && <b className="text-[#c84a30]">지금은 기본값(000000) — 꼭 변경하세요.</b>}
      </p>
      <Field label="새 비밀번호 (숫자 6자리)">
        <input inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={(e) => setPin(onlyDigits(e.target.value))} placeholder="● ● ● ● ● ●" className={pinCls} />
      </Field>
      <Field label="비밀번호 확인">
        <input inputMode="numeric" autoComplete="off" maxLength={6} value={confirm} onChange={(e) => setConfirm(onlyDigits(e.target.value))} placeholder="● ● ● ● ● ●" className={pinCls} />
      </Field>
      {pin && confirm && pin !== confirm && <p className="text-[11px] text-[#c84a30]">두 비밀번호가 일치하지 않습니다.</p>}
      <button onClick={save} disabled={!valid} className="w-full rounded-md bg-[#c2603f] py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#a94e31] disabled:cursor-not-allowed disabled:opacity-40">
        비밀번호 변경
      </button>
      {done && <p className="text-center text-[12px] font-medium text-[#1d8f5e]">✓ 변경되었습니다. 다음 접속부터 적용돼요.</p>}
      <p className="text-[10px] leading-relaxed text-[#9a958b]">참고: 링크를 아는 사람은 누구나 접속 화면까지는 볼 수 있고, 이 비밀번호로만 안쪽이 열립니다. 가벼운 잠금이라 완벽한 보안은 아니에요(메뉴 데이터 자체는 공개 키로 읽힘).</p>
    </div>
  );
}

/* --------------------------------------------------------------- Backups -- */

function BackupsTab() {
  const restoreDoc = useStudio((s) => s.restoreDoc);
  const [list, setList] = useState<Backup[]>(() => listBackups());
  const [saved, setSaved] = useState(false);
  const refresh = () => setList(listBackups());

  const save = () => {
    createBackup(useStudio.getState().doc);
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const restore = (b: Backup) => {
    if (!confirm(`${fmtBackupDate(b.ts)} 백업으로 되돌릴까요?\n\n지금 메뉴가 이 백업 내용으로 바뀝니다. (되돌리기 전에 '현재 상태 백업'을 먼저 눌러두면 더 안전해요.)`)) return;
    restoreDoc(b.doc);
  };
  const del = (b: Backup) => {
    if (!confirm(`${fmtBackupDate(b.ts)} 백업을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    deleteBackup(b.id);
    refresh();
  };

  return (
    <div className="space-y-3">
      <p className="rounded-md bg-[#faf1e7] px-3 py-2 text-[11px] leading-relaxed text-[#a6712f]">
        지금 메뉴 상태를 <b>날짜별로 저장</b>해 둡니다. 실수로 지웠을 때 그 시점으로 <b>되돌릴</b> 수 있어요. (이 기기에 보관 · 복원/삭제는 관리자 전용)
      </p>
      <button onClick={save} className="w-full rounded-md bg-[#c2603f] py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#a94e31]">
        {saved ? "✓ 백업 저장됨" : "현재 상태 백업 저장"}
      </button>
      <div className="space-y-1.5 pt-1">
        {list.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-[#9a958b]">아직 저장된 백업이 없습니다.</p>
        ) : (
          list.map((b) => (
            <div key={b.id} className="flex items-center gap-2 rounded-md border border-[#e6e2da] bg-[#faf9f6] px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-[#2a2723]">{fmtBackupDate(b.ts)}</div>
                <div className="text-[10px] text-[#9a958b]">{backupSummary(b.doc)}</div>
              </div>
              <button onClick={() => restore(b)} className="shrink-0 rounded-md border border-[#e6e2da] bg-white px-2.5 py-1 text-[11px] font-medium text-[#45413a] hover:border-[#c2603f] hover:text-[#a94e31]">복원</button>
              <button onClick={() => del(b)} title="삭제" className="shrink-0 rounded p-1 text-[#c84a30] hover:bg-[#f8e9e4]"><Trash2 className="size-3.5" /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
