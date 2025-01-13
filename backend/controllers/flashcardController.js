const flashcardService = require('../services/flashcardServices.js');

const getFlashcards = async (request, response) => {
    try {
        const flashcards = await flashcardService.getAllFlashcards();
        return response.status(200).json(flashcards);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
};

const getFlashcard = async (request, response) => {
    const { id } = request.params;

    try {
        const flashcard = await flashcardService.getFlashcardById(id);
        return response.status(200).json(flashcard);
    } catch (error) {
        return response.status(404).json({ error: error.message });
    }
};

const createFlashcard = async (request, response) => {
    try {
        const flashcard = await flashcardService.createFlashcard(request.body);
        return response.status(201).json(flashcard);
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
};

const deleteFlashcard = async (request, response) => {
    const { id } = request.params;

    try {
        const flashcard = await flashcardService.deleteFlashcard(id);
        return response.status(200).json(flashcard);
    } catch (error) {
        return response.status(404).json({ error: error.message });
    }
};

const updateFlashcard = async (request, response) => {
    const { id } = request.params;

    try {
        const flashcard = await flashcardService.updateFlashcard(id, request.body);
        return response.status(200).json(flashcard);
    } catch (error) {
        return response.status(404).json({ error: error.message });
    }
};

module.exports = {
    getFlashcards,
    getFlashcard,
    createFlashcard,
    deleteFlashcard,
    updateFlashcard
};