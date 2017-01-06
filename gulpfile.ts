import * as gulp from "gulp";
import * as concat from "gulp-concat-sourcemap";
import * as deploy from "gulp-gh-pages";
import * as runSequence from "run-sequence";
import * as uglifyjs from "gulp-uglifyjs";
import * as typescript from "gulp-typescript";
import * as sass from "gulp-sass";
import * as sourcemaps from "gulp-sourcemaps";
import * as autoprefixer from "gulp-autoprefixer";
let del = require("del");
let processhtml = require("gulp-processhtml");
let connect = require("gulp-connect");
let open = require("gulp-open");
let wrapCommonjs = require("gulp-wrap-commonjs");
let browserify = require("browserify");
let tsify = require("tsify");
const config = {
    styles: {
        sass: {
            style: { outputStyle: "expanded" },
            src: "public/stylesheets/*.scss",
        },
        prefixer: {
            browsers: ["last 10 versions"],
            cascade: false
        },
    }
};

const paths = {
    assets: "src/assets/**/*",
    scss: "src/scss/main.scss",
    index: "index.html",
    ts: "src/scripts/**/*.ts",
    build: "build/",
    dist: "dist"
};

gulp.task("clean", (cb) => {
    return del([paths.build, paths.dist], cb);
});

gulp.task("copy", () => {
    gulp.src("src/" + paths.index)
        .pipe(gulp.dest(paths.build));
    return gulp.src(paths.assets)
        .pipe(gulp.dest(paths.build + "/assets"));
});

let tsProject = typescript.createProject({
    declarationFiles: true,
    noResolve: false
});

gulp.task("typescript", () => {
    return browserify({
        basedir: '.',
        entries: ['src/scripts/App.ts'],
        cache: {},
        packageCache: {}
    })
        .plugin(tsify)
        .bundle()
        .pipe(gulp.dest("dist"));
});

gulp.task("scss", () => {
    gulp.src(paths.scss).
        pipe(sass(config.styles.sass).on("error", sass.logError)).
        pipe(autoprefixer(config.styles.prefixer)).
        pipe(gulp.dest(paths.build));


});

gulp.task("processhtml", () => {
    return gulp.src(paths.build + paths.index)
        .pipe(processhtml())
        .pipe(gulp.dest(paths.build));
});


gulp.task("reload", ["typescript"], () => {
    gulp.src(paths.build + paths.index)
        .pipe(connect.reload());
});



gulp.task("connect", () => {
    connect.server({
        root: [__dirname, paths.build],
        port: 9000,
        livereload: true
    });
});

gulp.task("open", () => {
    gulp.src(paths.build + paths.index)
        .pipe(open({ uri: "http://localhost:9000" }));
});
gulp.task("watch", () => {
    gulp.watch(paths.assets, ["copy"]);
    gulp.watch(paths.ts, ["typescript", "reload"]);
    gulp.watch(paths.scss, ["scss", "reload"]);
    gulp.watch(paths.index, ["reload"]);
});
gulp.task("minifyJs", ["typescript"], () => {
    let all = [].concat(paths.build + "/main.js");
    return gulp.src(all)
        .pipe(uglifyjs("all.min.js", { outSourceMap: false }))
        .pipe(gulp.dest(paths.dist));
});


gulp.task("deploy", () => {
    return gulp.src("dist/**/*")
        .pipe(deploy());
});

gulp.task("default", () => {
    runSequence("clean", ["copy", "typescript", "scss", "connect", "watch"], "open");
});
gulp.task("build", () => {
    return runSequence("clean", ["copy", "minifyJs", "processhtml"]);
});
