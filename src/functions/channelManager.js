const { ChannelType } = require('discord.js');
const Channel = require('../models/channelSchema');
const UserActivity = require('../models/userActivitySchema');
const { getChalk } = require('../utility/utils');

// Create a Map to store user activities
let userActivitiesMap = new Map();

// Function to store channels and user activities in the database
async function storeChannels(client) {
    const chalk = getChalk(); // Get the chalk instance

    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channels = guild.channels.cache;

        for (const channel of channels.values()) {
            if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) {
                await Channel.findOneAndUpdate(
                    { id: channel.id },
                    {
                        name: channel.name,
                        type: channel.type.toString(),
                        createdAt: channel.createdAt
                    },
                    { upsert: true }
                );

                if (channel.type === ChannelType.GuildText) {
                    await trackAndLogTextChannelActivity(channel);
                    await trackUserReactions(client);
                }
            }
        }

        console.log(chalk.green("Channels and user activities stored in DB."));
        trackVoiceChannelActivity(client);
        trackVoiceChannelActivity(client);

    } catch (error) {
        console.error(chalk.red('Error storing channels or user activity'), error);
    }
}

// Function to fetch the latest messages from all text channels
async function refreshLatestMessages(client) {
    const chalk = getChalk(); // Get the chalk instance

    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channels = guild.channels.cache;

        for (const channel of channels.values()) {
            if (channel.type === ChannelType.GuildText) {
                // Fetch the latest messages
                const messages = await channel.messages.fetch({ limit: 100 });
                await trackAndLogTextChannelActivity(channel, messages);
            }
        }

        console.log(chalk.cyan("Latest messages refreshed from all text channels."));
    } catch (error) {
        console.error(chalk.red('Error refreshing latest messages:'), error);
    }
}

// Function to track and update DB with text channel activity
async function trackAndLogTextChannelActivity(channel) {
    const chalk = getChalk(); // Get the chalk instance

    try {
        // Fetch the last 100 messages from the channel
        const messages = await channel.messages.fetch({ limit: 100 });

        // Check if messages is a Collection and not empty
        if (!messages || messages.size === 0) {
            console.log(`No messages found in channel: ${channel.name}`);
            return; // Exit the function if no messages
        }

        const userActivities = new Map();
        for (const message of messages.values()) { // Use .values() to iterate over the Collection
            const user = message.author;
            if (!userActivities.has(user.id)) {
                userActivities.set(user.id, {
                    userName: user.username,
                    lastMessage: message.content || '',
                    lastActive: message.createdAt,
                    lastVoiceActivity: null // Initialize lastVoiceActivity as null
                });
            } else {
                const existingActivity = userActivities.get(user.id);
                // Update if the message is more recent
                if (message.createdAt > existingActivity.lastActive) {
                    existingActivity.lastMessage = message.content || '';
                    existingActivity.lastActive = message.createdAt;
                    existingActivity.lastMessageDate = message.createdAt;
                }
            }
        }

        for (const [userId, activity] of userActivities.entries()) {
            userActivitiesMap.set(userId, activity);
            console.log(`UserID: ${userId}, Activity:`, activity); // Log the structure for debugging

            await UserActivity.findOneAndUpdate(
                { userId: userId.toString() },
                {
                  userName: activity.userName,
                 lastActive: activity.lastActive
                },
                { upsert: true, new: true }
            );
        }

        console.log(chalk.green(`Successfully tracked messages in channel: ${channel.name}`));
    } catch (error) {
        console.error(`Error tracking messages in channel: ${channel.name}`, error);
    }
}


// Function to track voice channel activity in real time
function trackVoiceChannelActivity(client) {
    const chalk = getChalk();

    console.log(chalk.bgYellow.black('Starting voice activity detection...'));

    client.on('voiceStateUpdate', async (oldState, newState) => {
        try {
            const userId = (newState.member.id || oldState.member.id).toString();
            const userName = newState.member.user.username || oldState.member.user.username;
            const joinedChannel = newState.guild.channels.cache.get(newState.channelId);
            const leftChannel = oldState.guild.channels.cache.get(oldState.channelId);

            if (newState.channelId && joinedChannel && joinedChannel.type === ChannelType.GuildVoice) {
                console.log(`${userName} joined voice channel: ${joinedChannel.name}`);
                await logVoiceActivity(userId, userName, joinedChannel.name, 'Joined voice channel');
            }

            if (!newState.channelId && oldState.channelId && leftChannel && leftChannel.type === ChannelType.GuildVoice) {
                console.log(`${userName} left voice channel: ${leftChannel.name}`);
                await logVoiceActivity(userId, userName, leftChannel.name, 'Left voice channel');
            }
        } catch (error) {
            console.error(chalk.red('Error tracking voice activity:'), error);
        }
    });
}

