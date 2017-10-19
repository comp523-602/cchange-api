
// Routes.js: attaches middleware and all routing files to server

// Initialize dependencies
const Messages = require('./tools/Messages');

// Export functionality
module.exports = function (server) {

	// Middleware: Set headers
	server.use(function (req, res, next) {
	    res.setHeader('Access-Control-Allow-Origin', '*');
	    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Authorization');
	    res.setHeader('Access-Control-Allow-Credentials', true);
	    next();
	});

	// Handle routes
	require('./routes/User')(server);
	require('./routes/Charity')(server);
	require('./routes/CharityToken')(server);
	require('./routes/Campaign')(server);
	require('./routes/Update')(server);
	require('./routes/Post')(server);

	// Middleware: Handle errors
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
			message = Messages.serverError;
		}

		// Set response code
		res.status(code);

		// Send response with error message
		res.json({
			'message': message
		});
	});
};