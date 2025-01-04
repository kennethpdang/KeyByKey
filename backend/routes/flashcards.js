const express = require('express');
const {
    getFlashcards,
    getFlashcard
} = require('../controllers/flashcardController.js')

const router = express.Router();

router.get('/', getFlashcards);

router.get('/:id', getFlashcard);

module.exports = router;