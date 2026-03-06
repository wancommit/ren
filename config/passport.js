const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/user');

module.exports = (passport) => {

    // --- LOCAL STRATEGY ---
    passport.use(new LocalStrategy({ usernameField: 'email' },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email: email.toLowerCase() });
                if (!user) return done(null, false, { message: 'Email not registered' });
                
                // If user registered via Google, they might not have a password
                if (!user.password) return done(null, false, { message: 'Please log in with Google' });

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return done(null, false, { message: 'Incorrect password' });
                
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    // --- GOOGLE STRATEGY ---
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback', // Relative path is safer
            proxy: true // Required for Railway/Heroku HTTPS
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check if user already has this Google ID
                let user = await User.findOne({ googleId: profile.id });
                if (user) return done(null, user);

                // 2. Check if email exists (maybe they signed up locally first)
                const userEmail = profile.emails[0].value;
                user = await User.findOne({ email: userEmail });

                if (user) {
                    user.googleId = profile.id;
                    await user.save();
                    return done(null, user);
                }

                // 3. Brand New User: Must provide 'username' to match your new Model
                user = await User.create({
                    name: profile.displayName,
                    email: userEmail,
                    googleId: profile.id,
                    // Generate a unique username (e.g., john_doe_1234)
                    username: profile.displayName.replace(/\s+/g, '_').toLowerCase() + Math.floor(1000 + Math.random() * 9000)
                });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }));
    } else {
        console.warn('[PASSPORT] Google OAuth credentials missing. Strategy disabled.');
    }

    passport.serializeUser((user, done) => done(null, user.id));
    
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};