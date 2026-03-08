/**
 * One-time migration script. Run from the backend folder:
 *   node migrate.js
 *
 * This script:
 * 1. Renames collectionName → collectionRef on flashcards
 * 2. Renames spacedRepitition → spacedRepetition on flashcards
 * 3. Removes the flashcards[] array from collections
 * 4. Drops the old unique index on collection title (now compound with user)
 *
 * After running this, log into the app with Google. Then run:
 *   node assign-user.js
 * to assign your existing data to your account.
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function migrate() {
	await mongoose.connect(process.env.MongoDB_URL);
	console.log('Connected to database.');

	const database = mongoose.connection.db;

	// Step 1: Rename fields on flashcards
	const flashcardResult = await database.collection('flashcards').updateMany(
		{},
		{
			$rename: {
				"collectionName": "collectionRef",
				"spacedRepitition": "spacedRepetition"
			}
		}
	);
	console.log(`Flashcards updated: ${flashcardResult.modifiedCount}`);

	// Step 2: Remove flashcards array from collections
	const collectionResult = await database.collection('collections').updateMany(
		{},
		{
			$unset: { flashcards: "" }
		}
	);
	console.log(`Collections updated: ${collectionResult.modifiedCount}`);

	// Step 3: Drop the old unique index on title (it's now a compound index with user)
	try {
		await database.collection('collections').dropIndex('title_1');
		console.log('Dropped old unique title index.');
	} catch (error) {
		console.log('No old title index to drop (may already be removed).');
	}

	await mongoose.disconnect();
	console.log('Migration complete.');
}

migrate().catch(console.error);