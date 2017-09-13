
// Initialize dependencies
const Mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Initialize variable for model object
var user;

// Initialize user model object
module.exports = function () {

	// Return object if already exists...
	if (user) return user;

	// Otherwise, make schema for new user object...
	var userSchema = new Schema;

	// Inherit object properties and methods
	require('./../ObjectMethods')(userSchema);
	require('./../ObjectProperties')(userSchema);

	// Include user properties and methods
	require('./UserMethods')(userSchema);
	require('./UserProperties')(userSchema);

	// Create new model object with schema
	user = Mongoose.model('User', userSchema);

	// Return new model object
	return user;
}