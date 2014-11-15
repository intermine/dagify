'use strict';
// generated on 2014-11-13 using generator-knockout-gulp-bootstrap 0.0.1
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserify = require('browserify');
var transform = require('vinyl-transform');
var uglify = require('gulp-uglify');
var wiredep = require('wiredep').stream;
var handlebars = require('gulp-handlebars');
var defineModule = require('gulp-define-module');
var notifier = require('node-notifier');
var util = require('gulp-util');

// Standard handler
function standardHandler(err){
  notifier.notify({ message: 'Error: ' + err.message });
  // Log to console
  util.log(util.colors.red('Error'), err.message);
}

// Handler for browserify
function browserifyHandler(err){
  standardHandler(err);
  this.end();
}

gulp.task('templates', function(){
  gulp.src(['templates/*.hbs'])
      .pipe(handlebars())
      .pipe(defineModule('node'))
      .pipe(gulp.dest('build/templates/'));
});

gulp.task('styles', function () {
  return gulp.src('app/styles/main.css')
    .pipe($.autoprefixer('last 1 version'))
    .pipe(gulp.dest('.tmp/styles'));
});

gulp.task('compile', function () {
  // At present just move source files, (which are JS) to build dir.
  return gulp.src('./src/**/*').pipe(gulp.dest('build'));
});

gulp.task('jshint', function () {
  return gulp.src('src/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jshint.reporter('fail'));
});

gulp.task('html', ['styles'], function () {
  var assets = $.useref.assets({searchPath: '{.tmp,app}'});

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')().concat('app/fonts/**/*'))
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src(['app/*.*', '!app/*.html'], {dot: true})
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'build', 'dist']));

gulp.task('connect', function () {
  var serveStatic = require('serve-static');
  var serveIndex = require('serve-index');
  var app = require('connect')()
    .use(require('connect-livereload')({port: 35729}))
    .use(serveStatic('app'))
    .use(serveStatic('.tmp'))
    // paths to bower_components should be relative to the current file
    // e.g. in app/index.html you should use ../bower_components
    .use('/bower_components', serveStatic('bower_components'))
    .use(serveIndex('app'));

  require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('serve', ['connect'], function () {
  require('opn')('http://localhost:9000');
});

// inject bower components
gulp.task('wiredep', function () {
  gulp.src('app/*.html')
    .pipe(wiredep({
      directory: 'bower_components'
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('watch', ['browserify', 'connect', 'serve'], function () {
  $.livereload.listen();

  // watch for changes
  gulp.watch([
    'app/*.html',
    '.tmp/styles/**/*.css',
    'app/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', $.livereload.changed);

  gulp.watch('bower.json', ['wiredep']);
  gulp.watch('package.json', ['browserify']);
  gulp.watch('src/**/*.js', ['browserify']);
  gulp.watch('templates/**/*.hbs', ['browserify']);
  gulp.watch('app/styles/**/*.css', ['styles']);
});

gulp.task('browserify', ['compile', 'templates'], function () {
  var browserified = transform(function(filename) {
    var b = browserify(filename);
    return b.bundle();
  });
  return gulp.src(['./build/*.js'])
    .pipe(browserified)
    .on('error', browserifyHandler) //.pipe(uglify())
    .pipe(gulp.dest('./app/scripts'));
});

gulp.task('build', ['jshint', 'images', 'fonts', 'extras', 'browserify'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});

