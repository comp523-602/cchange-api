
// Messages.js: holds messages

module.exports = {
	'codes': {
		'serverError': 500,
		'requestError': 400,
		'conflictError': 409,
		'success': 200
	},
	'responses': {
		'serverError': 'A server error occured',
		'success': 'Success'
	},
	'typeErrors': {
		'string': " is not a string",
	},
	'fieldErrors': {
		'passwordLetter': " is missing a letter",
		'passwordNumber': " is missing a number",
		'isInvalid': " is invalid"
	},
	'conflictErrors': {
		'adminUnauthorized': "You are not authorized to invite charities",
		'emailAlreadyUsed': "An account with this email already exists",
		'emailNotFound': "Email not recognized",
		'passwordIncorrect': "Incorrect password",
		'charityTokenInvalid': "Your token is invalid",
		'charityTokenUsed': "Your invitiation has already been used",
		'charityTokenExpired': "Your invitation has expired",
	}
};