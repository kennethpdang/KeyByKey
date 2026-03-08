const mongoose = require('mongoose');
const Flashcard = require('../models/flashcardModel.js');
const Collection = require('../models/collectionModel.js');

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
 * Finds a collection owned by the given user, or throws a descriptive error.
 * @param {string} collectionId
 * @param {string} userId
 * @returns {Promise<Object>} The found collection document.
 */
async function findUserCollectionOrThrow(collectionId, userId) {
	const collection = await Collection.findOne({ _id: collectionId, user: userId });

	if (!collection) {
		throw new Error('No such collection!');
	}

	return collection;
}

// ========================= SERVICE FUNCTIONS =========================

/**
 * Returns all collections belonging to a specific user.
 * @param {string} userId
 */
async function getAllCollections(userId) {
	return await Collection.find({ user: userId }).sort({ createdAt: -1 });
}

/**
 * @param {string} collectionId
 * @param {string} userId
 */
async function getCollectionById(collectionId, userId) {
	validateObjectId(collectionId, 'collection');
	return await findUserCollectionOrThrow(collectionId, userId);
}

/**
 * @param {object} data - The request body containing title, description.
 * @param {string} userId
 */
async function createCollection(data, userId) {
	const { title, description } = data;

	const collection = await Collection.create({
		title,
		description,
		user: userId
	});

	return collection;
}

/**
 * Deletes a collection owned by the user and cascade-deletes all associated flashcards.
 * @param {string} collectionId
 * @param {string} userId
 */
async function deleteCollection(collectionId, userId) {
	validateObjectId(collectionId, 'collection');

	const collection = await Collection.findOneAndDelete({ _id: collectionId, user: userId });

	if (!collection) {
		throw new Error('No such collection!');
	}

	await Flashcard.deleteMany({ collectionRef: collectionId, user: userId });

	return collection;
}

/**
 * Updates only the allowed fields (title, description) on a user's collection.
 * @param {string} collectionId
 * @param {object} data
 * @param {string} userId
 */
async function updateCollection(collectionId, data, userId) {
	validateObjectId(collectionId, 'collection');

	const allowedUpdates = {};

	if (data.title !== undefined) {
		allowedUpdates.title = data.title;
	}

	if (data.description !== undefined) {
		allowedUpdates.description = data.description;
	}

	const collection = await Collection.findOneAndUpdate(
		{ _id: collectionId, user: userId },
		allowedUpdates,
		{ new: true, runValidators: true }
	);

	if (!collection) {
		throw new Error('No such collection!');
	}

	return collection;
}

module.exports = {
	getAllCollections,
	getCollectionById,
	createCollection,
	deleteCollection,
	updateCollection
};