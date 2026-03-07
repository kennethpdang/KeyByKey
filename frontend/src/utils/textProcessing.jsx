/**
 * Shared text processing utilities for the memorization components.
 * Single source of truth — no other file should define these functions.
 */

/**
 * Checks whether a character at the given index is part of a list number pattern (e.g., "1. ").
 * List numbers appear at the start of lines and follow the pattern: digits + ". "
 * @param {string} text
 * @param {number} index
 * @returns {boolean}
 */
export function isListNumberPosition(text, index) {
	if (index >= text.length || !/\d/.test(text[index])) {
		return false;
	}

	const atLineStart = (
		index === 0 ||
		(index > 0 && text[index - 1] === '\n') ||
		(index > 0 && text[index - 1] === ' ' && index > 1 && text[index - 2] === '\n')
	);

	if (!atLineStart) {
		for (let scanIndex = index; scanIndex >= 0 && scanIndex > index - 5; scanIndex--) {
			if (text[scanIndex] === '\n' || scanIndex === 0) {
				const start = scanIndex === 0 ? 0 : scanIndex + 1;
				let lookAhead = start;

				while (lookAhead < text.length && /\d/.test(text[lookAhead])) {
					lookAhead++;
				}

				if (lookAhead < text.length - 1 && text[lookAhead] === '.' && text[lookAhead + 1] === ' ') {
					return index >= start && index < lookAhead + 2;
				}

				break;
			}
		}

		return false;
	}

	let lookAhead = index;

	while (lookAhead < text.length && /\d/.test(text[lookAhead])) {
		lookAhead++;
	}

	return lookAhead < text.length - 1 && text[lookAhead] === '.' && text[lookAhead + 1] === ' ';
}

/**
 * Returns the index immediately after a list number pattern starting at the given index.
 * For example, for "1. Hello" starting at index 0, this returns 3 (after "1. ").
 * @param {string} text
 * @param {number} index
 * @returns {number}
 */
export function getListNumberEnd(text, index) {
	let position = index;

	while (position < text.length && /\d/.test(text[position])) {
		position++;
	}

	if (position < text.length && text[position] === '.') {
		position++;
	}

	if (position < text.length && text[position] === ' ') {
		position++;
	}

	return position;
}

/**
 * Builds a visibility array for SPIN mode where every other word is hidden.
 * List numbers and punctuation always remain visible.
 * @param {string} text - The processed display text.
 * @returns {boolean[]} Array where true = visible, false = hidden.
 */
export function buildSpinVisibility(text) {
	const safeText = typeof text === "string" ? text : (text == null ? "" : String(text));
	const visibility = new Array(safeText.length).fill(true);
	let insideWord = false;
	let wordIndex = 0;

	for (let charIndex = 0; charIndex < safeText.length; charIndex++) {
		const character = safeText[charIndex];

		if (isListNumberPosition(safeText, charIndex)) {
			const listEnd = getListNumberEnd(safeText, charIndex);

			for (let position = charIndex; position < listEnd; position++) {
				visibility[position] = true;
			}

			charIndex = listEnd - 1;
			insideWord = false;
			continue;
		}

		const isAlphanumeric = /[a-zA-Z0-9]/.test(character);

		if (isAlphanumeric) {
			if (!insideWord) {
				insideWord = true;
			}

			visibility[charIndex] = wordIndex % 2 === 0;
		} else {
			if (insideWord) {
				insideWord = false;
				wordIndex += 1;
			}

			visibility[charIndex] = true;
		}
	}

	return visibility;
}

/**
 * Converts HTML list tags (<ol>, <li>, </li>, </ol>) into formatted numbered text.
 * Example: "<ol><li>Hello</li><li>World</li></ol>" becomes "1. Hello\n2. World"
 * @param {string} text
 * @returns {string}
 */
