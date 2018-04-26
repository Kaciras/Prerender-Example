const Prerenderer = require("./prerender");

function prerender(chromePath, headless) {

	const instance = new Prerenderer(process.argv[0], true);

	async function middleware(req, res, next) {
		if (!req.query["prerender"]) {
			return next();
		}

		/* if the script in page needs to read original url,the argument of driver.get() can't use localhost as domain. */
		// const url = "http://localhost" + req.originalUrl;
		const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		console.info("rendering ", fullUrl);

		try {
			const html = await instance.render(fullUrl);

			/* print browser console logs for debug. */
			instance.logs().then(logs => logs.forEach(log => console.debug(log.message)));

			res.send(html).end();
		} catch (err) {
			console.error("render error: " + err.stack);
			next(err)
		}
	}

	return middleware;
}


module.exports = prerender;