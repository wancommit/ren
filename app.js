require('dotenv').config();
const express = require('express');
const engine = require('ejs-mate');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const ensureAuth = require('./utils/ensureAuth');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');

// 1. MODELS & ROUTES
const Session = require('./models/session');
const Goal = require('./models/goal');
const sessionRoutes = require('./routes/sessions');
const goalRoutes = require('./routes/goals');
const authRoutes = require('./routes/auth');

const app = express();

// 2. DATABASE CONNECTION
const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/ren';

mongoose.connect(dbUrl)
    .then(() => console.log("CORE_CONNECTED: Database online"))
    .catch(err => console.log("CORE_ERROR:", err));

// 3. ENGINE & MIDDLEWARE SETTINGS
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session config 
app.use(session({
    secret: process.env.SESSION_SECRET || 'ren-secret',
    resave: false,
    saveUninitialized: false
}));

// ADD — Passport & Flash
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
require('./config/passport')(passport);

// ADD — Make flash & user available in all views
app.use((req, res, next) => {
    // --- EMERGENCY BYPASS START ---
    // If no one is logged in, create a fake user so the app doesn't crash on 'currentUser'
    if (!req.user) {
        req.user = { _id: '65e7f0000000000000000001', username: 'STREAK_SAVER_MODE' };
    }
    // --- EMERGENCY BYPASS END ---

    res.locals.currentUser = req.user;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// 4. CORE CONTROLLERS

// Home Route
app.get('/', catchAsync(async (req, res) => {
    const dayOfMonth = new Date().getDate();
    const bgImage = `/images/daily/${dayOfMonth}.jpg`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await Session.aggregate([
        { $match: { date: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$duration' } } }
    ]);

    const minutesToday = todayStats.length > 0 ? todayStats[0].total : 0;
    const dailyGoal = 90;
    const dailyPercent = Math.min(Math.round((minutesToday / dailyGoal) * 100), 100);

    res.render('home', { dailyPercent, bgImage });
}));

// Dashboard: The Command Center
// --- ensureAuth REMOVED TEMPORARILY BELOW ---
app.get('/dashboard', async (req, res) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const [goals, sessions] = await Promise.all([
        Goal.find({ month: currentMonth, year: currentYear }),
        Session.find({
            date: {
                $gte: new Date(currentYear, currentMonth, 1),
                $lt: new Date(currentYear, currentMonth + 1, 1)
            }
        }).sort({ date: -1 })
    ]);

    // --- REFINED STREAK LOGIC ---
    const loggedDays = new Set(sessions.map(s => s.date.toDateString()));
    let streak = 0;
    let d = new Date();
    d.setHours(0, 0, 0, 0);

    while (loggedDays.has(d.toDateString())) {
        streak++;
        d.setDate(d.getDate() - 1);
    }
    if (streak === 0) {
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        while (loggedDays.has(yesterday.toDateString())) {
            streak++;
            yesterday.setDate(yesterday.getDate() - 1);
        }
    }

    const getSlotData = (slotName) => {
        const goal = goals.find(g => g.slot === slotName);
        if (!goal) return null;

        const currentMins = sessions
            .filter(s => s.slot === slotName)
            .reduce((acc, s) => acc + s.duration, 0);

        return {
            id: goal._id,
            title: goal.title,
            current: currentMins,
            target: goal.targetMinutes,
            percent: Math.min(Math.round((currentMins / goal.targetMinutes) * 100), 100)
        };
    };

    const triptych = {
        engineer: getSlotData('engineer'),
        athlete: getSlotData('athlete'),
        thinker: getSlotData('thinker')
    };

    const totalXP = sessions.reduce((acc, s) => acc + s.duration, 0) * 10;

    res.render('dashboard', { triptych, now, totalXP, streak });
});

// EXTERNAL ROUTES
app.use('/sessions', sessionRoutes);
app.use('/goals', goalRoutes);
app.use('/auth', authRoutes);

// 404 Trigger - FIXED REGEX
app.all(/('.*')/, (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    const { statusCode = 500, message = 'Something went wrong' } = err;
    res.status(statusCode).send(message)
})

// 7. START SERVER
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM_ONLINE]: Port ${PORT}`);
});