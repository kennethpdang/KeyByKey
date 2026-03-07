import React, { useState } from "react";
import TableSizePicker from "./TableSizePicker";
import TableEditor from "./TableEditor";
import "../cascading_style_sheets/TableBuilder.css";

export default function TableCardFields({
type, setType,
content, setContent,
table, setTable
}) {
const [size, setSize] = useState({ rows: table?.rows || 2, cols: table?.cols || 2 });

return (
    <div>
    <div className="form-group">
        <label>Card Type</label>
        <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" className={`icon-btn ${type === "text" ? "active" : ""}`} onClick={() => setType("text")}>Text</button>
        <button type="button" className={`icon-btn ${type === "table" ? "active" : ""}`} onClick={() => setType("table")}>Table</button>
        </div>
    </div>

    {type === "text" ? (
        <div className="form-group">
        <label htmlFor="flashcardContent">Content/Response</label>
        <textarea
            id="flashcardContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter flashcard content"
            required
        />
        </div>
    ) : (
        <>
        <div className="form-group">
            <label>Choose table size (max 7×7)</label>
            <TableSizePicker
            value={size}
            onChange={(s) => {
                setSize(s);
                setTable({
                rows: s.rows,
                cols: s.cols,
                cells: Array.from({ length: s.rows }, () =>
                    Array.from({ length: s.cols }, () => ({ text: "", prefilled: false }))
                )
                });
            }}
            max={7}
            />
        </div>
        <TableEditor
            rows={size.rows}
            cols={size.cols}
            value={table || { rows: size.rows, cols: size.cols, cells: [] }}
            onChange={setTable}
        />
        </>
    )}
    </div>
);
}
