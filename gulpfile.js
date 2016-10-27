var gulp = require("gulp");
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minimist = require('minimist');
var browserify = require('gulp-browserify');
var gulpSequence = require('gulp-sequence');
var CacheBuster = require('gulp-cachebust');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
// 获取 minify-css 模块（用于压缩 CSS）
var minifyCSS = require('gulp-minify-css')


var knownOptions = {
    string: 'env',
    default: { env: process.env.NODE_ENV || 'development' }
};
var options = minimist(process.argv.slice(2), knownOptions);
var isProduction = (options.env === 'production');
var cachebust = new CacheBuster({
    checksumLength: isProduction ? 8 : 0
});

var Config = {
    // 源目录
    "originDir": {
        "html": 'project/',
        "js": 'project/js/',
        "css": 'project/css/'
    },
    // 预编译目录
    distDir: {
        "html": 'project/dist/',
        "js": 'project/dist/js/',
        "css": 'project/dist/css/'
    },
    // 后缀
    suffix: {
        "html": ".html",
        "js": ".js",
        "css": ".css"
    },
    // 通配符
    wild: '*'
};

// 监视文件改动并重新载入
gulp.task('serve', function() {
    browserSync({
        server: {
            baseDir: 'project'
        }
    });
    gulp.watch("project/" + Config.wild + Config.suffix.html, ['build-html']); // 监听html文件改动重新构建
    gulp.watch("project/js/" + Config.wild + Config.suffix.js, ['build-html']); // 监听js文件改动重新构建
    gulp.watch("project/css/" + Config.wild + Config.suffix.css, ['build-html']); // 监听css文件改动重新构建
    gulp.watch([Config.wild + Config.suffix.html, 'js/' + Config.wild + Config.suffix.js, 'css/' + Config.wild + Config.suffix.css], {
        cwd: 'project/dist'
    }, function() {
        reload();
    });
});

gulp.task('build-css', function() {
    return gulp.src(Config.originDir.css + Config.wild + Config.suffix.css)
        .pipe(minifyCSS()) //压缩文件
        .pipe(gulp.dest(Config.distDir.css))
});

gulp.task('build-js', function() {
    return gulp.src(Config.originDir.js + Config.wild + Config.suffix.js)
        .pipe(gulpif(isProduction, uglify())) // 仅在生产环境时候进行压缩
        .pipe(browserify({
            debug: !isProduction // source map开关
        }))
        .pipe(cachebust.resources())
        .pipe(gulp.dest(Config.distDir.js));
});

gulp.task('build-html', ['build-css', 'build-js'], function() {
    return gulp.src(Config.originDir.html + Config.wild + Config.suffix.html)
        .pipe(cachebust.references())
        .pipe(gulp.dest(Config.distDir.html));
});

gulp.task('default', gulpSequence('build-html', 'serve')); // 生产环境使用gulp --env production