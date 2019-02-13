const { src, dest, series } = require('gulp');
const browserify = require('browserify');
const livereactload = require('livereactload');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');
const eslint = require('gulp-eslint');
const rename = require('gulp-rename');
const path = require('path');
const logger = require('node-color-log');
const { exec } = require('child_process');

const env = process.env.NODE_ENV;

let builder = null;

const lint = glob => {
	const ret = () => {
		return src(glob).pipe(eslint({ fix: true }));
	};

	ret.displayName = 'lint';

	return ret;
};

const transpile = (srcPath, destFilePath) => {
	const ret = () => {
		const destName = path.basename(destFilePath);
		const destPath = path.dirname(destFilePath);

		if (builder === null) {
			builder = browserify(srcPath, {
				cache: {},
				packageCache: {},
				plugin: env !== 'production' ? [livereactload] : undefined,
			}).transform('babelify');
		}

		return builder
			.bundle()
			.on('error', function(err) {
				/* eslint-disable */
				if (err.stack.includes('@babel/helper-module-imports')) {
					exec(`yarn postinstall`, err => {
						if (err) {
							logger.error(err);
						} else {
							logger.warn(`Needed to perform postinstall action. You may restart.`);
						}

						process.exit(0);
					});
				} else {
					logger.error(err.stack);
				}
				this.emit('end');
				/* eslint-enable */
			})
			.pipe(source(destName))
			.pipe(dest(destPath));
	};

	ret.displayName = 'transpile';

	return ret;
};

const minify = filePath => {
	const ret = () => {
		return src(filePath)
			.pipe(uglify())
			.pipe(rename({ suffix: '.min' }))
			.pipe(dest(path.dirname(filePath)));
	};

	ret.displayName = 'minify';

	return ret;
};

const build = ({ lint: { glob }, srcPath, destPath }) =>
	series(lint(glob), transpile(srcPath, destPath), minify(destPath));

module.exports = {
	lint,
	transpile,
	minify,
	build,
};
