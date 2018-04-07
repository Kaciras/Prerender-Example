const selenium = require('selenium-webdriver');
const urlib = require("url");

class Renderer {

	constructor(chromePath) {
		const chromeCapabilities = selenium.Capabilities.chrome();
		chromeCapabilities.set('chromeOptions', {
			/*
			 * "--no-sandbox" is required for Linux without GUI
			 * "--disable-gpu" is required for Windows,
			 * remove "--headless" will shows browser GUI, it's useful for debug.
			 */
			args: ["--headless", "--disable-extensions", "--enable-logging --v=9", "--no-sandbox", "--disable-gpu"]
		});

		chromeCapabilities.set("chrome.binary", chromePath);

		/* accept all certs */
		chromeCapabilities.set("acceptInsecureCerts", true);

		this.driver = new selenium.Builder()
			.forBrowser('chrome')
			.withCapabilities(chromeCapabilities)
			.build();

		process.on("exit", () => this.driver.quit());
	}

	/**
	 * Render the page of url use selenium-webdriver.
	 *
	 * @param url {string} request url
	 * @return {Promise<string>} html text of page.
	 */
	async render(url) {

		/* put some query paramters to tell the script in page that they are being pre-rendering */
		const nUrl = new urlib.URL(url);
		nUrl.searchParams.set("isPrerender", "true");
		nUrl.searchParams.delete("prerender");

		await this.driver.get(nUrl.toString());

		/* waiting fixed time for render complete */
		// await driver.sleep(3000);

		/* or polling the specified flag */
		await new FluntWait(this.driver)
			.withTimeout(3000)
			.pollingEvery(500)
			.throwOnTimeout(false)
			.until(async driver => await (await driver
				.findElement(selenium.By.css("body")))
				.getAttribute("data-render-complete") === "true");

		return await (await this.driver
			.findElement(selenium.By.css("html")))
			.getAttribute("outerHTML");
	}

	async filter(req, res, next) {
		if (!req.query["prerender"]) {
			return next();
		}

		/* if the script in page needs to read original url,the argument of driver.get() can't use localhost as domain. */
		// const url = "http://localhost" + req.originalUrl;
		const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		console.info("rendering page for", fullUrl);

		try {
			const html = await this.render(fullUrl);

			/* print browser console logs for debug. */
			const browserLogs = await this.driver.manage().logs().get("browser");
			browserLogs.forEach(record => console.debug(record.message));

			res.send(html).end();
		} catch (err) {
			console.error("render error: " + err.stack);
			next(err)
		}
	}
}


class FluntWait {

	constructor(driver) {
		this.driver = driver;
		this.tot = true;
	}

	throwOnTimeout(tot) {
		this.tot = tot;
		return this;
	}

	withTimeout(timeout) {
		this.timeout = timeout;
		return this;
	}

	pollingEvery(span) {
		this.span = span;
		return this;
	}

	async until(checker) {
		const deadline = new Date().getTime() + this.timeout;
		const span = this.span;
		const driver = this.driver;
		const trowOnTimeout = this.tot;

		async function doWait() {
			if (new Date().getTime() > deadline) {
				if (!trowOnTimeout) {
					return;
				}
				throw new Error("wait timeout");
			}
			if (await checker(driver)) {
				return;
			}
			await driver.sleep(span);
			await doWait();
		}

		await doWait();
	}
}

module.exports = Renderer;