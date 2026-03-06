const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // For display in the Navbar (e.g., IDENT_USER_01)
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    // The "human" name
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true, // Prevents "User@me.com" and "user@me.com" being different accounts
        trim: true 
    },
    // Optional because Google OAuth users won't have one
    password: { 
        type: String 
    },         
    // Required for your Google Strategy to find existing users
    googleId: { 
        type: String,
        sparse: true // Allows multiple null values for people who don't use Google
    },
    // Useful for game-themed UI (e.g., "MEMBER SINCE: 2026")
    avatar: {
        type: String,
        default: '/images/default-avatar.png' 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);