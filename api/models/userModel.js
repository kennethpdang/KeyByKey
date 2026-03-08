const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
	googleId: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	name: {
		type: String,
		required: true
	},
	picture: {
		type: String,
		default: null
	}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);