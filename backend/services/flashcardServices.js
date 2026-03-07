const mongoose = require('mongoose');
const Flashcard = require('../models/flashcardModel.js');
const Collection = require('../models/collectionModel.js');

const REPETITION_LADDER = [1, 2, 4, 8, 16, 32, 64, 128, 256, 365];

/**
* Validates that a given ID is a valid MongoDB ObjectId.
* @param {string} id
* @param {string} label - Human-readable label for error messages (e.g. "flashcard").
*/
function validateObjectId(id, label) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new Error(`Invalid ${label} ID`);
	}
}

/**
* Finds a flashcard by ID or throws a descriptive error.
* @param {string} id
* @returns {Promise<Object>} The found flashcard document.
*/
async function findFlashcardOrThrow(id) {
	const flashcard = await Flashcard.findById(id);

	if (!flashcard) {
		throw new Error('Flashcard not found');
	}

	return flashcard;
}

/**
* Validates the structure of a table payload for table-type flashcards.
* Ensures rows, cols, and cells are properly sized and typed.
* @param {object} table
*/
function validateTablePayload(table) {
	if (!table) {
		throw new Error("Missing table payload");
	}

	const { rows, cols, cells } = table;

	if (!Number.isInteger(rows) || !Number.isInteger(cols)) {
		throw new Error("rows/cols must be integers");
	}

	if (rows < 1 || rows > 7 || cols < 1 || cols > 7) {
		throw new Error("rows/cols must be between 1 and 7");
	}

	if (!Array.isArray(cells) || cells.length !== rows) {
		throw new Error("cells must be a 2D array sized rows × cols");
	}

	for (let row = 0; row < rows; row++) {
		if (!Array.isArray(cells[row]) || cells[row].length !== cols) {
			throw new Error(`Row ${row} width does not match expected column count`);
		}

		for (let col = 0; col < cols; col++) {
			const cell = cells[row][col];

			if (typeof cell.text !== 'string') {
				throw new Error(`Cell [${row}][${col}]: text must be a string`);
			}

			if (typeof cell.prefilled !== 'boolean') {
				throw new Error(`Cell [${row}][${col}]: prefilled must be a boolean`);
			}
		}
	}
}

/**
* Checks whether two dates fall on the same UTC calendar day.
* @param {Date|null} firstDate
* @param {Date|null} secondDate
* @returns {boolean}
*/
function isSameUtcDay(firstDate, secondDate) {
	if (!firstDate || !secondDate) {
		return false;
	}

	return (
		firstDate.getUTCFullYear() === secondDate.getUTCFullYear() &&
		firstDate.getUTCMonth() === secondDate.getUTCMonth() &&
		firstDate.getUTCDate() === secondDate.getUTCDate()
	);
}

/**
* Builds the document fields for a text-type flashcard.
* @param {string} content
* @returns {object} Partial document with content and table fields.
*/
function buildTextCardFields(content) {
	if (!content || !content.trim()) {
		throw new Error('Content is required for text cards');
	}

	return {
		content: content,
		table: null
	};
}

/**
* Builds the document fields for a table-type flashcard.
* @param {object} table - The table payload to validate and attach.
* @returns {object} Partial document with content and table fields.
*/
function buildTableCardFields(table) {
	validateTablePayload(table);

	return {
		content: '',
		table: table
	};
}

async function getAllFlashcards() {
	return await Flashcard.find({}).populate('collection').sort({ createdAt: -1 });
}

/**
* @param {string} id - The ID of the flashcard.
*/
async function getFlashcardById(id) {
	validateObjectId(id, 'flashcard');
	return await findFlashcardOrThrow(id);
}

