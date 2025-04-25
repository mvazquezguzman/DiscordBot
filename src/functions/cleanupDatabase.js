const mongoose = require('mongoose');
const UserActivity = require('../models/userActivitySchema');

const mongoURI = 'mongodb+srv://CtrlAltKick2025:Huyen133169%40@ctrlaltkick.qhpme.mongodb.net/test?retryWrites=true&w=majority&appName=CtrlAltKick';

async function cleanUpDatabase() {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const result = await UserActivity.updateMany(
            {
                $or: [
                    { lastMessage: { $exists: true } },
                    { lastVoiceActivity: { $exists: true } }
                ]
            },
            {
                $unset: {
                    lastMessage: 1,
                    lastVoiceActivity: 1
                }
            }
        );

        console.log(` Fully removed ${result.modifiedCount} field(s) from documents.`);
    } catch (error) {
        console.error(' Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanUpDatabase();
