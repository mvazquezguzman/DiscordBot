const { executePurge } = require('../commands/purge');
const PurgeSchedule = require('../models/scheduleSchema');
const { getInactiveUsers } = require('../functions/inactivity');
const { Collection } = require('discord.js');

function parseTime(str) {
    if (!str) return 0;
    const num = parseInt(str);
    if (str.endsWith('s')) return num * 1000;
    if (str.endsWith('m')) return num * 60000;
    if (str.endsWith('h')) return num * 3600000;
    if (str.endsWith('d')) return num * 86400000;
    return 0;
}

async function runAutoPurge(client) {
    console.log("\uD83D\uDD01 Running scheduled purge...");

    const now = new Date();
    const schedules = await PurgeSchedule.find({});
    console.log("\u23F3 Loaded schedules:", schedules.length);
    console.log("\uD83D\uDCCB Schedules Loaded:", schedules);

    for (const schedule of schedules) {
        const nextRun = new Date(schedule.lastRun.getTime() + parseTime(schedule.frequency));
        const timeUntilNextRun = nextRun - now;

        if (now < nextRun) {
            console.log(`\u23F1️ Skip - Next run for guild ${schedule.guildId} at ${nextRun.toLocaleTimeString()}`);
            continue;
        }

        const guild = client.guilds.cache.first();
        if (!guild) {
            console.log("\u274C No guild found, skipping purge");
            continue;
        }

        const executorId = client.user.id;
        const executorUsername = client.user.username;
        const channel = client.channels.cache.find(c => c.name === 'testing');

        // Fetch inactive users and pass IDs to executePurge
        const inactiveUsers = await getInactiveUsers();
        const userIds = [...inactiveUsers.keys()];

        const result = await executePurge(guild, executorId, executorUsername, userIds);
        schedule.lastRun = new Date();
        await schedule.save();

        console.log(`\u2705 Purged ${result.purgedCount} users from guild ${schedule.guildId}`);

        if (channel) {
            if (result.purgedCount > 0) {
                await channel.send(`\u2705 Automatically purged **${result.purgedCount}** inactive users.`);
            } else {
                await channel.send(`\u26A0\uFE0F Auto purge ran, but no inactive users were purged.`);
            }
        }
    }
}

function startAutoPurge(client) {
    console.log("\uD83D\uDE80 Auto purge scheduler running every 30 minutes... (change to 1m or 20s in 'frequency' for testing)");
    setInterval(() => runAutoPurge(client), 30 * 60 * 1000); // 30 minutes
}

async function ensureDefaultSchedule() {
    const existing = await PurgeSchedule.findOne({ guildId: 'test-guild' });
    if (!existing) {
        await PurgeSchedule.create({
            guildId: 'test-guild',
            frequency: '30m', // change to '1m' or '20s' for testing
            lastRun: new Date(),
            reminderEnabled: false, // disable if using /warn for reminders
            previewEnabled: true
        });
        console.log('✅ Default purge schedule created');
    } else {
        console.log('📌 Default purge schedule already exists');
    }
}

ensureDefaultSchedule();

module.exports = {
    startAutoPurge,
};
