const createError = require('http-errors');
const express = require('express');
const Prerenderer = require("./prerender");

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/* create prerenderer instance */
if (process.argv.length === 0) {
	throw new Error("argument of chrome path is required.");
}
const prerenderer = new Prerenderer(process.argv[0]);

/* add as middleware */
app.use(async (req, res, next) => {
	if (!req.query["prerender"]) {
		return next();
	}

	/* if the script in page needs to read original url,the argument of driver.get() can't use localhost as domain. */
	// const url = "http://localhost" + req.originalUrl;
	const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	console.info("rendering ", fullUrl);

	try {
		const html = await prerenderer.render(fullUrl);

		/* print browser console logs for debug. */
		prerenderer.logs().then(logs => logs.forEach(log => console.debug(log.message)));

		res.send(html).end();
	} catch (err) {
		console.error("render error: " + err.stack);
		next(err)
	}
});

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
