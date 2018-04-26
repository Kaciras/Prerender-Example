const createError = require('http-errors');
const express = require('express');
const prerenderer = require("./middleware");

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/* create prerenderer instance */
if (process.argv.length === 0) {
	throw new Error("argument of chrome path is required.");
}

/* add as middleware */
app.use(prerenderer(process.argv[0], true));

app.use(express.static(__dirname));

app.use('/values', function (req, res, next) {
	if (req.method !== "GET") {
		return next(createError(405));
	}
	res.send(["value3", "value5", "value7", "value9", "value11"]).end();
});

app.use((req, res, next) => next(createError(404)));

app.use(function (err, req, res, next) {
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	res.status(err.status || 500).end();
});

module.exports = app;
