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
    collectionName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        required: true
    },
    spacedRepitition: {
        type: Number,
        required: true,
        enum: [1, 2, 4, 8, 16, 32, 64, 128, 256, 365],
        default: 1
    },
    masteredCount: {
        type: Number,
        default: 0 
    },
    nextDueAt: {
        type: Date,
        default: null
    },
    lastReviewedAt: {
        type: Date,
        default: null
    },
    lastMasteredAt: {
        type: Date,
        default: null
    },
}, { timestamps: true });

module.exports = mongoose.model('Flashcard', flashcardSchema);