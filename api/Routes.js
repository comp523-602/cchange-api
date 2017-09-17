
// Attach middleware and all routing files to server
module.exports = function (server) {

	// CORS Headers
	app.use(function (req, res, next) {
	    res.setHeader('Access-Control-Allow-Origin', '*');
	    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	    res.setHeader('Access-Control-Allow-Credentials', true);
	    next();
	});

	// Welcome
	server.get('/', function (request, response, next) {
		response.send('Welcome to the cChange API');
	});

	require('./routes/Authentication')(server);
};