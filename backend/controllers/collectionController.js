const Collection = require('../models/collectionModel.js');
const mongoose = require('mongoose');

const getCollections = async (request, response) => {
    const collections = await Collection.find({}).sort({createdAt: -1});
    response.status(200).json(collections);
};

const getCollection = async (request, response) => {
    const { id } = request.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({error: "No such collection!"});
    }

    const collection = await Collection.findById(id);

    if(!collection) {
        return response.status(404).json({error: "No such collection!"});
    }

    response.status(200).json(collection);
};

const createCollection = async (request, response) => {
    const { title, description } = request.body;

    try {
        const collection = await Collection.create({ title, description, flashcards: [] });
        response.status(200).json(collection);
    } catch (error) {
        response.status(400).json({ error: error.message })
    }
};

module.exports = {
    getCollections,
    getCollection,
    createCollection
};