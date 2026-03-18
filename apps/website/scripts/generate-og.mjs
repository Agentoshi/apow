import { chromium } from 'playwright';

async function generateOGImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // 2x for retina quality
  });

  console.log('Opening OG preview page...');
  await page.goto('http://localhost:3001/og-preview', {
    waitUntil: 'networkidle',
  });

  console.log('Waiting for Three.js scene to render...');
  // Wait for the canvas element
  await page.waitForSelector('canvas', { timeout: 10000 });

  // Wait for animations to settle and scene to fully render
  await page.waitForTimeout(3000);

  console.log('Taking screenshot...');
  await page.screenshot({
    path: 'public/og-image.png',
    type: 'png',
  });

  await browser.close();
  console.log('✓ OG image saved to public/og-image.png');
}

generateOGImage().catch(console.error);
