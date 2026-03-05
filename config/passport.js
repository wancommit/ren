const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/user');

module.exports = (passport) => {

    // --- LOCAL ---
    passport.use(new LocalStrategy({ usernameField: 'email' },
        async (email, password, done) => {
            const user = await User.findOne({ email });
            if (!user) return done(null, false, { message: 'Email not registered' });
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return done(null, false, { message: 'Incorrect password' });
            return done(null, user);
        }
    ));

    // --- GOOGLE ---
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        // Check if user already exists by googleId or email
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
            // Check if they registered with email before
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // Link Google to existing account
                user.googleId = profile.id;
                await user.save();
            } else {
                // Brand new user
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id
                });
            }
        }
        return done(null, user);
    }));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        const user = await User.findById(id);
        done(null, user);
    });
};