const mongoose = require('mongoose');
const Flashcard = require('../models/flashcardModel.js');
const Collection = require('../models/collectionModel.js');

function validateTablePayload(table) {
    if (!table) throw new Error("Missing table payload");
    const { rows, cols, cells } = table;
    if (!(Number.isInteger(rows) && Number.isInteger(cols))) throw new Error("rows/cols must be integers");
    if (rows < 1 || rows > 7 || cols < 1 || cols > 7) throw new Error("rows/cols must be between 1 and 7");
    if (!Array.isArray(cells) || cells.length !== rows) throw new Error("cells must be a 2D array sized rows×cols");
    for (let r = 0; r < rows; r++) {
        if (!Array.isArray(cells[r]) || cells[r].length !== cols) throw new Error("cells row width mismatch");
        for (let c = 0; c < cols; c++) {
            const cell = cells[r][c];
            if (typeof cell.text !== 'string') throw new Error("cell.text must be a string");
            if (typeof cell.prefilled !== 'boolean') throw new Error("cell.prefilled must be a boolean");
    }
  }
}

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
    const {
        header,
        content = '',
        collectionName,
        type = 'text',
        table = null
    } = data;

    if (!header || !header.trim()) throw new Error('Header is required');
    if (!collectionName) throw new Error('collectionName is required');

    // verify collection exists before creating the card
    const collection = await Collection.findById(collectionName);
    if (!collection) throw new Error('Collection not found');

    const doc = {
        header: header.trim(),
        collectionName,
        type
    };

    if (type === 'table') {
        validateTablePayload(table);
        doc.content = '';      // not used for table cards
        doc.table = table;
    } else {
        if (!content || !content.trim()) throw new Error('Content is required for text cards');
        doc.content = content;
        doc.table = null;
    }

    const flashcard = await Flashcard.create(doc);

    collection.flashcards.push(flashcard._id);
    await collection.save();

    // return populated version for convenience
    return await Flashcard.findById(flashcard._id).populate('collectionName');
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