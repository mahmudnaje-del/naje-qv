import fs from 'fs';
import path from 'path';

async function verify() {
  const chromium = (await import('@sparticuz/chromium')).default;
  const puppeteer = (await import('puppeteer-core')).default;

  const pdfPath = path.join(process.cwd(), 'output.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error("output.pdf does not exist!");
    process.exit(1);
  }

  const stat = fs.statSync(pdfPath);
  console.log(`output.pdf size: ${stat.size} bytes`);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  const fileUrl = `file://${pdfPath}`;
  
  // Render page 1 of PDF using browser's built-in PDF viewer or rendering
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.screenshot({ path: '/tmp/p-01.jpg', type: 'jpeg', quality: 80 });
  console.log("Saved page 1 screenshot to /tmp/p-01.jpg");

  await browser.close();
}

verify().catch(e => console.error("Error verifying PDF:", e));
