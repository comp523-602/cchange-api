
// Initialize models
var User = require('./../model/User')();

// Attach authentication endpoints to server
module.exports = function (server) {

	// Auth Create: creates a new user and returns authentication
	server.post('/auth.create', function (request, response, next) {
		User.create({
			'name': request.body.name,
			'email': request.body.email,
			'password': request.body.password,
		}, function (err, object) {
			response.send({
				'message': "User added!",
			});
		});
	})
};