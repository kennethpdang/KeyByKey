/**
 * Mode-specific strategies for the table memorization component.
 * Each mode defines:
 *   - getTargetText: which version of the text the user types against.
 *   - skipNonAlphanumeric: how to auto-advance past punctuation, whitespace, and HTML tags.
 */
import { processDisplayText, isListNumberPosition, getListNumberEnd } from './textProcessing';

const ModeStrategies = {
	BRAIN: {
		getTargetText: (originalText) => originalText,

		skipNonAlphanumeric: (text, currentIndex, typedText, feedbackArray) => {
			let newTyped = typedText;
			let newFeedback = [...feedbackArray];

			const firstOlIndex = text.indexOf("<ol>");
			const hasTextBeforeList = (
				firstOlIndex > 0 &&
				text.substring(0, firstOlIndex).trim().length > 0
			);

			while (currentIndex < text.length && !/[a-zA-Z0-9]/.test(text[currentIndex])) {
				const slice = text.slice(currentIndex, currentIndex + 5);

				if (slice.startsWith("<ol>")) {
					if (hasTextBeforeList) {
						newFeedback.push({ char: "\n", correct: true });
						newTyped += "\n";
					}

					currentIndex += 4;
				} else if (slice.startsWith("<li>")) {
					const existingListNumbers = newFeedback.filter(
						item => item.char.endsWith?.(". ")
					).length;
					const isFirstItem = existingListNumbers === 0;

					if (!isFirstItem || hasTextBeforeList) {
						newFeedback.push({ char: "\n", correct: true });
						newTyped += "\n";
					}

					const listNumber = existingListNumbers + 1;
					const prefix = `${listNumber}. `;
					newFeedback.push({ char: prefix, correct: true });
					newTyped += prefix;
					currentIndex += 4;
				} else if (slice.startsWith("</li>")) {
					currentIndex += 5;
				} else if (slice.startsWith("</ol>")) {
					currentIndex += 5;
				} else {
					newFeedback.push({ char: text[currentIndex], correct: true });
					newTyped += text[currentIndex];
					currentIndex++;
				}
			}

			return { newTyped, newFeedback, newPointer: currentIndex };
		}
	},

	READ: {
		getTargetText: (originalText) => processDisplayText(originalText),

		skipNonAlphanumeric: (text, currentIndex, typedText, feedbackArray) => {
			let newTyped = typedText;
			let newFeedback = [...feedbackArray];

			if (isListNumberPosition(text, currentIndex)) {
				const listEnd = getListNumberEnd(text, currentIndex);

				while (currentIndex < listEnd) {
					newFeedback.push({ char: text[currentIndex], correct: true });
					newTyped += text[currentIndex];
					currentIndex++;
				}

				return { newTyped, newFeedback, newPointer: currentIndex };
			}

			while (currentIndex < text.length && !/[a-zA-Z0-9]/.test(text[currentIndex])) {
				newFeedback.push({ char: text[currentIndex], correct: true });
				newTyped += text[currentIndex];
				currentIndex++;
			}

			return { newTyped, newFeedback, newPointer: currentIndex };
		}
	},

	SPIN: {
		getTargetText: (originalText) => processDisplayText(originalText),

		skipNonAlphanumeric: (text, currentIndex, typedText, feedbackArray) => {
			return ModeStrategies.READ.skipNonAlphanumeric(text, currentIndex, typedText, feedbackArray);
		}
	}
};

export default ModeStrategies;