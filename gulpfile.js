/** @module gulpfile */

const gulp = require('gulp');
const log = require('fancy-log');
const plumber = require('gulp-plumber');
const eslint = require('gulp-eslint');
const browserify = require('browserify');
const watchify = require('watchify');
const livereactload = require('livereactload');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const cssmin = require('gulp-cssmin');
const sequence = require('gulp-sequence');
const fs = require('fs');
const {exec} = require('child_process');

const express = require('express');
const app = express();
const http = require('http');
const open = require('open');
const clear = require('clear');
const packageFile = require('./package.json');

const livereload = require('gulp-livereload');

app.use(express.static(`${__dirname}/dist`));

let builder;
let singleRun = true;

const prodFileReplacements = [
	{
		path: 'www/index.html',
		replace: 'react.development.js',
		with: 'react.production.min.js',
	},
];

/**
 * Reads a file as UTF-8 and returns a Promise
 * which resolves to the string contents.
 * @param {string} path - The path of the
 * file to read.
 * @return {Promise}
 */
const readFile = (path) => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf-8', (err, data) => {
			if(err)
				reject(err);
			else
				resolve(data);
		});
	});
};

/**
 * Writes a file with the given data.
 * @param {string} path - The path of the
 * file to write.
 * @param {any} data - The data to write
 * to the file.
 * @return {Promise} Resolves on successful
 * write.
 */
const writeFile = (path, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, data, (err) => {
			if(err)
				reject(err);
			else
				resolve();
		});
	});
};

/**
 * Runs given files through eslint.
 * @param {Array} files - The files to
 * process with eslint.
 * @return {stream} The lint stream.
 */
const lintScripts = (files = ['www/js/**/*.js']) => {
	return gulp.src(files)
	.pipe(eslint('.eslintrc'))
	.pipe(eslint.format());
};

/**
 * Uses the 'builder' browserify object
 * to compile JS source.
 * @return {stream} The build stream.
 */
const buildJS = () => {
	return builder
		.bundle()
		.on('error', async function(err) {
			log.error(err);

			/* eslint-disable-next-line */
			this.emit('end');
		})
	.pipe(source('app.js'))
	.pipe(buffer())
	.pipe(plumber())
	.pipe(gulp.dest('dist/js'));
};

/**
 * Replaces all instances of a string with
 * another in a given file.
 * @param {string} path - The path of the
 * file you wish to work on.
 * @param {string} original - The original
 * string text you wish to replace.
 * @param {string} newContent - The new
 * content you wish to replace the old
 * stuff with.
 * @return {Promise} Resolves upon success.
 */
const replaceInFile = (path, original, newContent) => {
	return new Promise(async (resolve, reject) => {
		try {
			const originalContents = await readFile(path);
			let fileContents = originalContents;

			if(original instanceof Array) {
				original.forEach((orig, index) => {
					const regex = new RegExp(orig, 'g');

					fileContents = fileContents.replace(regex, newContent[index]);
				});
			}
			else {
				const regex = new RegExp(original, 'g');

				fileContents = fileContents.replace(regex, newContent);
			}

			if(originalContents != fileContents) {
				try {
					await writeFile(path, fileContents);
					resolve();
				}
				catch(err) {
					reject(err);
				}
			}
			else
				resolve();
		}
		catch(err) {
			reject(err);
		}
	});
};

/**
 * Writes the given parameter to the package.json
 * as the new version string.
 * @param  {string} symverStr
 * @return {Promise}
 */
const writeSymverToPackage = (symverStr) => {
	log(`Writing new vesion to package.json: ${symverStr}`);
	return new Promise((resolve, reject) => {
		const pkg = {...packageFile};
		pkg.version = symverStr;

		fs.writeFile('./package.json', JSON.stringify(pkg, 0, '\t'), (err) => {
			if(err)
				reject(err);
			else
				resolve();
		});
	});
};

/**
 * Commits all files and creates a git tag
 * for the current branch for the given
 * symver string.
 * @param  {string} symver
 * @return {Promise}
 */
const createGitTag = (symver) => {
	log(`Creating new git tag: v${symver}`);
	return new Promise((resolve, reject) => {
		exec(`git commit -am "Updated version to ${symver}"`, {cwd: __dirname}, (err, stdout, stderr) => {
			if(err)
				reject(err);
			else {
				exec(`git tag v${symver}`, {cwd: __dirname}, (err, stdout, stderr) => {
					if(err)
						reject(err);
					else {
						packageFile.version = symver;
						resolve();
					}
				});
			}
		});
	});
};

/**
 * Bumps the current version of rundown based on the input:
 * <br />
 * 0 - Bumps the major version, resets minor and patch to 0.
 * <br />
 * 1 - Bumps the minor version, resets patch to 0.
 * <br />
 * 2 - Bumps the patch version.
 * @param  {number} index
 * @return {Promise}
 */
const bumpVersion = (index) => {
	log('Bumping package version...');
	return new Promise(async (resolve, reject) => {
		const originalSymver = `${packageFile.version}`;
		const versions = originalSymver.split('.');

		versions[index]++;

		versions.forEach((version, i) => {
			if(i > index)
				versions[i] = 0;
		});

		const newSymver = `${versions[0]}.${versions[1]}.${versions[2]}`;

		try {
			await writeSymverToPackage(newSymver);

			try {
				await createGitTag(newSymver);
				resolve();
			}
			catch(err) {
				reject(err);
			}
		}
		catch(err) {
			reject(err);
		}
	});
};

