const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SessionSchema = new Schema({
    title:{
        type: String,
        required:true //Prevent empty logs
    },
    category:{
        type: String,
        enum:['Coding', 'Fitness', 'Reading', 'Writing', 'Drawing', 'Meditation', 'Other'],
        required:true
    },
    duration:{
        type:Number,
        min:1 // You can't learn for 0 minutes :-)
    },
    description: String,
    date: {
        type: Date,
        defualt: Date.now // Automatically logs today's date
    }
});


module.exports = mongoose.model('Session', SessionSchema);