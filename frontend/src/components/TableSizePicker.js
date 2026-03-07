import React, { useState } from "react";
import "../cascading_style_sheets/TableBuilder.css";

export default function TableSizePicker({ value, onChange, max=7 }) {
  const [hover, setHover] = useState(null);
  
  const handleEnter = (r, c) => setHover({ rows: r, cols: c });
  const handleLeave = () => setHover(null);
  const handleClick = (r, c) => {
    onChange && onChange({ rows: r, cols: c });
    setHover(null); // Clear hover after selection
  };

  // Use value for display when not hovering, hover state when hovering
  const display = hover || value || { rows: 1, cols: 1 };

  return (
    <div className="sizepicker" onMouseLeave={handleLeave}>
      <div className="sizepicker-grid" role="grid" aria-rowcount={max} aria-colcount={max}>
        {Array.from({ length: max }).map((_, r) => (
          <div className="sizepicker-row" role="row" key={r}>
            {Array.from({ length: max }).map((__, c) => {
              const rr = r + 1, cc = c + 1;
              const active = rr <= display.rows && cc <= display.cols;
              return (
                <div
                  role="gridcell"
                  key={c}
                  className={`sizepicker-cell ${active ? "active" : ""}`}
                  onMouseEnter={() => handleEnter(rr, cc)}
                  onClick={() => handleClick(rr, cc)}
                  aria-label={`${rr} by ${cc}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="sizepicker-label">{display.rows} × {display.cols}</div>
    </div>
  );
}