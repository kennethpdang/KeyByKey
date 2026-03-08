import React, { useEffect } from "react";
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

/**
 * Determines whether the table should render as a grid or as a column-by-column list.
 * Grid layout is used when the smaller dimension is 3 or under
 * AND the larger dimension is 5 or under.
 * Column layout is used for everything else.
 */
function shouldUseGridLayout(rows, cols) {
	return Math.min(rows, cols) <= 3 && Math.max(rows, cols) <= 5;
}

export default function TableEditor({ rows, cols, value, onChange }) {
	useEffect(() => {
		if (!value || !Array.isArray(value.cells)) {
			onChange(buildEmptyTable(rows, cols));
		} else if (value.rows !== rows || value.cols !== cols) {
			const resizedCells = Array.from({ length: rows }, (_, rowIndex) =>
				Array.from({ length: cols }, (_, colIndex) => {
					const existingCell = value.cells[rowIndex]?.[colIndex];
					return existingCell ? existingCell : { text: "", prefilled: false };
				})
			);

			onChange({ rows, cols, cells: resizedCells });
		}
	}, [rows, cols]); // eslint-disable-line

	const updateCell = (rowIndex, colIndex, patch) => {
		const updatedCells = value.cells.map((row) => row.slice());
		updatedCells[rowIndex][colIndex] = { ...updatedCells[rowIndex][colIndex], ...patch };
		onChange({ ...value, cells: updatedCells });
	};

	const handleTextareaInput = (event) => {
		event.target.style.height = 'auto';
		event.target.style.height = event.target.scrollHeight + 'px';
	};

	const prefillRow = (rowIndex, prefilled) => {
		const updatedCells = value.cells.map((row, currentRow) =>
			row.map((cell) => (currentRow === rowIndex ? { ...cell, prefilled } : cell))
		);

		onChange({ ...value, cells: updatedCells });
	};

	const prefillCol = (colIndex, prefilled) => {
		const updatedCells = value.cells.map((row) =>
			row.map((cell, currentCol) => (currentCol === colIndex ? { ...cell, prefilled } : cell))
		);

		onChange({ ...value, cells: updatedCells });
	};

	const clearAllPrefills = () => {
		const updatedCells = value.cells.map((row) =>
			row.map((cell) => ({ ...cell, prefilled: false }))
		);

		onChange({ ...value, cells: updatedCells });
	};

	const renderCellEditor = (rowIndex, colIndex, label) => {
		const cell = value.cells?.[rowIndex]?.[colIndex] || { text: "", prefilled: false };
		const cellId = `cell-${rowIndex}-${colIndex}`;
		const cellClassName = `table-editor-cell${cell.prefilled ? " prefilled-cell" : ""}`;

		return (
			<div key={cellId} className={cellClassName}>
				<div className="cell-editor-header">
					{label && <span className="cell-label">{label}</span>}
					<label className="prefill-toggle" htmlFor={`${cellId}-prefill`}>
						<input
							id={`${cellId}-prefill`}
							type="checkbox"
							checked={!!cell.prefilled}
							onChange={(event) => updateCell(rowIndex, colIndex, { prefilled: event.target.checked })}
						/>
						Prefill
					</label>
				</div>
				<textarea
					className="cell-textarea"
					value={cell.text}
					onChange={(event) => updateCell(rowIndex, colIndex, { text: event.target.value })}
					onInput={handleTextareaInput}
					placeholder={label || `Row ${rowIndex + 1}, Col ${colIndex + 1}`}
				/>
			</div>
		);
	};

	const renderGridLayout = () => {
		return (
			<div className="table-editor-grid-wrapper">
				<table className="table-editor-table">
					<tbody>
						{Array.from({ length: rows }).map((_, rowIndex) => (
							<tr key={rowIndex}>
								{Array.from({ length: cols }).map((_, colIndex) => (
									<td key={colIndex}>
										{renderCellEditor(rowIndex, colIndex, `Row ${rowIndex + 1}, Col ${colIndex + 1}`)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	const renderColumnLayout = () => {
		return (
			<div className="table-editor-columns-wrapper">
				<div className="table-editor-columns">
					{Array.from({ length: cols }).map((_, colIndex) => (
						<div key={colIndex} className="table-editor-column-group">
							<h3 className="column-group-header">Column {colIndex + 1}</h3>
							{Array.from({ length: rows }).map((_, rowIndex) => (
								renderCellEditor(rowIndex, colIndex, `Row ${rowIndex + 1}`)
							))}
						</div>
					))}
				</div>
			</div>
		);
	};

	const useGrid = shouldUseGridLayout(rows, cols);

	return (
		<div className="table-editor">
			<div className="controls">
				<button type="button" onClick={() => prefillRow(0, true)}>Prefill first row</button>
				<button type="button" onClick={() => prefillCol(0, true)}>Prefill first col</button>
				<button type="button" onClick={clearAllPrefills}>Clear all prefills</button>
			</div>
			{useGrid ? renderGridLayout() : renderColumnLayout()}
		</div>
	);
}