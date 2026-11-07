import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetsDir = path.resolve(projectRoot, 'assets');

// Source: The original 1024x1024 favicon master artwork
const sourcePath = path.resolve(assetsDir, 'source-favicon-1024.png');
if (!fs.existsSync(sourcePath)) {
  throw new Error(`Source favicon file not found at: ${sourcePath}`);
}

async function run() {
  console.log(`Processing original favicon artwork from: ${sourcePath}`);

  // 1. Crop symmetrically around the circular logo mark:
  // Circular arcs vertical range: y=172 to y=812 (height 640px, center y=492)
  // Circular arcs horizontal range: x=219 to x=810 (width 592px, center x=514.5)
  // Italic text "REPPULSE" horizontal range: x=178 to x=868
  // Symmetrical crop centered at (515, 492):
  const cropLeft = 157;
  const cropTop = 165;
  const cropWidth = 716;  // 157 + 716/2 = 515 (exact center of arcs)
  const cropHeight = 654; // 165 + 654/2 = 492 (exact center of arcs)

  console.log(`Cropping logo region: left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}`);

  const cropped = await sharp(sourcePath)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Convert to RGBA buffer: pure white logo with antialiased alpha, transparent background
  const rgbaBuffer = Buffer.alloc(cropped.info.width * cropped.info.height * 4);
  for (let i = 0; i < cropped.info.width * cropped.info.height; i++) {
    const srcIdx = i * cropped.info.channels;
    const destIdx = i * 4;

    const r = cropped.data[srcIdx];
    const g = cropped.data[srcIdx + 1];
    const b = cropped.data[srcIdx + 2];

    const luma = Math.max(r, g, b);
    const alpha = luma < 15 ? 0 : luma;

    rgbaBuffer[destIdx] = 255;       // R
    rgbaBuffer[destIdx + 1] = 255;   // G
    rgbaBuffer[destIdx + 2] = 255;   // B
    rgbaBuffer[destIdx + 3] = alpha; // Alpha
  }

  const transparentLogo = sharp(rgbaBuffer, {
    raw: {
      width: cropped.info.width,
      height: cropped.info.height,
      channels: 4,
    },
  });

  // 3. Scale down uniformly to fit inside Android Adaptive Icon safe zone:
  // Android safe zone is 66dp of 108dp = 61.1% of canvas = 625px diameter.
  // Original arcs diameter is 640px.
  // We scale to arcs diameter = 540px (scale factor s = 540 / 640 = 0.84375).
  // This leaves 42.5px safe margin from the safe zone edge, preventing any clipping on any device.
  const scale = 540 / 640;
  const targetW = Math.round(cropWidth * scale);   // ~604px
  const targetH = Math.round(cropHeight * scale);  // ~552px

  console.log(`Resizing logo to fit safe zone: ${targetW}x${targetH} (scale=${scale.toFixed(4)})`);

  const resizedLogoBuffer = await transparentLogo
    .resize(targetW, targetH, {
      fit: 'contain',
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const offsetX = Math.round((1024 - targetW) / 2); // 210
  const offsetY = Math.round((1024 - targetH) / 2); // 236

  // 4. Generate assets/icon-background.png (1024x1024 solid black #000000)
  const bgPath = path.join(assetsDir, 'icon-background.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(bgPath);
  console.log(`Created ${bgPath}`);

  // 5. Generate assets/icon-foreground.png (1024x1024 transparent with centered logo)
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
    .png({ compressionLevel: 9 })
    .toFile(fgPath);
  console.log(`Created ${fgPath}`);

  // 6. Generate assets/icon-only.png (1024x1024 solid black with centered logo)
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
    .png({ compressionLevel: 9 })
    .toFile(iconOnlyPath);
  console.log(`Created ${iconOnlyPath}`);

  console.log('Successfully generated all 3 icon assets directly from original favicon artwork!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
