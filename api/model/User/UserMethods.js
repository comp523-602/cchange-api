
// Static Methods (functionality attached to the schema in general)
function UserStaticMethods (schema) {

}

// Instance Methods (functionality related to existing instances of the object)
function UserInstanceMethods (schema) {

}

// User Methods: adds instance and static methods to a schema
module.exports = function (schema) {
	ObjectStaticMethods(schema);
	ObjectInstanceMethods(schema);
}