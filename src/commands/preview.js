const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const { PermissionFlagsBits } = require("discord.js");
const { getInactiveUsers } = require("../functions/inactivity");
const { blackListDB } = require("../models/blacklistSchema");

async function getPurgePreview(guild) {
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
        // Skip user if they are on the blacklist
        if (blacklistedUserIds.includes(userId)) {
            console.log(`Skipping blacklisted user ${userId}`);
            continue;
        }

        const member = await guild.members.fetch(userId).catch(err => {
            console.error('Error fetching member:', err);
            return null;
        });

        if (member) {
            const lastActiveDate = new Date(userData.lastMessageDate).toLocaleString();
            userList += `<@${userId}> - Last active: ${lastActiveDate}\n`;
            userCount++;
        } else {
            console.log(`No member found for userId: ${userId}`);
        }
    }

    console.log('User list:', userList);
    return {userList, userCount};
}

const data = new SlashCommandBuilder()
    .setName('preview')
    .setDescription('Preview a list of users who will be purged');

module.exports = {
    data,
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const { userList, userCount } = await getPurgePreview(interaction.guild);

            if (userCount==0) {
                return interaction.editReply('No users are currently eligble to be purged.');
            }

            // Create the embed to display the user list
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Purge Preview')
                .setDescription(`The following ${userCount} users will be kicked in the next purge:\n\n` + userList)

            // Create the action row with buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm')
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Success), //Confirm purge
                    new ButtonBuilder()
                        .setCustomId('abort')
                        .setLabel('Abort')
                        .setStyle(ButtonStyle.Danger), //Abort purge
                    new ButtonBuilder()
                        .setCustomId('edit')
                        .setLabel('Edit')
                        .setStyle(ButtonStyle.Primary) //Edit list
                );   

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Preview error:', error);
            return interaction.editReply('An error occurred while fetching the preview.');
        }
    },
    getPurgePreview
};