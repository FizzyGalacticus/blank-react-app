const { src, dest, watch, parallel, series } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const http = require('http');
const express = require('express');
const clearScreen = require('clear');
const logger = require('node-color-log');

const { lint, transpile, build } = require('./js');

const app = express();
app.use(express.static(`${__dirname}/../docs`));

const env = process.env.NODE_ENV;

const clear = () => {
	clearScreen();

	return Promise.resolve();
};

const minHtml = () => {
	return src('src/index.html')
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
		.pipe(dest('docs/'));
};

const devMode = () => {
	if (env === 'dev') {
		watch('src/index.html', series(clear, minHtml));
		watch('src/**/*.js', series(clear, lint('src/**/*.js'), transpile('src/index.js', 'docs/js/app.js')));

		const server = http.createServer(app);
		const port = 3001;

		process.on('SIGINT', function() {
			server.close();
			process.exit();
		});

		server.listen(port, () => {
			setTimeout(() => {
				logger.info(`You can view your changes here:`);
				logger.info(`http://localhost:${port}`);
			}, 200);
		});
	}

	return Promise.resolve();
};

const all = series(
	parallel(build({ lint: { glob: 'src/**/*.js' }, srcPath: 'src/index.js', destPath: 'docs/js/app.js' }), minHtml),
	devMode
);

module.exports = {
	default: all,
};
