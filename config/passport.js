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
                if (!user) return done(null, false, { message: 'ID_NOT_FOUND' });
                
                if (!user.password) return done(null, false, { message: 'USE_GOOGLE_AUTH' });

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return done(null, false, { message: 'ACCESS_DENIED_INVALID_KEY' });
                
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    // --- GOOGLE STRATEGY ---
    // Industrial Guard: Fail loudly in development so you know why it's broken
    const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_ID || !GOOGLE_SECRET) {
        console.error(' [!] CRITICAL_AUTH_FAILURE: Google Credentials Missing.');
    } else {
        passport.use(new GoogleStrategy({
            clientID: GOOGLE_ID,
            clientSecret: GOOGLE_SECRET,
            callbackURL: '/auth/google/callback',
            proxy: true 
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check by Google ID
                let user = await User.findOne({ googleId: profile.id });
                if (user) return done(null, user);

                // 2. Check by Email (Account Linking)
                const userEmail = profile.emails[0].value;
                user = await User.findOne({ email: userEmail });

                if (user) {
                    user.googleId = profile.id;
                    await user.save();
                    return done(null, user);
                }

                // Ensure 'username' matches your schema requirements
                const generatedUsername = profile.displayName.replace(/\s+/g, '_').toLowerCase() + Math.floor(1000 + Math.random() * 9000);
                const generatedName = profile.name && profile.name.givenName ? profile.name.givenName : profile.displayName;
                
                user = await User.create({
                    username: generatedUsername, 
                    email: userEmail,
                    name: generatedName,
                    googleId: profile.id
                    // Note: No password field created for Google users
                });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }));
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