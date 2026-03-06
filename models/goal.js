const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    // THE OWNER (Required for multi-user apps)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // THE 1-2 SYSTEM SLOTS
    slot: { 
        type: String, 
        enum: ['engineer', 'athlete', 'thinker'], 
        required: true 
    },
    
    // MISSION OBJECTIVE
    title: { 
        type: String, 
        required: true,
        trim: true 
    },

    // MISSION PARAMETERS
    description: {
        type: String,
        trim: true
    },

    // TOTAL TIME COMMITMENT
    targetMinutes: { 
        type: Number, 
        required: true,
        min: [1, 'Target must be at least 1 minute']
    },

    // PROGRESS ACCUMULATION
    // We update this via $inc whenever a session is logged/deleted
    currentMinutes: {
        type: Number,
        default: 0
    },

    // TIME-STAMPING DATA
    month: { 
        type: Number, 
        default: () => new Date().getMonth() 
    },
    year: { 
        type: Number, 
        default: () => new Date().getFullYear() 
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// VIRTUAL: Calculate % complete on the fly
goalSchema.virtual('progressPercent').get(function() {
    return Math.round((this.currentMinutes / this.targetMinutes) * 100);
});

// RECTIFIED INDEXING: 
// Now User A and User B can both have an 'engineer' goal in the same month.
goalSchema.index({ user: 1, slot: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Goal', goalSchema);