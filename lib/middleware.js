const Renderer = require("./render");

async function prerenderMiddleware(chromePath, headless) {

	const instance = await Renderer.create(chromePath, headless);

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

	console.info("Render initialization completed");
	return middleware;
}

module.exports = prerenderMiddleware;
