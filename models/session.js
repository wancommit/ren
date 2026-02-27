const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SessionSchema = new Schema({
    // THE LINK: Connects to the Monthly Big Rock
    goal: {
        type: Schema.Types.ObjectId,
        ref: 'Goal',
        required: [true, 'Session must be linked to an active Goal']
    },
    // THE SLOT: Redundant but critical for high-speed filtering in History
    slot: {
        type: String,
        required: true,
        enum: ['engineer', 'athlete', 'thinker']
    },
    title: {
        type: String,
        required: [true, 'What did you achieve?'],
        trim: true
    },
    duration: {
        type: Number,
        min: [1, 'Minimum duration is 1 minute'],
        required: true 
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now,
        // Ensures you can't log sessions in the future
        max: [Date.now, 'Cannot log work for the future']
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// VIRTUAL XP: 1 min = 10 XP
SessionSchema.virtual('xpEarned').get(function() {
    return this.duration * 10;
});

module.exports = mongoose.model('Session', SessionSchema);