import React, { useRef, useMemo, useEffect, useState } from "react";
import Speedometer from "./Speedometer";
import Feedback from "./Feedback";
import GuidedText from "./GuidedText";
import useKeyPress from "../hooks/useKeyPress";
import useHiddenText from "../hooks/useHiddenText";
import "../cascading_style_sheets/InteractiveMemorization.css";

function buildSpinVisibility(text) {
  const vis = new Array(text.length).fill(true);

  let inWord = false;
  let wordIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const isAlnum = /[a-zA-Z0-9]/.test(c);

    if (isAlnum) {
      if (!inWord) inWord = true;
      const showThisWord = wordIndex % 2 === 0;
      vis[i] = showThisWord;
    } else {
      if (inWord) {
        inWord = false;
        wordIndex += 1;
      }
      vis[i] = true;
    }
  }

  return vis;
}

const InteractiveMemorization = ({ hiddenText, mode = "BRAIN", flashcardId, onReviewed }) => {
    const processedText = hiddenText;
    const isLongContent = hiddenText.length > 600;

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
    const contentRef = useRef(null);
    const viewportRef = useRef(null);
    const [translateY, setTranslateY] = useState(0);
    const scrollLockRef = useRef(false);
    const scrollCountRef = useRef(0);

    useEffect(() => {
        postedRef.current = false;
        setTranslateY(0);
        scrollLockRef.current = false;
        scrollCountRef.current = 0;
    }, [flashcardId]);

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

    // Line-based auto-scroll: keep cursor on line 7
    useEffect(() => {
        if (!contentRef.current || !viewportRef.current || !isLongContent) return;
        
        // CRITICAL: If a scroll is in progress, skip this calculation entirely
        if (scrollLockRef.current) {
            return;
        }
        
        const CHARACTER_HEIGHT = 85;
        const TARGET_LINE = 7; // Keep cursor on visual line 7
        
        let cursorElement = null;
        
        if (mode === "BRAIN") {
            const allChars = contentRef.current.querySelectorAll('.character');
            cursorElement = allChars[allChars.length - 1];
        } else {
            const typedChars = contentRef.current.querySelectorAll('.character.correct, .character.incorrect');
            cursorElement = typedChars[typedChars.length - 1];
        }
        
        if (!cursorElement) return;
        
        // Get cursor position relative to viewport
        const viewportRect = viewportRef.current.getBoundingClientRect();
        const cursorRect = cursorElement.getBoundingClientRect();
        const cursorFromViewportTop = cursorRect.top - viewportRect.top;
        
        // Calculate absolute Y position from original content top
        // Each scroll moves content up by 85px, so after N scrolls, content is at -85*N
        const scrolledAmount = scrollCountRef.current * CHARACTER_HEIGHT;
        const cursorAbsoluteY = cursorFromViewportTop + scrolledAmount;
        
        // Which line is the cursor on? (1-indexed)
        const currentAbsoluteLine = Math.floor(cursorAbsoluteY / CHARACTER_HEIGHT) + 1;
        
        // Calculate how many scrolls SHOULD have happened to keep cursor on line 7
        const shouldHaveScrolled = Math.max(0, currentAbsoluteLine - TARGET_LINE);
        
        // How many times have we actually scrolled?
        const actuallyScrolled = scrollCountRef.current;
        
        // Only scroll if we're behind
        if (shouldHaveScrolled > actuallyScrolled) {
            // LOCK: Prevent any other scroll calculations
            scrollLockRef.current = true;
            
            const scrollsNeeded = shouldHaveScrolled - actuallyScrolled;
            const scrollAmount = scrollsNeeded * CHARACTER_HEIGHT;
            
            // Update state
            setTranslateY(prev => prev - scrollAmount);
            
            // Update scroll count
            scrollCountRef.current = shouldHaveScrolled;
            
            // UNLOCK after transition completes (200ms transition + 50ms buffer)
            setTimeout(() => {
                scrollLockRef.current = false;
            }, 250);
        }
    }, [feedback.length, mode, isLongContent]);

    useKeyPress(handleKeyDown);

    const screenRef = useRef(null);
    const focusScreen = () => screenRef.current?.focus();

    const body =
        mode === "BRAIN"
        ? completed
            ? <div className="completion-message">Completed!</div>
            : <Feedback feedback={feedback} shaking={shaking} />
        : completed
            ? <div className="completion-message">Completed!</div>
            : <GuidedText
                text={processedText}
                feedback={feedback}
                pointer={pointer}
                mode={mode}
                spinVisibility={spinVisibility}
                shaking={shaking}
            />;

    const guided = mode !== "BRAIN";
    
    return (
        <div
            ref={screenRef}
            className={`screen ${guided ? "guided" : ""}`}
            tabIndex={0}
            onClick={focusScreen}
        >
            <Speedometer percentage={accuracy} />
            <div 
                className={`text-viewport ${isLongContent ? 'long-content' : 'short-content'}`} 
                ref={viewportRef}
            >
                <div 
                    className="text-content-container"
                    ref={contentRef}
                    style={{ transform: `translateY(${translateY}px)` }}
                >
                    {body}
                </div>
            </div>
        </div>
    );
};

export default InteractiveMemorization;