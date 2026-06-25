import { useStudio } from "./state/store";
import { useStudioPersistence } from "./state/persistence";
import { EditorApp } from "./editor/EditorApp";
import { EditMode } from "./editor/EditMode";
import { PinGate } from "./PinGate";

/** Root: persistence runs once here (mode-independent), gated by the PIN lock,
    then we show either the full studio (관리자) or the mobile editor (수정). */
export function App() {
  useStudioPersistence();
  const mode = useStudio((s) => s.uiMode);
  return (
    <PinGate>
      {mode === "edit" ? <EditMode /> : <EditorApp />}
    </PinGate>
  );
}
