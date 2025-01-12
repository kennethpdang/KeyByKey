const Flashcard = require('../models/flashcardModel.js');
const Collection = require('../models/collectionModel.js');
const mongoose = require('mongoose');

const getFlashcards = async (request, response) => {
    const flashCards = await Flashcard.find({}).sort({createdAt: -1});
    response.status(200).json(flashCards);
};

const getFlashcard = async (request, response) => {
    const { id } = request.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).json({error: "No such flashcard!"});
    }
    
    const flashcard = await Flashcard.findById(id);

    if(!flashcard) {
        return response.status(404).json({error: "No such flashcard!"});
    }

    response.status(200).json(flashcard);
};

const createFlashcard = async (request, response) => {
    const { header, content, collectionName } = request.body;

    try {
        const flashcard = await Flashcard.create({ header, content, collectionName });
        response.status(200).json(flashcard);
        
        // Update the corresponding collection:
        const collection = await Collection.findById(collectionName);
        if (!collection) {
            return response.status(404).json({ error: 'Collection not found' });
        }

        collection.flashcards.push(flashcard._id);
        await collection.save();
    } catch (error) {
        response.status(400).json({ error: error.message });
    }
};

const deleteFlashcard = async (request, response) => {
    const { id } = request.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).json({error: "No such flashcard!"});
    }

    try {
        const flashcard = await Flashcard.findOneAndDelete({_id: id});
        if(!flashcard) {
            return response.status(400).json({error: "No such flashcard!"});
        }

        await Collection.updateOne(
            {_id: flashcard.collectionName}, // See that flashcard is defined above.
            {$pull: {flashcards: id}}
        );

        response.status(200).json(flashcard);
    } catch (error) {
        response.status(500).json({error: error.message});
    }
};

const updateFlashcard = async (request, response) => {
    const { id } = request.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({error: "No such flashcard!"});
    }

    const flashcard = await Flashcard.findOneAndUpdate({_id: id}, {
        ...request.body
    });

    if(!flashcard) {
        return request.status(400).json({error: "No such flashcard!"});
    }

    response.status(200).json(flashcard);
};

module.exports = {
    getFlashcards,
    getFlashcard,
    createFlashcard,
    deleteFlashcard,
    updateFlashcard
};