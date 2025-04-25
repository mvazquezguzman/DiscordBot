const { blackListDB } = require('../models/blacklistSchema');
const { userMention, roleMention } = require('discord.js');

async function removeBlacklistDB(userid, userTag, roleid = null, roleName = null) {
    const userIdString = userid ? userid.toString() : null;// Ensure the user ID is a string
    const roleIdString = roleid ? roleid.toString() : null;

    const mentionedUser = userid ? userMention(userid) : null;// Get the mention for the user
    const mentionedRole = roleid ? roleMention(roleid) : null; 
    
    const doc = await blackListDB.findOne();

    // Check if the blacklist document exists
    if (!doc) {
        const resultMessage = "Blacklist does not exist.";
        console.log(resultMessage);
        return resultMessage;
    }
       
    // Handle user removal
    if (userIdString) {
        const userExists = doc.blackListedUsers.some(user => user.userId === userIdString);

        if (userExists) {
            await blackListDB.updateOne(
                {},
                { $pull: { blackListedUsers: { userId: userIdString } } }
            );
            const message = `User ${mentionedUser} has been removed from the Blacklist.`;
            console.log(message);
            return message;
        } else {
            const message = `User ${mentionedUser} is not in the Blacklist.`;
            console.log(message);
            return message;
        }
    }

    // Handle role removal
    if (roleIdString) {
        const roleExists = doc.blackListedRoles.some(role => role.roleId === roleIdString);

        if (roleExists) {
            await blackListDB.updateOne(
                {},
                { $pull: { blackListedRoles: { roleId: roleIdString } } }
            );
            const message = `Role ${mentionedRole} has been removed from the Blacklist.`;
            console.log(message);
            return message;
        } else {
            const message = `Role ${mentionedRole} is not in the Blacklist.`;
            console.log(message);
            return message;
        }
    }

    return "No user or role provided to remove from blacklist.";
}

module.exports = {
    removeBlacklistDB
};
