const mongoose = require('mongoose');

const syncCodeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

syncCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SyncCode', syncCodeSchema);
