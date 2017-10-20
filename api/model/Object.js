/** @namespace model/Object */

// Initialize dependencies
const Uuid = require('uuid');
const Database = require('./../tools/Database.js');

// Initialize constants
const unformattedKeys = [
	"_id",
	"__v",
	"password",
	"charityToken"
];

// Object Properties: configures properties for database object
function ObjectProperties (schema) {
    schema.add({

		// GUID: a unique identified for an object
        'guid': {
            'type': String,
            'index': true,
            'unique': true
        },

		// Date Created: this time this object was created
		'dateCreated': {
			'type': Number,
		},

        // Last Modified: the time this object was last modified
        'lastModified': {
            'type': Number,
            'index': true
        },

        // Erased: a boolean value to allow objects to be erased and still referenced
        'erased': {
			'type': Boolean,
            'default': false,
            'index': true
        }

    });
}

// Object Static Methods: attaches functionality used by the schema in general
function ObjectStaticMethods (schema) {

	/**
	 * Generates a guaranteed unique GUID for a Mongo collection
	 * @memberof model/Object
	 * @param {function(err, GUID)} callback Callback function
	 */
	schema.statics.GUID = function (callback) {

		// Save reference to model object
		var model = this;

		// Generate a new GUID
		var GUID = Uuid.v4();

		// Build query to check for uniqueness
		var query = {
			'guid': GUID
		};

		// Check for uniqueness
		Database.findOne({model, query}, function(err, object) {

			// If an object exists, recursively make another GUID.
			if (object) return model.GUID(callback);

			// Otherwise, callback with GUID
			callback(err, GUID);
		});
	};

};

// Object Instance Methods: attaches functionality related to existing instances of the object
function ObjectInstanceMethods (schema) {

	/**
	 * Returns a formatted version of a database object
	 * @memberof model/Object#
	 * @return {Object} Formatted database object
	 */
	schema.methods.format = function () {
		var formattedObject = JSON.parse(JSON.stringify(this.toObject()));
		for (var i in unformattedKeys) delete formattedObject[unformattedKeys[i]];
		return formattedObject;
	};

};

// Export object properties and methods
module.exports = function (schema) {
	ObjectProperties(schema);
	ObjectStaticMethods(schema);
	ObjectInstanceMethods(schema);
}