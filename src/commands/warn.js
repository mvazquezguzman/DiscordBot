const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const { PermissionFlagsBits } = require("discord.js");
const { getInactiveUsers } = require("../functions/inactivity");
const { blackListDB } = require("../models/blacklistSchema");

async function getWarning(guild) {
    const inactiveUsers = await getInactiveUsers();
    let userList = ''; // String to store formatted user information
    let userCount = 0; // Variable to count users

    // Ensure getInactiveUsers returns a Map
    if (!(inactiveUsers instanceof Map)) {
        throw new Error('Expected a Map from getInactiveUsers');
    }

    // Log inactive users to check the data
    console.log('Inactive users:', inactiveUsers);

    // Get blacklist for exclusions
    const blacklistDoc = await blackListDB.findOne();
    if (!blacklistDoc) {
        console.error('No blacklist document found');
    }
    const blacklistedUserIds = blacklistDoc ? blacklistDoc.blackListedUsers.map(user => user.userId) : [];
    console.log('Blacklisted user IDs:', blacklistedUserIds);


    for (const [userId, userData] of inactiveUsers.entries()) {
        // Skips blacklisted users
        if (blacklistedUserIds.includes(userId)) {
            console.log(`Skipping blacklisted user ${userId}`);
            continue;
        }

        //Returns error if users can't be grabbed
        const member = await guild.members.fetch(userId).catch(err => {
            console.error('Error fetching member:', err);
            return null;
        });

        if (member) {
            const lastActiveDate = new Date(userData.lastMessageDate).toLocaleString();
            userList += `<@${userId}> - Last active: ${lastActiveDate}\n`;
            userCount++;

            const guildName = client.guilds.cache.map(g => g.name); //Grabs server name
            await member.send('You are inactive! This warning is to let you know of an upcoming purge at the server "'
                + guildName + '"') //Sends message to inactive users including server name
        } else {
            console.log(`No member found for userId: ${userId}`);
        }
    }

    console.log('User list:', userList);
    return {userList, userCount};
}

const data = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Shows a purge preview, and warns users of purge eligibility.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports = {
    data,
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const { userList, userCount } = await getWarning(interaction.guild);

            if (userCount===0) {
                return interaction.editReply('No users are currently eligble to be purged.');
            }

            // Create the embed to display the user list
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Inactive Users')
                .setDescription(`The following ${userCount} users have been warned for inactivity:\n\n` + userList)
            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Preview error:', error);
            return interaction.editReply('An error occurred while fetching the preview.');
        }
    },
    getWarning
};
