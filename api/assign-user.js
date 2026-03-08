/**
 * Run this AFTER your first Google login to assign all existing
 * collections and flashcards to your user account.
 *
 * Usage:
 *   node assign-user.js your-email@gmail.com
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function assignUser() {
	const email = process.argv[2];

	if (!email) {
		console.error('Usage: node assign-user.js your-email@gmail.com');
		process.exit(1);
	}

	await mongoose.connect(process.env.MongoDB_URL);
	console.log('Connected to database.');

	const database = mongoose.connection.db;

	// Find the user by email
	const user = await database.collection('users').findOne({ email });

	if (!user) {
		console.error(`No user found with email: ${email}`);
		console.error('Make sure you have logged in with Google at least once first.');
		await mongoose.disconnect();
		process.exit(1);
	}

	console.log(`Found user: ${user.name} (${user.email})`);

	// Assign all unowned collections to this user
	const collectionResult = await database.collection('collections').updateMany(
		{ user: { $exists: false } },
		{ $set: { user: user._id } }
	);
	console.log(`Collections assigned: ${collectionResult.modifiedCount}`);

	// Assign all unowned flashcards to this user
	const flashcardResult = await database.collection('flashcards').updateMany(
		{ user: { $exists: false } },
		{ $set: { user: user._id } }
	);
	console.log(`Flashcards assigned: ${flashcardResult.modifiedCount}`);

	await mongoose.disconnect();
	console.log('Done. All existing data is now linked to your account.');
}

assignUser().catch(console.error);