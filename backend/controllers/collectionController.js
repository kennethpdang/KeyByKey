const collectionService = require('../services/collectionService');

const getCollections = async (request, response) => {
    try {
        const collections = await collectionService.getAllCollections();
        return response.status(200).json(collections);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
};

const getCollection = async (request, response) => {
    const { id } = request.params;

    try {
        const collection = await collectionService.getCollectionById(id);
        return response.status(200).json(collection);
    } catch (error) {
        if (error.message.includes('Invalid collection ID')) {
            return response.status(400).json({ error: error.message });
        }
        return response.status(404).json({ error: error.message });
    }
};

const createCollection = async (request, response) => {
    try {
        const collection = await collectionService.createCollection(request.body);
        return response.status(200).json(collection);
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
};

const deleteCollection = async (request, response) => {
    const { id } = request.params;

    try {
        const collection = await collectionService.deleteCollection(id);
        return response.status(200).json(collection);
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
};

const updateCollection = async (request, response) => {
    const { id } = request.params;

    try {
        const updatedCollection = await collectionService.updateCollection(id, request.body);
        return response.status(200).json(updatedCollection);
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
};

module.exports = {
    getCollections,
    getCollection,
    createCollection,
    deleteCollection,
    updateCollection
};