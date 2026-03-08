const express = require('express');
const {
	googleLogin,
	getCurrentUser,
	logout
} = require('../controllers/authController.js');

const router = express.Router();

router.post('/google', googleLogin);
router.get('/me', getCurrentUser);
router.post('/logout', logout);

module.exports = router;