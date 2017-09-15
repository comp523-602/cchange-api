
// Initialize dependencies
const Uuid = require('uuid');
const Database = require('./../tools/Database.js');

// Object Properties: configures properties for database object
function ObjectProperties (schema) {
    schema.add({

		// GUID: a unique identified for an object
        'guid': {
            'type': String,
            'index': true,
            'unique': true
        },

        // Write Access: a list of users that can write to this object
        'writeAccess': {
            'type': [String],
            'index': true,
            'default': []
        },

		// Private Access: a list of users that can access private properties on this object
		'privateAccess': {
			'type': [String],
			'index': true,
			'default': []
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

	// GUID: returns a unique GUID
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



};

// Export object properties and methods
module.exports = function (schema) {
	ObjectProperties(schema);
	ObjectStaticMethods(schema);
	ObjectInstanceMethods(schema);
}