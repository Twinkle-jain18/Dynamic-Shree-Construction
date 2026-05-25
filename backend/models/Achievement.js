const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  label: { type: String, required: true },    // e.g. "Projects Completed"
  value: { type: Number, required: true },     // e.g. 50
  suffix: { type: String, default: '+' },      // e.g. "+", "%"
  icon: { type: String, default: 'trophy' },   // icon key: trophy, building, users, hardhat
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Achievement', achievementSchema);