/**
* Creates a new flashcard and verifies the parent collection exists.
* @param {Object} data
* @param {string} data.header
* @param {string} [data.content]
* @param {string} data.collection - The parent collection's ObjectId.
* @param {string} [data.type='text']
* @param {object} [data.table=null]
*/
async function createFlashcard(data) {
	const {
		header,
		content = '',
		collection: collectionId,
		type = 'text',
		table = null
	} = data;

	if (!header || !header.trim()) {
		throw new Error('Header is required');
	}

	if (!collectionId) {
		throw new Error('Collection ID is required');
	}

	const parentCollection = await Collection.findById(collectionId);

	if (!parentCollection) {
		throw new Error('Collection not found');
	}

	const typeSpecificFields = (type === 'table')
		? buildTableCardFields(table)
		: buildTextCardFields(content);

	const flashcard = await Flashcard.create({
		header: header.trim(),
		collection: collectionId,
		type,
		...typeSpecificFields
	});

	return await Flashcard.findById(flashcard._id).populate('collection');
}

/**
* Deletes a flashcard by ID.
* @param {string} id
*/
async function deleteFlashcard(id) {
	validateObjectId(id, 'flashcard');

	const flashcard = await Flashcard.findOneAndDelete({ _id: id });

	if (!flashcard) {
		throw new Error('Flashcard not found');
	}

	return flashcard;
}

/**
* Updates only the allowed fields on a flashcard.
* Spaced repetition fields are managed exclusively through reviewFlashcard.
* @param {string} id
* @param {Object} data - The update data.
*/
async function updateFlashcard(id, data) {
	validateObjectId(id, 'flashcard');

	const existingFlashcard = await findFlashcardOrThrow(id);

	const allowedUpdates = {};

	if (data.header !== undefined) {
		allowedUpdates.header = data.header;
	}

	if (data.collection !== undefined) {
		validateObjectId(data.collection, 'collection');

		const parentCollection = await Collection.findById(data.collection);

		if (!parentCollection) {
			throw new Error('Target collection not found');
		}

		allowedUpdates.collection = data.collection;
	}

	if (data.type !== undefined) {
		allowedUpdates.type = data.type;
	}

	if (data.content !== undefined) {
		allowedUpdates.content = data.content;
	}

	if (data.table !== undefined) {
		if (data.table !== null) {
			validateTablePayload(data.table);
		}

		allowedUpdates.table = data.table;
	}

	const updatedFlashcard = await Flashcard.findOneAndUpdate(
		{ _id: id },
		allowedUpdates,
		{ new: true, runValidators: true }
	);

	if (!updatedFlashcard) {
		throw new Error('Flashcard not found');
	}

	return updatedFlashcard;
}

/**
* @param {string} id
* @param {object} reviewData
* @param {string} reviewData.mode - The review mode ("BRAIN", "READ", "SPIN").
* @param {number} reviewData.accuracy - The accuracy percentage (0–100).
*/
async function reviewFlashcard(id, { mode, accuracy }) {
	validateObjectId(id, 'flashcard');

	const card = await findFlashcardOrThrow(id);
	const now = new Date();

	const isMasteryAttempt = (
		mode === 'BRAIN' &&
		typeof accuracy === 'number' &&
		accuracy >= 90
	);

	if (!isMasteryAttempt) {
		card.lastReviewedAt = now;
		await card.save();
		return card;
	}

	const alreadyMasteredToday = isSameUtcDay(now, card.lastMasteredAt);

	if (alreadyMasteredToday) {
		card.lastReviewedAt = now;
		await card.save();
		return card;
	}

	const currentIndex = Math.max(0, REPETITION_LADDER.indexOf(card.spacedRepetition));
	const nextIndex = Math.min(currentIndex + 1, REPETITION_LADDER.length - 1);
	const nextIntervalDays = REPETITION_LADDER[nextIndex];

	const nextDueDate = new Date(now);
	nextDueDate.setDate(nextDueDate.getDate() + nextIntervalDays);

	card.spacedRepetition = nextIntervalDays;
	card.masteredCount = (card.masteredCount || 0) + 1;
	card.nextDueAt = nextDueDate;
	card.lastReviewedAt = now;
	card.lastMasteredAt = now;

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