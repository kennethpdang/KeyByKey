const Flashcard = require('../models/flashcardModel.js');
const mongoose = require('mongoose');

const getFlashcards = async (request, response) => {
    const flashCards = await Flashcard.find({}).sort({createdAt: -1});
    response.status(200).json(flashCards);
};

const getFlashcard = async (request, response) => {
    const { id } = request.params;
    
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({error: "No such flashcard!"});
    };
    
    const flashCard = await Flashcard.findById(id);

    if(!flashcard) {
        return response.status(404).json({error: "No such flashcard!"})
    }

    response.status(200).json(flashCard);
};

module.exports = {
    getFlashcards,
    getFlashcard
};