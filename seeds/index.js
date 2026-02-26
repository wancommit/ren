const mongoose = require('mongoose');
const Session = require('../models/session')

// Connect → Clear → Create → Close.

// Initialize MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/ren')
    .then(() => console.log("Database connected"))
    .catch(err => console.error("Connection error:", err));


const seedDB = async () =>{
    // Delete everything in the database
    await Session.deleteMany({});

   // Create 5 random sessions
    for (let i = 0; i < 5; i++) {
        const sampleSession = new Session({
            title: `Session Number ${i + 1}`,
            category: 'Coding', 
            duration: Math.floor(Math.random() * 60) + 15, // Random 15-75 mins
            description: 'Automated seed data for testing the Ren tracker.'
        });
        
        await sampleSession.save();
    }
    console.log("Database seeded successfully!");

}

// Run function then close the connection
seedDB().then(() => {
    mongoose.connection.close();
})