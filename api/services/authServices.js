const User = require('../models/userModel.js');

/**
 * Verifies a Google access token by calling Google's userinfo endpoint.
 * This is secure because only a valid access token will return profile data.
 * @param {string} accessToken - The access token from Google's OAuth flow.
 * @returns {Promise<Object>} The verified profile data.
 */
async function verifyGoogleAccessToken(accessToken) {
	const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!response.ok) {
		throw new Error('Invalid Google access token');
	}

	const payload = await response.json();

	if (!payload.sub || !payload.email) {
		throw new Error('Incomplete profile data from Google');
	}

	return {
		googleId: payload.sub,
		email: payload.email,
		name: payload.name,
		picture: payload.picture
	};
}

/**
 * Finds an existing user by Google ID, or creates a new one if they don't exist.
 * If the user exists, updates their name, email, and picture in case they changed.
 * @param {Object} profileData
 * @returns {Promise<Object>} The user document.
 */
async function findOrCreateUser(profileData) {
	const { googleId, email, name, picture } = profileData;

	const existingUser = await User.findOne({ googleId });

	if (existingUser) {
		existingUser.email = email;
		existingUser.name = name;
		existingUser.picture = picture;
		await existingUser.save();
		return existingUser;
	}

	const newUser = await User.create({
		googleId,
		email,
		name,
		picture
	});

	return newUser;
}

/**
 * Returns a safe, public-facing representation of a user document.
 * Strips internal fields like googleId and __v.
 * @param {Object} user - The Mongoose user document.
 * @returns {Object} The sanitized user object.
 */
function sanitizeUser(user) {
	return {
		id: user._id,
		email: user.email,
		name: user.name,
		picture: user.picture
	};
}

module.exports = {
	verifyGoogleAccessToken,
	findOrCreateUser,
	sanitizeUser
};