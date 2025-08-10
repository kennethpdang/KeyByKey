const mongoose = require('mongoose');
const Flashcard = require('../models/flashcardModel.js');
const Collection = require('../models/collectionModel.js');


function isSameUtcDay(a, b) {
    if (!a || !b) return false;
    return (
        a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate()
    );
}

async function getAllFlashcards() {
    return await Flashcard.find({}).populate('collectionName').sort({ createdAt: -1 });
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

    // Retrieve the current flashcard
    const existingFlashcard = await Flashcard.findById(id);
    if (!existingFlashcard) {
    throw new Error('Flashcard not found');
    }

    // Check if the collectionName is being updated
    if (data.collectionName && data.collectionName.toString() !== existingFlashcard.collectionName.toString()) {
    // Remove the flashcard ID from the old collection
    await Collection.updateOne(
        { _id: existingFlashcard.collectionName },
        { $pull: { flashcards: id } }
    );
    // Add the flashcard ID to the new collection
    await Collection.updateOne(
        { _id: data.collectionName },
        { $push: { flashcards: id } }
    );
    }

    // Update the flashcard document
    const updatedFlashcard = await Flashcard.findOneAndUpdate(
        { _id: id },
        { ...data },
        { new: true }
    );

    if (!updatedFlashcard) {
    throw new Error('Flashcard not found');
    }

    return updatedFlashcard;
}

async function reviewFlashcard(id, { mode, accuracy }) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid flashcard ID');
    const card = await Flashcard.findById(id);
    if (!card) throw new Error('Flashcard not found');

    const now = new Date();

    // Only BRAIN mastery bumps interval; early reviews still count.
    if (mode === 'BRAIN' && typeof accuracy === 'number' && accuracy >= 90) {
        const alreadyMasteredToday = isSameUtcDay(now, card.lastMasteredAt);

        if (!alreadyMasteredToday) {
            const ladder = [1, 2, 4, 8, 16, 32, 64, 128, 256, 365];
            const currentIdx = Math.max(0, ladder.indexOf(card.spacedRepitition));
            const nextIdx = Math.min(currentIdx + 1, ladder.length - 1);
            const nextIntervalDays = ladder[nextIdx];

            const nextDue = new Date(now);
            nextDue.setDate(nextDue.getDate() + nextIntervalDays);

            card.spacedRepitition = nextIntervalDays;
            card.masteredCount = (card.masteredCount || 0) + 1;
            card.nextDueAt = nextDue;
            card.lastReviewedAt = now;
            card.lastMasteredAt = now;
        } else {
            card.lastReviewedAt = now;
        }
    } else {
        card.lastReviewedAt = now;
    }
    await card.save();
    return card;
}
  
module.exports = {
    getAllFlashcards,
    getFlashcardById,
    createFlashcard,
    deleteFlashcard,
    updateFlashcard,
    reviewFlashcard
};