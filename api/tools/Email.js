
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

		// Initialize route
		const route = "http://app.cchange.ga/charityToken/";

		// Setup email
		var body = "You've been invited to create a cChange charity account. Click the link to get started: ";
		body += "<br /><br />";
		body += "<a href='" + route + token +"'>" + route + token + "</a>";
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