
// Attach middleware and all routing files to server
module.exports = function (server) {

	// CORS Headers
	server.use(function (request, response, next) {
	    response.setHeader('Access-Control-Allow-Origin', '*');
	    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	    response.setHeader('Access-Control-Allow-Credentials', true);
	    next();
	});

	// Welcome
	server.get('/', function (request, response, next) {
		response.send('Welcome to the cChange API');
	});

	require('./routes/Authentication')(server);
};