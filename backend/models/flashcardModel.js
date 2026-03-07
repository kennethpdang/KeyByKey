const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CellSchema = new Schema({
	text: {
		type: String,
		default: "",
		required: true
	},
	prefilled: {
		type: Boolean,
		default: false
	}
}, { _id: false });

const TableSchema = new Schema({
	rows: {
		type: Number,
		min: 1,
		max: 7,
		required: true
	},
	cols: {
		type: Number,
		min: 1,
		max: 7,
		required: true
	},
	cells: {
		type: [[CellSchema]],
		required: true
	}
}, { _id: false });

const flashcardSchema = new Schema({
	header: {
		type: String,
		required: true
	},
	content: {
		type: String,
		default: '',
		required: function () {
			return this.type !== 'table';
		}
	},
	collection: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Collection',
		required: true,
		index: true
	},
	spacedRepetition: {
		type: Number,
		required: true,
		default: 1
	},
	masteredCount: {
		type: Number,
		default: 0
	},
	nextDueAt: {
		type: Date,
		default: null,
		index: true
	},
	lastReviewedAt: {
		type: Date,
		default: null
	},
	lastMasteredAt: {
		type: Date,
		default: null
	},
	type: {
		type: String,
		enum: ['text', 'table'],
		default: 'text'
	},
	table: { type: TableSchema, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Flashcard', flashcardSchema);