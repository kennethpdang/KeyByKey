const express = require('express');
const {
    getCollection,
    getCollections,
    createCollection
} = require('../controllers/collectionController.js')

const router = express.Router();

router.get('/', getCollection);
router.get('/:id', getCollections);
router.post('/', createCollection);

module.exports = router;