const { blackListDB } = require('../models/blacklistSchema');
const { userMention, roleMention } = require('discord.js');

async function removeBlacklistDB(userid, userTag = null) {
    const userIdString = userid ? userid.toString() : null;
    const mentionedUser = userid ? userMention(userid) : null;

    console.log("🧪 REMOVE USER - Input:", { userIdString, userTag });

    const doc = await blackListDB.findOne();

    if (!doc) {
        const resultMessage = "Blacklist does not exist.";
        console.log(resultMessage);
        return resultMessage;
    }

    const userExists = doc.blackListedUsers.some(user => user.userId === userIdString);

    if (userExists) {
        await blackListDB.updateOne(
            {},
            { $pull: { blackListedUsers: { userId: userIdString } } }
        );
        const message = `✅ User ${mentionedUser} has been removed from the Blacklist.`;
        console.log(message);
        return message;
    } else {
        const message = `⚠️ User ${mentionedUser} is not in the Blacklist.`;
        console.log(message);
        return message;
    }
}

async function removeBlacklistRoleDB(roleid, roleName = null) {
    const roleIdString = roleid ? roleid.toString() : null;
    const mentionedRole = roleid ? roleMention(roleid) : null;

    console.log("REMOVE ROLE - Input:", { roleIdString, roleName });

    const doc = await blackListDB.findOne();

    if (!doc) {
        const resultMessage = "Blacklist does not exist.";
        console.log(resultMessage);
        return resultMessage;
    }

    const roleExists = doc.blackListedRoles.some(role => role.roleId === roleIdString);
    console.log("🔍 Role exists?", roleExists);

    if (roleExists) {
        await blackListDB.updateOne(
            {},
            { $pull: { blackListedRoles: { roleId: roleIdString } } }
        );
        const message = `✅ Role ${mentionedRole} has been removed from the Blacklist.`;
        console.log(message);
        return message;
    } else {
        const message = `⚠️ Role ${mentionedRole} is not in the Blacklist.`;
        console.log(message);
        return message;
    }
}

module.exports = {
    removeBlacklistDB,
    removeBlacklistRoleDB
};
