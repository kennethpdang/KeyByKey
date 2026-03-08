/**
 * Splits text into word lengths by counting alphanumeric characters per word.
 * HTML tags are skipped entirely. Whitespace acts as a word boundary.
 * @param {string} hiddenText - The raw text, potentially containing HTML tags.
 * @returns {number[]} Array where each element is the alphanumeric character count of a word.
 */
export default function useWordBoundaries(hiddenText) {
	const wordLengths = [];
	let currentWordLength = 0;

	for (let charIndex = 0; charIndex < hiddenText.length; charIndex++) {
		const character = hiddenText[charIndex];

		if (character === "<") {
			if (currentWordLength > 0) {
				wordLengths.push(currentWordLength);
				currentWordLength = 0;
			}

			while (charIndex < hiddenText.length && hiddenText[charIndex] !== ">") {
				charIndex++;
			}

			continue;
		}

		if (/\s/.test(character)) {
			if (currentWordLength > 0) {
				wordLengths.push(currentWordLength);
				currentWordLength = 0;
			}

			continue;
		}

		if (/[a-zA-Z0-9]/.test(character)) {
			currentWordLength++;
		}
	}

	if (currentWordLength > 0) {
		wordLengths.push(currentWordLength);
	}

	return wordLengths;
}