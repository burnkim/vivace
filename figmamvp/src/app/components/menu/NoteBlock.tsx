import { useScale } from "../../menu/ScaleContext";

type Props = {
  text: string;
  align?: "left" | "center" | "right";
  /** Use the slightly smaller body size instead of the note size. */
  size?: "note" | "small";
};

/**
 * Standardized note block (decaf / extra-shot, roasting philosophy). All
 * variants share one size + alignment system here — this is what fixes the
 * original per-variant inconsistencies.
 */
export function NoteBlock({ text, align = "right", size = "note" }: Props) {
  const { tokens, fonts } = useScale();
  return (
    <p
      style={{
        width: "100%",
        margin: 0,
        textAlign: align,
        fontFamily: fonts.body,
        fontSize: size === "note" ? tokens.font.note : tokens.font.itemDesc,
        fontWeight: 500,
        color: "black",
        lineHeight: 1.4,
        whiteSpace: "pre-line",
      }}
    >
      {text}
    </p>
  );
}
