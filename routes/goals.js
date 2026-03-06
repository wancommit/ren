const express = require('express');
const router = express.Router();
const Goal = require('../models/goal');
const ensureAuth = require('../utils/ensureAuth');

// GLOBAL LOCK: No one gets past this point without an ID
router.use(ensureAuth);

/**
 * 1. GET NEW GOAL FORM
 */
router.get('/new', (req, res) => {
    const { slot } = req.query; 
    const validSlots = ['engineer', 'athlete', 'thinker'];
    
    if (!validSlots.includes(slot)) {
        return res.redirect('/dashboard');
    }
    res.render('goals/new', { slot });
});

/**
 * 2. POST NEW GOAL
 */
router.post('/', async (req, res) => {
    try {
        const { title, slot, targetMinutes, description } = req.body.goal; 
        const validSlots = ['engineer', 'athlete', 'thinker'];

        // 1. Rigorous Validation
        if (!validSlots.includes(slot)) {
            req.flash('error', 'Invalid parameter slot.');
            return res.redirect('/dashboard');
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 2. Prevent Duplicate Objectives (The "One Slot per Month" Rule)
        const existingGoal = await Goal.findOne({ 
            user: req.user._id, 
            slot, 
            month: currentMonth, 
            year: currentYear 
        });

        if (existingGoal) {
            req.flash('info', `Objective for [${slot.toUpperCase()}] already initialized for this cycle.`);
            return res.redirect('/dashboard'); 
        }

        // 3. Construct the Manifest
        const goal = new Goal({
            user: req.user._id,
            title: title.toUpperCase(), // Keeping the Industrial aesthetic
            description,
            slot,
            targetMinutes: parseInt(targetMinutes),
            currentMinutes: 0, // Ensure starting at zero
            month: currentMonth,
            year: currentYear
        });

        await goal.save();
        req.flash('success', `Objective [${slot.toUpperCase()}] initialized.`);
        res.redirect('/dashboard');
        
    } catch (e) {
        console.error("GOAL_SAVE_ERROR:", e.message);
        req.flash('error', 'Failed to initialize objective.');
        res.redirect('/goals/new');
    }
});

module.exports = router;