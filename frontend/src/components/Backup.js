import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import "../cascading_style_sheets/InteractiveTableMemorization.css";

// Build SPIN visibility for processed text (with list numbers already added)
function buildSpinVisibility(text) {
    const s = typeof text === "string" ? text : (text == null ? "" : String(text));
    const vis = new Array(s.length).fill(true);
    let inWord = false;
    let wordIndex = 0;

    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        
        // Check if this is part of a list number pattern (e.g., "1. ", "2. ", etc.)
        const isListNumber = () => {
            // Look for pattern like "1. " at current position
            if (i > 0 && s[i-1] === '\n' || i === 0) {
                // Check if we have a number followed by ". "
                let j = i;
                while (j < s.length && /\d/.test(s[j])) j++;
                if (j < s.length - 1 && s[j] === '.' && s[j+1] === ' ') {
                    return true;
                }
            }
            // Also check if current position is within a list number
            // Look back to see if we're in a "digit(s). " pattern after a newline
            for (let k = i; k >= 0 && k > i - 5; k--) {
                if (s[k] === '\n' || k === 0) {
                    const start = k === 0 ? 0 : k + 1;
                    // Check pattern from start
                    let j = start;
                    while (j < s.length && /\d/.test(s[j])) j++;
                    if (j < s.length - 1 && s[j] === '.' && s[j+1] === ' ') {
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
            if (s[i] === ' ' && i > 0 && s[i-1] === '.') {
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
            vis[i] = true;
        }
    }

    return vis;
}

// Word wrap function that respects 42 character limit and keeps list numbers intact
function wordWrapText(text, maxChars = 42) {
    if (!text || text.length <= maxChars) return text;
    
    const lines = text.split('\n');
    const wrappedLines = [];
    
    for (const line of lines) {
        // Check if this line starts with a list number pattern
        const listMatch = line.match(/^(\d+\.\s+)/);
        let lineToWrap = line;
        let prefix = '';
        
        if (listMatch) {
            // Don't break the list number from its content
            prefix = listMatch[1];
            lineToWrap = line.substring(prefix.length);
        }
        
        // If even with the list number it fits, keep it as is
        if (line.length <= maxChars) {
            wrappedLines.push(line);
            continue;
        }
        
        // Need to wrap - but keep list number with first part
        if (prefix) {
            // Wrap the content after the list number
            const words = lineToWrap.split(/(\s+)/);
            let currentLine = prefix;
            
            for (const word of words) {
                if (currentLine.length + word.length <= maxChars) {
                    currentLine += word;
                } else {
                    if (currentLine.length > prefix.length) {
                        // We have content after the list number
                        wrappedLines.push(currentLine);
                        currentLine = word.trim();
                    } else {
                        // Even the first word after list number is too long
                        wrappedLines.push(currentLine + word.substring(0, maxChars - currentLine.length));
                        currentLine = word.substring(maxChars - currentLine.length);
                    }
                }
            }
            
            if (currentLine.trim().length > 0) {
                wrappedLines.push(currentLine);
            }
        } else {
            // No list number, regular wrapping
            const words = line.split(/(\s+)/);
            let currentLine = "";
            
            for (const word of words) {
                if (currentLine.length + word.length <= maxChars) {
                    currentLine += word;
                } else {
                    if (currentLine.length > 0) {
                        wrappedLines.push(currentLine);
                        currentLine = word.trim();
                    } else {
                        // Single word longer than maxChars
                        wrappedLines.push(word.substring(0, maxChars));
                        currentLine = word.substring(maxChars);
                    }
                }
            }
            
            if (currentLine.length > 0) {
                wrappedLines.push(currentLine);
            }
        }
    }
    
    return wrappedLines.join("\n");
}

// Process text to convert list tags to formatted output (table-specific version)
function processDisplayText(text) {
    let result = "";
    let listItemCount = 0;
    let i = 0;
    let hasTextBeforeList = false;
    
    // Check if there's any non-whitespace text before the first <ol> tag
    const firstOlIndex = text.indexOf("<ol>");
    if (firstOlIndex > 0) {
        const textBefore = text.substring(0, firstOlIndex).trim();
        hasTextBeforeList = textBefore.length > 0;
    }
    
    while (i < text.length) {
        const slice = text.slice(i, i + 5);
        
        if (slice.startsWith("<ol>")) {
            // Only add newline if there's text before the list
            if (hasTextBeforeList) {
                result += "\n";
            }
            i += 4;
        } else if (slice.startsWith("<li>")) {
            // For first item: if no text before list, don't add newline
            // For subsequent items: always add newline
            if (listItemCount > 0 || hasTextBeforeList) {
                result += "\n";
            }
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

// Helper to get word lengths in the text (similar to useWordBoundaries hook)
function getWordLengths(text) {
    const alphanumericRegex = /[a-zA-Z0-9]/;
    const wordLengths = [];
    let currentCount = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Handle HTML tags in BRAIN mode
        if (char === "<") {
            if (currentCount > 0) {
                wordLengths.push(currentCount);
                currentCount = 0;
            }
            while (i < text.length && text[i] !== ">") {
                i++;
            }
            continue;
        }
        
        // In READ/SPIN modes with processed text, skip list numbers entirely
        // Check if we're at a digit that starts a list number
        if (/\d/.test(char)) {
            // Check if this is the start of a list number
            let isListNumber = false;
            if (i === 0 || text[i-1] === '\n' || (i > 0 && text[i-1] === ' ' && i > 1 && text[i-2] === '\n')) {
                // Look ahead to see if this is followed by ". "
                let j = i;
                while (j < text.length && /\d/.test(text[j])) j++;
                if (j < text.length - 1 && text[j] === '.' && text[j+1] === ' ') {
                    isListNumber = true;
                }
            }
            
            if (isListNumber) {
                // Skip the entire list number
                if (currentCount > 0) {
                    wordLengths.push(currentCount);
                    currentCount = 0;
                }
                while (i < text.length && /\d/.test(text[i])) i++;
                if (i < text.length && text[i] === '.') i++;
                if (i < text.length && text[i] === ' ') i++;
                i--; // Back up one since the loop will increment
                continue;
            }
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

// Individual cell component that handles guided typing
function GuidedTableCell({ target, mode, onComplete, cellKey, isActive, onFocus, tabIndex, shouldCenter }) {
  const originalTarget = target; // Keep original for comparison
  const [typedText, setTypedText] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [pointer, setPointer] = useState(0);
  const [shaking, setShaking] = useState(false);
  const cellRef = useRef(null);
  
  // Track word progress
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedAlphanumericsInCurrentWord, setTypedAlphanumericsInCurrentWord] = useState(0);

  // For display purposes, process HTML tags and then wrap
  const processedOriginal = processDisplayText(originalTarget);
  const displayTarget = wordWrapText(processedOriginal, 42);
  
  // Calculate where line breaks occur in the wrapped text for BRAIN mode
  const lineBreakPositions = useMemo(() => {
    if (mode !== "BRAIN") return [];
    
    const breaks = [];
    const wrapped = displayTarget;
    const original = processedOriginal;
    let originalPos = 0;
    
    // Walk through wrapped text to find where breaks were inserted
    for (let i = 0; i < wrapped.length; i++) {
      if (wrapped[i] === '\n') {
        // Check if this newline exists in the original
        if (originalPos >= original.length || original[originalPos] !== '\n') {
          // This is a wrapped break - record the position AFTER which to break
          breaks.push(originalPos);
        } else {
          // This newline is from the original text
          originalPos++;
        }
      } else {
        // Regular character
        originalPos++;
      }
    }
    
    return breaks;
  }, [mode, displayTarget, processedOriginal]);

  // BRAIN mode: type against original HTML text
  // READ/SPIN modes: type against processed text (simpler alignment)
  const targetForMode = mode === "BRAIN" ? originalTarget : processedOriginal;

  // Calculate word lengths for this cell
  const wordLengths = useMemo(() => getWordLengths(targetForMode), [targetForMode]);

  // Calculate SPIN visibility on processed and wrapped text (for display)
  const spinVisibility = useMemo(
    () => (mode === "SPIN" ? buildSpinVisibility(displayTarget) : null),
    [mode, displayTarget]
  );

  // Reset when target changes
  useEffect(() => {
    setTypedText("");
    setFeedback([]);
    setCompleted(false);
    setPointer(0);
    setCurrentWordIndex(0);
    setTypedAlphanumericsInCurrentWord(0);
  }, [originalTarget]);

  // Check if completed
  useEffect(() => {
    if (currentWordIndex >= wordLengths.length && wordLengths.length > 0) {
      setCompleted(true);
      onComplete && onComplete(cellKey);
    }
  }, [currentWordIndex, wordLengths, cellKey, onComplete]);

  // Focus cell when it becomes active
  useEffect(() => {
    if (isActive && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isActive]);

  // Helper function to skip non-alphanumeric characters
  const skipNonAlphanumeric = (text, currentPointer, curTyped, curFeedback) => {
    let newTyped = curTyped;
    let newFeedback = [...curFeedback];
    let idx = currentPointer;
    
    // For BRAIN mode, handle HTML tags
    if (mode === "BRAIN") {
      // Check if there's text before the first <ol> for this cell
      const firstOlIndex = text.indexOf("<ol>");
      const hasTextBeforeList = firstOlIndex > 0 && text.substring(0, firstOlIndex).trim().length > 0;
      
      while (idx < text.length && !/[a-zA-Z0-9]/.test(text[idx])) {
        const slice = text.slice(idx, idx + 5);
        if (slice.startsWith("<ol>")) {
          // Only add newline if there's text before the list
          if (hasTextBeforeList) {
            newFeedback.push({ char: "\n", correct: true });
            newTyped += "\n";
          }
          idx += 4;
        } else if (slice.startsWith("<li>")) {
          // For first item: if no text before list and it's the first item, don't add newline
          const isFirstItem = newFeedback.filter((i) => i.char.endsWith?.(". ")).length === 0;
          if (!isFirstItem || hasTextBeforeList) {
            newFeedback.push({ char: "\n", correct: true });
            newTyped += "\n";
          }
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
    } else {
      // For READ/SPIN modes, we need to handle two cases:
      // 1. We're at a list number at the start - skip it entirely
      // 2. We're at regular punctuation - skip it
      
      // First, check if we're at the start of a list number
      let atListNumber = false;
      if (idx < text.length && /\d/.test(text[idx])) {
        // Check if this digit is at line start (position 0 or after newline)
        if (idx === 0) {
          atListNumber = true;
        } else {
          // Look back - should only see spaces or newline
          let k = idx - 1;
          while (k >= 0 && text[k] === ' ') k--;
          if (k < 0 || text[k] === '\n') {
            atListNumber = true;
          }
        }
        
        // Confirm it's a list number by looking ahead
        if (atListNumber) {
          let j = idx;
          while (j < text.length && /\d/.test(text[j])) j++;
          if (j >= text.length - 1 || text[j] !== '.' || text[j+1] !== ' ') {
            atListNumber = false; // Not a list number pattern
          }
        }
      }
      
      if (atListNumber) {
        // Skip the entire list number pattern
        while (idx < text.length && /\d/.test(text[idx])) {
          newFeedback.push({ char: text[idx], correct: true });
          newTyped += text[idx];
          idx++;
        }
        // Skip the ". "
        if (idx < text.length && text[idx] === '.') {
          newFeedback.push({ char: text[idx], correct: true });
          newTyped += text[idx];
          idx++;
        }
        if (idx < text.length && text[idx] === ' ') {
          newFeedback.push({ char: text[idx], correct: true });
          newTyped += text[idx];
          idx++;
        }
        // Important: return here so we don't continue to the next character
        return { newTyped, newFeedback, newPointer: idx };
      }
      
      // Otherwise, skip regular non-alphanumeric characters
      while (idx < text.length && !/[a-zA-Z0-9]/.test(text[idx])) {
        newFeedback.push({ char: text[idx], correct: true });
        newTyped += text[idx];
        idx++;
      }
    }
    
    return { newTyped, newFeedback, newPointer: idx };
  };

  const handleKeyDown = useCallback((e) => {
    if (!isActive || completed || shaking) return;

    // Only handle alphanumeric characters and space
    if (e.key !== " " && !/^[a-zA-Z0-9]$/.test(e.key)) {
      return;
    }

    e.preventDefault();

    let newTyped = typedText;
    let newFeedback = [...feedback];
    let idx = pointer;

    // Skip non-alphanumeric at the beginning
    const result = skipNonAlphanumeric(targetForMode, idx, newTyped, newFeedback);
    newTyped = result.newTyped;
    newFeedback = result.newFeedback;
    idx = result.newPointer;

    if (idx >= targetForMode.length) {
      setTypedText(newTyped);
      setFeedback(newFeedback);
      setCompleted(true);
      return;
    }

    // Handle space key - move to next word
    if (e.key === " ") {
      const neededChars = wordLengths[currentWordIndex] || 0;
      // Only advance if we've typed enough characters for current word
      if (typedAlphanumericsInCurrentWord >= neededChars) {
        setCurrentWordIndex(w => w + 1);
        setTypedAlphanumericsInCurrentWord(0);
        
        // After moving to next word, skip any non-alphanumeric
        const afterSpace = skipNonAlphanumeric(targetForMode, idx, newTyped, newFeedback);
        newTyped = afterSpace.newTyped;
        newFeedback = afterSpace.newFeedback;
        idx = afterSpace.newPointer;
      }
      setTypedText(newTyped);
      setFeedback(newFeedback);
      setPointer(idx);
      return;
    }

    // Check if current word is complete
    const neededCount = wordLengths[currentWordIndex] || 0;
    if (typedAlphanumericsInCurrentWord >= neededCount) {
      return;
    }

    // Handle alphanumeric character
    const targetChar = targetForMode[idx];
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
    setTypedAlphanumericsInCurrentWord(count => count + 1);

    if (idx >= targetForMode.length) {
      setCompleted(true);
    }

    setTypedText(newTyped);
    setFeedback(newFeedback);
    setPointer(idx);
  }, [isActive, completed, shaking, pointer, targetForMode, typedText, feedback, currentWordIndex, typedAlphanumericsInCurrentWord, wordLengths]);

  // Add event listener when active
  useEffect(() => {
    if (isActive) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, isActive]);

  // Calculate accuracy for this cell
  const correctCount = feedback.filter(item => item.correct).length;
  const totalTyped = feedback.length;
  const accuracy = totalTyped === 0 ? 0 : Math.round((correctCount / totalTyped) * 100);

  const renderContent = () => {
    // For BRAIN mode, display is based on processed text (hidden)
    if (mode === "BRAIN") {
      const chars = Array.from(displayTarget);
      const showCursor = isActive && pointer === 0 && !completed;
      
      return (
        <>
          {showCursor && <span className="cell-cursor">|</span>}
          {chars.map((ch, displayIndex) => {
            if (ch === "\n") return <br key={displayIndex} />;
            return (
              <span key={displayIndex} className="character hidden">
                {ch}
              </span>
            );
          })}
        </>
      );
    }
    
    // For READ/SPIN modes:
    // We type against processedOriginal, feedback[i] corresponds to processedOriginal[i]
    // We display displayTarget (which might be word-wrapped)
    
    const showCursor = isActive && pointer === 0 && !completed;
    
    // Simple case: no wrapping
    if (displayTarget.length === processedOriginal.length) {
      const chars = Array.from(displayTarget);
      
      return (
        <>
          {showCursor && <span className="cell-cursor">|</span>}
          {chars.map((ch, i) => {
            if (ch === "\n") return <br key={i} />;
            
            // Check if this position has been typed
            if (i < feedback.length) {
              const item = feedback[i];
              const cls = `character ${item?.correct ? "correct" : "incorrect"}`;
              return (
                <span key={i} className={cls}>
                  {ch}
                </span>
              );
            }
            
            // Not typed yet - show baseline
            let cls = "character";
            if (mode === "SPIN") {
              const visible = spinVisibility?.[i] ?? true;
              if (!visible) cls += " hidden";
            }
            
            return (
              <span key={i} className={cls}>
                {ch}
              </span>
            );
          })}
        </>
      );
    }
    
    // With wrapping: need to map processedOriginal positions to displayTarget positions
    const displayChars = Array.from(displayTarget);
    
    // Build position mapping
    let origIdx = 0;
    let dispIdx = 0;
    const displayToOrig = [];
    
    while (dispIdx < displayTarget.length && origIdx <= processedOriginal.length) {
      if (origIdx < processedOriginal.length && 
          displayTarget[dispIdx] === processedOriginal[origIdx]) {
        // Matching character
        displayToOrig[dispIdx] = origIdx;
        origIdx++;
        dispIdx++;
      } else if (displayTarget[dispIdx] === '\n' && 
                 (origIdx >= processedOriginal.length || processedOriginal[origIdx] !== '\n')) {
        // Wrapping newline - doesn't correspond to original
        displayToOrig[dispIdx] = -1;
        dispIdx++;
      } else {
        // Shouldn't happen with correct wrapping
        displayToOrig[dispIdx] = origIdx;
        origIdx++;
        dispIdx++;
      }
    }
    
    return (
      <>
        {showCursor && <span className="cell-cursor">|</span>}
        {displayChars.map((ch, dispIdx) => {
          if (ch === "\n") return <br key={dispIdx} />;
          
          const origPos = displayToOrig[dispIdx];
          
          // If this is a wrapping artifact
          if (origPos === -1 || origPos === undefined) {
            return <span key={dispIdx} className="character">{ch}</span>;
          }
          
          // Check if this original position has been typed
          if (origPos < feedback.length) {
            const item = feedback[origPos];
            const cls = `character ${item?.correct ? "correct" : "incorrect"}`;
            return (
              <span key={dispIdx} className={cls}>
                {ch}
              </span>
            );
          }
          
          // Not typed yet - show baseline
          let cls = "character";
          if (mode === "SPIN") {
            const visible = spinVisibility?.[dispIdx] ?? true;
            if (!visible) cls += " hidden";
          }
          
          return (
            <span key={dispIdx} className={cls}>
              {ch}
            </span>
          );
        })}
      </>
    );
  };

  return (
    <div 
        ref={cellRef}
        className={`guided-cell ${completed ? "completed" : ""} ${shaking ? "shake" : ""} ${shouldCenter ? "centered-text" : ""}`}
        onClick={onFocus}
        tabIndex={tabIndex}
    >
      <div className="cell-content">
        {mode === "BRAIN" && !completed ? (
          <div className="brain-mode">
            {/* Always render invisible placeholder to maintain size */}
            <div className="brain-placeholder-layer">
              {Array.from(displayTarget).map((ch, i) => (
                ch === "\n" ? <br key={i} /> : <span key={i} className="character brain-placeholder">{ch}</span>
              ))}
            </div>
            {/* Overlay typed text on top */}
            <div className="brain-typed-layer">
              {isActive && typedText.length === 0 && <span className="cell-cursor">|</span>}
              {(() => {
                if (typedText.length === 0) return null;
                
                const result = [];
                let pos = 0;
                
                // Go through each feedback item
                for (let i = 0; i < feedback.length; i++) {
                  const item = feedback[i];
                  
                  // Handle list numbers (like "1. ")
                  if (item.char.endsWith?.(". ") && /^\d+\. $/.test(item.char)) {
                    for (const ch of item.char) {
                      result.push({ 
                        type: 'char',
                        char: ch,
                        feedback: item
                      });
                    }
                    continue;
                  }
                  
                  // Handle newlines
                  if (item.char === "\n") {
                    result.push({ type: 'break' });
                    continue;
                  }
                  
                  // Regular character
                  result.push({ 
                    type: 'char',
                    char: item.char,
                    feedback: item
                  });
                  pos++;
                  
                  // Check if we should insert a line break AFTER this character
                  if (lineBreakPositions.includes(pos)) {
                    result.push({ type: 'break' });
                  }
                }
                
                // Render the result
                return result.map((item, idx) => {
                  if (item.type === 'break') {
                    return <br key={`br-${idx}`} />;
                  }
                  
                  return (
                    <span 
                      key={idx} 
                      className={`character ${item.feedback?.correct ? "correct" : "incorrect"}`}
                    >
                      {item.char}
                    </span>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="guided-content">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InteractiveTableMemorization({ table, mode = "BRAIN", flashcardId, onReviewed }) {
  const rows = Number(table?.rows) || 0;
  const cols = Number(table?.cols) || 0;
  const rawCells = Array.isArray(table?.cells) ? table.cells : [];

  // Always a rows×cols matrix of { text: string, prefilled: boolean }
  const cells = React.useMemo(() => {
    return Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const row = Array.isArray(rawCells[r]) ? rawCells[r] : [];
        const cell = row[c] && typeof row[c] === "object" ? row[c] : {};
        return {
          text: typeof cell.text === "string" ? cell.text : (cell.text == null ? "" : String(cell.text)),
          prefilled: !!cell.prefilled,
        };
      })
    );
  }, [rows, cols, rawCells]);

  const [activeCell, setActiveCell] = useState({ r: 0, c: 0 });
  const [completedCells, setCompletedCells] = useState(new Set());

  // Check if any cell exceeds 42 characters
  const hasLongCell = useMemo(() => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (cells[r][c].text.length > 42) {
          return true;
        }
      }
    }
    return false;
  }, [rows, cols, cells]);

  // Find first non-prefilled cell on mount
  useEffect(() => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!cells[r][c].prefilled && cells[r][c].text) {
          setActiveCell({ r, c });
          return;
        }
      }
    }
  }, [rows, cols, cells]);

  // Calculate total completion and accuracy
  const { totalCells, totalAccuracy, allCompleted } = useMemo(() => {
    let total = 0;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = cells[r][c];
            if (!cell.prefilled && cell.text.length > 0) total++;
        }
    }

    const completed = completedCells.size;
    const accuracy = total === 0 ? 100 : Math.round((completed / total) * 100);
    
    return { 
      totalCells: total, 
      totalAccuracy: accuracy, 
      allCompleted: completed === total && total > 0
    };
  }, [rows, cols, cells, completedCells]);

  // BRAIN mastery → review endpoint (once)
  const postedRef = useRef(false);
  
  // Reset postedRef when flashcard changes
  useEffect(() => {
    postedRef.current = false;
  }, [flashcardId]);
  
  useEffect(() => {
    if (!postedRef.current && allCompleted && mode === "BRAIN" && totalAccuracy >= 90 && flashcardId) {
      postedRef.current = true;
      fetch(`/api/flashcards/${flashcardId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "BRAIN", accuracy: totalAccuracy })
      }).then(() => { if (typeof onReviewed === "function") onReviewed(); }).catch(console.error);
    }
  }, [allCompleted, totalAccuracy, mode, flashcardId, onReviewed]);

  const handleCellComplete = (cellKey) => {
    setCompletedCells(prev => new Set([...prev, cellKey]));
  };

  const handleCellFocus = (r, c) => {
    const cell = cells[r][c];
    if (!cell.prefilled && cell.text) {
      setActiveCell({ r, c });
    }
  };

  // Helper functions to determine if a row or column is entirely prefilled
  const isRowPrefilled = (r) => {
    for (let c = 0; c < cols; c++) {
      if (!cells[r][c].prefilled) return false;
    }
    return true;
  };

  const isColPrefilled = (c) => {
    for (let r = 0; r < rows; r++) {
      if (!cells[r][c].prefilled) return false;
    }
    return true;
  };

  // Find next non-prefilled cell in order
  const findNextCell = (currentR, currentC) => {
    // Start from next cell
    for (let r = currentR; r < rows; r++) {
      for (let c = (r === currentR ? currentC + 1 : 0); c < cols; c++) {
        if (!cells[r][c].prefilled && cells[r][c].text) {
          return { r, c };
        }
      }
    }
    // Wrap around to beginning
    for (let r = 0; r <= currentR; r++) {
      for (let c = 0; c < (r === currentR ? currentC : cols); c++) {
        if (!cells[r][c].prefilled && cells[r][c].text) {
          return { r, c };
        }
      }
    }
    return null;
  };

  // Find previous non-prefilled cell in order
  const findPrevCell = (currentR, currentC) => {
    // Start from previous cell
    for (let r = currentR; r >= 0; r--) {
      for (let c = (r === currentR ? currentC - 1 : cols - 1); c >= 0; c--) {
        if (!cells[r][c].prefilled && cells[r][c].text) {
          return { r, c };
        }
      }
    }
    // Wrap around to end
    for (let r = rows - 1; r >= currentR; r--) {
      for (let c = cols - 1; c > (r === currentR ? currentC : -1); c--) {
        if (!cells[r][c].prefilled && cells[r][c].text) {
          return { r, c };
        }
      }
    }
    return null;
  };

  const handleKeyDown = useCallback((e) => {
    const { r, c } = activeCell;
    
    if (e.key === "Tab") {
      e.preventDefault();
      
      if (e.shiftKey) {
        // Shift+Tab: go to previous cell
        const prev = findPrevCell(r, c);
        if (prev) {
          setActiveCell(prev);
        }
      } else {
        // Tab: go to next cell
        const next = findNextCell(r, c);
        if (next) {
          setActiveCell(next);
        }
      }
    } else if (e.ctrlKey) {
      // Keep existing Ctrl+Arrow navigation
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          for (let newC = c + 1; newC < cols; newC++) {
            if (!cells[r][newC].prefilled && cells[r][newC].text) {
              setActiveCell({ r, c: newC });
              break;
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          for (let newC = c - 1; newC >= 0; newC--) {
            if (!cells[r][newC].prefilled && cells[r][newC].text) {
              setActiveCell({ r, c: newC });
              break;
            }
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          for (let newR = r + 1; newR < rows; newR++) {
            if (!cells[newR][c].prefilled && cells[newR][c].text) {
              setActiveCell({ r: newR, c });
              break;
            }
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          for (let newR = r - 1; newR >= 0; newR--) {
            if (!cells[newR][c].prefilled && cells[newR][c].text) {
              setActiveCell({ r: newR, c });
              break;
            }
          }
          break;
        default:
          break;
      }
    }
  }, [activeCell, rows, cols, cells]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Calculate tab index for each cell
  const getTabIndex = (r, c) => {
    if (cells[r][c].prefilled || !cells[r][c].text) return -1;
    // Only the active cell has tabIndex 0, others have -1
    return activeCell.r === r && activeCell.c === c ? 0 : -1;
  };

  const renderCellContent = (r, c) => {
    const cell = cells[r][c];
    const cellKey = `${r}-${c}`;
    const shouldCenter = hasLongCell && cell.text.length < 14;

    if (cell.prefilled) {
      // Process prefilled text to convert HTML tags to formatted lists
      const processedText = processDisplayText(cell.text);
      const wrappedText = wordWrapText(processedText, 42);
      
      return (
        <div className={`cell prefilled ${shouldCenter ? "centered-text" : ""}`} key={cellKey}>
          <div className="prefilled-text">{wrappedText}</div>
        </div>
      );
    }

    const target = cell.text || "";
    const isActive = activeCell.r === r && activeCell.c === c;

    return (
      <GuidedTableCell
        key={cellKey}
        target={target}
        mode={mode}
        cellKey={cellKey}
        isActive={isActive}
        onComplete={handleCellComplete}
        onFocus={() => handleCellFocus(r, c)}
        tabIndex={getTabIndex(r, c)}
        shouldCenter={shouldCenter}
      />
    );
  };

  return (
    <div className="screen table-screen" tabIndex={0}>
      <div className="table-speed">{totalAccuracy}%</div>
      <div className="table-wrapper">
        <table className="memo-table" role="grid" aria-rowcount={rows} aria-colcount={cols}>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr 
                key={r}
                className={isRowPrefilled(r) ? "prefilled-row" : ""}
              >
                {Array.from({ length: cols }).map((_, c) => (
                  <td 
                    key={c} 
                    role="gridcell"
                    className={isColPrefilled(c) ? "prefilled-col" : ""}
                  >
                    {renderCellContent(r, c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {allCompleted && <div className="completion-message">Completed!</div>}
      </div>
    </div>
  );
}