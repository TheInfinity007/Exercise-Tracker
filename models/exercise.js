const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
	description: String,
	duration: Number,
	date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Exercise", exerciseSchema);