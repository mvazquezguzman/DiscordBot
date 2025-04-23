require('dotenv').config({ path: `${__dirname}/../.env` }); // Navigate up one level to access the .env file in the src folder
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bot = require('../index');
const { inactiveDB } = require('../models/inactivitySchema');
const UserActivity = require('../models/userActivitySchema');
const { PurgeHistory } = require('../models/purgeHistorySchema');
const { blackListDB } = require('../models/blacklistSchema');
const UserSchema = require('../models/userSchema');
const { checkIfUserIsAdmin } = require('../functions/userInformation');
const { executePurge } = require('../commands/purge');
// console.log('blackListDB model:', blackListDB);

const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5011;

const databaseToken = process.env.databaseToken; // Make sure this is defined in your .env file
// console.log('Database Token:', databaseToken); // Debugging line for ensuring database connection

mongoose.connect(databaseToken)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

require('dotenv').config({ path: `${__dirname}/../.env` });

// Gets these from the dotenv
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Debug for missing CLIENT_ID or CLIENT_SECRET
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing CLIENT_ID or CLIENT_SECRET in environment variables');
    console.log('CLIENT_ID:', CLIENT_ID);
    console.log('CLIENT_SECRET:', CLIENT_SECRET);
    process.exit(1);
}

console.log('CLIENT_ID:', CLIENT_ID);
console.log('CLIENT_SECRET:', CLIENT_SECRET ? 'Exists' : 'Missing');
console.log('REDIRECT_URI:', REDIRECT_URI);

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));


// Enable JSON parsing middleware
app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Endpoint for auth login
app.get('/auth/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify guilds.members.read`;
    res.redirect(discordAuthUrl);
});

// TODO: MAKE A PAGE FOR THIS
// Endpoint for auth login callback
app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
    }

    try {
        // Exchange the code for an access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });


        const accessToken = tokenResponse.data.access_token;

        // Fetch user information from Discord
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const user = userResponse.data;
        console.log('Discord user:', user);

        // Check if the user is an admin
        const isAdmin = await checkIfUserIsAdmin(user.id);

        if (isAdmin) {
            const userData = {
                id: user.id,
                username: user.username,
                roles: [{ roleName: 'Admin' }]
            };
            console.log('Redirecting to client with user data:', userData);

            // Redirect with user data in the query string
            res.redirect(`http://localhost:3000/login-success?user=${encodeURIComponent(JSON.stringify(userData))}`);
        } else {
            console.log('Access denied: User does not have admin privileges');
            res.status(403).send('Access denied: You do not have admin privileges.');
        }
    } catch (error) {
        console.error('Error during Discord OAuth2 flow:', error);
        res.status(500).json({ message: 'An error occurred during Discord authentication' });
    }
});

