const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const Goal = require('../models/goal');

/**
 * 1. ACTIVITY LOG (History)
 */
router.get('/', async (req, res) => {
    try {
        const activeFilter = req.query.slot || null;
        const filter = activeFilter ? { slot: activeFilter } : {};
        const sessions = await Session.find(filter)
            .populate('goal')
            .sort({ date: -1 });

        res.render('sessions/index', { sessions, activeFilter });
    } catch (e) {
        console.error("SESSION_FETCH_ERROR:", e.message);
        res.redirect('/dashboard');
    }
});

router.get('/new/select', (req, res) => {
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
 * 3. EXECUTE LOG (Create)
 */
router.post('/', async (req, res) => {
    try {
        const { goalId, title, duration, description, slot } = req.body.session;
        const minutes = parseInt(duration);

        const session = new Session({
            goal: goalId,
            title,
            duration: minutes,
            description,
            slot,
            date: new Date()
        });
        await session.save();

        const goal = await Goal.findById(goalId);
        if (goal) {
            goal.currentMinutes += minutes;
            await goal.save();
        }

        res.redirect('/dashboard');
    } catch (e) {
        console.error("SESSION_SAVE_ERROR:", e.message);
        res.redirect('/dashboard');
    }
});

/**
 * 4. MODIFY LOG (Update with Math Balance)
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { duration, title, description } = req.body.session;
        const newMinutes = parseInt(duration);

        // 1. Find existing session to get the old duration
        const oldSession = await Session.findById(id);
        if (!oldSession) return res.redirect('/sessions');

        // 2. Calculate the difference (New - Old)
        const diff = newMinutes - oldSession.duration;

        // 3. Update the session record
        await Session.findByIdAndUpdate(id, {
            title,
            description,
            duration: newMinutes
        });

        // 4. Adjust the Goal's total minutes by the difference
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
 * 5. PURGE LOG (Delete with Rollback)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the session to know how many minutes to subtract
        const session = await Session.findById(id);
        if (!session) return res.redirect('/sessions');

        // 2. Rollback the minutes on the associated Goal
        if (session.goal) {
            await Goal.findByIdAndUpdate(session.goal, {
                $inc: { currentMinutes: -session.duration }
            });
        }

        // 3. Delete the session
        await Session.findByIdAndDelete(id);
        res.redirect('/sessions');
    } catch (e) {
        console.error("DELETE_ERROR:", e);
        res.redirect('/sessions');
    }
});

module.exports = router;