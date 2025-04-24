// Load environment variables from a .env file into process.env
require('dotenv').config({ path: `${__dirname}/.env` });
//comment for testing

const path = require('path');

// Import necessary modules from discord.js
const { Client, IntentsBitField, GatewayIntentBits, Collection } = require('discord.js');

// Import custom functions for channel management, inactivity database, and activity checks
const { storeChannels, refreshLatestMessages } = require('./functions/channelManager'); // Adjust the path accordingly
const { checkAndUpdateInactiveUsers, trackUserActivity, refreshInactiveUsers, loadUserActivityOnStartup} = require('./functions/inactivity');
const { getChalk } = require('./utility/utils');
const { logUsersAndRoles } = require('./functions/userInformation');
const { startAutoPurge } = require('./commands/timer');
const { initializeDefaultRoleTimers } = require("./commands/roletimer");


// Import Node.js filesystem module for file operations
const fs = require('fs');
const mongoose = require('mongoose');

// Create a new Discord client instance with specified intents
global.client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, // Required to receive guild
        IntentsBitField.Flags.GuildMembers, // Required for access to guild members
        IntentsBitField.Flags.GuildMessages, // Required to receive message events
        IntentsBitField.Flags.MessageContent, // Required to access message content
        GatewayIntentBits.GuildVoiceStates, // Required to access voice states
        GatewayIntentBits.GuildMessageReactions, // Required to access reaction event
    ]
});

// Initialize a Collection for storing commands
client.commands = new Collection();

// Read all command files from the "commands" directory
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith(".js"));

// Array to hold command data
const commands = [];

// Loop through each command file
for (const file of commandFiles) {
    // Require the command file and extract command data
    const command = require(path.join(__dirname, 'commands', file));
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

// Read all event files from the "events" directory
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith(".js"));

// Loop through each event file
for (const file of eventFiles) {
    const events = require(path.join(__dirname, 'events', file));
    if (events.once) {
        client.once(events.name, (...args) => events.execute(...args, commands));
    } else {
        client.on(events.name, (...args) => events.execute(...args, commands));
    }
}

// Event handler for when the bot is ready
client.on('ready', async (clientInstance) => {
    const chalk = getChalk(); // Get the chalk instance
    console.log(chalk.yellow(`⚡ ${clientInstance.user.tag} ⚡ is online.`));
    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.databaseToken);
        console.log(chalk.green("Connected to DB"));
    } catch (error) {
        console.log(chalk.red('DB is disconnected'));
    }

    // Initialize default role timers and start the auto-purge function of the timer
    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        if (guild) {
            startAutoPurge(guild);
            await initializeDefaultRoleTimers(guild); // Call the function to set default timers
        }
    } catch (error) {
        console.error("Error initializing default role timers:", error);
    }

    // Step 1: Load existing user activity from the database
    await loadUserActivityOnStartup();

    // Step 2: Refresh inactive users based on loaded activity
    await refreshInactiveUsers();

    // Step 3: Store channel information in the database
    await storeChannels(client);

    // Step 4: Log users and their roles
    await logUsersAndRoles(process.env.GUILD_ID);

    // DO NOT DELETE OR REMOVE ANY FUNCTION CALLS
    setInterval(() => {
        checkAndUpdateInactiveUsers();
        trackUserActivity(clientInstance);
        refreshLatestMessages(clientInstance); // Call to refresh latest messages
    }, 20000); // Check every 20 secs, adjust as needed
});

// Event listener for when a member's roles are updated
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        // Check if the roles have changed
        if (oldMember.roles.cache.size !== newMember.roles.cache.size ||
            oldMember.roles.cache.some(role => !newMember.roles.cache.has(role.id))) {
            console.log(`Roles updated for member: ${newMember.user.tag}`);

            // Update roles in the database for the member
            await logUsersAndRoles(newMember.guild.id);
        }
    } catch (error) {
        console.error(`Error handling guildMemberUpdate for ${newMember.user.tag}:`, error);
    }
});

client.on('interactionCreate', async (interaction) => {
    const command = client.commands.get('purge');

    if (interaction.isButton()) {
        if (command?.buttonInteractionHandler) {
            try {
                await command.buttonInteractionHandler(interaction);
            } catch (error) {
                console.error('Error handling purge button interaction:', error);
                if (!interaction.replied) {
                    await interaction.reply({ content: 'There was an error processing your action.', ephemeral: true });
                }
            }
        }
    }
    
    if (interaction.isStringSelectMenu()) {
        if (command?.selectMenuInteraction) {
            try {
                await command.selectMenuInteraction(interaction);
            } catch (error) {
                console.error('Error handling purge select menu interaction:', error);
                if (!interaction.replied) {
                    await interaction.reply({ content: 'There was an error processing your action.', ephemeral: true });
                }
            }
        }
    }
});



// Debug log for the bot token for debugging
// console.log('Bot Token:', process.env.TOKEN); // Debugging line

// Log in to Discord using the token from environment variables
client.login(process.env.TOKEN)
    .then(() => console.log("Bot is logged in!"))
    .catch(error => console.error('Error logging in:', error));