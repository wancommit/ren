const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SessionSchema = new Schema({
    // THE OWNER: Essential for multi-user security
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Session must belong to a user']
    },
    // THE LINK: Connects to the Monthly Big Rock
    goal: {
        type: Schema.Types.ObjectId,
        ref: 'Goal',
        required: [true, 'Session must be linked to an active Goal']
    },
    // THE SLOT: For high-speed filtering
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