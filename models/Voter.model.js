const mongoose = require('mongoose');

const votersSchema = new mongoose.Schema({
  user: { type: String, required: true },
  votes: { type: Array, required: true },
});

module.exports = mongoose.model('Voter', votersSchema);
