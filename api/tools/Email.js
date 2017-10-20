/** @namespace tools/Email */
// Email.js: sends emails using sendmail

// Initialize dependencies
const SendGrid = require('@sendgrid/mail');

// Initialize config
const config = require('./../../config');

// Setup SendGrid
SendGrid.setApiKey(config.sendgrid);

// Functions ===================================================================
module.exports = {

	/**
	 * Sends an email with a charity token
	 * @memberof tools/Email
	 * @param {Object} params
	 * @param {String} params.token Encoded charity token string
	 * @param {String} params.email Address to send email to
	 * @param {function (err)} callback Callback function
	 */
	sendCharityToken: function ({token, email}, callback) {

		// Initialize route
		const route = "charitySignup/";

		// Setup email
		var body = "You've been invited to create a cChange charity account. Click the link to get started: ";
		body += "<br /><br />";
		body += "<a href='" + config.appURL + route + token +"'>Create a new cChage charity</a>";
		body += "<br /><br />";
		body += "This link will expire in 7 days";

		// Send email
		SendGrid.send({
		    'from': config.fromEmail,
		    'to': email,
		    'subject': "Make your cChange Charity Account",
		    'html': body,
		}, function(err) {
			callback(err);
		});
	},
};