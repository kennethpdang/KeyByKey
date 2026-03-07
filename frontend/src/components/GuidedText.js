import React, { useMemo } from "react";
import "../cascading_style_sheets/InteractiveMemorization.css";

// Process text to convert list tags to formatted output
function processListTags(text) {
  let result = "";
  let listItemCount = 0;
  let i = 0;
  
  while (i < text.length) {
    const slice = text.slice(i, i + 5);
    
    if (slice.startsWith("<ol>")) {
      result += "\n";
      i += 4;
    } else if (slice.startsWith("<li>")) {
      result += "\n";
      listItemCount++;
      result += `${listItemCount}. `;
      i += 4;
    } else if (slice.startsWith("</li>")) {
      i += 5;
    } else if (slice.startsWith("</ol>")) {
      listItemCount = 0; // Reset counter after list ends
      i += 5;
    } else {
      result += text[i];
      i++;
    }
  }
  
  return result;
}

// Build SPIN visibility for processed text
function buildProcessedSpinVisibility(text) {
  const vis = new Array(text.length).fill(true);
  let inWord = false;
  let wordIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    
    // Check if this is part of a list number pattern (e.g., "1. ", "2. ", etc.)
    const isListNumber = () => {
      // Look for pattern like "1. " at current position
      if (i > 0 && text[i-1] === '\n' || i === 0) {
        // Check if we have a number followed by ". "
        let j = i;
        while (j < text.length && /\d/.test(text[j])) j++;
        if (j < text.length - 1 && text[j] === '.' && text[j+1] === ' ') {
          return true;
        }
      }
      // Also check if current position is within a list number
      // Look back to see if we're in a "digit(s). " pattern after a newline
      for (let k = i; k >= 0 && k > i - 5; k--) {
        if (text[k] === '\n' || k === 0) {
          const start = k === 0 ? 0 : k + 1;
          // Check pattern from start
          let j = start;
          while (j < text.length && /\d/.test(text[j])) j++;
          if (j < text.length - 1 && text[j] === '.' && text[j+1] === ' ') {
            // We're in a list number if i is between start and j+2
            if (i >= start && i < j + 2) {
              return true;
            }
          }
          break;
        }
      }
      return false;
    };
    
    // List numbers should always be visible
    if (isListNumber()) {
      vis[i] = true;
      if (text[i] === ' ' && i > 0 && text[i-1] === '.') {
        // End of list number, reset word tracking
        inWord = false;
      }
      continue;
    }
    
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
      vis[i] = true; // punctuation/space remain visible
    }
  }

  return vis;
}

export default function GuidedText({ text, feedback, pointer, mode, spinVisibility, shaking }) {
  // Process the text to handle list tags
  const processedText = useMemo(() => processListTags(text), [text]);
  
  // Build SPIN visibility for the processed text
  const processedSpinVisibility = useMemo(() => {
    if (mode !== "SPIN") return null;
    return buildProcessedSpinVisibility(processedText);
  }, [mode, processedText]);

  // Map original text positions to processed text positions
  const positionMap = useMemo(() => {
    const map = [];
    let origPos = 0;
    let procPos = 0;
    let listItemCount = 0;
    
    while (origPos < text.length) {
      const slice = text.slice(origPos, origPos + 5);
      
      if (slice.startsWith("<ol>")) {
        // <ol> adds a newline
        origPos += 4;
      } else if (slice.startsWith("<li>")) {
        // <li> adds newline and list number
        listItemCount++;
        const listPrefix = `${listItemCount}. `;
        origPos += 4;
      } else if (slice.startsWith("</li>")) {
        origPos += 5;
      } else if (slice.startsWith("</ol>")) {
        listItemCount = 0;
        origPos += 5;
      } else {
        // Regular character - map it
        map[origPos] = procPos;
        origPos++;
        procPos++;
      }
    }
    
    return map;
  }, [text]);

  const chars = Array.from(processedText);

  const renderChar = (ch, i) => {
    if (ch === "\n") return <br key={i} />;

    const render = ch;

    // Find if this position has been typed
    // We need to check if any feedback corresponds to this processed position
    let isTyped = false;
    let feedbackItem = null;
    
    // Count how many processed characters we've seen in feedback
    let processedCount = 0;
    for (let f = 0; f < feedback.length; f++) {
      const item = feedback[f];
      
      // Handle list numbers that come as a chunk like "1. "
      if (item.char.match(/^\d+\. $/)) {
        const len = item.char.length;
        if (i >= processedCount && i < processedCount + len) {
          isTyped = true;
          feedbackItem = item;
          break;
        }
        processedCount += len;
      } else if (item.char === "\n") {
        if (i === processedCount) {
          isTyped = true;
          feedbackItem = item;
          break;
        }
        processedCount++;
      } else {
        if (i === processedCount) {
          isTyped = true;
          feedbackItem = item;
          break;
        }
        processedCount++;
      }
    }

    if (isTyped && feedbackItem) {
      const cls = `character ${feedbackItem.correct ? "correct" : "incorrect"}`;
      return (
        <span key={i} className={cls}>
          {render}
        </span>
      );
    }

    // Baseline/ghost character
    let cls = "character";
    const visible = mode === "SPIN" ? (processedSpinVisibility?.[i] ?? true) : true;
    if (!visible) cls += " hidden";

    return (
      <span key={i} className={cls}>
        {render}
      </span>
    );
  };

  return (
    <div className={`feedback-container ${shaking ? "shake" : ""}`}>
      {chars.map(renderChar)}
    </div>
  );
}