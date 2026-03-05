const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// 1. SIGNUP LOGIC (Optimized for Modals)
router.post('/register', async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        // Create user instance (passport-local-mongoose handles hashing password)
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        
        // Log them in immediately after signing up
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to REN, Operator.');
            res.redirect('/dashboard');
        });
    } catch (e) {
        // If username/email exists, Passport throws an error
        req.flash('error', e.message);
        res.redirect('back'); // Sends them back to the Home/current page to see the modal error
    }
});

// 2. LOGIN LOGIC
router.post('/login', passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: 'back' // Stays on the home page so the user can try the modal again
}), (req, res) => {
    req.flash('success', 'Identity Verified. Access Granted.');
    res.redirect('/dashboard');
});

// 3. GOOGLE OAUTH
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
    passport.authenticate('google', { failureFlash: true, failureRedirect: '/' }), 
    (req, res) => {
        res.redirect('/dashboard');
    }
);

// 4. LOGOUT
router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', 'System Session Terminated.');
        res.redirect('/');
    });
});

// 5. REDIRECTS (Since we deleted login.ejs and register.ejs)
router.get('/login', (req, res) => res.redirect('/'));
router.get('/register', (req, res) => res.redirect('/'));

module.exports = router;