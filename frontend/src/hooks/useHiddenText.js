import { useState, useCallback } from "react";
import useWordBoundaries from "./useWordBoundaries";

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

  const skipNonAlphanumeric = (text, currentPointer, curTyped, curFeedback) => {
    let newTyped = curTyped;
    let newFeedback = [...curFeedback];
    let idx = currentPointer;

    while (idx < text.length && !/[a-zA-Z0-9]/.test(text[idx])) {
      const slice = text.slice(idx, idx + 5);
      if (slice.startsWith("<ol>")) {
        newFeedback.push({ char: "\n", correct: true });
        newTyped += "\n";
        idx += 4;
      } else if (slice.startsWith("<li>")) {
        newFeedback.push({ char: "\n", correct: true });
        newTyped += "\n";
        const listNumber = newFeedback.filter((i) => i.char.endsWith?.(". ")).length + 1;
        const prefix = `${listNumber}. `;
        newFeedback.push({ char: prefix, correct: true });
        newTyped += prefix;
        idx += 4;
      } else if (slice.startsWith("</li>")) {
        idx += 5;
      } else if (slice.startsWith("</ol>")) {
        idx += 5;
      } else {
        newFeedback.push({ char: text[idx], correct: true });
        newTyped += text[idx];
        idx++;
      }
    }
    return { newTyped, newFeedback, newPointer: idx };
  };

  const handleKeyDown = useCallback(
    (e) => {
      // Use document.activeElement for more reliable input detection
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT' ||
        activeElement.contentEditable === 'true'
      )) {
        return;
      }
      
      // Check if a modal is open (modal-overlay class exists)
      if (document.querySelector('.modal-overlay')) {
        return;
      }
      
      if (completed || shaking) return;

      if (e.key !== " " && !/^[a-zA-Z0-9]$/.test(e.key)) {
        return;
      }

      let newTyped = typedText;
      let newFeedback = [...feedback];
      let idx = pointer;

      const result = skipNonAlphanumeric(initialText, idx, newTyped, newFeedback);
      newTyped = result.newTyped;
      newFeedback = result.newFeedback;
      idx = result.newPointer;

      if (idx >= initialText.length) {
        setTypedText(newTyped);
        setFeedback(newFeedback);
        setCompleted(true);
        return;
      }

      if (e.key === " ") {
        const neededChars = wordLengths[currentWordIndex] || 0;
        if (typedAlphanumericsInCurrentWord >= neededChars) {
          setCurrentWordIndex((w) => w + 1);
          setTypedAlphanumericsInCurrentWord(0);
        }
        setTypedText(newTyped);
        setFeedback(newFeedback);
        setPointer(idx);
        return;
      }

      const neededCount = wordLengths[currentWordIndex] || 0;
      if (typedAlphanumericsInCurrentWord >= neededCount) {
        return;
      }

      const targetChar = initialText[idx];
      if (e.key.toLowerCase() === targetChar.toLowerCase()) {
        newTyped += targetChar;
        newFeedback.push({ char: targetChar, correct: true });
      } else {
        newTyped += targetChar;
        newFeedback.push({ char: targetChar, correct: false });
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
      idx++;
      setTypedAlphanumericsInCurrentWord((count) => count + 1);

      if (idx >= initialText.length) {
        setCompleted(true);
      }

      setTypedText(newTyped);
      setFeedback(newFeedback);
      setPointer(idx);
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

  const correctCount = feedback.filter((item) => item.correct).length;
  const totalTyped = feedback.length;
  const accuracy = totalTyped === 0 ? 0 : Math.round((correctCount / totalTyped) * 100);

  return { typedText, feedback, shaking, completed, accuracy, handleKeyDown, pointer };
}