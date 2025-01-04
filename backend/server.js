require('dotenv').config({path: '../.env'}); // This is for our global environment variables.

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

// Create express app:
const app = express();

// Import Routes
// const collectionRoutes = require('./routes/collection.js');
const flashcardRoutes = require('./routes/flashcards.js');

// Logging Stuff
app.use(express.json());
app.use(morgan(':method :url :status')); // Log our requests in the terminal.

// Routes
// app.use('/api/collections', collectionRoutes);
app.use('/api/flashcards', flashcardRoutes);

// Connect to database:
mongoose.connect(process.env.MongoDB_URL)
    .then(() => {
        console.log('Connected to the database.');

        // Listen to the port:
        app.listen(process.env.PORT, () => {
            console.log(`Listening to requests on port ${process.env.PORT}`);
        });
    })
    .catch((error) => console.log(error));