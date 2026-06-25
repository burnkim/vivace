import { useStudio } from "./state/store";
import { useStudioPersistence } from "./state/persistence";
import { EditorApp } from "./editor/EditorApp";
import { EditMode } from "./editor/EditMode";

/** Root: persistence runs once here (mode-independent), then we show either the
    full studio (관리자) or the mobile content editor (수정). */
export function App() {
  useStudioPersistence();
  const mode = useStudio((s) => s.uiMode);
  return mode === "edit" ? <EditMode /> : <EditorApp />;
}
