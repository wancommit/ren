module.exports = (req, res, next) => {
    // Passport.js provides the .isAuthenticated() method
    if (req.isAuthenticated()) {
        return next(); // They are logged in, let them through
    }
    
    // They are NOT logged in
    req.session.returnTo = req.originalUrl; // Remember where they wanted to go
    req.flash('error', 'Authentication required.');
    res.redirect('/'); // Send them to the home page to login
};