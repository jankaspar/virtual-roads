var browserify = require('browserify');
var gulp = require('gulp');
var fs = require('fs');

gulp.task('default', function() {
    return browserify({
        debug: true
    })
    .add('./typings/tsd.d.ts')
    .add('./src/main.ts')
    .plugin('minifyify', {map: 'main.js.map', output: './build/main.js.map'})
    .plugin('tsify', { noImplicitAny: true })
    .bundle()
    .pipe(fs.createWriteStream('./build/main.js'));
});