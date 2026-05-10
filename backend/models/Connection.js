const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Connection', connectionSchema);
