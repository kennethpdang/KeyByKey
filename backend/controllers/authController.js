const authService = require('../services/authServices.js');

/**
 * Handles Google OAuth login.
 * Verifies the access token with Google, finds or creates the user,
 * and establishes a session.
 */
const googleLogin = async (request, response) => {
	const { accessToken } = request.body;

	if (!accessToken) {
		return response.status(400).json({ error: 'Google access token is required' });
	}

	try {
		const profileData = await authService.verifyGoogleAccessToken(accessToken);
		const user = await authService.findOrCreateUser(profileData);
		const sanitizedUser = authService.sanitizeUser(user);

		// Store the user ID in the session for subsequent requests.
		request.session.userId = user._id;

		return response.status(200).json(sanitizedUser);
	} catch (error) {
		console.error('Google login error:', error.message);
		return response.status(401).json({ error: 'Authentication failed' });
	}
};

/**
 * Returns the currently authenticated user's profile.
 * Used by the frontend to restore sessions on page reload.
 */
const getCurrentUser = async (request, response) => {
	if (!request.session.userId) {
		return response.status(401).json({ error: 'Not authenticated' });
	}

	try {
		const User = require('../models/userModel.js');
		const user = await User.findById(request.session.userId);

		if (!user) {
			request.session.destroy();
			return response.status(401).json({ error: 'User not found' });
		}

		const sanitizedUser = authService.sanitizeUser(user);
		return response.status(200).json(sanitizedUser);
	} catch (error) {
		console.error('Get current user error:', error.message);
		return response.status(500).json({ error: 'Server error' });
	}
};

/**
 * Logs the user out by destroying their session.
 */
const logout = async (request, response) => {
	request.session.destroy((error) => {
		if (error) {
			console.error('Logout error:', error.message);
			return response.status(500).json({ error: 'Failed to log out' });
		}

		response.clearCookie('connect.sid');
		return response.status(200).json({ message: 'Logged out successfully' });
	});
};

module.exports = {
	googleLogin,
	getCurrentUser,
	logout
};