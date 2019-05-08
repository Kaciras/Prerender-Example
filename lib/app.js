const createError = require('http-errors');
const express = require('express');
const prerenderMiddleware = require("./middleware");
const path = require("path");


if (process.argv.length === 0) {
	throw new Error("argument of chrome path is required.");
}

module.exports = async function createApp() {
	const app = express();
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));

	// add as middleware
	app.use(await prerenderMiddleware(process.argv[0], false));
	app.use(express.static(path.join(__dirname, "../public")));

	// mock data
	app.use('/values', (req, res, next) => {
		if (req.method !== "GET") {
			return next(createError(405));
		}
		res.send(["value3", "value5", "value7", "value9", "value11"]).end();
	});

	app.use((req, res, next) => next(createError(404)));

	app.use((err, req, res) => {
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};
		res.status(err.status || 500).end();
	});

	return app;
};
