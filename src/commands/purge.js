const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("@discordjs/builders");
const { ButtonStyle, PermissionFlagsBits } = require("discord.js");
const { getInactiveUsers } = require("../functions/inactivity");
const { PurgeHistory } = require("../models/purgeHistorySchema");
const { blackListDB } = require("../models/blacklistSchema");
const { removeUserFromDatabases } = require("../functions/userDatabaseManager");

async function executePurge(guild, executorId, executorUsername) {
    const inactiveUsers = await getInactiveUsers();
    const purgedUsers = [];
    const cleanupResults = [];

    //Get blacklist for exclusions
    const blacklistDoc = await blackListDB.findOne();
    const blacklistedUserIds = blacklistDoc ? blacklistDoc.blackListedUsers.map(user => user.userId) : [];

    for (const [userId, userData] of inactiveUsers.entries()) {
        //Skip user if they are on the blacklist
        if (blacklistedUserIds.includes(userId)) {
            console.log(`Skipping blacklisted user ${userId}`);
            continue;
        }
        
        const member = await guild.members.fetch(userId).catch(() => null);

        if (member) {
            try {
                // Kick the member
                await member.kick("Inactive user purge");
                
                // Clean up databases
                const cleanupResult = await removeUserFromDatabases(userId, userData.userName);
                cleanupResults.push({
                    userId,
                    username: userData.userName,
                    ...cleanupResult
                });

                purgedUsers.push({
                    userId: userId,
                    username: member.user.username
                });
                console.log("Purge executed successfully for user", userId);
            } catch (error) {
                console.error(`Error kicking user ${userId}: ${error}`);
            }
        }
    }

    try {
        await PurgeHistory.create({
            userId: executorId,
            username: executorUsername,
            executionDate: new Date(),
            purgedCount: purgedUsers.length,
            purgedUsers: purgedUsers,
            databaseCleanupResults: cleanupResults
        });
    } catch (error) {
        console.error(`Error logging purge to database: ${error}`);
    }

    return {
        purgedCount: purgedUsers.length,
        purgedUsers: purgedUsers,
        cleanupResults: cleanupResults
    };
}

const data = 
        new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Execute purge of inactive users');


module.exports = {
    data,
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const result = await executePurge(interaction.guild);
            return interaction.editReply(
                `Successfully purged ${result.purgedCount} inactive users.`
            );
        } catch (error) {
            console.error('Purge error:', error);
            return interaction.editReply('An error occurred while executing the purge.');
        }
    },
    executePurge
};
