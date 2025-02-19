// src/pages/Memorize.js
import React, { useState } from 'react';
import '../cascading_style_sheets/Memorize.css';
import FlashcardsTray from '../components/FlashcardsTray';

const flashcardsData = [
    {
        id: 1,
        title: 'Flashcard 1',
        category: 'Category 1',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
        dueDate: '2025-03-01', // Example due date
    },
    {
        id: 2,
        title: 'Flashcard 2',
        category: 'Category 1',
        description:
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. '.repeat(10),
        dueDate: '2025-03-10', // Example due date
    },
];


const Memorize = () => {
const [isPanelOpen, setIsPanelOpen] = useState(true);
const [flashcards, setFlashcards] = useState(flashcardsData);

const togglePanel = () => {
    setIsPanelOpen((prev) => !prev);
};

const handleDelete = (id) => {
    setFlashcards(flashcards.filter((card) => card.id !== id));
};

return (
    <div className="memorize-page">
    <FlashcardsTray
        isOpen={isPanelOpen}
        togglePanel={togglePanel}
        flashcards={flashcards}
        handleDelete={handleDelete}
    />
    <div className="content-area">
        {/* Your main content */}
        <p>Hello</p>
    </div>
    </div>
);
};

export default Memorize;