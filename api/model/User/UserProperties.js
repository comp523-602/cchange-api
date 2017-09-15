// User Properties: adds properties to User schema
module.exports = function (schema) {

    schema.add({

		// Email: the user's email (used for user uniqueness)
		"email": {
			"type": String,
			"unique": true,
			"index": true,
			"lowercase": true,
			"required": true,
			"maxlength": MAX_FIELD_LEN,
		},

		// Password: hashed password string
		"password": {
			"type": String,
			"required": true
		},

    });
}