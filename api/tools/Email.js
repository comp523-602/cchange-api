
// Email.js: sends emails using sendmail

// Initialize dependencies
const SendGrid = require('@sendgrid/mail');

// Initialize config
const config = require('./../../config');

// Setup SendGrid
SendGrid.setApiKey(config.sendgrid);

// Functions ===================================================================

module.exports = {
	sendCharityToken: function ({token, email}, callback) {

		// Setup email
		body = "You've been invited to create a cChange charity account. Use this token to get started: ";
		body += token;
		body += " This token will expire in 7 days";

		// Send email
		SendGrid.send({
		    'from': config.fromEmail,
		    'to': email,
		    'subject': "Make your cChange Charity Account",
		    'html': body,
			'text': body,
		}, function(err) {
			callback(err);
		});
	},
};