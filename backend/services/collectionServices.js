const mongoose = require('mongoose');
const Flashcard = require('../models/flashcardModel.js');
const Collection = require('../models/collectionModel.js');

/**
* Validates that a given ID is a valid MongoDB ObjectId.
* @param {string} id
* @param {string} label - Human-readable label for error messages (e.g. "collection").
*/
function validateObjectId(id, label) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new Error(`Invalid ${label} ID`);
	}
}

/**
 * Finds a collection by ID or throws a descriptive error.
 * @param {string} id
 * @returns {Promise<Object>} The found collection document.
 */
async function findCollectionOrThrow(id) {
	const collection = await Collection.findById(id);

	if (!collection) {
		throw new Error('No such collection!');
	}

	return collection;
}

async function getAllCollections() {
	return await Collection.find({}).sort({ createdAt: -1 });
}

/**
* @param {string} id
*/
async function getCollectionById(id) {
	validateObjectId(id, 'collection');
	return await findCollectionOrThrow(id);
}

/**
* @param {object} data - The request body containing title, description.
*/
async function createCollection(data) {
	const { title, description } = data;

	const collection = await Collection.create({
		title,
		description
	});

	return collection;
}

/**
* Deletes a collection by ID and cascade-deletes all associated flashcards.
* @param {string} id
*/
async function deleteCollection(id) {
	validateObjectId(id, 'collection');

	const collection = await Collection.findOneAndDelete({ _id: id });

	if (!collection) {
		throw new Error('No such collection!');
	}

	await Flashcard.deleteMany({ collection: id });

	return collection;
}

/**
* Updates only the allowed fields (title, description) on a collection.
* @param {string} id
* @param {object} data
*/
async function updateCollection(id, data) {
	validateObjectId(id, 'collection');

	const allowedUpdates = {};

	if (data.title !== undefined) {
		allowedUpdates.title = data.title;
	}

	if (data.description !== undefined) {
		allowedUpdates.description = data.description;
	}

	const collection = await Collection.findOneAndUpdate(
		{ _id: id },
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