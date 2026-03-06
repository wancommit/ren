const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const Goal = require('../models/goal');
const ensureAuth = require('../utils/ensureAuth');

/**
 * 1. ACTIVITY LOG (History) - Add ensureAuth
 */
router.get('/', ensureAuth, async (req, res) => {
    try {
        const activeFilter = req.query.slot || null;
        // IMPORTANT: Filter by req.user._id so they only see THEIR history
        const filter = activeFilter ? { slot: activeFilter, user: req.user._id } : { user: req.user._id };
        
        const sessions = await Session.find(filter)
            .populate('goal')
            .sort({ date: -1 });

        res.render('sessions/index', { sessions, activeFilter });
    } catch (e) {
        res.redirect('/dashboard');
    }
});


/**
 * 2. SELECT SLOT - Add ensureAuth
 */
router.get('/new/select', ensureAuth, (req, res) => {
    res.render('sessions/select');
});


/**
 * 2. INITIALIZE LOG FORM
 */
router.get('/new', async (req, res) => {
    try {
        const { slot } = req.query;
        const goal = await Goal.findOne({ slot: slot });

        if (!goal) {
            return res.redirect(`/goals/new?slot=${slot}`);
        }

        res.render('sessions/new', { goal, slot });
    } catch (e) {
        console.error("FORM_RENDER_ERROR:", e);
        res.redirect('/dashboard');
    }
});

// GET route for the Edit page (You'll need this to render your edit.ejs)
router.get('/:id/edit', async (req, res) => {
    const session = await Session.findById(req.params.id);
    res.render('sessions/edit', { session });
});

/**
 * 3. EXECUTE LOG (Create) - FIXED
 */
router.post('/', ensureAuth, async (req, res) => {
    try {
        const { goalId, title, duration, description, slot } = req.body.session;
        const minutes = parseInt(duration);

        const session = new Session({
            goal: goalId,
            user: req.user._id, // <--- CRITICAL: Attach the logged-in user ID
            title,
            duration: minutes,
            description,
            slot,
            date: new Date()
        });
        
        await session.save();

        // Update the Goal's total minutes
        const goal = await Goal.findById(goalId);
        if (goal) {
            goal.currentMinutes += minutes;
            await goal.save();
        }

        res.redirect('/dashboard');
    } catch (e) {
        // Detailed logging to catch validation errors
        console.error("SESSION_SAVE_ERROR:", e.message);
        res.redirect('/dashboard');
    }
});

/** 
* 4. MODIFY LOG (Update) - ADDED PROTECTION
 */
router.put('/:id', ensureAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { duration, title, description } = req.body.session;
        const newMinutes = parseInt(duration);

        // Verify ownership: Find session and ensure it belongs to this user
        const oldSession = await Session.findOne({ _id: id, user: req.user._id });
        if (!oldSession) return res.redirect('/sessions');

        const diff = newMinutes - oldSession.duration;

        // Update session
        oldSession.title = title;
        oldSession.description = description;
        oldSession.duration = newMinutes;
        await oldSession.save();

        if (oldSession.goal) {
            await Goal.findByIdAndUpdate(oldSession.goal, {
                $inc: { currentMinutes: diff }
            });
        }

        res.redirect('/sessions');
    } catch (e) {
        console.error("UPDATE_ERROR:", e);
        res.redirect('/sessions');
    }
});

/**
 * 5. PURGE LOG (Delete) - ADDED PROTECTION
 */
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure user owns the session before deleting
        const session = await Session.findOneAndDelete({ _id: id, user: req.user._id });
        
        if (!session) return res.redirect('/sessions');

        if (session.goal) {
            await Goal.findByIdAndUpdate(session.goal, {
                $inc: { currentMinutes: -session.duration }
            });
        }

        res.redirect('/sessions');
    } catch (e) {
        console.error("DELETE_ERROR:", e);
        res.redirect('/sessions');
    }
});

module.exports = router;