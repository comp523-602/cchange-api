
// Routing.js: attaches middleware and all routing files to server

// Initialize dependencies
const Messages = require('./../tools/Messages');

// Export functionality
module.exports = function (server) {

	// SET HEADERS: Allow CORS requests from all origins
	server.use(function (req, res, next) {
	    res.setHeader('Access-Control-Allow-Origin', '*');
	    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	    res.setHeader('Access-Control-Allow-Credentials', true);
	    next();
	});

	// INCLUDE ROUTES
	require('./User')(server);
	require('./CharityToken')(server);

	// Handle errors
	server.use(function (err, req, res, next) {

		// Initialize response variables
		var code, message;

		// Process handled errors
		if (err.handledError) {
			code = err.code;
			message = err.message;
		}

		// Process unhandled errors
		else {
			console.log(err); // Print error in log
			code = Messages.codes.serverError;
			message = Messages.responses.serverError;
		}

		// Set response code
		res.status(code);

		// Send response with error message
		res.json({
			'message': message
		});
	});
};