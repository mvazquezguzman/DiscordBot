const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { getInactiveUsers } = require("../functions/inactivity");
const { PurgeHistory } = require("../models/purgeHistorySchema");
const { blackListDB } = require("../models/blacklistSchema");

const purgeSessions = new Map();

// Preview
async function getPurgePreview(guild, userIds = []) {
    const inactiveUsers = await getInactiveUsers();
    let userList = '';
    let userCount = 0;

    for (const userId of userIds) {
        const userData = inactiveUsers.get(userId);
        const member = await guild.members.fetch(userId).catch(() => null);

        if (member) {
            const lastActive = userData && userData.lastMessageDate
                ? new Date(userData.lastMessageDate).toLocaleString()
                : "unknown";

            userList += `<@${userId}> - Last active: ${lastActive}\n`;
            userCount++;
        }
    }

    return { userList, userCount };
}

// Purge
async function executePurge(guild, executorId, executorUsername, userIds) {
    const purgedUsers = [];

    for (const userId of userIds) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
            try {
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
            const inactiveUsers = await getInactiveUsers();
            const blacklistDoc = await blackListDB.findOne();
            const blacklistedUserIds = blacklistDoc ? blacklistDoc.blackListedUsers.map(user => user.userId) : [];

            const userIds = [];

            for (const [userId] of inactiveUsers.entries()) {
                if (!blacklistedUserIds.includes(userId)) {
                    userIds.push(userId);
                }
            }

            if (userIds.length === 0) {
                return interaction.editReply('No users are currently eligible to be purged.');
            }

            purgeSessions.set(interaction.user.id, { userIds });

            const { userList, userCount } = await getPurgePreview(interaction.guild, userIds);

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

    async buttonInteractionHandler(interaction) {
        if (!interaction.isButton()) return;

        const customId = interaction.customId;

        if (customId === 'edit') {
            const session = purgeSessions.get(interaction.user.id);
            if (!session) {
                return interaction.reply({ content: 'No purge session found.', ephemeral: true });
            }

            const userIds = session.userIds;

            const options = [];

            for (const userId of userIds) {
                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                if (member) {
                    options.push({
                        label: `${member.user.username}#${member.user.discriminator}`,
                        value: userId,
                    });
                }
            }

            const selectMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('removeFromPurge')
                    .setPlaceholder('Select users to exclude')
                    .setMinValues(1)
                    .setMaxValues(options.length)
                    .addOptions(options)
            );

            await interaction.reply({
                content: 'Select users you want to remove from the purge:',
                components: [selectMenu],
                ephemeral: true
            });

            return;
        }

        await interaction.deferUpdate();

        if (customId === 'confirm') {
            const session = purgeSessions.get(interaction.user.id);
            if (!session) {
                return interaction.editReply({ content: 'No purge session found.', embeds: [], components: [] });
            }

            const { purgedCount } = await executePurge(interaction.guild, interaction.user.id, interaction.user.username, session.userIds);

            purgeSessions.delete(interaction.user.id);

            return interaction.editReply({ content: `Purge complete. Kicked ${purgedCount} users.`, embeds: [], components: [] });
        }

        if (customId === 'abort') {
            purgeSessions.delete(interaction.user.id);
            return interaction.editReply({ content: 'Purge aborted.', embeds: [], components: [] });
        }
    },

    async selectMenuInteraction(interaction) {
        if (!interaction.isStringSelectMenu()) return;
    
        await interaction.deferReply({ ephemeral: true });
    
        const selectedUserIds = interaction.values;
        const session = purgeSessions.get(interaction.user.id);
    
        if (!session) {
            return interaction.editReply({ content: 'No purge session found.' });
        }
    
        session.userIds = session.userIds.filter(id => !selectedUserIds.includes(id));
    
        if (session.userIds.length === 0) {
            purgeSessions.delete(interaction.user.id);
            return interaction.editReply({ content: 'No users are currently eligible to be purged after exclusions.' });
        }
    
        const { userList, userCount } = await getPurgePreview(interaction.guild, session.userIds);
    
        if (userCount === 0) {
            purgeSessions.delete(interaction.user.id);
            return interaction.editReply({ content: 'No users are currently eligible to be purged after exclusions.' });
        }
    
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Updated Purge Preview')
            .setDescription(`The following ${userCount} users are still eligible for purging after exclusions:\n\n${userList}\n\nWould you like to proceed?`);
    
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('abort').setLabel('Abort').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('edit').setLabel('Edit').setStyle(ButtonStyle.Primary)
        );
    
        await interaction.editReply({ 
            content: 'Here is the updated purge list after exclusions:',
            embeds: [embed],
            components: [row],
        });
    },

    executePurge
};