// Endpoint to get inactivity
app.get('/inactivity', async (req, res) => {
    console.log('Received request for inactivity data'); // Log when the route is hit
    try {
        const inactivityData = await inactiveDB.find(); // Fetch all items from the collection
        console.log('Inactivity Data:', inactivityData); // Log the fetched data
        res.json(inactivityData); // Send the items as a JSON response
    } catch (error) {
        console.error('Error fetching inactivity:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to get user activity
app.get('/useractivity', async (req, res) => {
    console.log('Received request for user activities'); // Logs to ensure the route is hit
    try {
        const userActivitiesData = await UserActivity.find(); // Fetch all user activities
        console.log('User Activities Data:', userActivitiesData); // Log fetched data
        res.json(userActivitiesData); // Send fetched user activities as response
    } catch (error) {
        console.error('Error fetching user activities:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Endpoint to get user information
app.get('/userinfo', async (req, res) => {
    console.log('Received request for user information'); // This log should appear when the route is hit
    try {
        const users = await UserSchema.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET /users - Returns all users with their userId and userName
app.get('/users', async (req, res) => {
    try {
        const users = await UserSchema.find({}, { userId: 1, userName: 1, _id: 0 });
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Endpoint to get purge history
app.get('/purge-history', async (req, res) => {
    console.log('Received request for purge history');
    try {
        const purgeHistory = await PurgeHistory.find()
            .sort({ executionDate: -1 })
            .limit(3)
            .lean({ virtuals: true });  // This ensures virtual properties are included

        console.log('Fetched purge history:', purgeHistory);

        const sanitizedPurgeHistory = purgeHistory.map(entry => ({
            username: entry.username || 'Unknown user',
            executionDate: entry.executionDate || new Date(),
            purgedUsers: Array.isArray(entry.purgedUsers) ? entry.purgedUsers : []
        }));

        console.log('Sending purge history:', sanitizedPurgeHistory);
        res.json(sanitizedPurgeHistory);
    } catch (error) {
        console.error('Error fetching purge history:', error);
        res.status(500).json({ error: 'Failed to fetch purge history' });
    }
});

//Endpoint for FAQ
app.get('/faq', async (req, res) => {
    console.log('FAQ populated'); // Add this log to ensure the route is hit
});

// Endpoint to get blacklist
app.get('/blacklist', async (req, res) => {
    console.log('Received request for blacklist data');
    try {
        const doc = await blackListDB.findOne();
        console.log('Fetched document from MongoDB:', doc); // This log should print the document

        const blacklistedUsers = doc ? doc.blackListedUsers : [];
        res.json(blacklistedUsers);
    } catch (error) {
        console.error('Error fetching blacklist:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /blacklist/add - Adds a user to the blacklist
app.post('/blacklist/add', async (req, res) => {
    const { userId, userName } = req.body;
    if (!userId || !userName) {
        return res.status(400).json({ message: 'User ID and User Name are required' });
    }

    try {
        // Check if a blacklist document exists; create one if not
        let doc = await blackListDB.findOne();
        if (!doc) {
            doc = await blackListDB.create({ blackListedUsers: [] });
        }

        // Add the user to the blacklist using $addToSet to prevent duplicates
        await blackListDB.updateOne(
            {},
            { $addToSet: { blackListedUsers: { userId, userName } } }
        );

        console.log(`User ${userId} added to the blacklist.`);
        res.json({ message: 'User added to the blacklist' });
    } catch (error) {
        console.error('Error adding user to blacklist:', error);
        res.status(500).json({ message: 'Failed to add user to blacklist' });
    }
});

// POST /blacklist/remove - Removes a user from the blacklist
app.post('/blacklist/remove', async (req, res) => {
    console.log('Request body:', req.body); // Debugging line to check request data

    const { userId } = req.body; // Now req.body should have data
    if (!userId) {
        console.log('User ID not found in request body');
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const result = await blackListDB.updateOne(
            {},
            { $pull: { blackListedUsers: { userId } } }
        );

        if (result.modifiedCount > 0) {
            console.log(`User ${userId} removed from the blacklist.`);
            res.json({ message: 'User removed from the blacklist' });
        } else {
            console.log(`User ${userId} not found in the blacklist.`);
            res.status(404).json({ message: 'User not found in blacklist' });
        }
    } catch (error) {
        console.error('Error removing user from blacklist:', error);
        res.status(500).json({ message: 'Failed to remove user from blacklist' });
    }
});

// Endpoint to get roles
app.get('/roles', async (req, res) => {
    console.log('Received request for roles data'); // Log when the route is hit
});

//POST /purge - Purge inactive users from guild
app.post('/purge', async (req, res) => {
    try {

        const { executorId, executorUsername} = req.body;

        if (!executorId || !executorUsername) {
            throw new Error("Executor information is required");
        }

        const guild = client.guilds.cache.first();
        if (!guild) {
            throw new Error("No guild available");
        }

        const result = await executePurge(guild, executorId, executorUsername);

        res.json({
            success: true,
            message: `Successfully purged ${result.purgedCount} users`,
            purgedCount: result.purgedCount,
            purgedUsers: result.purgedUsers
        })
    }
    catch (error) {
        console.error('Error executing purge', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to execute purge'
        });
    }
});



// Start the bot
client.login(process.env.TOKEN); // Make sure BOT_TOKEN is set in your .env
//Start the automatic purge scheduler to run purges at configured intervals
const { startAutoPurge } = require('../functions/purgeScheduler');
startAutoPurge(client);

