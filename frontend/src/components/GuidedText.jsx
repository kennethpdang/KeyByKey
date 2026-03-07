import React, { useMemo } from "react";
import { processDisplayText, buildSpinVisibility } from "../utils/textProcessing";
import "../cascading_style_sheets/InteractiveMemorization.css";

export default function GuidedText({ text, feedback, pointer, mode, spinVisibility, shaking }) {
	const processedText = useMemo(() => processDisplayText(text), [text]);

	const processedSpinVisibility = useMemo(() => {
		if (mode !== "SPIN") {
			return null;
		}

		return buildSpinVisibility(processedText);
	}, [mode, processedText]);

	const characters = Array.from(processedText);

	/**
	 * Maps a display character index to its corresponding feedback entry.
	 * Handles multi-character feedback items like list numbers ("1. ").
	 */
	const findFeedbackForPosition = (displayIndex) => {
		let processedCount = 0;

		for (let feedbackIndex = 0; feedbackIndex < feedback.length; feedbackIndex++) {
			const item = feedback[feedbackIndex];

			if (item.char.match(/^\d+\. $/)) {
				const listNumberLength = item.char.length;

				if (displayIndex >= processedCount && displayIndex < processedCount + listNumberLength) {
					return item;
				}

				processedCount += listNumberLength;
			} else if (item.char === "\n") {
				if (displayIndex === processedCount) {
					return item;
				}

				processedCount++;
			} else {
				if (displayIndex === processedCount) {
					return item;
				}

				processedCount++;
			}
		}

		return null;
	};

	const renderCharacter = (character, charIndex) => {
		if (character === "\n") {
			return <br key={charIndex} />;
		}

		const matchedFeedback = findFeedbackForPosition(charIndex);

		if (matchedFeedback) {
			const className = `character ${matchedFeedback.correct ? "correct" : "incorrect"}`;

			return (
				<span key={charIndex} className={className}>
					{character}
				</span>
			);
		}

		const isVisible = mode === "SPIN"
			? (processedSpinVisibility?.[charIndex] ?? true)
			: true;
		const className = `character${!isVisible ? " hidden" : ""}`;

		return (
			<span key={charIndex} className={className}>
				{character}
			</span>
		);
	};

	return (
		<div className={`feedback-container ${shaking ? "shake" : ""}`}>
			{characters.map(renderCharacter)}
		</div>
	);
}