export function processDisplayText(text) {
	let result = "";
	let listItemCount = 0;
	let charIndex = 0;

	const firstOlIndex = text.indexOf("<ol>");
	const hasTextBeforeList = firstOlIndex > 0 && text.substring(0, firstOlIndex).trim().length > 0;

	while (charIndex < text.length) {
		const slice = text.slice(charIndex, charIndex + 5);

		if (slice.startsWith("<ol>")) {
			if (hasTextBeforeList) {
				result += "\n";
			}

			charIndex += 4;
		} else if (slice.startsWith("<li>")) {
			if (listItemCount > 0 || hasTextBeforeList) {
				result += "\n";
			}

			listItemCount++;
			result += `${listItemCount}. `;
			charIndex += 4;
		} else if (slice.startsWith("</li>")) {
			charIndex += 5;
		} else if (slice.startsWith("</ol>")) {
			listItemCount = 0;
			charIndex += 5;
		} else {
			result += text[charIndex];
			charIndex++;
		}
	}

	return result;
}

/**
 * Wraps text to a maximum line width, preserving list number prefixes on the first line.
 * @param {string} text
 * @param {number} [maxCharacters=42]
 * @returns {string}
 */
export function wordWrapText(text, maxCharacters = 42) {
	if (!text || text.length <= maxCharacters) {
		return text;
	}

	const lines = text.split('\n');
	const wrappedLines = [];

	for (const line of lines) {
		if (line.length <= maxCharacters) {
			wrappedLines.push(line);
			continue;
		}

		const listMatch = line.match(/^(\d+\.\s+)/);
		const prefix = listMatch ? listMatch[1] : '';
		const content = prefix ? line.substring(prefix.length) : line;

		const words = [];
		let currentWord = '';

		for (let charIndex = 0; charIndex < content.length; charIndex++) {
			currentWord += content[charIndex];

			const isEndOfContent = charIndex === content.length - 1;
			const nextCharStartsWord = (
				content[charIndex + 1] &&
				!/\s/.test(content[charIndex + 1]) &&
				/\s/.test(content[charIndex])
			);

			if (isEndOfContent || nextCharStartsWord) {
				if (currentWord.length > 0) {
					words.push(currentWord);
					currentWord = '';
				}
			}
		}

		if (currentWord.length > 0) {
			words.push(currentWord);
		}

		let currentLine = prefix;

		for (const word of words) {
			const testLine = currentLine + word;

			if (testLine.length <= maxCharacters) {
				currentLine = testLine;
			} else {
				if (currentLine.length > prefix.length) {
					wrappedLines.push(currentLine.trimEnd());
					currentLine = prefix.length > 0 ? word.trimStart() : word;
				} else {
					const remaining = maxCharacters - currentLine.length;
					wrappedLines.push(currentLine + word.substring(0, remaining));
					currentLine = word.substring(remaining);
				}
			}
		}

		if (currentLine.length > 0) {
			wrappedLines.push(currentLine.trimEnd());
		}
	}

	return wrappedLines.join("\n");
}

/**
 * Counts the number of alphanumeric characters in each word, skipping HTML tags
 * and list number patterns. Used to determine when a word is fully typed.
 * @param {string} text
 * @returns {number[]} Array of word lengths.
 */
export function getWordLengths(text) {
	const wordLengths = [];
	let currentWordLength = 0;

	for (let charIndex = 0; charIndex < text.length; charIndex++) {
		const character = text[charIndex];

		if (character === "<") {
			if (currentWordLength > 0) {
				wordLengths.push(currentWordLength);
				currentWordLength = 0;
			}

			while (charIndex < text.length && text[charIndex] !== ">") {
				charIndex++;
			}

			continue;
		}

		if (isListNumberPosition(text, charIndex)) {
			if (currentWordLength > 0) {
				wordLengths.push(currentWordLength);
				currentWordLength = 0;
			}

			charIndex = getListNumberEnd(text, charIndex) - 1;
			continue;
		}

		if (/\s/.test(character)) {
			if (currentWordLength > 0) {
				wordLengths.push(currentWordLength);
				currentWordLength = 0;
			}
		} else if (/[a-zA-Z0-9]/.test(character)) {
			currentWordLength++;
		}
	}

	if (currentWordLength > 0) {
		wordLengths.push(currentWordLength);
	}

	return wordLengths;
}