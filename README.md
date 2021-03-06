# Prerender-Example

an example for prerender html page using nodejs + selenium + chrome.

# Requirements

* NodeJs >= 9
* Chrome Driver ([download page](https://sites.google.com/a/chromium.org/chromedriver/)) in working directory or `PATH` 
* Chrome browser that matches driver version

# Run example

```shell
npm install
node bin/www /path/to/chrome
```

open [http://localhost:3000/page.html](http://localhost:3000/page.html), you can see the result render by browser. 
If you checked `Disable JavaScript` in browser developer tools, the page will not be rendered.

open [http://localhost:3000/page.html?prerender=true](http://localhost:3000/page.html?prerender=true), the page will
 prerendered on server, and don't need to run render scripts on the client.

# Usage

renderer a page:

```javascript
const Renderer = require("kx-prerender/lib/prerender");
const renderer = await Renderer.create("/path/to/chrome", false);
const html = await renderer.render("http://example.com");
```

**Notice: if you will build a service on linux, don't run as root, which will cause chrome to crash unpredictable.**
