const selenium = require('selenium-webdriver');
const { Type } = require('selenium-webdriver/lib/logging');
const urlib = require("url");

class Renderer {

	constructor(driver) {
		this.driver = driver;
	}

	/**
	 * Render the page of url use selenium-webdriver.
	 *
	 * @param url {string} request url
	 * @return {Promise<string>} html text of page.
	 */
	async render(url) {
		/* put some query parameters to tell the script in page that they are being pre-rendering */
		const nUrl = new urlib.URL(url);
		nUrl.searchParams.set("isPrerender", "true");
		nUrl.searchParams.delete("prerender");

		await this.driver.get(nUrl.toString());
		const body = await this.driver.findElement(selenium.By.css("body"));

		/* Waiting for data-render-complete attribute append to body */
		await this.driver.wait(new selenium.Condition("for render complete", async () => {
			return await body.getAttribute("data-render-complete") === "true";
		}), 1000);

		return await (await this.driver.findElement(selenium.By.css("html"))).getAttribute("outerHTML");
	}

	/**
	 * Fetches available log entries for Developer Tools(F12)/Console.
	 *
	 * @return {promise.Thenable<Array<logging.Entry>>} log entries
	 */
	logs() {
		return this.driver.manage().logs().get(Type.BROWSER);
	}

	/**
	 * Terminates the browser session.
	 *
	 * @return {promise.Thenable<void>} the promise
	 * @see IWebDriver.quit
	 */
	close() {
		return this.driver.quit()
	}

	static create(chromePath, headless) {
		const args = [
			"--disable-extensions",
			"--window-size=1366,768",
			"--no-sandbox", // required for Linux without GUI
			"--disable-gpu", // required for Windows,
			"--enable-logging --v=1", // write debug logs to file(debug.log)
		];

		if (headless) {
			args.push("--headless")
		}

		const chromeCapabilities = selenium.Capabilities.chrome()
			.set('chromeOptions', { args })
			.set("chrome.binary", chromePath)
			.set("acceptInsecureCerts", true); // if you render localhost with SSL

		const builder = new selenium.Builder()
			.forBrowser('chrome')
			.withCapabilities(chromeCapabilities);

		return builder.build().then(driver => new Renderer(driver));
	}
}

module.exports = Renderer;
