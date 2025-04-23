const mongoose = require('mongoose');

const purgeScheduleSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  frequency: {
    type: String, // e.g., '1d', '12h'
    required: true
  },
  lastRun: {
    type: Date,
    default: Date.now
  },
  previewEnabled: {
    type: Boolean,
    default: true
  },
  reminderBeforeMs: {
    type: Number,
    default: 30 * 1000 // 20 seconds for testing
  }
});

module.exports = mongoose.model('PurgeSchedule', purgeScheduleSchema);