async function logVoiceActivity(userId, userName, channelName, action) {
    const chalk = getChalk();
    const currentDate = new Date();

    try {
        console.log(`UserID Type: ${typeof userId}, Value: ${userId}`);

        await UserActivity.findOneAndUpdate(
            { userId: userId.toString(), channelName: channelName },
            {
                userName: userName,
                lastVoiceActivity: currentDate,
                lastActive: currentDate
            },
            { upsert: true, new: true }
        );

        const currentActivity = userActivitiesMap.get(userId) || {
            userName: userName,
            lastActive: currentDate,
            lastVoiceActivity: currentDate
        };

        if (currentDate > currentActivity.lastActive) {
            currentActivity.lastVoiceActivity = currentDate;
            currentActivity.lastActive = currentDate;
        }

        userActivitiesMap.set(userId, currentActivity);

        console.log(chalk.magentaBright(`Voice activity logged for user: ${userName} - ${action}`));
    } catch (error) {
        console.error(chalk.red('Error logging voice activity:'), error);
    }
}

// Function to track message reactions
function trackUserReactions(client) {
    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;
        const { message } = reaction;
        const channelName = message.channel.name;

        console.log(`${user.username} reacted with ${reaction.emoji.name} to message: "${message.content}" in channel: ${channelName}`);
        await logReactionActivity(user.id.toString(), user.username, channelName, message.content, reaction.emoji.name);
    });
}

async function logReactionActivity(userId, userName, channelName, messageContent, emojiName) {
    const chalk = getChalk();
    const currentDate = new Date();

    try {
        console.log(`UserID Type: ${typeof userId}, Value: ${userId}`);

        const lastReaction = {
            messageContent: messageContent,
            emoji: emojiName,
            userName: userName,
            timestamp: currentDate
        };

        let lastActive = currentDate;
        const userActivity = await UserActivity.findOne({ userId: userId, channelName: channelName });

        if (userActivity) {
            const lastReactionTimestamp = userActivity.lastReaction?.timestamp || new Date(0);
            const lastActiveTimestamp = userActivity.lastActive || new Date(0);

            if (currentDate > lastReactionTimestamp && currentDate > lastActiveTimestamp) {
                lastActive = currentDate;
            } else {
                lastActive = lastActiveTimestamp;
            }
        }

        await UserActivity.findOneAndUpdate(
            { userId: userId.toString(), channelName: channelName },
            {
                userName: userName,
                lastActive: lastActive,
                lastReaction: lastReaction
            },
            { upsert: true, new: true }
        );

        const currentActivity = userActivitiesMap.get(userId) || {
            userName: userName,
            lastReaction: lastReaction.timestamp,
            lastActive: lastActive
        };

        if (currentDate > currentActivity.lastActive) {
            currentActivity.lastReaction = lastReaction.timestamp;
            currentActivity.lastActive = lastActive;
        }

        userActivitiesMap.set(userId, currentActivity);

        console.log(chalk.cyan(`User activity updated for ${userName} in channel ${channelName}:`,
            JSON.stringify({ lastActive, lastReaction }, null, 2)
        ));

        console.log(chalk.magentaBright(`Reaction logged for user: ${userName} - Reacted with ${emojiName}`));
    } catch (error) {
        console.error(chalk.red('Error logging reaction activity:'), error);
    }
}

// Function to retrieve the user activity from the Map
function getUserActivities() {
    const chalk = getChalk();
    console.log(chalk.bgYellow.black('Updated User Activities Map: '), userActivitiesMap);
    return userActivitiesMap;
}

module.exports = {
    storeChannels,
    getUserActivities,
    refreshLatestMessages,
};
