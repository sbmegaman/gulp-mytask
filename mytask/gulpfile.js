var gulp         = require('gulp');
var sass         = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");
var uglify       = require("gulp-uglify");
var browser      = require("browser-sync");
var plumber      = require("gulp-plumber");
var jade         = require('gulp-jade');
var del          = require('del');
var notify       = require('gulp-notify');
var imagemin     = require('gulp-imagemin');
var pngquant     = require('imagemin-pngquant');
var size         = require('gulp-size');
var cache        = require('gulp-cache');
var gulpif       = require('gulp-if');
var csso         = require('gulp-csso');
var uncss        = require('gulp-uncss');
var minifyHTML   = require('gulp-minify-html');
var runSequence  = require('run-sequence');

// =============================================================================================================

// gulp.task(“タスク名”,function() {});でタスクの登録をおこないます。
// gulp.src(“MiniMatchパターン”)で読み出したいファイルを指定します。
// pipe(行いたい処理)でsrcで取得したファイルに処理を施します
// gulp.dest(“出力先”)で出力先に処理を施したファイルを出力します。

// “sass/style.scss” sass/style.scssだけヒット
// “sass/*.scss” sassディレクトリ直下にあるscssがヒット
// “sass/**/*.scss” sassディレクトリ以下にあるすべてのscssがヒット
// [“sass/**/.scss”,"!sass/sample/**/*.scss] sass/sample以下にあるscssを除くsassディレクトリ以下のscssがヒット

// =============================================================================================================

var basedir = "./dist/";
var dir = basedir;
var AUTOPREFIXER_BROWSERS = [
    'ie >= 8',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];

gulp.task("server", function() {
    browser({
        server: {
            baseDir: basedir
        }
    });
});
gulp.task('clean', del.bind(null, [dir]));


gulp.task("js", function() {
    console.log('Run task "js"');
    gulp.src(["./src/**/*.js", "!./src/_partial/**/*"])
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(uglify())
        .pipe(gulp.dest(dir))
        .pipe(size({title: 'js'}))
        .pipe(browser.reload({stream:true}));
});

gulp.task("sass", function() {
    console.log('Run task "sass"');
    gulp.src(["./src/**/*.scss", "!./src/_partial/**/*"])
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sass())
        .pipe(autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
        .pipe(gulp.dest(dir))
        .pipe(browser.reload({stream:true}));

    gulp.src(["./src/**/*.css", "!./src/_partial/**/*"])
        .pipe(gulp.dest(dir))
        .pipe(size({title: 'sass'}))
        .pipe(browser.reload({stream:true}));
});

gulp.task('jade', function(){
    console.log('Run task "jade"');
    gulp.src(['./src/**/*.jade', "!./src/_partial/**/*"])
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(jade({
            pretty: true,
            test: "あああ"
        }))
        .pipe(gulp.dest(dir))
        .pipe(size({title: 'jade'}))
        .pipe(browser.reload({stream:true}));
});

gulp.task("html", function() {
    console.log('Run task "html"');
    gulp.src(["./src/**/*.html", "!./src/_partial/**/*"])
        .pipe(gulp.dest(dir))
        .pipe(size({title: 'html'}))
        .pipe(browser.reload({stream:true}));
});
gulp.task("php", function() {
    console.log('Run task "php"');
    gulp.src(["./src/**/*.php", "./src/**/*.txt", "./src/**/*.pdf", "./src/.htaccess", "./src/**/*.htc", "!./src/_partial/**/*"])
        .pipe(gulp.dest(dir))
        .pipe(browser.reload({stream:true}));
});

gulp.task("img", function() {
    console.log('Run task "img"');
    gulp.src(["./src/**/img/**/*", "!./src/_partial/**/*"])
        .pipe(cache(imagemin({
                    progressive: true,
                    interlaced: true
                })))
        .pipe(gulp.dest(dir))
        .pipe(size({title: 'img'}))
        .pipe(browser.reload({stream:true}));
});
gulp.task("img-for-release", function() {
    console.log('Run task "img"');
    gulp.src(["./src/**/img/**/*", "!./src/_partial/**/*"])
        .pipe(cache(imagemin({
                    progressive: true,
                    interlaced: true,
                    use: [pngquant({ quality: '65-80', speed: 4 })]
                })))
        .pipe(gulp.dest(dir))
        .pipe(size({title: 'img'}))
        .pipe(browser.reload({stream:true}));
});

// Clearing the cache
gulp.task('clear', function (done) {
  return cache.clearAll(done);
});
// Finaly clean up for release
gulp.task('last', function () {
    gulp.src([dir+"**/*.html"])
        .pipe(gulpif('*.html', minifyHTML()))
        .pipe(gulp.dest(dir));
    gulp.src([dir+"**/*.css"])
        // Remove Any Unused CSS
        // Note: If not using the Style Guide, you can delete it from
        // the next line to only include styles your project uses.
        .pipe(gulpif('*.css', uncss({
          html: [
            'index.html'
          ],
          // CSS Selectors for UnCSS to ignore
          ignore: [
            // /.navdrawer-container.open/,
            // /.app-bar.open/
          ]
        })))
        .pipe(gulpif('*.css', csso()))
        .pipe(gulp.dest(dir));
});

// =============================================================================================================

gulp.task("default", ['server'], function() {
    gulp.watch(["./src/**/*.js", "!./src/**/min/**/*.js"], ["js"]);
    gulp.watch(["./src/**/*.scss", "./src/**/*.css"], ["sass"]);
    gulp.watch("./src/**/*.jade", ["jade"]);
    gulp.watch("./src/**/*.html", ["html"]);
    gulp.watch("./src/**/img/**/*", ["img"]);
});

gulp.task("build", ['clean'], function(cb){
    runSequence('jade', 'clear', ['js', 'sass', 'html', 'img'], cb);
});// http://qiita.com/naoiwata/items/4c82140a5fb5d7bdb3f8

gulp.task("build-php", ['clean'], function(cb){
    runSequence('jade', 'clear',['php', 'js', 'sass', 'html', 'img'], cb);
});

gulp.task("release", ['clean'], function(cb){
    runSequence('jade', 'clear',['php', 'js', 'sass', 'html', 'img-for-release'], 'last', cb);
});
