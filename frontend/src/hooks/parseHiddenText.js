export default function parseHiddenText(hiddenText) {
    const tokens = [];
    let currentWord = "";
    let currentDisplay = "";
    let listCounter = 1;

    function pushWord() {
    if (!currentWord) return;
    let trailingPunctuation = "";
    const match = currentDisplay.match(/[!?.,;:]+$/);
    if (match) {
        trailingPunctuation = match[0];
        currentDisplay = currentDisplay.slice(0, -trailingPunctuation.length);
    }
    tokens.push({
        word: currentWord,
        display: currentDisplay.trim(),
        punctuation: trailingPunctuation,
    });
    currentWord = "";
    currentDisplay = "";
    }

    let i = 0;
    while (i < hiddenText.length) {
    const slice = hiddenText.slice(i, i + 5);
    if (slice.startsWith("<ol>")) {
        i += 4;
        continue;
    }
    if (slice.startsWith("</ol")) {
        i += 5;
        continue;
    }
    if (slice.startsWith("<li>")) {
        pushWord();
        tokens.push({ special: "newline" });
        i += 4;
        let endLi = hiddenText.indexOf("</li>", i);
        if (endLi === -1) endLi = hiddenText.length;
        const liContent = hiddenText.slice(i, endLi).trim();
        const displayText = `${listCounter}. ${liContent}`;
        listCounter++;
        tokens.push({
        special: "list",
        display: displayText,
        original: liContent,
        });
        i = endLi + 5;
        continue;
    }
    if (hiddenText[i] === "<") {
        i++;
        continue;
    }
    if (/\s/.test(hiddenText[i])) {
        pushWord();
        i++;
        continue;
    }
    if (/[!?.,;:'"()]/.test(hiddenText[i])) {
        currentDisplay += hiddenText[i];
        i++;
        continue;
    }
    if (/[a-zA-Z0-9]/.test(hiddenText[i])) {
        currentWord += hiddenText[i];
        currentDisplay += hiddenText[i];
        i++;
        continue;
    }
    i++;
    }
    pushWord();
    return tokens;
}