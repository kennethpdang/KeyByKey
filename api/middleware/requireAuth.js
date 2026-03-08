const User = require('../models/userModel.js');

/**
 * Express middleware that requires an authenticated session.
 * Attaches the full user document to request.user for downstream handlers.
 * Returns 401 if the session is missing or the user no longer exists.
 */
async function requireAuth(request, response, next) {
	if (!request.session.userId) {
		return response.status(401).json({ error: 'Authentication required' });
	}

	try {
		const user = await User.findById(request.session.userId);

		if (!user) {
			request.session.destroy();
			return response.status(401).json({ error: 'User not found' });
		}

		request.user = user;
		next();
	} catch (error) {
		console.error('Auth middleware error:', error.message);
		return response.status(500).json({ error: 'Server error' });
	}
}

module.exports = requireAuth;