const mongoose = require('mongoose');
const shortid = require('shortid');

const userSchema = new mongoose.Schema({
	_id: { type: String, 	'default': shortid.generate },
	username: String,
	logs: [
		{
			type:mongoose.Schema.Types.ObjectId,
			ref: "Exercise"
		}
	],
	count: { type: Number, default: 0 }
})

module.exports = mongoose.model("User", userSchema);