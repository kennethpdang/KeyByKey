import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
	processDisplayText,
	getWordLengths,
	buildSpinVisibility
} from "../utils/textProcessing";
import ModeStrategies from "../utils/modeStrategies";
import "../cascading_style_sheets/InteractiveTableMemorization.css";

/**
 * A single interactive table cell that handles guided typing across all three modes.
 * Each cell independently tracks its own typing state, feedback, and completion.
 *
 * Text wrapping is handled by CSS (white-space: pre-wrap / word-break: break-word),
 * not by manual character counting — so cells use the full available width.
 */
export default function GuidedTableCell({
	target,
	mode,
	onComplete,
	onFeedbackUpdate,
	cellKey,
	isActive,
	onFocus,
	tabIndex,
	shouldCenter
}) {
	const [typedText, setTypedText] = useState("");
	const [feedback, setFeedback] = useState([]);
	const [completed, setCompleted] = useState(false);
	const [pointer, setPointer] = useState(0);
	const [shaking, setShaking] = useState(false);
	const [currentWordIndex, setCurrentWordIndex] = useState(0);
	const [typedAlphanumericsInCurrentWord, setTypedAlphanumericsInCurrentWord] = useState(0);
	const cellRef = useRef(null);

	const strategy = ModeStrategies[mode];
	const processedText = useMemo(() => processDisplayText(target), [target]);
	const targetForMode = useMemo(() => strategy.getTargetText(target), [strategy, target]);
	const wordLengths = useMemo(() => getWordLengths(targetForMode), [targetForMode]);

	const spinVisibility = useMemo(() => {
		if (mode !== "SPIN") {
			return null;
		}

		return buildSpinVisibility(processedText);
	}, [mode, processedText]);

	// Reset state when the target text changes.
	const resetState = useCallback(() => {
		setTypedText("");
		setFeedback([]);
		setCompleted(false);
		setPointer(0);
		setCurrentWordIndex(0);
		setTypedAlphanumericsInCurrentWord(0);
	}, []);

	useEffect(() => {
		resetState();
	}, [target, resetState]);

	// Centralized completion handler — ensures onComplete always fires.
	const markCompleted = useCallback((currentFeedback) => {
		if (completed) {
			return;
		}

		setCompleted(true);

		if (onComplete) {
			const correctCount = currentFeedback.filter(item => item.correct).length;
			const totalCount = currentFeedback.length;
			const cellAccuracy = totalCount === 0 ? 100 : Math.round((correctCount / totalCount) * 100);

			onComplete(cellKey, cellAccuracy);
		}
	}, [completed, onComplete, cellKey]);

	useEffect(() => {
		if (currentWordIndex >= wordLengths.length && wordLengths.length > 0 && !completed) {
			markCompleted(feedback);
		}
	}, [currentWordIndex, wordLengths, completed, feedback, markCompleted]);

	useEffect(() => {
		if (isActive && cellRef.current) {
			cellRef.current.focus();
		}
	}, [isActive]);

	// Report accuracy to parent on every keystroke.
	useEffect(() => {
		if (onFeedbackUpdate && feedback.length > 0) {
			const correctCount = feedback.filter(item => item.correct).length;
			const totalCount = feedback.length;
			onFeedbackUpdate(cellKey, correctCount, totalCount);
		}
	}, [feedback, cellKey, onFeedbackUpdate]);

	// ========================= TYPING HANDLER =========================

	const handleKeyDown = useCallback((event) => {
		if (!isActive || completed || shaking) {
			return;
		}

		if (event.key !== " " && !/^[a-zA-Z0-9]$/.test(event.key)) {
			return;
		}

		event.preventDefault();

		let newTyped = typedText;
		let newFeedback = [...feedback];
		let currentIndex = pointer;

		const skipResult = strategy.skipNonAlphanumeric(targetForMode, currentIndex, newTyped, newFeedback);
		newTyped = skipResult.newTyped;
		newFeedback = skipResult.newFeedback;
		currentIndex = skipResult.newPointer;

		if (currentIndex >= targetForMode.length) {
			setTypedText(newTyped);
			setFeedback(newFeedback);
			markCompleted(newFeedback);
			return;
		}

		// Space bar advances to the next word.
		if (event.key === " ") {
			const neededCharacters = wordLengths[currentWordIndex] || 0;

			if (typedAlphanumericsInCurrentWord >= neededCharacters) {
				setCurrentWordIndex(wordIdx => wordIdx + 1);
				setTypedAlphanumericsInCurrentWord(0);

				const afterSpace = strategy.skipNonAlphanumeric(targetForMode, currentIndex, newTyped, newFeedback);
				newTyped = afterSpace.newTyped;
				newFeedback = afterSpace.newFeedback;
				currentIndex = afterSpace.newPointer;

				if (currentIndex >= targetForMode.length) {
					setTypedText(newTyped);
					setFeedback(newFeedback);
					setPointer(currentIndex);
					markCompleted(newFeedback);
					return;
				}
			}

			setTypedText(newTyped);
			setFeedback(newFeedback);
			setPointer(currentIndex);
			return;
		}

		// Don't accept more characters if the current word is complete.
		const neededCount = wordLengths[currentWordIndex] || 0;

		if (typedAlphanumericsInCurrentWord >= neededCount) {
			return;
		}

		// Compare the typed character against the target.
		const targetCharacter = targetForMode[currentIndex];
		const isCorrect = event.key.toLowerCase() === targetCharacter.toLowerCase();

		newTyped += targetCharacter;
		newFeedback.push({ char: targetCharacter, correct: isCorrect });

		if (!isCorrect) {
			setShaking(true);
			setTimeout(() => setShaking(false), 500);
		}

		currentIndex++;
		setTypedAlphanumericsInCurrentWord(count => count + 1);

		setTypedText(newTyped);
		setFeedback(newFeedback);
		setPointer(currentIndex);

		if (currentIndex >= targetForMode.length) {
			markCompleted(newFeedback);
		}
	}, [
		isActive, completed, shaking, pointer, targetForMode, typedText, feedback,
		currentWordIndex, typedAlphanumericsInCurrentWord, wordLengths, strategy, markCompleted
	]);

	useEffect(() => {
		if (isActive) {
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [handleKeyDown, isActive]);

	// ========================= RENDERING =========================

	const renderCharacter = (character, index, feedbackItem, isHidden = false) => {
		if (character === "\n") {
			return <br key={index} />;
		}

		let className = "character";

		if (feedbackItem) {
			className += feedbackItem.correct ? " correct" : " incorrect";
		} else if (isHidden) {
			className += " hidden";
		}

		return (
			<span key={index} className={className}>
				{character}
			</span>
		);
	};

	const renderContent = () => {
		const showCursor = isActive && pointer === 0 && !completed;
		const displayCharacters = Array.from(processedText);

		if (mode === "BRAIN") {
			return (
				<>
					{showCursor && <span className="cell-cursor">|</span>}
					{displayCharacters.map((character, index) =>
						renderCharacter(character, index, null, true)
					)}
				</>
			);
		}

		// READ/SPIN modes — feedback maps 1:1 with processedText positions.
		return (
			<>
				{showCursor && <span className="cell-cursor">|</span>}
				{displayCharacters.map((character, charIndex) => {
					const feedbackItem = charIndex < feedback.length ? feedback[charIndex] : null;
					const isHidden = mode === "SPIN" && !spinVisibility?.[charIndex];
					return renderCharacter(character, charIndex, feedbackItem, isHidden);
				})}
			</>
		);
	};

	const renderBrainTypedOverlay = () => {
		if (typedText.length === 0) {
			return isActive ? <span className="cell-cursor">|</span> : null;
		}

		const renderItems = [];

		for (let feedbackIndex = 0; feedbackIndex < feedback.length; feedbackIndex++) {
			const item = feedback[feedbackIndex];

			if (item.char.endsWith?.(". ") && /^\d+\. $/.test(item.char)) {
				for (const character of item.char) {
					renderItems.push({ type: 'char', char: character, feedback: item });
				}
			} else if (item.char === "\n") {
				renderItems.push({ type: 'break' });
			} else {
				renderItems.push({ type: 'char', char: item.char, feedback: item });
			}
		}

		return renderItems.map((item, index) => {
			if (item.type === 'break') {
				return <br key={`break-${index}`} />;
			}

			const className = `character ${item.feedback?.correct ? "correct" : "incorrect"}`;

			return (
				<span key={index} className={className}>
					{item.char}
				</span>
			);
		});
	};

	// ========================= JSX =========================

	const cellClassName = [
		"guided-cell",
		completed ? "completed" : "",
		shaking ? "shake" : "",
		shouldCenter ? "centered-text" : ""
	].filter(Boolean).join(" ");

	return (
		<div
			ref={cellRef}
			className={cellClassName}
			onClick={onFocus}
			tabIndex={tabIndex}
		>
			<div className="cell-content">
				{mode === "BRAIN" && !completed ? (
					<div className="brain-mode">
						<div className="brain-placeholder-layer">
							{Array.from(processedText).map((character, index) =>
								renderCharacter(character, index, null, true)
							)}
						</div>
						<div className="brain-typed-layer">
							{renderBrainTypedOverlay()}
						</div>
					</div>
				) : (
					<div className="guided-content">
						{renderContent()}
					</div>
				)}
			</div>
		</div>
	);
}