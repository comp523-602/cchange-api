/** @namespace model/User */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');
const Authentication = require('./../tools/Authentication');

// User Properties: configures properties for database object
function UserProperties (schema) {
    schema.add({

		// OBJECT TYPE
		'objectType': {
			'type': String,
			'default': "user"
		},

		// Email: the user's email (used for user uniqueness)
		'email': {
			'type': String,
			'unique': true,
			'index': true,
			'lowercase': true,
			'required': true,
		},

		// Password: hashed password string
		'password': {
			'type': String,
			'required': true
		},

		// Name: the user's name
		'name': {
			'type': String,
			'index': true,
			'required': true
		},

		// Bio: the user's bio
		'bio': {
			'type': String,
			'index': true,
			'required': true
		},

		// Picture: image URL of user's profile picture
		'picture': {
			'type': String,
			'required': true
		},

		// Balance: the user's balance, in cents
		'balance': {
			'type': Number,
			'default': 0,
		},

		// Charity: GUID of charity which user belongs to, used to distinguish user types
		'charity': {
			'type': String,
			'default': null,
		},

		// Posts: array of post GUIDs which belong to user
		'posts': {
			'type': Array,
			'default': [],
		},

		// Donations: array of donation GUIDs made by user
		'donations': {
			'type': Array,
			'default': []
		},

		// Following: entities which this user follows
		'followingUsers': {
			'type': Array,
			'index': true,
			'default': [],
		},
		'followingCharities': {
			'type': Array,
			'index': true,
			'default': [],
		},

    });

	schema.index({'name': 'text', 'bio': 'text'});
};

// User Static Methods: attaches functionality used by the schema in general
function UserStaticMethods (schema) {

	/**
	 * Creates a new user in the database
	 * @memberof model/User
	 * @param {Object} params
	 * @param {String} params.name Name of user
	 * @param {String} params.email User email
	 * @param {String} params.password Hashed password for user
	 * @param {String} params.charityGUID GUID of charity object associated with user
	 * @param {function(err, update)} callback Callback function
	 */
	schema.statics.create = function ({name, email, password, charityGUID}, callback) {

		// Save reference to model
		var User = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				User.GUID(function (err, GUID) {
					callback(err, GUID);
				})
			},

			// Write new user to the database
			function (GUID, callback) {

				// Setup query with GUID
				var query = {
					'guid': GUID
				};

				// Setup database update
				var update = {
					'$set': {
						'guid': GUID,
						'name': name,
						'email': email,
						'password': password,
						'charity': charityGUID,
						'dateCreated': Dates.now(),
					}
				};

				// Make database update
				Database.update({
					'model': User,
					'query': query,
					'update': update,
				}, function (err, user) {
					callback(err, user);
				});
			},

		], function (err, user) {
			callback(err, user);
		});
	};
};

