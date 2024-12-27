const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const collectionSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 750
    },
    flashcards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flashcard'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);