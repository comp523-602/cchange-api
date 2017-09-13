// Object Properties: adds properties to a schema
module.exports = function (schema) {

    schema.add({

		// GUID: a unique identified for an object
        "guid": {
            "type": String,
            "index": true,
            "unique": true
        },

        // Write Access: a list of users that can write to this object
        "writeAccess": {
            "type": [String],
            "index": true,
            "default": []
        },

		// Private Access: a list of users that can access private properties on this object
		"privateAccess": {
			"type": [String],
			"index": true,
			"default": []
		},

		// Date Created: this time this object was created
		"dateCreated": {
			"type": Number,
		},

        // Last Modified: the time this object was last modified
        "lastModified": {
            "type": Number,
            "index": true
        },

        // Erased: a boolean value to allow objects to be erased and still referenced
        "erased": {
			"type": Boolean,
            "default": false,
            "index": true
        }

    });
}