gulp.task('init-builder', () => {
	if(builder === undefined) {
		builder = browserify('www/js/app.js', {
			paths: ['./node_modules', './www/js'],
			cache: {},
			packageCache: {},
			plugin:
				(process.env.NODE_ENV != 'production' && !singleRun) ?
					[
						[
							watchify,
							{
								ignoreWatch: ['**/node_modules/**'],
							},
						],
						livereactload,
					]
					: undefined,
		}).transform('babelify');

		builder.on('update', (ids) => {
			clear();
			lintScripts(ids);

			const buildStart = Date.now();

			ids.forEach((path) => {
				log(`Rebuilding ${path} ...`);
			});

			buildJS().on('end', () => {
				log(`... build complete: ${Date.now() - buildStart} ms`);
			});
		});
	}
});

gulp.task('clear', () => {
	return new Promise((resolve, reject) => {
		clear();
		resolve();
	});
});

gulp.task('bump-major', () => {
	return bumpVersion(0);
});

gulp.task('bump-minor', () => {
	return bumpVersion(1);
});

gulp.task('bump-patch', () => {
	return bumpVersion(2);
});

gulp.task('lint-scripts', () => {
	return lintScripts();
});

gulp.task('prod-env', () => {
	return new Promise(async (resolve, reject) => {
		const promises = [];

		if(process.env.NODE_ENV == 'production') {
			prodFileReplacements.forEach((replacement) => {
				promises.push(replaceInFile(replacement.path, replacement.replace, replacement.with));
			});
		}
		else {
			prodFileReplacements.forEach((replacement) => {
				promises.push(replaceInFile(replacement.path, replacement.with, replacement.replace));
			});
		}

		try {
			await Promise.all(promises);
			resolve();
		}
		catch(err) {
			reject(err);
		}
	});
});

gulp.task('compile-scripts', ['init-builder', 'lint-scripts', 'prod-env'], () => {
	return buildJS();
});

gulp.task('min-scripts', ['compile-scripts'], () => {
	return gulp.src(['dist/js/app.js'])
	.pipe(plumber())
	.pipe(uglify())
	.pipe(gulp.dest('dist/js'))
	.pipe(livereload());
});

gulp.task('min-html', ['prod-env'], () => {
	return gulp.src('www/**/*.html')
	.pipe(plumber())
	.pipe(
		htmlmin({
			collapseWhitespace: true,
			minifyURLs: true,
			minifyCSS: true,
			minifyJS: true,
			removeAttributeQuotes: true,
			removeComments: true,
			removeEmptyAttributes: true,
			removeOptionalTags: true,
			removeRedundantAttributes: true,
		})
	)
	.pipe(gulp.dest('dist'))
	.pipe(livereload());
});

gulp.task('sass', () => {
	return gulp.src([
		'www/scss/**/*.scss',
		'www/scss/**/*.css',
		'www/css/**/*.css',
		'www/js/**/*.scss',
		'www/js/**/*.css',
	])
	.pipe(plumber())
	.pipe(sass.sync({includePaths: ['www/scss']}))
	.pipe(
		autoprefixer({
			browsers: ['last 3 versions'],
		})
	)
	.pipe(concat('app.css'))
	.pipe(cssmin())
	.pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('dist/css'))
	.pipe(livereload());
});

gulp.task('fonts', () => {
	const fontDir = 'www/fonts/';
	return gulp.src([
		fontDir + '*.ttf',
		fontDir + '*.oft',
		fontDir + '*.woff',
		fontDir + '*.woff2',
		fontDir + '*.svg',
		fontDir + '*.eot',
	])
	.pipe(plumber())
	.pipe(gulp.dest('dist/fonts'))
	.pipe(livereload());
});

const minImage = (src = 'www/img/**/*') => {
	return gulp.src(src)
	.pipe(plumber())
	.pipe(imagemin())
	.pipe(gulp.dest('dist/img'))
	.pipe(livereload());
};

gulp.task('min-image', () => {
	return minImage();
});

gulp.task('serve', () => {
	const server = http.createServer(app);
	const serverPort = 3000;

	server.listen(serverPort, () => {
		const url = `http://localhost:${serverPort}`;

		log(`Now serving the page at ${url}`);
		open(url);
	});

	process.on('SIGINT', function() {
		server.close();
		process.exit();
	});
});

gulp.task('all-prod', (callback) => {
	sequence(['min-scripts', 'min-html', 'sass', 'fonts', 'min-image'])(callback);
});

gulp.task('all', (callback) => {
	sequence(['compile-scripts', 'min-html', 'sass', 'fonts', 'min-image'])(callback);
});

gulp.task('watch-html', () => {
	gulp.watch('www/**/*.html', ['clear', 'min-html']);
});

gulp.task('watch-sass', () => {
	gulp.watch(
		['www/scss/**/*.scss', 'www/scss/**/*.css', 'www/css/**/*.css', 'www/js/**/*.scss', 'www/js/**/*.css'],
		['clear', 'sass']
	);
});

gulp.task('watch-fonts', () => {
	gulp.watch(['www/fonts/**'], ['clear', 'fonts']);
});

gulp.task('watch-img', () => {
	gulp.watch(['www/img/**'], ['clear', 'min-image']);
});

gulp.task('livereload', () => {
	livereload.listen({
		start: true,
		reloadPage: 'dist/index.html',
	});
});

gulp.task('default', (callback) => {
	singleRun = false;
	sequence('all', ['watch-html', 'watch-sass', 'watch-fonts', 'watch-img', 'serve', 'livereload'])(callback);
});
