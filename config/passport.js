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
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const callbackURL = process.env.NODE_ENV === 'production'
            ? 'https://ren-production.up.railway.app/auth/google/callback'
            : 'http://localhost:4000/auth/google/callback';

        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL
        },
        async (accessToken, refreshToken, profile, done) => {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = await User.findOne({ email: profile.emails[0].value });
                if (user) {
                    user.googleId = profile.id;
                    await user.save();
                } else {
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id
                    });
                }
            }
            return done(null, user);
        }));
    } else {
        console.warn('[PASSPORT] Google OAuth not configured — GOOGLE_CLIENT_ID missing');
    }

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        const user = await User.findById(id);
        done(null, user);
    });
};