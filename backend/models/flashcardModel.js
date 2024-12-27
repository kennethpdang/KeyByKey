const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const flashcardSchema = new Schema({
    header: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Flashcard', flashcardSchema);