var gulp = require('gulp');
var apidoc = require('gulp-apidoc');

gulp.task('apidoc', function(done) {
	apidoc({
		src: "./api/routes",
		dest: "./docs/",
	}, done);
});

gulp.task('default', ['apidoc']);