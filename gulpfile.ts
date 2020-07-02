import * as gulp from "gulp";
import * as ts from "gulp-typescript";
import {exec} from "child_process";
import ReflectTransformer from "./dev/ReflectTransformer"

let tsProject = ts.createProject('tsconfig.json',{getCustomTransformers: (pr)=>({before:[ReflectTransformer(pr)]})});

gulp.task('build', function () {
    return gulp.src('src/**/*.ts')
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist'));
});
gulp.task('run',function (cb){
    exec("node ./dist/main.js",(error,stdout,stderr)=>{
        console.log(stdout);
        console.log(stderr);
        cb(error);
    });
});
gulp.task('build-run',gulp.series('build','run'));
gulp.task('build-dev',()=>{
    return gulp.src('dev/src/*.ts').
    pipe(ts({module:'commonjs',target: "ES2019",declaration:true}))
    .pipe(gulp.dest('dev/dist/'));
});
gulp.task('bbuild',gulp.series('build-dev','build'));
