import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import "../cascading_style_sheets/InteractiveTableMemorization.css";

// ============= UTILITY FUNCTIONS =============
// Consolidated list number detection
function isListNumberPosition(text, index) {
  if (index >= text.length || !/\d/.test(text[index])) return false;
  
  // Check if at line start
  const atLineStart = index === 0 || 
    (index > 0 && text[index - 1] === '\n') ||
    (index > 0 && text[index - 1] === ' ' && index > 1 && text[index - 2] === '\n');
  
  if (!atLineStart) {
    // Check if we're within an existing list number
    for (let k = index; k >= 0 && k > index - 5; k--) {
      if (text[k] === '\n' || k === 0) {
        const start = k === 0 ? 0 : k + 1;
        let j = start;
        while (j < text.length && /\d/.test(text[j])) j++;
        if (j < text.length - 1 && text[j] === '.' && text[j + 1] === ' ') {
          return index >= start && index < j + 2;
        }
        break;
      }
    }
    return false;
  }
  
  // Look ahead for ". " pattern
  let j = index;
  while (j < text.length && /\d/.test(text[j])) j++;
  return j < text.length - 1 && text[j] === '.' && text[j + 1] === ' ';
}

// Get the end position of a list number starting at index
function getListNumberEnd(text, index) {
  let j = index;
  while (j < text.length && /\d/.test(text[j])) j++;
  if (j < text.length && text[j] === '.') j++;
  if (j < text.length && text[j] === ' ') j++;
  return j;
}

