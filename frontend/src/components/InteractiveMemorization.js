import React, { useRef, useMemo, useEffect } from "react";
import Speedometer from "./Speedometer";
import Feedback from "./Feedback";
import GuidedText from "./GuidedText";
import useKeyPress from "../hooks/useKeyPress";
import useHiddenText from "../hooks/useHiddenText";
import "../cascading_style_sheets/InteractiveMemorization.css";

function buildSpinVisibility(text) {
  const vis = new Array(text.length).fill(true);

  let inWord = false;
  let wordIndex = 0; // 0 => first word (visible), 1 => second (hidden), etc.

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const isAlnum = /[a-zA-Z0-9]/.test(c);

    if (isAlnum) {
      if (!inWord) inWord = true;
      const showThisWord = wordIndex % 2 === 0; // 1st, 3rd, 5th visible
      vis[i] = showThisWord;
    } else {
      if (inWord) {
        inWord = false;
        wordIndex += 1;
      }
      vis[i] = true; // punctuation/space remains visible
    }
  }

  return vis;
}

const InteractiveMemorization = ({ hiddenText, mode = "BRAIN", flashcardId, onReviewed }) => {
    // We never mutate the target string for READ or SPIN; you still type the full text.
    const processedText = hiddenText;

    const spinVisibility = useMemo(
        () => (mode === "SPIN" ? buildSpinVisibility(hiddenText) : null),
        [mode, hiddenText]
    );

    const {
        feedback,
        shaking,
        completed,
        accuracy,
        handleKeyDown,
        pointer
    } = useHiddenText(processedText);
    
    const postedRef = useRef(false);

    useEffect(() => {
        postedRef.current = false;
    }, []);

    useEffect(() => {
        if (!postedRef.current && completed && mode === "BRAIN" && accuracy >= 90 && flashcardId) {
        postedRef.current = true;
        fetch(`/api/flashcards/${flashcardId}/review`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'BRAIN', accuracy })
        })
        .then(() => onReviewed && onReviewed())
        .catch(console.error);
        }
    }, [completed, accuracy, mode, flashcardId, onReviewed]);

    useKeyPress(handleKeyDown);

    const screenRef = useRef(null);
    const focusScreen = () => screenRef.current?.focus();

  const body =
    mode === "BRAIN" ? (
      completed ? (
        <div className="completion-message">Great job, you had an {accuracy}% accuracy!</div>
      ) : (
        <Feedback feedback={feedback} shaking={shaking} />
      )
    ) : (
      <>
        {completed ? (
          <div className="completion-message">Great job, you had an {accuracy}% accuracy!</div>
        ) : (
          <GuidedText
            text={processedText}
            feedback={feedback}
            pointer={pointer}
            mode={mode}
            spinVisibility={spinVisibility}
          />
        )}
      </>
    );

    const guided = mode !== "BRAIN";
    return (
        <div
            ref={screenRef}
            className={`screen ${guided ? "guided" : ""}`}
            tabIndex={0}
            onClick={focusScreen}
        >
      <Speedometer percentage={accuracy} />
      {body}
    </div>
  );
};

export default InteractiveMemorization;