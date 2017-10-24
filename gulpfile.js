var gulp = require("gulp");
var rm = require("gulp-rm");
var concat = require("gulp-concat");
var merge = require("merge-stream");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var sourcemaps = require("gulp-sourcemaps");
var HtmlProcessor = require("./gulp/HtmlProcessor");
var htmlProcessor = new HtmlProcessor();

gulp.task('clean', function(){
  return gulp.src("dist/**/*")
    .pipe(rm());
})

gulp.task('html', function(){
  return gulp.src("web-content/**/*.html")
    .pipe(gulp.dest("dist/web-content"));
});

gulp.task('server', function(){
  gulp.src("node/**/*.*")
    .pipe(gulp.dest("dist/node"));

  return gulp.src("locales/**/*.*")
    .pipe(gulp.dest("dist/locales"));
});

gulp.task('node', function(){
  return gulp.src(["index.js", "package.json", "README.md"])
    .pipe(gulp.dest("dist"));
});

gulp.task('default', [
  'html',
  'server',
  'node'
]);
