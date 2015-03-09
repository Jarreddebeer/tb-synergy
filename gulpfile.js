var gulp = require('gulp'),
    shell = require('gulp-shell'),
    connect = require('connect'),
    watch = require('gulp-watch'),
    serveStatic = require('serve-static'),
    liveReload = require('gulp-livereload');

gulp.task('server', function(next) {
    var server = connect();
    server.use(serveStatic('public'))
    .listen(10000, next);
});

gulp.task('bundle', function() {
    return gulp.src('', {read: false})
    .pipe(shell(['jspm bundle lib/main ./public/build.js']))
    .pipe(liveReload());
});

gulp.task('watch', ['server'], function() {

    var server = liveReload.listen();

    gulp.watch(['public/*.html', 'public/css/*.css']).on('change', function(file) {
        liveReload.changed(file.path);
    });

    gulp.watch(['public/lib/**'], ['bundle']);
});

gulp.task('default', ['server', 'watch']);
