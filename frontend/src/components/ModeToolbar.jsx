import React from "react";
import { Student, ArrowsClockwise, Brain } from "@phosphor-icons/react";
import "../cascading_style_sheets/ModeToolbar.css";

const modes = [
	{ id: "READ", icon: Student, label: "Read-only" },
	{ id: "SPIN", icon: ArrowsClockwise, label: "Skip every 2nd word" },
	{ id: "BRAIN", icon: Brain, label: "Full blank-canvas" }
];

export default function ModeToolbar({ selected, onSelect }) {
	return (
		<div className="mode-toolbar">
			{modes.map(({ id, icon: Icon, label }) => (
				<button
					key={id}
					title={label}
					className={`icon-btn ${selected === id ? "active" : ""}`}
					onClick={() => onSelect(id)}
				>
					<Icon size={20} />
				</button>
			))}
		</div>
	);
}