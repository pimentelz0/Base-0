import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Vector SVG for Base 0 App Icon:
// Solid vibrant electric blue background (#007AFF) with bold black '0' in the center,
// matching the top navbar icon inside the app (bg-[#007AFF] text-black font-black)
const getIconSvg = (isMaskable = false) => {
  // For maskable icon (Android circular/adaptive icons), scale the '0' to ~0.76 to guarantee
  // it sits safely inside the 80% diameter safe-zone circle without touching edges.
  // For standard/iOS icon, scale 0.90 gives the ideal bold badge proportion.
  const scale = isMaskable ? 0.76 : 0.90;
  const translate = (512 * (1 - scale)) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <clipPath id="safeClip">
      <rect width="512" height="512" />
    </clipPath>
  </defs>

  <!-- Solid vibrant Base 0 Blue background matching navbar bg-[#007AFF] -->
  <rect width="512" height="512" fill="#007AFF" />

  <!-- Bold Black Zero '0' Vector Path -->
  <g transform="translate(${translate}, ${translate}) scale(${scale})">
    <path
      d="M 256 124
         C 324 124, 362 170, 362 256
         C 362 342, 324 388, 256 388
         C 188 388, 150 342, 150 256
         C 150 170, 188 124, 256 124 Z
         M 256 186
         C 218 186, 212 216, 212 256
         C 212 296, 218 326, 256 326
         C 294 326, 300 296, 300 256
         C 300 216, 294 186, 256 186 Z"
      fill="#000000"
    />
  </g>
</svg>`;
};

async function generateIcons() {
  console.log('Generating Base 0 mobile app icons (#007AFF background + black 0)...');

  const standardSvg = Buffer.from(getIconSvg(false));
  const maskableSvg = Buffer.from(getIconSvg(true));

  // 1. Vector SVG in public/icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  console.log('✔ public/icon.svg updated');

  // 2. Apple Touch Icon (180x180 PNG) for iOS Safari "Add to Home Screen"
  await sharp(standardSvg)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✔ public/apple-touch-icon.png (180x180) created');

  // 3. Apple Touch Icon Precomposed
  await sharp(standardSvg)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
  console.log('✔ public/apple-touch-icon-precomposed.png (180x180) created');

  // 4. Android / Chrome PWA Standard 192x192
  await sharp(standardSvg)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✔ public/pwa-192x192.png (192x192) created');

  // 5. Android / Chrome PWA Standard 512x512
  await sharp(standardSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✔ public/pwa-512x512.png (512x512) created');

  // 6. Android Maskable Icon 512x512 (Safe-zone padded)
  await sharp(maskableSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✔ public/pwa-maskable-512x512.png (512x512 maskable) created');

  // 7. Desktop Favicons (32x32 and 16x16)
  await sharp(standardSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✔ public/favicon-32x32.png (32x32) created');

  await sharp(standardSvg)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✔ public/favicon-16x16.png (16x16) created');

  // 8. Favicon.ico
  await sharp(standardSvg)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✔ public/favicon.ico created');

  console.log('All Base 0 icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
