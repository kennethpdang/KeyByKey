import React from "react";
import "../cascading_style_sheets/ModeToolbar.css";

const modes = [
    { id: "READ", icon: "fa-user-graduate", label: "Read-only" },
    { id: "SPIN", icon: "fa-arrows-rotate", label: "Skip every 2nd word" },
    { id: "BRAIN", icon: "fa-brain", label: "Full blank-canvas" }
];

export default function ModeToolbar({ selected, onSelect }) {
    return (
        <div className="mode-toolbar">
            {modes.map(({ id, icon, label }) => (
            <button
                key={id}
                title={label}
                className={`icon-btn ${selected === id ? "active" : ""}`}
                onClick={() => onSelect(id)}
            >
            <i className={`fas ${icon}`}></i>
            </button>
            ))}
        </div>
    );
}
