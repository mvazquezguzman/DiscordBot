const mongoose = require('mongoose');
const UserActivity = require('../models/userActivitySchema');

async function cleanUpDatabase() {
    try {
        await UserActivity.updateMany({}, {
            $unset: { lastReaction: 1 } // Removes lastReaction field
        });

        console.log('✅ Successfully removed irrelevant data from the database!');
    } catch (error) {
        console.error('❌ Error cleaning up database:', error);
    }
}

// Run cleanup function when executing this script
cleanUpDatabase();
