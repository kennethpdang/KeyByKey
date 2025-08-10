import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../cascading_style_sheets/Memorize.css';
import FlashcardsTray from '../components/FlashcardsTray';
import InteractiveMemorization from '../components/InteractiveMemorization';
import ModeToolbar from '../components/ModeToolbar';

const Memorize = () => {
    const { id } = useParams();
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [flashcards, setFlashcards] = useState([]);
    const [selectedFlashcard, setSelectedFlashcard] = useState(null);
    const [mode, setMode] = useState("BRAIN"); // Default mode.

    const togglePanel = () => {
        setIsPanelOpen(prev => !prev);
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/flashcards/${id}`, { 
                method: 'DELETE' 
            });
            if (response.ok) {
                setFlashcards(prevCards => prevCards.filter(card => card._id !== id));
            } else {
                console.error("Error deleting flashcard");
            }
        } catch (error) {
            console.error("Error deleting flashcard:", error);
        }
    };

    const addFlashcard = (newFlashcard) => {
        setFlashcards(prevFlashcards => [newFlashcard, ...prevFlashcards]);
    };

    const updateFlashcard = (updatedFlashcard) => {
        setFlashcards(prevFlashcards =>
            prevFlashcards.map(card =>
                card._id === updatedFlashcard._id ? updatedFlashcard : card
            )
        );
    };

    // Fetch all flashcards for the tray
    useEffect(() => {
        const fetchFlashcards = async () => {
            try {
                const response = await fetch('/api/flashcards/');
                const data = await response.json();
                setFlashcards(data);
            } catch (error) {
                console.error("Failed to fetch flashcards:", error);
            }
        };
        fetchFlashcards();
    }, []);

    // If an id is provided in the URL, fetch that specific flashcard
    useEffect(() => {
        if (id) {
            const fetchFlashcardById = async () => {
                try {
                    const response = await fetch(`/api/flashcards/${id}`);
                    const data = await response.json();
                    setSelectedFlashcard(data);
                } catch (error) {
                    console.error("Failed to fetch flashcard:", error);
                }
            };
            fetchFlashcardById();
        } else {
            setSelectedFlashcard(null);
        }
    }, [id]);

    return (
        <div className="memorize-page">
            <FlashcardsTray
                isOpen={isPanelOpen}
                togglePanel={togglePanel}
                flashcards={flashcards}
                handleDelete={handleDelete}
                onFlashcardAdded={addFlashcard}
                onFlashcardEdited={updateFlashcard}
            />
            <div className="content-area">
                {selectedFlashcard ? (
                <InteractiveMemorization 
                    key={`${selectedFlashcard._id}-${mode}`}
                    hiddenText={selectedFlashcard.content}
                    mode={mode}
                    flashcardId={selectedFlashcard._id}
                    onReviewed={() => {
                        fetch('/api/flashcards')
                            .then(r => r.json())
                            .then(setFlashcards)
                            .catch(console.error);
                    }}
                />
                ) : (
                    <div style={{ color: '#fff', padding: '2rem' }}>
                        Select a flashcard to start memorizing.
                    </div>
                )}
            </div>
            <ModeToolbar selected={mode} onSelect={setMode} />
        </div>
    );
};

export default Memorize;