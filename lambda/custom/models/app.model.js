const mongoose = require('mongoose');

const AppSchema = new mongoose.Schema({
  userId: String,
  status: String,
  type: String,
  amount: Number
});

module.exports = mongoose.model('App', AppSchema);
