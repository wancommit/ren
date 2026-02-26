const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const mongoose = require ('mongoose')
const Session = require('./models/session');

const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/ren');

app.engine('ejs', engine); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Route: Root/Home page
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/sessions', async (req, res) => {
    const sessions = await Session.find({}); // Fetching from MongoDB
    res.render('sessions/index', { sessions }); // Passing 'sessions' variable to EJS
});

app.listen(3000, () => {
    console.log("Ren is running on port 3000");
})