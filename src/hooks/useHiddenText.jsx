import { useState, useCallback } from "react";
import useWordBoundaries from "./useWordBoundaries";

/**
 * Core typing engine for the text memorization component (non-table).
 * Tracks a pointer through the source text, records feedback per character,
 * auto-skips non-alphanumeric characters and HTML tags, and calculates accuracy.
 *
 * @param {string} initialText - The raw flashcard text to type against.
 * @returns {Object} Typing state and the keydown handler to attach.
 */
export default function useHiddenText(initialText) {
	const wordLengths = useWordBoundaries(initialText);

	const [typedText, setTypedText] = useState("");
	const [shaking, setShaking] = useState(false);
	const [feedback, setFeedback] = useState([]);
	const [completed, setCompleted] = useState(false);
	const [pointer, setPointer] = useState(0);
	const [currentWordIndex, setCurrentWordIndex] = useState(0);
	const [typedAlphanumericsInCurrentWord, setTypedAlphanumericsInCurrentWord] = useState(0);

	if (currentWordIndex >= wordLengths.length && !completed) {
		setCompleted(true);
	}

	/**
	 * Advances the pointer past any non-alphanumeric characters, HTML tags,
	 * and list markup, recording them as auto-correct feedback.
	 */
	const skipNonAlphanumeric = (text, currentIndex, currentTyped, currentFeedback) => {
		let newTyped = currentTyped;
		let newFeedback = [...currentFeedback];
		let index = currentIndex;

		while (index < text.length && !/[a-zA-Z0-9]/.test(text[index])) {
			const slice = text.slice(index, index + 5);

			if (slice.startsWith("<ol>")) {
				newFeedback.push({ char: "\n", correct: true });
				newTyped += "\n";
				index += 4;
			} else if (slice.startsWith("<li>")) {
				newFeedback.push({ char: "\n", correct: true });
				newTyped += "\n";

				const existingListNumbers = newFeedback.filter(
					item => item.char.endsWith?.(". ")
				).length;
				const listNumber = existingListNumbers + 1;
				const prefix = `${listNumber}. `;

				newFeedback.push({ char: prefix, correct: true });
				newTyped += prefix;
				index += 4;
			} else if (slice.startsWith("</li>")) {
				index += 5;
			} else if (slice.startsWith("</ol>")) {
				index += 5;
			} else {
				newFeedback.push({ char: text[index], correct: true });
				newTyped += text[index];
				index++;
			}
		}

		return { newTyped, newFeedback, newPointer: index };
	};

	const handleKeyDown = useCallback(
		(event) => {
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

			if (completed || shaking) {
				return;
			}

			if (event.key !== " " && !/^[a-zA-Z0-9]$/.test(event.key)) {
				return;
			}

			let newTyped = typedText;
			let newFeedback = [...feedback];
			let currentIndex = pointer;

			const skipResult = skipNonAlphanumeric(initialText, currentIndex, newTyped, newFeedback);
			newTyped = skipResult.newTyped;
			newFeedback = skipResult.newFeedback;
			currentIndex = skipResult.newPointer;

			if (currentIndex >= initialText.length) {
				setTypedText(newTyped);
				setFeedback(newFeedback);
				setCompleted(true);
				return;
			}

			// Space bar advances to the next word.
			if (event.key === " ") {
				const neededCharacters = wordLengths[currentWordIndex] || 0;

				if (typedAlphanumericsInCurrentWord >= neededCharacters) {
					setCurrentWordIndex(wordIdx => wordIdx + 1);
					setTypedAlphanumericsInCurrentWord(0);
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
			const targetCharacter = initialText[currentIndex];

			if (event.key.toLowerCase() === targetCharacter.toLowerCase()) {
				newTyped += targetCharacter;
				newFeedback.push({ char: targetCharacter, correct: true });
			} else {
				newTyped += targetCharacter;
				newFeedback.push({ char: targetCharacter, correct: false });
				setShaking(true);
				setTimeout(() => setShaking(false), 500);
			}

			currentIndex++;
			setTypedAlphanumericsInCurrentWord(count => count + 1);

			if (currentIndex >= initialText.length) {
				setCompleted(true);
			}

			setTypedText(newTyped);
			setFeedback(newFeedback);
			setPointer(currentIndex);
		},
		[
			typedText,
			feedback,
			pointer,
			completed,
			shaking,
			initialText,
			currentWordIndex,
			typedAlphanumericsInCurrentWord,
			wordLengths,
		]
	);

	const correctCount = feedback.filter(item => item.correct).length;
	const totalTyped = feedback.length;
	const accuracy = totalTyped === 0 ? 0 : Math.round((correctCount / totalTyped) * 100);

	return { typedText, feedback, shaking, completed, accuracy, handleKeyDown, pointer };
}