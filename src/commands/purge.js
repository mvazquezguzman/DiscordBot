const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getInactiveUsers } = require("../functions/inactivity");
const { PurgeHistory } = require("../models/purgeHistorySchema");
const { blackListDB } = require("../models/blacklistSchema");

// Preview
async function getPurgePreview(guild) {
    const inactiveUsers = await getInactiveUsers();
    let userList = '';
    let userCount = 0;

    const blacklistDoc = await blackListDB.findOne();
    const blacklistedUserIds = blacklistDoc ? blacklistDoc.blackListedUsers.map(user => user.userId) : [];

    for (const [userId, userData] of inactiveUsers.entries()) {
        if (blacklistedUserIds.includes(userId)) continue;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
            const lastActiveDate = new Date(userData.lastMessageDate).toLocaleString();
            userList += `<@${userId}> - Last active: ${lastActiveDate}\n`;
            userCount++;
        }
    }

    return { userList, userCount };
}

// Purge
async function executePurge(guild, executorId, executorUsername) {
    const inactiveUsers = await getInactiveUsers();
    const purgedUsers = [];

    const blacklistDoc = await blackListDB.findOne();
    const blacklistedUserIds = blacklistDoc ? blacklistDoc.blackListedUsers.map(user => user.userId) : [];

    for (const [userId, userData] of inactiveUsers.entries()) { // Iterate over the Map
        //Skip user if they are on the blacklist
        if (blacklistedUserIds.includes(userId)) {
            console.log(`Skipping blacklisterd user ${userId}`);
            continue;
        }

        const member = await guild.members.fetch(userId).catch(() => null);

        if (member) {
            try {
                // kicks members who are in the inactive list and updates the purge count
                await member.kick("Inactive user purge");
                purgedUsers.push({
                    userId,
                    username: member.user.username
                });
                console.log("Purge executed successfully for user", userId);
            } catch (error) {
                console.error(`Error kicking ${userId}:`, error);
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
        });
    } catch (error) {
        console.error(`Error logging purge to database: ${error}`);
    }

    return { purgedCount: purgedUsers.length, purgedUsers };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Preview and purge inactive users'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const { userList, userCount } = await getPurgePreview(interaction.guild);

            if (userCount === 0) {
                return interaction.editReply('No users are currently eligible to be purged.');
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Purge Preview')
                .setDescription(`The following ${userCount} users will be kicked:\n\n${userList}\n\nWould you like to proceed?`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('abort').setLabel('Abort').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('edit').setLabel('Edit').setStyle(ButtonStyle.Primary)
            );

            return interaction.editReply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error('Error preparing purge preview:', err);
            return interaction.editReply('An error occurred while preparing the purge preview.');
        }
    },

    async buttonInteractionHandler(client, interaction) {
        if (!interaction.isButton()) return;

        const customId = interaction.customId;

        if (customId === 'confirm') {
            const { purgedCount } = await executePurge(interaction.guild, interaction.user.id, interaction.user.username);
            return interaction.reply({ content: `Purge complete. Kicked ${purgedCount} users.`, ephemeral: true });
        }

        if (customId === 'abort') {
            return interaction.reply({ content: 'Purge aborted.', ephemeral: true });
        }

        if (customId === 'edit') {
            return interaction.reply({ content: 'Edit functionality coming soon.', ephemeral: true });
        }
    }
};
