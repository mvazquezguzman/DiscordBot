const { inactiveDB } = require('../models/inactivitySchema');
const { blackListDB } = require('../models/blacklistSchema');
const { getChalk } = require('../utility/utils');

async function removeUserFromDatabases(userId, username = 'Unknown') {
    const chalk = getChalk();
    const userIdString = userId.toString();
    
    try {
        // Remove from inactive users database
        const inactiveResult = await inactiveDB.deleteOne({ userId: userIdString });
        if (inactiveResult.deletedCount > 0) {
            console.log(chalk.green(`Removed purged user ${username} (${userIdString}) from inactive database`));
        }

        // Remove from blacklist
        const blacklistResult = await blackListDB.updateOne(
            {},
            { $pull: { blackListedUsers: { userId: userIdString } } }
        );
        if (blacklistResult.modifiedCount > 0) {
            console.log(chalk.green(`Removed purged user ${username} (${userIdString}) from blacklist`));
        }

        return {
            success: true,
            inactiveRemoved: inactiveResult.deletedCount > 0,
            blacklistRemoved: blacklistResult.modifiedCount > 0
        };
    } catch (error) {
        console.error(chalk.red(`Error removing user ${username} (${userIdString}) from databases:`, error));
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    removeUserFromDatabases
};
