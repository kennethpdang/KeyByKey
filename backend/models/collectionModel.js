const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const collectionSchema = new Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true
	},
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true,
		minlength: 10,
		maxlength: 750
	}
}, { timestamps: true });

collectionSchema.index({ user: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Collection', collectionSchema);