import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { processDisplayText } from "../utils/textProcessing";
import GuidedTableCell from "./GuidedTableCell";
import "../cascading_style_sheets/InteractiveTableMemorization.css";

/**
 * Orchestrates a table-based memorization session.
 * Manages the grid of cells, navigation between cells, completion tracking,
 * and the spaced repetition review call on mastery.
 */
export default function InteractiveTableMemorization({ table, mode = "BRAIN", flashcardId, onReviewed }) {
	const rows = Number(table?.rows) || 0;
	const cols = Number(table?.cols) || 0;

	const cells = useMemo(() => {
		const rawCells = Array.isArray(table?.cells) ? table.cells : [];

		return Array.from({ length: rows }, (_, rowIndex) =>
			Array.from({ length: cols }, (_, colIndex) => {
				const row = Array.isArray(rawCells[rowIndex]) ? rawCells[rowIndex] : [];
				const cell = row[colIndex] && typeof row[colIndex] === "object" ? row[colIndex] : {};

				return {
					text: typeof cell.text === "string"
						? cell.text
						: (cell.text == null ? "" : String(cell.text)),
					prefilled: !!cell.prefilled,
				};
			})
		);
	}, [rows, cols, table]);

	const [activeCell, setActiveCell] = useState({ row: 0, col: 0 });
	const [cellAccuracies, setCellAccuracies] = useState({});
	const [cellFeedback, setCellFeedback] = useState({});
	const postedRef = useRef(false);

	const hasLongCell = useMemo(() =>
		cells.some(row => row.some(cell => cell.text.length > 42)),
		[cells]
	);

	// ========================= INITIALIZATION =========================

	useEffect(() => {
		for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
			for (let colIndex = 0; colIndex < cols; colIndex++) {
				if (!cells[rowIndex][colIndex].prefilled && cells[rowIndex][colIndex].text) {
					setActiveCell({ row: rowIndex, col: colIndex });
					return;
				}
			}
		}
	}, [rows, cols, cells]);

	// ========================= COMPLETION TRACKING =========================

	// Live accuracy computed from all cells' keystroke feedback.
	const liveAccuracy = useMemo(() => {
		const entries = Object.values(cellFeedback);

		if (entries.length === 0) {
			return 0;
		}

		const totalCorrect = entries.reduce((sum, entry) => sum + entry.correct, 0);
		const totalKeystrokes = entries.reduce((sum, entry) => sum + entry.total, 0);

		if (totalKeystrokes === 0) {
			return 0;
		}

		return Math.round((totalCorrect / totalKeystrokes) * 100);
	}, [cellFeedback]);

	const stats = useMemo(() => {
		const nonPrefilledCells = cells.flat().filter(cell => !cell.prefilled && cell.text.length > 0);
		const totalCount = nonPrefilledCells.length;
		const completedCount = Object.keys(cellAccuracies).length;

		return {
			totalCells: totalCount,
			totalAccuracy: liveAccuracy,
			allCompleted: completedCount === totalCount && totalCount > 0
		};
	}, [cells, cellAccuracies, liveAccuracy]);

	useEffect(() => {
		postedRef.current = false;
	}, [flashcardId]);

	useEffect(() => {
		const shouldPostReview = (
			!postedRef.current &&
			stats.allCompleted &&
			mode === "BRAIN" &&
			stats.totalAccuracy >= 90 &&
			flashcardId
		);

		if (!shouldPostReview) {
			return;
		}

		postedRef.current = true;

		fetch(`/api/flashcards/${flashcardId}/review`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ mode: "BRAIN", accuracy: stats.totalAccuracy })
		})
			.then(() => {
				if (onReviewed) {
					onReviewed();
				}
			})
			.catch(console.error);
	}, [stats, mode, flashcardId, onReviewed]);

	// ========================= NAVIGATION =========================

	/**
	 * Builds a flat list of navigable cell positions and finds the next/previous
	 * cell relative to the current one.
	 */
	const findAdjacentCell = useCallback((currentRow, currentCol, direction = 1) => {
		const navigablePositions = [];

		for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
			for (let colIndex = 0; colIndex < cols; colIndex++) {
				if (!cells[rowIndex][colIndex].prefilled && cells[rowIndex][colIndex].text) {
					navigablePositions.push({ row: rowIndex, col: colIndex });
				}
			}
		}

		const currentIndex = navigablePositions.findIndex(
			position => position.row === currentRow && position.col === currentCol
		);

		if (currentIndex === -1) {
			return null;
		}

		const nextIndex = (currentIndex + direction + navigablePositions.length) % navigablePositions.length;
		return navigablePositions[nextIndex];
	}, [rows, cols, cells]);

	const handleKeyDown = useCallback((event) => {
		const activeElement = document.activeElement;
		const isInputFocused = activeElement && (
			activeElement.tagName === 'INPUT' ||
			activeElement.tagName === 'TEXTAREA' ||
			activeElement.tagName === 'SELECT' ||
			activeElement.contentEditable === 'true'
		);

		if (isInputFocused || document.querySelector('.modal-overlay')) {
			return;
		}

		const { row, col } = activeCell;

		if (event.key === "Tab") {
			event.preventDefault();

			const direction = event.shiftKey ? -1 : 1;
			const nextCell = findAdjacentCell(row, col, direction);

			if (nextCell) {
				setActiveCell(nextCell);
			}
		} else if (event.ctrlKey && /^Arrow/.test(event.key)) {
			event.preventDefault();

			const directions = {
				ArrowRight: { deltaRow: 0, deltaCol: 1 },
				ArrowLeft: { deltaRow: 0, deltaCol: -1 },
				ArrowDown: { deltaRow: 1, deltaCol: 0 },
				ArrowUp: { deltaRow: -1, deltaCol: 0 }
			};

			const direction = directions[event.key];

			if (!direction) {
				return;
			}

			const maxSteps = direction.deltaRow !== 0 ? rows : cols;

			for (let step = 1; step < maxSteps; step++) {
				const newRow = direction.deltaRow !== 0
					? (row + direction.deltaRow * step + rows) % rows
					: row;
				const newCol = direction.deltaCol !== 0
					? (col + direction.deltaCol * step + cols) % cols
					: col;

				if (!cells[newRow][newCol].prefilled && cells[newRow][newCol].text) {
					setActiveCell({ row: newRow, col: newCol });
					break;
				}
			}
		}
	}, [activeCell, rows, cols, cells, findAdjacentCell]);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	// ========================= RENDERING =========================

	const handleCellComplete = (cellKey, accuracy) => {
		setCellAccuracies(previous => ({ ...previous, [cellKey]: accuracy }));
	};

	const handleFeedbackUpdate = useCallback((cellKey, correctCount, totalCount) => {
		setCellFeedback(previous => ({
			...previous,
			[cellKey]: { correct: correctCount, total: totalCount }
		}));
	}, []);

	const renderCell = (rowIndex, colIndex) => {
		const cell = cells[rowIndex][colIndex];
		const cellKey = `${rowIndex}-${colIndex}`;
		const shouldCenter = hasLongCell && cell.text.length < 14;
		const isCellActive = activeCell.row === rowIndex && activeCell.col === colIndex;

		if (cell.prefilled) {
			const processedText = processDisplayText(cell.text);

			return (
				<div className={`cell prefilled ${shouldCenter ? "centered-text" : ""}`} key={cellKey}>
					<div className="prefilled-text">{processedText}</div>
				</div>
			);
		}

		return (
			<GuidedTableCell
				key={cellKey}
				target={cell.text}
				mode={mode}
				cellKey={cellKey}
				isActive={isCellActive}
				onComplete={handleCellComplete}
				onFeedbackUpdate={handleFeedbackUpdate}
				onFocus={() => {
					if (!cell.prefilled && cell.text) {
						setActiveCell({ row: rowIndex, col: colIndex });
					}
				}}
				tabIndex={isCellActive ? 0 : -1}
				shouldCenter={shouldCenter}
			/>
		);
	};

	return (
		<div className="screen table-screen" tabIndex={0}>
			<div className="table-speed">{stats.totalAccuracy}%</div>
			<div className="table-wrapper">
				<table className="memo-table" role="grid" aria-rowcount={rows} aria-colcount={cols}>
					<tbody>
						{Array.from({ length: rows }).map((_, rowIndex) => (
							<tr key={rowIndex}>
								{Array.from({ length: cols }).map((_, colIndex) => (
									<td key={colIndex} role="gridcell">
										{renderCell(rowIndex, colIndex)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
				{stats.allCompleted && <div className="completion-message">Completed!</div>}
			</div>
		</div>
	);
}