// User Instance Methods: attaches functionality related to existing instances of the object
function UserInstanceMethods (schema) {

	/**
	 * Formats a campaign object to be returned to the client
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {Object} params.req Express.js request object
	 * @param {Object} params.res Express.js response object
	 * @param {function(err, formattedObject)} callback Callback function
	 */
	schema.methods.format = function ({req, res}, callback) {

		// Reference object
		var User = this.constructor;

		// Initialize formatted object
		var thisObject = this.toObject();

		Async.waterfall([

			// Get request authorization
			function (callback) {
				Authentication.authenticateUser(req, function (err, token) {
					callback(null, token);
				});
			},

			// Attach currentUserFollows boolean
			function (token, callback) {
				if (token && token.user != thisObject.guid) {
					thisObject.currentUserFollows = false;
					Database.findOne({
						'model': User,
						'query': {
							'guid': token.user,
						}
					}, function (err, user) {
						if (user) {
							for (var i in user.followingUsers) {
								if (user.followingUsers[i] == thisObject.guid) {
									thisObject.currentUserFollows = true; break;
								}
							}
						}
						callback();
					});
				} else {
					callback();
				}
			},

			// Attach follower counts
			function (callback) {
				Database.find({
					'model': User,
					'query': {
						'followingUsers': thisObject.guid,
					},
				}, function (err, objects) {
					if (objects) thisObject.followers = objects.length;
					callback();
				})
			},

			// Attach total donation amount
			function (callback) {
				const Donation = require('./Donation.js');
				Database.find({
					'model': Donation,
					'query': {
						'user': thisObject.guid
					},
				}, function (err, donations) {
					if (donations) {
						thisObject.totalDonationAmount = 0
						for (var i in donations) {
							thisObject.totalDonationAmount += donations[i].amount;
						}
					}
					callback();
				})
			},

			// Attach charityName if applicable
			function (callback) {
				if (thisObject.charity) {
					const Charity = require('./Charity.js');
					Database.findOne({
						'model': Charity,
						'query': {
							'guid': thisObject.charity
						},
					}, function (err, charity) {
						if (charity) thisObject.charityName = charity.name;
						callback();
					})
				} else callback();
			},

		], function (err) {
			callback(err, thisObject);
		})
	};

	/**
	 * Adds a user to the followingUsers array
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {Object} params.user User object to be added
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.addFollowingUser = function ({user}, callback) {

		// Save reference to model
		var User = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$addToSet': {
				'followingUsers': user.guid,
			}
		};

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': query,
			'update': update,
		}, function (err, user) {
			callback(err, user);
		});
	};

	/**
	 * Removes a user from the followingUsers array
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {Object} params.user User object to be removed
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.removeFollowingUser = function ({user}, callback) {

		// Save reference to model
		var User = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$pull': {
				'followingUsers': user.guid,
			}
		};

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': query,
			'update': update,
		}, function (err, user) {
			callback(err, user);
		});
	};

	/**
	 * Adds a charity to the followingCharities array
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {Object} params.charity Charity object to be added
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.addFollowingCharity = function ({charity}, callback) {

		// Save reference to model
		var User = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$addToSet': {
				'followingCharities': charity.guid,
			}
		};

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': query,
			'update': update,
		}, function (err, user) {
			callback(err, user);
		});
	};

	/**
	 * Removes a charity from the followingCharities array
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {Object} params.charity Charity object to be remove
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.removeFollowingCharity = function ({charity}, callback) {

		// Save reference to model
		var User = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$pull': {
				'followingCharities': charity.guid,
			}
		};

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': query,
			'update': update,
		}, function (err, user) {
			callback(err, user);
		});
	};

	/**
	 * Adds a donation to the donation array
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {Object} params.donation Donation object to be added
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.addDonation = function ({donation}, callback) {

		// Save reference to model
		var User = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$push': {
				'donations': donation.guid,
			}
		};

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': query,
			'update': update,
		}, function (err, user) {
			callback(err, user);
		});
	};

	/**
	 * Adds a post to the posts array
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {Object} params.post Post object
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.addPost = function ({post}, callback) {

		// Save reference to model
		var User = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$push': {
				'posts': post.guid,
			}
		};

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': query,
			'update': update,
		}, function (err, user) {
			callback(err, user);
		});
	};

	/**
	 * Updates an existing user's balance
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {Number} [params.name] Name of user
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.updateBalance = function ({change}, callback) {

		// Save reference to model
		var User = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var update = {
			'$set': {
				'lastModified': Dates.now(),
			},
			'$inc': {
				'balance': change,
			},
		};

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': query,
			'update': update,
		}, function (err, user) {
			callback(err, user);
		});
	};

	/**
	 * Updates an existing user
	 * @memberof model/User#
	 * @param {Object} params
	 * @param {String} [params.name] Name of user
	 * @param {String} [params.bio] User bio
	 * @param {String} [params.picture] Image URL of user picture
	 * @param {function(err, user)} callback Callback function
	 */
	schema.methods.edit = function ({name, bio, picture}, callback) {

		// Save reference to model
		var User = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var set = {
			'lastModified': Dates.now(),
		};
		if (name) set.name = name;
		if (bio) set.bio = bio;
		if (picture) set.picture = picture;
		var update = {
			'$set': set
		};

		// Make database update
		Database.update({
			'model': User.constructor,
			'query': query,
			'update': update,
		}, function (err, user) {
			callback(err, user);
		});
	};

};

// Export user model object
module.exports = function () {

	// Make schema for new user object...
	var userSchema = new Mongoose.Schema;

	// Inherit Object properties and methods
	require('./Object')(userSchema);

	// Add user properties and methods to schema
	UserProperties(userSchema);
	UserStaticMethods(userSchema);
	UserInstanceMethods(userSchema);

	// Create new model object with schema
	var user = Mongoose.model('User', userSchema);

	// Return new model object
	return user;
}();