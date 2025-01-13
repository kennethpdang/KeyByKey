const mongoose = require('mongoose');
const Flashcard = require('../models/flashcardModel.js');
const Collection = require('../models/collectionModel.js');

async function getAllFlashcards() {
    return await Flashcard.find({}).sort({ createdAt: -1 });
}

/**
* @param {string} id - The ID of the flashcard.
*/
async function getFlashcardById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid flashcard ID');
    }

    const flashcard = await Flashcard.findById(id);
    if (!flashcard) {
        throw new Error('Flashcard not found');
    }
    return flashcard;
}

/**
* @param {Object} data - The flashcard data.
* @param {string} data.header
* @param {string} data.content
* @param {ObjectId} data.collectionName
*/
async function createFlashcard(data) {
    const { header, content, collectionName } = data;
    const flashcard = await Flashcard.create({ header, content, collectionName });

    const collection = await Collection.findById(collectionName);
    if (!collection) {
        throw new Error('Collection not found');
    }

    collection.flashcards.push(flashcard._id);
    await collection.save();
    return flashcard;
}

/**
* @param {string} id - The ID of the flashcard to delete.
*/
async function deleteFlashcard(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid flashcard ID');
    }

    const flashcard = await Flashcard.findOneAndDelete({ _id: id });
    if (!flashcard) {
        throw new Error('Flashcard not found');
    }

    await Collection.updateOne(
        { _id: flashcard.collectionName },
        { $pull: { flashcards: id } }
    );

    return flashcard;
}

/**
* @param {string} id - The ID of the flashcard to update.
* @param {Object} data - The update data.
*/
async function updateFlashcard(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid flashcard ID');
    }

    const flashcard = await Flashcard.findOneAndUpdate(
        { _id: id },
        { ...data },
        { new: true }
    );

    if (!flashcard) {
        throw new Error('Flashcard not found');
    }

    return flashcard;
}

module.exports = {
    getAllFlashcards,
    getFlashcardById,
    createFlashcard,
    deleteFlashcard,
    updateFlashcard
};