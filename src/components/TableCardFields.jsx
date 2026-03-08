import React, { useState, useEffect } from "react";
import TableSizePicker from "./TableSizePicker";
import TableEditor from "./TableEditor";
import "../cascading_style_sheets/TableBuilder.css";

function buildEmptyTable(rows, cols) {
	return {
		rows,
		cols,
		cells: Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => ({ text: "", prefilled: false }))
		)
	};
}

export default function TableCardFields({
	type, setType,
	content, setContent,
	table, setTable
}) {
	const [size, setSize] = useState({
		rows: table?.rows || 2,
		cols: table?.cols || 2
	});

	// When switching to table mode, ensure a valid table object exists immediately.
	useEffect(() => {
		if (type === "table" && !table) {
			setTable(buildEmptyTable(size.rows, size.cols));
		}
	}, [type, table, size, setTable]);

	const handleSizeChange = (newSize) => {
		setSize(newSize);
		setTable(buildEmptyTable(newSize.rows, newSize.cols));
	};

	return (
		<div>
			<div className="form-group">
				<label>Card Type</label>
				<div style={{ display: "flex", gap: "8px" }}>
					<button
						type="button"
						className={`icon-btn ${type === "text" ? "active" : ""}`}
						onClick={() => setType("text")}
					>
						Text
					</button>
					<button
						type="button"
						className={`icon-btn ${type === "table" ? "active" : ""}`}
						onClick={() => setType("table")}
					>
						Table
					</button>
				</div>
			</div>

			{type === "text" ? (
				<div className="form-group">
					<label htmlFor="flashcardContent">Content/Response</label>
					<textarea
						id="flashcardContent"
						value={content}
						onChange={(event) => setContent(event.target.value)}
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
							onChange={handleSizeChange}
							max={7}
						/>
					</div>
					{table && (
						<TableEditor
							rows={size.rows}
							cols={size.cols}
							value={table}
							onChange={setTable}
						/>
					)}
				</>
			)}
		</div>
	);
}