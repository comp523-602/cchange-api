
// Initialize dependencies
const Async = require('async');
const Authentication = require('./../tools/Authentication');
const Database = require('./../tools/Database');
const Paging = require('./../tools/Paging');
const Validation = require('./../tools/Validation');
const Secretary = require('./../tools/Secretary');
const Messages = require('./../tools/Messages');
const Dates = require('./../tools/Dates');

// Initialize config
const config = require('./../../config');

// Initialize models
const Charity = require('./../model/Charity');

// Attach charityToken endpoints to server
module.exports = function (server) {

	/**
	 * @memberof apiDocs
	 * @api {POST} /charity.edit Edit
	 * @apiName Edit
	 * @apiGroup Charity
	 * @apiDescription Edits a charity for a charity user
	 * @apiUse Authorization
	 *
	 * @apiParam {String} [name] Name of charity
	 * @apiParam {String} [description] Description of charity
	 * @apiParam {String} [logo] Image URL of charity logo
	 *
	 * @apiSuccess {Object} charity Charity object
	 *
	 * @apiUse Error
	 */
	server.post('/charity.edit', function (req, res, next) {

		// Synchronously perform the following tasks...
		Async.waterfall([

			// Authenticate charity user
			function (callback) {
				Authentication.authenticateCharityUser(req, function (err, token) {
					callback(err, token);
				});
			},

			// Validate required fields
			function (token, callback) {
				var fields = [];
				if (req.body.name) fields.push(Validation.string('Name', req.body.name));
				if (req.body.description) fields.push(Validation.string('Description', req.body.description));
				if (req.body.logo) fields.push(Validation.imageUrl('Logo', req.body.logo));
				callback(Validation.catchErrors(fields), token);
			},

			// Find charity using token
			function (token, callback) {
				Database.findOne({
					'model': Charity,
					'query': {
						'guid': token.charity,
					}
				}, function (err, charity) {
					if (!charity) callback(Secretary.conflictError(Messages.conflictErrors.objectNotFound));
					else callback(err, token, charity);
				})
			},

			// Update charity, add to response
			function (token, charity, callback) {
				charity.edit({
					'token': token,
					'name': req.body.name,
					'description': req.body.description,
					'logo': req.body.logo,
				}, function (err, charity) {
					if (charity) Secretary.addToResponse({
						'response': res,
						'key': "charity",
						'value': charity,
					});
					callback(err);
				});
			},

		], function (err) {
			if (err) next(err);
			else Secretary.respond(req, res);
		})
	})
};