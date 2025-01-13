const mongoose = require('mongoose');
const Collection = require('../models/collectionModel');

async function getAllCollections() {
    return await Collection.find({}).sort({ createdAt: -1 });
}

/**
* @param {string} id
*/
async function getCollectionById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid collection ID');
    }

    const collection = await Collection.findById(id);
    if (!collection) {
        throw new Error('No such collection!');
    }

    return collection;
}

/**
* @param {object} data - The request body containing title, description.
*/
async function createCollection(data) {
    const { title, description } = data;

    const collection = await Collection.create({
        title,
        description,
        flashcards: [],
    });
    return collection;
}

/**
* Delete a collection by ID.
* @param {string} id
*/
async function deleteCollection(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid collection ID');
    }
    const collection = await Collection.findOneAndDelete({ _id: id });
    if (!collection) {
        throw new Error('No such collection!');
    }
    return collection;
}

/**
* @param {string} id
* @param {object} data
*/
async function updateCollection(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid collection ID');
    }

    const collection = await Collection.findOneAndUpdate(
        { _id: id },
        { ...data },
        { new: true }
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