import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetsDir = path.resolve(projectRoot, 'assets');

// Source icon selected by user in dist (or fallback to public)
let sourceIconPath = path.resolve(projectRoot, 'dist', 'icon-512.png');
if (!fs.existsSync(sourceIconPath)) {
  sourceIconPath = path.resolve(projectRoot, 'public', 'icon-512.png');
}

if (!fs.existsSync(sourceIconPath)) {
  console.error(`Source icon not found at: ${sourceIconPath}`);
  process.exit(1);
}

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log(`Using source logo from: ${sourceIconPath}`);

async function extractTransparentLogo() {
  const image = sharp(sourceIconPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // 1. Find bounding box of white/non-black logo
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r > 15 || g > 15 || b > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropX = Math.max(0, minX - 1);
  const cropY = Math.max(0, minY - 1);
  const cropW = Math.min(info.width - cropX, (maxX - minX + 1) + 2);
  const cropH = Math.min(info.height - cropY, (maxY - minY + 1) + 2);

  // 2. Crop to bounding box
  const cropped = await sharp(sourceIconPath)
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 3. Convert black background to transparent alpha channel with pure white foreground
  const rgbaBuffer = Buffer.alloc(cropped.info.width * cropped.info.height * 4);
  for (let i = 0; i < cropped.info.width * cropped.info.height; i++) {
    const srcIdx = i * cropped.info.channels;
    const destIdx = i * 4;

    const r = cropped.data[srcIdx];
    const g = cropped.data[srcIdx + 1];
    const b = cropped.data[srcIdx + 2];

    // Compute luminance for anti-aliasing
    const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const alpha = luma < 10 ? 0 : luma;

    rgbaBuffer[destIdx] = 255;     // R
    rgbaBuffer[destIdx + 1] = 255; // G
    rgbaBuffer[destIdx + 2] = 255; // B
    rgbaBuffer[destIdx + 3] = alpha; // A
  }

  const transparentLogo = sharp(rgbaBuffer, {
    raw: {
      width: cropped.info.width,
      height: cropped.info.height,
      channels: 4,
    },
  });

  return { transparentLogo, width: cropped.info.width, height: cropped.info.height };
}

async function run() {
  const { transparentLogo, width: logoW, height: logoH } = await extractTransparentLogo();

  // Scale logo to width ~560px (target safe diameter in 1024x1024 adaptive icon is <= 625px)
  const targetLogoWidth = 560;
  const targetLogoHeight = Math.round(logoH * (targetLogoWidth / logoW));

  const resizedLogoBuffer = await transparentLogo
    .resize(targetLogoWidth, targetLogoHeight, {
      fit: 'contain',
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const offsetX = Math.round((1024 - targetLogoWidth) / 2);
  const offsetY = Math.round((1024 - targetLogoHeight) / 2);

  // 1. Generate assets/icon-background.png (1024x1024 solid black #000000)
  const bgPath = path.join(assetsDir, 'icon-background.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toFile(bgPath);
  console.log(`Created ${bgPath}`);

  // 2. Generate assets/icon-foreground.png (1024x1024 transparent with centered white logo)
  const fgPath = path.join(assetsDir, 'icon-foreground.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: resizedLogoBuffer,
        left: offsetX,
        top: offsetY,
      },
    ])
    .png()
    .toFile(fgPath);
  console.log(`Created ${fgPath}`);

  // 3. Generate assets/icon-only.png (1024x1024 solid black background with centered white logo)
  const iconOnlyPath = path.join(assetsDir, 'icon-only.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedLogoBuffer,
        left: offsetX,
        top: offsetY,
      },
    ])
    .png()
    .toFile(iconOnlyPath);
  console.log(`Created ${iconOnlyPath}`);

  console.log('Successfully prepared all 3 source assets from dist/icon-512.png!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
