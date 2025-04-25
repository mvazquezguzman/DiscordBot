const { User } = require("discord.js");
const { blackListDB } = require('../models/blacklistSchema');


async function insertBlacklistDB(userid, username, roleid = null, rolename = null) {
    if (!username && !rolename) {
        console.error("Username or role name must be provided.");
        return;
    }

    const userIdString = userid ? userid.toString() : null;
    const userNameString = username ? username.toString() : null;
    const roleIdString = roleid ? roleid.toString() : null;
    const roleNameString = rolename ? rolename.toString() : null;

    const doc = await blackListDB.findOne();

    if (doc) {
        if (userIdString && userNameString) {
            await blackListDB.updateOne(
                {},
                { $addToSet: { blackListedUsers: { userId: userIdString, userName: userNameString } } }
            );
            console.log(`User ${userIdString} has been blacklisted.`);
        }

        if (roleIdString && roleNameString) {
            await blackListDB.updateOne(
                {},
                { $addToSet: { blackListedRoles: { roleId: roleIdString, roleName: roleNameString } } }
            );
            console.log(`Role ${roleIdString} has been blacklisted.`);
        }

    } else {
        // Create new schema document
        const newDoc = {
            blackListedUsers: [],
            blackListedRoles: []
        };

        if (userIdString && userNameString) {
            newDoc.blackListedUsers.push({ userId: userIdString, userName: userNameString });
        }

        if (roleIdString && roleNameString) {
            newDoc.blackListedRoles.push({ roleId: roleIdString, roleName: roleNameString });
        }

        await blackListDB.create(newDoc);
        console.log(`New Schema has been created with initial values.`);
    }
}

module.exports = {
    insertBlacklistDB
}
