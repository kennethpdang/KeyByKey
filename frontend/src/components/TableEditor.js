import React, { useEffect } from "react";
import "../cascading_style_sheets/TableBuilder.css";

export default function TableEditor({ rows, cols, value, onChange }) {
  useEffect(() => {
    if (!value || !Array.isArray(value.cells)) {
      onChange({
        rows,
        cols,
        cells: Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => ({ text: "", prefilled: false }))
        )
      });
    } else if (value.rows !== rows || value.cols !== cols) {
      const next = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const prev = value.cells[r]?.[c];
          return prev ? prev : { text: "", prefilled: false };
        })
      );
      onChange({ rows, cols, cells: next });
    }
  }, [rows, cols]); // eslint-disable-line

  const updateCell = (r, c, patch) => {
    const next = value.cells.map((row) => row.slice());
    next[r][c] = { ...next[r][c], ...patch };
    onChange({ ...value, cells: next });
  };

  const handleTextareaInput = (e) => {
    // Auto-resize textarea based on content
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const prefillRow = (r, v) => {
    const next = value.cells.map((row, ri) =>
      row.map((cell, ci) => (ri === r ? { ...cell, prefilled: v } : cell))
    );
    onChange({ ...value, cells: next });
  };

  const prefillCol = (c, v) => {
    const next = value.cells.map((row) =>
      row.map((cell, ci) => (ci === c ? { ...cell, prefilled: v } : cell))
    );
    onChange({ ...value, cells: next });
  };

  const clearAllPrefills = () => {
    const next = value.cells.map((row) =>
      row.map((cell) => ({ ...cell, prefilled: false }))
    );
    onChange({ ...value, cells: next });
  };

  return (
    <div className="table-editor">
      <div className="controls">
        <button type="button" onClick={() => prefillRow(0, true)}>Prefill first row</button>
        <button type="button" onClick={() => prefillCol(0, true)}>Prefill first col</button>
        <button type="button" onClick={clearAllPrefills}>Clear all prefills</button>
      </div>
      <table className="table-editor-table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((__, c) => {
                const cell = value.cells?.[r]?.[c] || { text: "", prefilled: false };
                const id = `cell-${r}-${c}`;
                return (
                  <td key={c} className="table-editor-cell">
                    <label className="prefill-toggle" htmlFor={`${id}-prefill`}>
                      <input
                        id={`${id}-prefill`}
                        type="checkbox"
                        checked={!!cell.prefilled}
                        onChange={(e) => updateCell(r, c, { prefilled: e.target.checked })}
                      />
                      Prefill
                    </label>
                    <textarea
                      className="cell-textarea"
                      value={cell.text}
                      onChange={(e) => updateCell(r, c, { text: e.target.value })}
                      onInput={handleTextareaInput}
                      placeholder={`Row ${r + 1}, Col ${c + 1}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}