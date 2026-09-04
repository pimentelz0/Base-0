import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Standard High-Resolution Vector SVG for Base 0 Icon (1:1 aspect ratio, 512x512)
// Full-bleed background ensures iOS squircle clipper and Android maskable don't produce transparent corner artifacts.
const getIconSvg = (isMaskable = false) => {
  // For maskable icon, scale content down slightly to ensure 15% safe-zone margin on all sides
  const scale = isMaskable ? 0.78 : 0.88;
  const translate = (512 * (1 - scale)) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Dark Athletic Tech Canvas Background Gradient -->
    <linearGradient id="baseBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b101d" />
      <stop offset="50%" stop-color="#050811" />
      <stop offset="100%" stop-color="#010204" />
    </linearGradient>

    <!-- Electric Cyan to Cobalt Blue Neon Gradient -->
    <linearGradient id="neonBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F5FF" />
      <stop offset="45%" stop-color="#007AFF" />
      <stop offset="100%" stop-color="#004ae6" />
    </linearGradient>

    <!-- Outer Tech Border Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F5FF" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#1e293b" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#007AFF" stop-opacity="0.3" />
    </linearGradient>

    <!-- Center Ambient Glow -->
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#007AFF" stop-opacity="0.28" />
      <stop offset="50%" stop-color="#00F5FF" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Neon Glow Filter -->
    <filter id="glowFilter" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="9" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full-bleed background with no transparent corners for native phone home screen compatibility -->
  <rect width="512" height="512" fill="url(#baseBgGrad)" />

  <!-- Inner subtle border outline -->
  <rect x="10" y="10" width="492" height="492" rx="90" fill="none" stroke="url(#borderGrad)" stroke-width="2" opacity="0.6" />

  <!-- Core Content Container with Dynamic Scaling for Maskable vs Standard -->
  <g transform="translate(${translate}, ${translate}) scale(${scale})">
    <!-- Center Radial Glow -->
    <circle cx="256" cy="256" r="210" fill="url(#ambientGlow)" />

    <!-- Outer Tech Sub-Ring -->
    <circle cx="256" cy="256" r="172" fill="none" stroke="#162035" stroke-width="5" opacity="0.8" />
    <circle cx="256" cy="256" r="172" fill="none" stroke="#00F5FF" stroke-width="5" stroke-dasharray="16 28" opacity="0.4" />

    <!-- Main Glowing Neon Orbit Ring Arc -->
    <circle
      cx="256"
      cy="256"
      r="146"
      fill="none"
      stroke="url(#neonBlue)"
      stroke-width="24"
      stroke-linecap="round"
      stroke-dasharray="680 240"
      filter="url(#glowFilter)"
    />

    <!-- Orbit Satellite Node Accent (Electric Cyan Core) -->
    <circle cx="256" cy="110" r="18" fill="#00F5FF" filter="url(#glowFilter)" />
    <circle cx="256" cy="110" r="9" fill="#FFFFFF" />

    <!-- Lower Orbit Counter-Accent Dot -->
    <circle cx="158" cy="360" r="6" fill="#007AFF" opacity="0.8" />
    <circle cx="354" cy="360" r="6" fill="#007AFF" opacity="0.8" />

    <!-- Central "0" Emblem: Pure Geometric Athletic Vector Path -->
    <!-- Outer contour of 0 -->
    <path
      d="M 256 160
         C 298 160, 320 188, 320 242
         L 320 262
         C 320 316, 298 344, 256 344
         C 214 344, 192 316, 192 262
         L 192 242
         C 192 188, 214 160, 256 160 Z
         M 256 194
         C 238 194, 226 210, 226 244
         L 226 260
         C 226 294, 238 310, 256 310
         C 274 310, 286 294, 286 260
         L 286 244
         C 286 210, 274 194, 256 194 Z"
      fill="#FFFFFF"
    />

    <!-- Athletic "BASE" Wordmark beneath 0 -->
    <text
      x="256"
      y="388"
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Outfit', sans-serif"
      font-weight="800"
      font-size="28"
      fill="#00F5FF"
      text-anchor="middle"
      letter-spacing="9"
    >BASE</text>
  </g>
</svg>`;
};

async function generateIcons() {
  console.log('Generating mobile home screen and PWA icons in /public...');

  const standardSvg = Buffer.from(getIconSvg(false));
  const maskableSvg = Buffer.from(getIconSvg(true));

  // 1. Update public/icon.svg with crisp standard version
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  console.log('✔ public/icon.svg updated');

  // 2. Apple Touch Icon (180x180 PNG) for iOS Safari Home Screen
  await sharp(standardSvg)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✔ public/apple-touch-icon.png (180x180) created');

  // 3. Apple Touch Icon Precomposed (for maximum iOS compatibility)
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

  // 6. Android Maskable Icon 512x512 (Safe-zone padded for circles & squircles)
  await sharp(maskableSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✔ public/pwa-maskable-512x512.png (512x512 maskable) created');

  // 7. Desktop Browser Favicons (32x32 and 16x16)
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

  // 8. Legacy favicon.ico (using 32x32 PNG container or direct rename)
  await sharp(standardSvg)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✔ public/favicon.ico created');

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
