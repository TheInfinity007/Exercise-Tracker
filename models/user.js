const mongoose = require('mongoose');
const shortid = require('shortid');

const userSchema = new mongoose.Schema({
	_id: { type: String, 	'default': shortid.generate },
	username: String,
	exercises: [
		{
			type:mongoose.Schema.Types.ObjectId,
			ref: "Exercise"
		}
	]
})

module.exports = mongoose.model("User", userSchema);