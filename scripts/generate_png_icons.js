import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

async function generate() {
  const logoAppSvg = fs.readFileSync(path.join(publicDir, 'logo-app.svg'));
  const ogImageSvg = fs.readFileSync(path.join(publicDir, 'og-image.svg'));

  await sharp(logoAppSvg).resize(512, 512).png().toFile(path.join(publicDir, 'logo-512.png'));
  console.log('Generated logo-512.png');

  await sharp(logoAppSvg).resize(192, 192).png().toFile(path.join(publicDir, 'logo-192.png'));
  console.log('Generated logo-192.png');

  await sharp(logoAppSvg).resize(128, 128).png().toFile(path.join(publicDir, 'logo-128.png'));
  console.log('Generated logo-128.png');

  await sharp(logoAppSvg).resize(64, 64).png().toFile(path.join(publicDir, 'logo-64.png'));
  console.log('Generated logo-64.png');

  await sharp(logoAppSvg).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32.png'));
  console.log('Generated favicon-32.png');

  await sharp(logoAppSvg).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16.png'));
  console.log('Generated favicon-16.png');

  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient>
    <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EBC85A"/><stop offset="100%" stop-color="#D4AF37"/></linearGradient>
    <radialGradient id="bgG" cx="50%" cy="34%" r="72%"><stop offset="0%" stop-color="#181B26"/><stop offset="100%" stop-color="#0E0F13"/></radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bgG)"/>
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <rect x="106.0" y="146.0" width="61.1" height="61.1" rx="13.4" fill="url(#gV)"/>
    <rect x="106.0" y="220.8" width="61.1" height="61.1" rx="13.4" fill="url(#gV)"/>
    <rect x="106.0" y="295.6" width="61.1" height="61.1" rx="13.4" fill="url(#gV)"/>
    <rect x="344.9" y="146.0" width="61.1" height="61.1" rx="13.4" fill="url(#gV)"/>
    <rect x="344.9" y="220.8" width="61.1" height="61.1" rx="13.4" fill="url(#gV)"/>
    <rect x="344.9" y="295.6" width="61.1" height="61.1" rx="13.4" fill="url(#gV)"/>
    <rect x="188.8" y="210.2" width="61.1" height="61.1" rx="13.4" fill="url(#gG)"/>
    <rect x="262.1" y="243.8" width="61.1" height="61.1" rx="13.4" fill="url(#gG)"/>
  </g>
</svg>`;
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'logo-512-maskable.png'));
  console.log('Generated logo-512-maskable.png');

  await sharp(ogImageSvg).resize(1200, 630).png().toFile(path.join(publicDir, 'og-image.png'));
  console.log('Generated og-image.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
