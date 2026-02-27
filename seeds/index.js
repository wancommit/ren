const mongoose = require('mongoose');
const Session = require('../models/session'); 
const Goal = require('../models/goal');

mongoose.connect('mongodb://127.0.0.1:27017/ren')
    .then(() => console.log("CONNECTED TO REN_DATABASE_CORE"))
    .catch(err => console.error("CONNECTION_ERROR:", err));

const seedDB = async () => {
    // 1. TOTAL_PURGE - This is the only part that runs now
    await Session.deleteMany({});
    await Goal.deleteMany({});
    console.log(">>> [REDACTED]: ALL_SYSTEM_DATA_PERMANENTLY_PURGED");

    /* ==========================================================
       THE CODE BELOW IS DEACTIVATED TO ENSURE A TOTAL WIPE
       ==========================================================

    // 2. INITIALIZE_STANDARDS (Goals)
    const goalData = [
        { title: 'Deep Work Protocol', slot: 'engineer', targetMinutes: 1000 },
        { title: 'Physical Optimization', slot: 'athlete', targetMinutes: 800 },
        { title: 'Cognitive Expansion', slot: 'thinker', targetMinutes: 600 }
    ];

    const createdGoals = [];
    for (let data of goalData) {
        const goal = new Goal({
            ...data,
            currentMinutes: 0, 
            dateCreated: new Date()
        });
        await goal.save();
        createdGoals.push(goal);
    }

    // 3. LOG_INITIAL_DATA
    for (let goal of createdGoals) {
        const duration = Math.floor(Math.random() * 60) + 30; 
        
        const session = new Session({
            goal: goal._id, 
            title: `System_Initial_Boot: ${goal.slot}`,
            duration: duration,
            slot: goal.slot,
            description: 'Automated seed entry for system calibration.',
            date: new Date()
        });
        
        await session.save();

        goal.currentMinutes += duration;
        await goal.save();
    }

    console.log(">>> REN_OS: SEEDS_PLANTED_SUCCESSFULLY");
    ========================================================== */
};

seedDB().then(() => {
    console.log(">>> SYSTEM_STATUS: CLEAN_SLATE_ACHIEVED");
    mongoose.connection.close();
});