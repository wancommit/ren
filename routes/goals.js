const express = require('express');
const router = express.Router();
const Goal = require('../models/goal');

// 1. GET NEW GOAL FORM
// We now pass the 'slot' via a query string (e.g., /goals/new?slot=engineer)
router.get('/new', (req, res) => {
    // Get the slot from the URL query
    const { slot } = req.query; 
    // Pass slot to the view so EJS can show identity-specific prompts
    res.render('goals/new', { slot }); 
});

// POST NEW GOAL
router.post('/', async (req, res) => {
    try {
        // We pull from req.body.goal because the form names are goal[title], goal[slot], etc.
        const { title, slot, targetMinutes } = req.body.goal; 
        
if (!slot) {
            console.error("GOAL_SAVE_ERROR: No slot provided.");
            return res.redirect('/goals/new');
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1-2 System: Prevent duplicates for the same slot in the same month
        const existingGoal = await Goal.findOne({ slot, month: currentMonth, year: currentYear });

        if (existingGoal) {
            return res.redirect('/dashboard'); 
        }

        const goal = new Goal({
            title,
            slot,
            targetMinutes: parseInt(targetMinutes),
            month: currentMonth,
            year: currentYear
        });

        await goal.save();
        res.redirect('/dashboard');
    } catch (e) {
        console.error("GOAL SAVE ERROR:", e.message);
        res.redirect('/goals/new');
    }
});

module.exports = router;