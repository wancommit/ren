const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// 1. SIGNUP LOGIC (Optimized for Modals)
router.post('/register', async (req, res, next) => {
    try {
        const { email, username, name, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username }]
        });

        if (existingUser) {
            req.flash('error', 'A user with that email or username already exists.');
            return res.redirect('back');
        }

        // Hash the password manually
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user instance
        const user = new User({
            email: email.toLowerCase(),
            username,
            name,
            password: hashedPassword
        });

        await user.save();

        // Log them in immediately after signing up
        req.login(user, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to REN, Operator.');
            res.redirect('/dashboard');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('back'); // Sends them back to the Home/current page to see the modal error
    }
});

// 2. LOGIN LOGIC
router.post('/login', passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/'
}), (req, res) => {
    const redirectUrl = req.session.returnTo || '/dashboard';
    delete req.session.returnTo; // Clean up the session
    res.redirect(redirectUrl);
});

// 3. GOOGLE OAUTH
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// router.get('/google/callback',
//     passport.authenticate('google', { failureFlash: true, failureRedirect: '/' }),
//     (req, res) => {
//         res.redirect('/dashboard');
//     }
// );

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