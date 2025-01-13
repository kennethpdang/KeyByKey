const express = require('express');
const {
    getCollection,
    getCollections,
    createCollection,
    deleteCollection,
    updateCollection
} = require('../controllers/collectionController.js')

const router = express.Router();

router.get('/', getCollections);
router.get('/:id', getCollection);
router.post('/', createCollection);
router.delete('/:id', deleteCollection);
router.patch('/:id', updateCollection);

module.exports = router;