// ============= TEXT PROCESSING =============
// Build SPIN visibility for processed text
function buildSpinVisibility(text) {
  const s = typeof text === "string" ? text : (text == null ? "" : String(text));
  const vis = new Array(s.length).fill(true);
  let inWord = false;
  let wordIndex = 0;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    
    if (isListNumberPosition(s, i)) {
      // Skip to end of list number
      const end = getListNumberEnd(s, i);
      for (let k = i; k < end; k++) {
        vis[k] = true;
      }
      i = end - 1;
      inWord = false;
      continue;
    }
    
    const isAlnum = /[a-zA-Z0-9]/.test(c);
    if (isAlnum) {
      if (!inWord) inWord = true;
      vis[i] = wordIndex % 2 === 0;
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

// Word wrap with list number preservation
function wordWrapText(text, maxChars = 42) {
  if (!text || text.length <= maxChars) return text;
  
  const lines = text.split('\n');
  const wrappedLines = [];
  
  for (const line of lines) {
    // Check if entire line fits
    if (line.length <= maxChars) {
      wrappedLines.push(line);
      continue;
    }
    
    // Handle list numbers
    const listMatch = line.match(/^(\d+\.\s+)/);
    const prefix = listMatch ? listMatch[1] : '';
    const content = prefix ? line.substring(prefix.length) : line;
    
    // Split on word boundaries but keep spaces attached to preceding word
    const words = [];
    let currentWord = '';
    for (let i = 0; i < content.length; i++) {
      currentWord += content[i];
      // If next char is not a space or we're at the end, close current word
      if (i === content.length - 1 || (content[i + 1] && !/\s/.test(content[i + 1]) && /\s/.test(content[i]))) {
        if (currentWord.length > 0) {
          words.push(currentWord);
          currentWord = '';
        }
      }
    }
    if (currentWord.length > 0) {
      words.push(currentWord);
    }
    
    // Build wrapped lines
    let currentLine = prefix;
    
    for (const word of words) {
      const testLine = currentLine + word;
      
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        // Only break if we have content on current line
        if (currentLine.length > prefix.length) {
          wrappedLines.push(currentLine.trimEnd());
          currentLine = prefix.length > 0 ? word.trimStart() : word;
        } else {
          // Word is too long even for a fresh line, break it
          const remaining = maxChars - currentLine.length;
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

// Process HTML list tags to formatted text
function processDisplayText(text) {
  let result = "";
  let listItemCount = 0;
  let i = 0;
  
  const firstOlIndex = text.indexOf("<ol>");
  const hasTextBeforeList = firstOlIndex > 0 && text.substring(0, firstOlIndex).trim().length > 0;
  
  while (i < text.length) {
    const slice = text.slice(i, i + 5);
    
    if (slice.startsWith("<ol>")) {
      if (hasTextBeforeList) result += "\n";
      i += 4;
    } else if (slice.startsWith("<li>")) {
      if (listItemCount > 0 || hasTextBeforeList) result += "\n";
      listItemCount++;
      result += `${listItemCount}. `;
      i += 4;
    } else if (slice.startsWith("</li>")) {
      i += 5;
    } else if (slice.startsWith("</ol>")) {
      listItemCount = 0;
      i += 5;
    } else {
      result += text[i];
      i++;
    }
  }
  
  return result;
}

// Get word lengths, skipping HTML tags and list numbers
function getWordLengths(text) {
  const wordLengths = [];
  let currentCount = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Skip HTML tags
    if (char === "<") {
      if (currentCount > 0) {
        wordLengths.push(currentCount);
        currentCount = 0;
      }
      while (i < text.length && text[i] !== ">") i++;
      continue;
    }
    
    // Skip list numbers
    if (isListNumberPosition(text, i)) {
      if (currentCount > 0) {
        wordLengths.push(currentCount);
        currentCount = 0;
      }
      i = getListNumberEnd(text, i) - 1;
      continue;
    }
    
    if (/\s/.test(char)) {
      if (currentCount > 0) {
        wordLengths.push(currentCount);
        currentCount = 0;
      }
    } else if (/[a-zA-Z0-9]/.test(char)) {
      currentCount++;
    }
  }
  
  if (currentCount > 0) {
    wordLengths.push(currentCount);
  }
  
  return wordLengths;
}

// ============= MODE STRATEGIES =============
const ModeStrategies = {
  BRAIN: {
    getTargetText: (original) => original,
    skipNonAlphanumeric: (text, idx, typed, feedback) => {
      let newTyped = typed;
      let newFeedback = [...feedback];
      
      const firstOlIndex = text.indexOf("<ol>");
      const hasTextBeforeList = firstOlIndex > 0 && text.substring(0, firstOlIndex).trim().length > 0;
      
      while (idx < text.length && !/[a-zA-Z0-9]/.test(text[idx])) {
        const slice = text.slice(idx, idx + 5);
        if (slice.startsWith("<ol>")) {
          if (hasTextBeforeList) {
            newFeedback.push({ char: "\n", correct: true });
            newTyped += "\n";
          }
          idx += 4;
        } else if (slice.startsWith("<li>")) {
          const isFirstItem = newFeedback.filter(i => i.char.endsWith?.(". ")).length === 0;
          if (!isFirstItem || hasTextBeforeList) {
            newFeedback.push({ char: "\n", correct: true });
            newTyped += "\n";
          }
          const listNumber = newFeedback.filter(i => i.char.endsWith?.(". ")).length + 1;
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
    }
  },
  
  READ: {
    getTargetText: (original) => processDisplayText(original),
    skipNonAlphanumeric: (text, idx, typed, feedback) => {
      let newTyped = typed;
      let newFeedback = [...feedback];
      
      // Check for list number at current position
      if (isListNumberPosition(text, idx)) {
        const end = getListNumberEnd(text, idx);
        while (idx < end) {
          newFeedback.push({ char: text[idx], correct: true });
          newTyped += text[idx];
          idx++;
        }
        return { newTyped, newFeedback, newPointer: idx };
      }
      
      // Skip regular non-alphanumeric
      while (idx < text.length && !/[a-zA-Z0-9]/.test(text[idx])) {
        newFeedback.push({ char: text[idx], correct: true });
        newTyped += text[idx];
        idx++;
      }
      
      return { newTyped, newFeedback, newPointer: idx };
    }
  },
  
  SPIN: {
    getTargetText: (original) => processDisplayText(original),
    skipNonAlphanumeric: (text, idx, typed, feedback) => {
      // Same as READ mode
      return ModeStrategies.READ.skipNonAlphanumeric(text, idx, typed, feedback);
    }
  }
};

// ============= CELL COMPONENT =============
function GuidedTableCell({ target, mode, onComplete, cellKey, isActive, onFocus, tabIndex, shouldCenter }) {
  const [typedText, setTypedText] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [pointer, setPointer] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedAlphanumericsInCurrentWord, setTypedAlphanumericsInCurrentWord] = useState(0);
  const cellRef = useRef(null);

  const strategy = ModeStrategies[mode];
  const processedOriginal = processDisplayText(target);
  const displayTarget = wordWrapText(processedOriginal, 42);
  const targetForMode = strategy.getTargetText(target);
  const wordLengths = useMemo(() => getWordLengths(targetForMode), [targetForMode]);
  const spinVisibility = useMemo(
    () => mode === "SPIN" ? buildSpinVisibility(displayTarget) : null,
    [mode, displayTarget]
  );

  // Calculate line break positions for BRAIN mode
  const lineBreakPositions = useMemo(() => {
    if (mode !== "BRAIN") return [];
    
    const breaks = [];
    let originalPos = 0;
    
    for (let i = 0; i < displayTarget.length; i++) {
      if (displayTarget[i] === '\n') {
        if (originalPos >= processedOriginal.length || processedOriginal[originalPos] !== '\n') {
          breaks.push(originalPos);
        } else {
          originalPos++;
        }
      } else {
        originalPos++;
      }
    }
    
    return breaks;
  }, [mode, displayTarget, processedOriginal]);

  // Reset state when target changes
  const resetState = useCallback(() => {
    setTypedText("");
    setFeedback([]);
    setCompleted(false);
    setPointer(0);
    setCurrentWordIndex(0);
    setTypedAlphanumericsInCurrentWord(0);
  }, []);

  useEffect(() => {
    resetState();
  }, [target, resetState]);

  // Check completion
  useEffect(() => {
    if (currentWordIndex >= wordLengths.length && wordLengths.length > 0) {
      setCompleted(true);
      onComplete && onComplete(cellKey);
    }
  }, [currentWordIndex, wordLengths, cellKey, onComplete]);

  // Focus management
  useEffect(() => {
    if (isActive && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isActive]);

  // Typing handler
  const handleKeyDown = useCallback((e) => {
    if (!isActive || completed || shaking) return;
    if (e.key !== " " && !/^[a-zA-Z0-9]$/.test(e.key)) return;

    e.preventDefault();

    let newTyped = typedText;
    let newFeedback = [...feedback];
    let idx = pointer;

    // Skip non-alphanumeric using mode strategy
    const result = strategy.skipNonAlphanumeric(targetForMode, idx, newTyped, newFeedback);
    newTyped = result.newTyped;
    newFeedback = result.newFeedback;
    idx = result.newPointer;

    if (idx >= targetForMode.length) {
      setTypedText(newTyped);
      setFeedback(newFeedback);
      setCompleted(true);
      return;
    }

    // Handle space - advance word
    if (e.key === " ") {
      const neededChars = wordLengths[currentWordIndex] || 0;
      if (typedAlphanumericsInCurrentWord >= neededChars) {
        setCurrentWordIndex(w => w + 1);
        setTypedAlphanumericsInCurrentWord(0);
        
        const afterSpace = strategy.skipNonAlphanumeric(targetForMode, idx, newTyped, newFeedback);
        newTyped = afterSpace.newTyped;
        newFeedback = afterSpace.newFeedback;
        idx = afterSpace.newPointer;
      }
      setTypedText(newTyped);
      setFeedback(newFeedback);
      setPointer(idx);
      return;
    }

    // Check word completion
    const neededCount = wordLengths[currentWordIndex] || 0;
    if (typedAlphanumericsInCurrentWord >= neededCount) return;

    // Handle character typing
    const targetChar = targetForMode[idx];
    const isCorrect = e.key.toLowerCase() === targetChar.toLowerCase();
    
    newTyped += targetChar;
    newFeedback.push({ char: targetChar, correct: isCorrect });
    
    if (!isCorrect) {
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
  }, [isActive, completed, shaking, pointer, targetForMode, typedText, feedback, 
      currentWordIndex, typedAlphanumericsInCurrentWord, wordLengths, strategy]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, isActive]);

  // Render character with appropriate styling
  const renderCharacter = (ch, index, feedbackItem, isHidden = false) => {
    if (ch === "\n") return <br key={index} />;
    
    let className = "character";
    if (feedbackItem) {
      className += feedbackItem.correct ? " correct" : " incorrect";
    } else if (isHidden) {
      className += " hidden";
    }
    
    return <span key={index} className={className}>{ch}</span>;
  };

  // Render content based on mode
  const renderContent = () => {
    const showCursor = isActive && pointer === 0 && !completed;
    
    if (mode === "BRAIN") {
      const chars = Array.from(displayTarget);
      
      return (
        <>
          {showCursor && <span className="cell-cursor">|</span>}
          {chars.map((ch, i) => renderCharacter(ch, i, null, true))}
        </>
      );
    }
    
    // READ/SPIN modes
    const chars = Array.from(displayTarget);
    
    // Map display positions to feedback
    const getFeedbackForPosition = (displayIdx) => {
      if (displayTarget.length === processedOriginal.length) {
        return displayIdx < feedback.length ? feedback[displayIdx] : null;
      }
      
      // Handle wrapped text mapping
      let origIdx = 0;
      for (let i = 0; i <= displayIdx && origIdx < processedOriginal.length; i++) {
        if (displayTarget[i] === processedOriginal[origIdx]) {
          origIdx++;
        } else if (displayTarget[i] === '\n' && 
                   (origIdx >= processedOriginal.length || processedOriginal[origIdx] !== '\n')) {
          // Wrapping newline
          continue;
        }
      }
      return origIdx <= feedback.length ? feedback[origIdx - 1] : null;
    };
    
    return (
      <>
        {showCursor && <span className="cell-cursor">|</span>}
        {chars.map((ch, i) => {
          const feedbackItem = getFeedbackForPosition(i);
          const isHidden = mode === "SPIN" && !spinVisibility?.[i];
          return renderCharacter(ch, i, feedbackItem, isHidden);
        })}
      </>
    );
  };

  // Render BRAIN mode typed overlay
  const renderBrainTypedOverlay = () => {
    if (typedText.length === 0) {
      return isActive ? <span className="cell-cursor">|</span> : null;
    }
    
    const result = [];
    let charCount = 0;
    
    for (let i = 0; i < feedback.length; i++) {
      const item = feedback[i];
      
      if (item.char.endsWith?.(". ") && /^\d+\. $/.test(item.char)) {
        // List number
        for (const ch of item.char) {
          result.push({ type: 'char', char: ch, feedback: item });
        }
      } else if (item.char === "\n") {
        result.push({ type: 'break' });
      } else {
        result.push({ type: 'char', char: item.char, feedback: item });
        charCount++;
        if (lineBreakPositions.includes(charCount)) {
          result.push({ type: 'break' });
        }
      }
    }
    
    return result.map((item, idx) => 
      item.type === 'break' 
        ? <br key={`br-${idx}`} />
        : <span key={idx} className={`character ${item.feedback?.correct ? "correct" : "incorrect"}`}>
            {item.char}
          </span>
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
            <div className="brain-placeholder-layer">
              {Array.from(displayTarget).map((ch, i) => renderCharacter(ch, i, null, true))}
            </div>
            <div className="brain-typed-layer">
              {renderBrainTypedOverlay()}
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

// ============= MAIN COMPONENT =============
export default function InteractiveTableMemorization({ table, mode = "BRAIN", flashcardId, onReviewed }) {
  const rows = Number(table?.rows) || 0;
  const cols = Number(table?.cols) || 0;
  const rawCells = Array.isArray(table?.cells) ? table.cells : [];

  // Parse cells into structured format
  const cells = useMemo(() => {
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
  const postedRef = useRef(false);

  // Check if any cell exceeds 42 characters (for centering logic)
  const hasLongCell = useMemo(() => 
    cells.some(row => row.some(cell => cell.text.length > 42)),
    [cells]
  );

  // Find first non-prefilled cell
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

  // Calculate completion stats
  const stats = useMemo(() => {
    const nonPrefilledCells = cells.flat().filter(cell => !cell.prefilled && cell.text.length > 0);
    const total = nonPrefilledCells.length;
    const completed = completedCells.size;
    
    return {
      totalCells: total,
      totalAccuracy: total === 0 ? 100 : Math.round((completed / total) * 100),
      allCompleted: completed === total && total > 0
    };
  }, [cells, completedCells]);

  // Reset posting ref when flashcard changes
  useEffect(() => {
    postedRef.current = false;
  }, [flashcardId]);

  // Handle BRAIN mode completion
  useEffect(() => {
    if (!postedRef.current && stats.allCompleted && mode === "BRAIN" && stats.totalAccuracy >= 90 && flashcardId) {
      postedRef.current = true;
      fetch(`/api/flashcards/${flashcardId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "BRAIN", accuracy: stats.totalAccuracy })
      }).then(() => onReviewed?.()).catch(console.error);
    }
  }, [stats, mode, flashcardId, onReviewed]);

  // Navigation helpers
  const findNextCell = useCallback((currentR, currentC, direction = 1) => {
    const positions = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!cells[r][c].prefilled && cells[r][c].text) {
          positions.push({ r, c });
        }
      }
    }
    
    const currentIdx = positions.findIndex(p => p.r === currentR && p.c === currentC);
    if (currentIdx === -1) return null;
    
    const nextIdx = (currentIdx + direction + positions.length) % positions.length;
    return positions[nextIdx];
  }, [rows, cols, cells]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
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
    
    // Check if a modal is open
    if (document.querySelector('.modal-overlay')) {
      return;
    }
    
    const { r, c } = activeCell;
    
    if (e.key === "Tab") {
      e.preventDefault();
      const next = findNextCell(r, c, e.shiftKey ? -1 : 1);
      if (next) setActiveCell(next);
    } else if (e.ctrlKey && /^Arrow/.test(e.key)) {
      e.preventDefault();
      const directions = {
        ArrowRight: { dr: 0, dc: 1 },
        ArrowLeft: { dr: 0, dc: -1 },
        ArrowDown: { dr: 1, dc: 0 },
        ArrowUp: { dr: -1, dc: 0 }
      };
      
      const dir = directions[e.key];
      if (!dir) return;
      
      // Find next non-prefilled cell in direction
      const step = dir.dr !== 0 ? rows : cols;
      for (let i = 1; i < step; i++) {
        const newR = dir.dr !== 0 ? (r + dir.dr * i + rows) % rows : r;
        const newC = dir.dc !== 0 ? (c + dir.dc * i + cols) % cols : c;
        
        if (!cells[newR][newC].prefilled && cells[newR][newC].text) {
          setActiveCell({ r: newR, c: newC });
          break;
        }
      }
    }
  }, [activeCell, rows, cols, cells, findNextCell]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Render cell
  const renderCell = (r, c) => {
    const cell = cells[r][c];
    const cellKey = `${r}-${c}`;
    const shouldCenter = hasLongCell && cell.text.length < 14;
    const isActive = activeCell.r === r && activeCell.c === c;

    if (cell.prefilled) {
      const processedText = processDisplayText(cell.text);
      const wrappedText = wordWrapText(processedText, 42);
      
      return (
        <div className={`cell prefilled ${shouldCenter ? "centered-text" : ""}`} key={cellKey}>
          <div className="prefilled-text">{wrappedText}</div>
        </div>
      );
    }

    return (
      <GuidedTableCell
        key={cellKey}
        target={cell.text}
        mode={mode}
        cellKey={cellKey}
        isActive={isActive}
        onComplete={() => setCompletedCells(prev => new Set([...prev, cellKey]))}
        onFocus={() => !cell.prefilled && cell.text && setActiveCell({ r, c })}
        tabIndex={isActive ? 0 : -1}
        shouldCenter={shouldCenter}
      />
    );
  };

  return (
    <div className="screen table-screen" tabIndex={0}>
      <div className="table-speed">{stats.totalAccuracy}%</div>
      <div className="table-wrapper">
        <table className="memo-table" role="grid" aria-rowcount={rows} aria-colcount={cols}>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} role="gridcell">
                    {renderCell(r, c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {stats.allCompleted && <div className="completion-message">Completed!</div>}
      </div>
    </div>
  );
}