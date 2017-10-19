/** @namespace model/Post */

// Initialize dependencies
const Mongoose = require('mongoose');
const Async = require('async');
const Tokens = require('jsonwebtoken');
const Database = require('./../tools/Database');
const Dates = require('./../tools/Dates');

// Authenticated Token: authenicates user to edit post
function authenticatedToken (update, token) {
	if (token.user == post.user) return true;
	return false;
};

// Post Properties: configures properties for database object
function PostProperties (schema) {
    schema.add({

		// User: GUID of the user this post belongs to
		'user': {
			'type': String,
			'required': true,
		},

		// Campaign: GUID of the campaign this post supports
		'campaign': {
			'type': String,
			'required': true,
		},

		// Charity: GUID of the charity this post supports
		'charity': {
			'type': String,
			'required': true,
		},

		// Image: URL of the post image
		'image': {
			'type': String,
			'required': true,
		},

		// Caption: Caption for the post
		'caption': {
			'type': String,
		},

    });
};

// Post Static Methods: attaches functionality used by the schema in general
function PostStaticMethods (schema) {

	/**
	 * Creates a new post in the database
	 * @memberof model/Post
	 */
	schema.statics.create = function ({user, campaign, image, caption}, callback) {

		// Save reference to model
		var Post = this;

		// Synchronously perform the following tasks, then make callback...
		Async.waterfall([

			// Generate a unique GUID
			function (callback) {
				Post.GUID(function (err, GUID) {
					callback(err, GUID);
				})
			},

			// Write new charity to the database
			function (GUID, callback) {

				// Setup query with GUID
				var query = {
					'guid': GUID
				};

				// Setup database update
				var set = {
					'guid': GUID,
					'user': user.guid,
					'campaign': campaign.guid,
					'charity': campaign.charity,
					'image': image,
					'dateCreated': Dates.now(),
				};
				if (caption) set.caption = caption;
				var update = {
					'$set': set
				};

				// Make database update
				Database.update({
					'model': Post,
					'query': query,
					'update': update,
				}, function (err, post) {
					callback(err, post);
				});
			},

		], function (err, post) {
			callback(err, post);
		});
	};
};

// Post Instance Methods: attaches functionality related to existing instances of the object
function PostInstanceMethods (schema) {

	/**
	 * Updates an existing post in the database
	 * @memberof model/Post
	 */
	schema.methods.edit = function ({token, image, caption}, callback) {

		// Authenicate user
		if (!authenticatedToken(this, token))
			return callback(Secretary.authenticationError(Messages.authErrors.noAccess));

		// Save reference to model
		var Post = this;

		// Setup query with GUID
		var query = {
			'guid': this.guid,
		};

		// Setup database update
		var set = {
			'lastModified': Dates.now(),
		};
		if (image) set.image = image;
		if (caption) set.caption = caption;
		var update = {
			'$set': set
		};

		// Make database update
		Database.update({
			'model': Post.constructor,
			'query': query,
			'update': update,
		}, function (err, post) {
			callback(err, post);
		});
	};

};

// Export update model object
module.exports = function () {

	// Make schema for new post object...
	var postSchema = new Mongoose.Schema;

	// Inherit Object properties and methods
	require('./Object')(postSchema);

	// Add update properties and methods to schema
	PostProperties(postSchema);
	PostStaticMethods(postSchema);
	PostInstanceMethods(postSchema);

	// Create new model object with schema
	var post = Mongoose.model('Post', postSchema);

	// Return new model object
	return post;
}();