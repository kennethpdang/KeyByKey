const express = require('express');
const {
    getFlashcards,
    getFlashcard,
    createFlashcard,
    deleteFlashcard,
    updateFlashcard
} = require('../controllers/flashcardController.js')

const router = express.Router();

router.get('/', getFlashcards);

router.get('/:id', getFlashcard);

router.post('/', createFlashcard);

router.delete('/:id', deleteFlashcard);

router.patch('/:id', updateFlashcard);

module.exports = router;