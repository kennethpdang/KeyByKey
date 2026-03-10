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
// const requireAuth = require('./middleware/requireAuth.js');

// TEMPORARY: bypass auth — remove when OAuth is restored
const User = require('./models/userModel.js');
const requireAuth = async (request, response, next) => {
    const user = await User.findOne({ email: 'kennethpdang@gmail.com' });
    if (!user) {
        return response.status(500).json({ error: 'Temp user not found' });
    }
    request.user = user;
    next();
};

// Create express app
const app = express();
app.set('trust proxy', 1);

// ========================= MIDDLEWARE =========================

app.use(express.json());
app.use(morgan(':method :url :status'));
app.use(cors({
	origin: process.env.NODE_ENV === 'production'
		? process.env.CLIENT_URL
		: 'http://localhost:3000',
	credentials: true
}));

// Session configuration
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	store: MongoStore.create({
		mongoUrl: process.env.MongoDB_URL,
		collectionName: 'sessions',
		ttl: 7 * 24 * 60 * 60
	}),
	cookie: {
		maxAge: 7 * 24 * 60 * 60 * 1000,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax'
	}
}));

// ========================= ROUTES =========================

app.use('/api/auth', authRoutes);
app.use('/api/collections', tempAuth, collectionRoutes);
app.use('/api/flashcards', tempAuth, flashcardRoutes);
// Put back after resolved.
// app.use('/api/collections', requireAuth, collectionRoutes);
// app.use('/api/flashcards', requireAuth, flashcardRoutes);

// ========================= DATABASE & SERVER =========================

mongoose.connect(process.env.MongoDB_URL)
	.then(() => console.log('Connected to the database.'))
	.catch((error) => console.log(error));

// Export for Vercel serverless
module.exports = app;

// Only listen locally in development
if (process.env.NODE_ENV !== 'production') {
	app.listen(process.env.PORT, () => {
		console.log(`Listening to requests on port ${process.env.PORT}`);
	});
}