const express = require('express');
const app = express();

// Routes
app.get('/', (request, response) => {
    response.json({mssg: "Welcome to the app."})
});

app.listen(4000, () => {
    console.log("Listening on port 4000.");
});