const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
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

    // TOTAL TIME COMMITMENT (e.g., 2000 minutes)
    targetMinutes: { 
        type: Number, 
        required: true,
        min: [1, 'Target must be at least 1 minute']
    },

    // TIME-STAMPING DATA
    // We store these as numbers for high-speed indexing
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
    // This allows us to calculate progress easily in the model later if needed
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// INDEXING: Prevents you from creating two 'engineer' goals in the same month
goalSchema.index({ slot: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Goal', goalSchema);