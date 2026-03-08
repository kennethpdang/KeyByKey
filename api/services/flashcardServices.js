const mongoose = require('mongoose');
const Flashcard = require('../models/flashcardModel.js');
const Collection = require('../models/collectionModel.js');

const REPETITION_LADDER = [1, 2, 4, 8, 16, 32, 64, 128, 256, 365];

// ========================= HELPERS =========================

/**
 * Validates that a given ID is a valid MongoDB ObjectId.
 * @param {string} id
 * @param {string} label - Human-readable label for error messages.
 */
function validateObjectId(id, label) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new Error(`Invalid ${label} ID`);
	}
}

/**
 * Finds a flashcard owned by the given user, or throws a descriptive error.
 * @param {string} flashcardId
 * @param {string} userId
 * @returns {Promise<Object>} The found flashcard document.
 */
async function findUserFlashcardOrThrow(flashcardId, userId) {
	const flashcard = await Flashcard.findOne({ _id: flashcardId, user: userId });

	if (!flashcard) {
		throw new Error('Flashcard not found');
	}

	return flashcard;
}

/**
 * Validates the structure of a table payload for table-type flashcards.
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
 * @returns {object}
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
 * @param {object} table
 * @returns {object}
 */
function buildTableCardFields(table) {
	validateTablePayload(table);

	return {
		content: '',
		table: table
	};
}

// ========================= SERVICE FUNCTIONS =========================

/**
 * Returns all flashcards belonging to a specific user.
 * @param {string} userId
 */
async function getAllFlashcards(userId) {
	return await Flashcard.find({ user: userId }).populate('collectionRef').sort({ createdAt: -1 });
}

/**
 * @param {string} flashcardId
 * @param {string} userId
 */
async function getFlashcardById(flashcardId, userId) {
	validateObjectId(flashcardId, 'flashcard');
	return await findUserFlashcardOrThrow(flashcardId, userId);
}

/**
 * Creates a new flashcard owned by the user.
 * Verifies the parent collection exists and belongs to the same user.
 * @param {Object} data
 * @param {string} userId
 */
async function createFlashcard(data, userId) {
	const {
		header,
		content = '',
		collectionRef: collectionId,
		type = 'text',
		table = null
	} = data;

	if (!header || !header.trim()) {
		throw new Error('Header is required');
	}

	if (!collectionId) {
		throw new Error('Collection ID is required');
	}

	const parentCollection = await Collection.findOne({ _id: collectionId, user: userId });

	if (!parentCollection) {
		throw new Error('Collection not found');
	}

	const typeSpecificFields = (type === 'table')
		? buildTableCardFields(table)
		: buildTextCardFields(content);

	const flashcard = await Flashcard.create({
		header: header.trim(),
		collectionRef: collectionId,
		user: userId,
		type,
		...typeSpecificFields
	});

	return await Flashcard.findById(flashcard._id).populate('collectionRef');
}

/**
 * Deletes a flashcard owned by the user.
 * @param {string} flashcardId
 * @param {string} userId
 */
async function deleteFlashcard(flashcardId, userId) {
	validateObjectId(flashcardId, 'flashcard');

	const flashcard = await Flashcard.findOneAndDelete({ _id: flashcardId, user: userId });

	if (!flashcard) {
		throw new Error('Flashcard not found');
	}

	return flashcard;
}

/**
 * Updates only the allowed fields on a user's flashcard.
 * @param {string} flashcardId
 * @param {Object} data
 * @param {string} userId
 */
async function updateFlashcard(flashcardId, data, userId) {
	validateObjectId(flashcardId, 'flashcard');

	await findUserFlashcardOrThrow(flashcardId, userId);

	const allowedUpdates = {};

	if (data.header !== undefined) {
		allowedUpdates.header = data.header;
	}

	if (data.collectionRef !== undefined) {
		validateObjectId(data.collectionRef, 'collection');

		const parentCollection = await Collection.findOne({ _id: data.collectionRef, user: userId });

		if (!parentCollection) {
			throw new Error('Target collection not found');
		}

		allowedUpdates.collectionRef = data.collectionRef;
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
		{ _id: flashcardId, user: userId },
		allowedUpdates,
		{ new: true, runValidators: true }
	);

	if (!updatedFlashcard) {
		throw new Error('Flashcard not found');
	}

	return updatedFlashcard;
}

/**
 * Processes a review attempt for a user's flashcard.
 * @param {string} flashcardId
 * @param {object} reviewData
 * @param {string} userId
 */
async function reviewFlashcard(flashcardId, { mode, accuracy }, userId) {
	validateObjectId(flashcardId, 'flashcard');

	const card = await findUserFlashcardOrThrow(flashcardId, userId);
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