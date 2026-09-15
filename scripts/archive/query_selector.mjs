import fs from 'fs';
import { JSDOM } from 'jsdom';

// We can't really query the React source code with querySelector directly.
// But we could fetch the generated HTML from the local dev server.
async function run() {
  try {
    const res = await fetch('http://localhost:3000');
    const html = await res.text();
    const dom = new JSDOM(html);
    const el = dom.window.document.querySelector("div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)");
    console.log("Element:", el ? el.outerHTML : "Not found");
  } catch (e) {
    console.error(e);
  }
}
run();
