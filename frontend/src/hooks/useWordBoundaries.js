export default function useWordBoundaries(hiddenText) {
    const alphanumericRegex = /[a-zA-Z0-9]/;
    const wordLengths = [];
    let currentCount = 0;

    for (let i = 0; i < hiddenText.length; i++) {
    const char = hiddenText[i];
    if (char === "<") {
        if (currentCount > 0) {
        wordLengths.push(currentCount);
        currentCount = 0;
        }
        while (i < hiddenText.length && hiddenText[i] !== ">") {
        i++;
        }
        continue;
    }
    if (/\s/.test(char)) {
        if (currentCount > 0) {
        wordLengths.push(currentCount);
        currentCount = 0;
        }
        continue;
    }
    if (alphanumericRegex.test(char)) {
        currentCount++;
    }
    }
    if (currentCount > 0) {
        wordLengths.push(currentCount);
    }
    return wordLengths;
}  