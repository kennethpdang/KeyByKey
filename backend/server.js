require('dotenv').config({ path: '../.env' });

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

// Import Routes
const authRoutes = require('./routes/auth.js');
const collectionRoutes = require('./routes/collections.js');
const flashcardRoutes = require('./routes/flashcards.js');

// Import Middleware
const requireAuth = require('./middleware/requireAuth.js');

// Create express app
const app = express();

// ========================= MIDDLEWARE =========================

app.use(express.json());
app.use(morgan(':method :url :status'));
app.use(cors({
	origin: 'http://localhost:3000',
	credentials: true
}));

// Session configuration — stores sessions in MongoDB so they persist across restarts.
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	store: MongoStore.create({
		mongoUrl: process.env.MongoDB_URL,
		collectionName: 'sessions',
		ttl: 7 * 24 * 60 * 60 // Sessions expire after 7 days
	}),
	cookie: {
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
		httpOnly: true,
		secure: false, // Set to true in production with HTTPS
		sameSite: 'lax'
	}
}));

// ========================= ROUTES =========================

// Auth routes are public (no auth middleware).
app.use('/api/auth', authRoutes);

// Collection and flashcard routes require authentication.
app.use('/api/collections', requireAuth, collectionRoutes);
app.use('/api/flashcards', requireAuth, flashcardRoutes);

// ========================= DATABASE & SERVER =========================

mongoose.connect(process.env.MongoDB_URL)
	.then(() => {
		console.log('Connected to the database.');

		app.listen(process.env.PORT, () => {
			console.log(`Listening to requests on port ${process.env.PORT}`);
		});
	})
	.catch((error) => console.log(error));