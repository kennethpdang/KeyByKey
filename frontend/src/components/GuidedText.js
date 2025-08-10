import React from "react";
import "../cascading_style_sheets/InteractiveMemorization.css";

export default function GuidedText({ text, feedback, pointer, mode, spinVisibility }) {
  const chars = Array.from(text);

  const renderChar = (ch, i) => {
    if (ch === "\n") return <br key={i} />;

    // Non-breaking space to keep multiple spaces visually distinct
    const render = ch;

    const isTyped = i < pointer;
    if (isTyped) {
      const item = feedback[i];
      const cls = `character ${item?.correct ? "correct" : "incorrect"}`;
      return (
        <span key={i} className={cls}>
          {render}
        </span>
      );
    }

    // Baseline/ghost
    let cls = "character";
    const visible = mode === "SPIN" ? (spinVisibility?.[i] ?? true) : true;
    if (!visible) cls += " hidden"; // keep width, hide glyph

    return (
      <span key={i} className={cls}>
        {render}
      </span>
    );
  };

  return <div className="feedback-container">{chars.map(renderChar)}</div>;
}