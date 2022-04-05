'use strict';

const gulp = require('gulp'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    cleancss = require('gulp-clean-css'),
    uglify = require('gulp-uglify-es').default,
    sass = require('gulp-sass')(require('sass')),
    clean = require('gulp-clean'),
    purgecss = require('gulp-purgecss'),
    rename = require('gulp-rename'),
    merge = require('merge-stream'),
    injectstring = require('gulp-inject-string'),
    imagemin = require('gulp-imagemin'),
    bundleconfig = require('./bundleconfig.json'),
    fs = require('fs');

const { series, parallel, src, dest, watch } = require('gulp');

const regex = {
    css: /\.css$/,
    js: /\.js$/
};

const paths = {
    input: 'input/',
    output: 'output/assets/',
    assets: 'input/assets/',
    node_modules: 'node_modules/'
};

const getBundles = (regexPattern) => {
    return bundleconfig.filter(bundle => {
        return regexPattern.test(bundle.outputFileName);
    });
};
  
function delStart() {
    return src([
        paths.output
        ], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

function copyAssets() {
    var copyFontAwesome = src(paths.node_modules + '@fortawesome/fontawesome-free/webfonts/*.*')
        .pipe(dest(paths.output + 'fonts/fontawesome-free'));

    var copyImages = src(paths.assets + 'images/**/*.*')
        .pipe(imagemin())
        .pipe(dest(paths.output + 'images'));

    var copyIcons = src(paths.input + '/*.png')
        .pipe(imagemin())
        .pipe(dest('output'));

    var copyManifest = src(paths.input + '/site.webmanifest')
        .pipe(dest('output'));

    return merge(copyFontAwesome, copyImages, copyIcons, copyManifest);
}

function compileScss() {
    return src(paths.assets + 'css/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(dest(paths.output + 'css'));
}

/*function concatJs() {
    var tasks = getBundles(regex.js).map(function (bundle) {
        return src(bundle.inputFiles, { base: '.' })
            .pipe(babel({
                "sourceType": "unambiguous",
                "presets": [
                    ["@babel/preset-env", {
                        "targets": {
                            "ie": "10"
                        }
                    }
                    ]]
            }))
            .pipe(concat(bundle.outputFileName))
            .pipe(dest('.'));
    });

    return merge(tasks);
}*/

function concatCss() {
    var tasks = getBundles(regex.css).map(function (bundle) {

        return src(bundle.inputFiles, { base: '.' })
            .pipe(concat(bundle.outputFileName))
            .pipe(dest('.'));
    });

    return merge(tasks);
}

function purgeCss() {
    return src(paths.output + 'css/hollowinsidemaintenance.bundle.css')
        .pipe(purgecss({
            content: [
                paths.input + '**/*.cshtml'
                //paths.input + '**/*.md',
                //paths.output + 'js/*.*'
            ],
            safelist: [
                '::-webkit-scrollbar',
                '::-webkit-scrollbar-thumb'
            ],
            keyframes: true,
            variables: true
        }))
        .pipe(dest(paths.output + 'css/'));
}

function minCss() {
    var tasks = getBundles(regex.css).map(function (bundle) {

        return src(bundle.outputFileName, { base: '.' })
            .pipe(cleancss({
                level: 2,
                compatibility: 'ie8'
            }))
            .pipe(rename({ suffix: '.min' }))
            .pipe(dest('.'));
    });

    return merge(tasks);
}

/*function minJs() {
    var tasks = getBundles(regex.js).map(function (bundle) {

        return src(bundle.outputFileName, { base: '.' })
            .pipe(uglify())
            .pipe(rename({ suffix: '.min' }))
            .pipe(dest('.'));
    });

    return merge(tasks);
}*/

function delEnd() {
    return src([
        paths.output + 'css/*.css',
        '!' + paths.output + 'css/*.min.css'
        //paths.output + 'js/*.js',
        //'!' + paths.output + 'js/*.min.js'
    ], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

// Gulp series
//exports.concatScssJs = parallel(compileScss, concatJs);
//exports.minCssJs = parallel(minCss, minJs);

// Gulp default
exports.default = series(delStart, copyAssets, compileScss, concatCss, purgeCss, minCss, delEnd);