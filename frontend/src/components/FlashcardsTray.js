// src/components/FlashcardsTray.js
import React from 'react';
import '../cascading_style_sheets/FlashcardsTray.css';

function FlashcardsTray({ isOpen, togglePanel, flashcards, handleDelete }) {
  return (
    <div className={`tray-container ${isOpen ? 'open' : 'closed'}`}>
      <div className="tray-header">
        <div className="toggle-icon" onClick={togglePanel}>
          <i className={`fas fa-arrow-circle-down fa-2x ${isOpen ? 'rotate' : 'closed'}`}></i>
        </div>
        {isOpen && <span className="tray-title">Flashcards</span>}
      </div>
      {isOpen && (
        <div className="tray-list">
          {flashcards.map((card) => (
            <div className="flashcard-item" key={card.id}>
              
              {/* Flex container for title and delete button */}
              <div className="flashcard-header-container">
                <div className="flashcard-header">{card.title}</div>
                <button className="delete-button" onClick={() => handleDelete(card.id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>

              <div className="flashcard-category">{card.category}</div>
              <div className="flashcard-description">
                {card.description.length > 250
                  ? `${card.description.substring(0, 250)}...`
                  : card.description}
              </div>
              <div className="flashcard-due-date">Due: {card.dueDate}</div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FlashcardsTray;
