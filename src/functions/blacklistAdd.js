const { blackListDB } = require('../models/blacklistSchema');

async function insertBlacklistDB(userid, username, roleid = null, rolename = null) {
    if (!userid && !roleid) {
        console.error("User ID or Role ID must be provided.");
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
            console.log(`✅ User ${userIdString} has been blacklisted.`);
        }

        if (roleIdString && roleNameString) {
            // 🔍 Debug log for role insertion
            console.log('🛠 Attempting to insert role:', {
                roleIdString,
                roleNameString
            });

            await blackListDB.updateOne(
                {},
                { $addToSet: { blackListedRoles: { roleId: roleIdString, roleName: roleNameString } } }
            );
            console.log(`✅ Role ${roleIdString} has been blacklisted.`);
        }

    } else {
        // Create new document if it doesn't exist
        const newDoc = {
            blackListedUsers: [],
            blackListedRoles: []
        };

        if (userIdString && userNameString) {
            newDoc.blackListedUsers.push({ userId: userIdString, userName: userNameString });
        }

        if (roleIdString && roleNameString) {
            // 🔍 Debug log for role insertion (initial doc)
            console.log('🛠 Attempting to insert role into new document:', {
                roleIdString,
                roleNameString
            });

            newDoc.blackListedRoles.push({ roleId: roleIdString, roleName: roleNameString });
        }

        await blackListDB.create(newDoc);
        console.log(`📄 New blacklist document created with initial values.`);
    }
}

module.exports = {
    insertBlacklistDB
};
