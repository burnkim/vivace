import { useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { MonitorPlay, Pencil, FileDown, Store, SlidersHorizontal } from "lucide-react";
import { MenuStoreProvider } from "./state/menu-store";
import { AppModeProvider, useAppMode } from "./state/app-mode";
import { WebHorizontal } from "./components/view/WebHorizontal";
import { PagePreview } from "./components/view/PagePreview";
import { EditorPanel } from "./components/editor/EditorPanel";
import { ExportPanel } from "./components/export/ExportPanel";

type View = "web" | "editor" | "export";

const NAV: { id: View; label: string; icon: typeof MonitorPlay }[] = [
  { id: "web", label: "웹 뷰", icon: MonitorPlay },
  { id: "editor", label: "편집", icon: Pencil },
  { id: "export", label: "PDF 내보내기", icon: FileDown },
];

export default function App() {
  return (
    <AppModeProvider>
      <MenuStoreProvider>
        <Shell />
      </MenuStoreProvider>
    </AppModeProvider>
  );
}

function ModeToggle() {
  const { mode, setMode } = useAppMode();
  return (
    <div className="flex items-center rounded-md border p-0.5">
      <Button
        size="sm"
        variant={mode === "operate" ? "default" : "ghost"}
        className="h-7"
        onClick={() => setMode("operate")}
        title="메뉴 항목만 추가/삭제 (디자인 잠금)"
      >
        <Store className="mr-1 size-4" /> 운영
      </Button>
      <Button
        size="sm"
        variant={mode === "design" ? "default" : "ghost"}
        className="h-7"
        onClick={() => setMode("design")}
        title="레이아웃·여백·폰트까지 전체 편집"
      >
        <SlidersHorizontal className="mr-1 size-4" /> 디자인
      </Button>
    </div>
  );
}

function Shell() {
  const [view, setView] = useState<View>("web");

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-medium tracking-tight">Vivace 메뉴 시스템</span>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <nav className="flex gap-1">
            {NAV.map(({ id, label, icon: Icon }) => (
              <Button key={id} size="sm" variant={view === id ? "default" : "ghost"} onClick={() => setView(id)}>
                <Icon className="mr-1 size-4" />
                {label}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {view === "web" && <WebHorizontal />}
        {view === "editor" && (
          <div className="flex h-full">
            <div className="w-[440px] shrink-0 border-r">
              <EditorPanel />
            </div>
            <div className="min-w-0 flex-1">
              <PagePreview initial="a4l" />
            </div>
          </div>
        )}
        {view === "export" && <ExportPanel />}
      </main>

      <Toaster richColors position="top-center" />
    </div>
  );
}
