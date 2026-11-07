import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetsDir = path.resolve(projectRoot, 'assets');
const resDir = path.resolve(projectRoot, 'android/app/src/main/res');

// Source: The authentic master favicon artwork from RepPulse-favicon-files.zip
const sourcePath = path.resolve(assetsDir, 'favicon-source-1024.png');
if (!fs.existsSync(sourcePath)) {
  throw new Error(`Master favicon source not found at: ${sourcePath}`);
}

interface DensityConfig {
  name: string;
  legacySize: number;       // 48dp * density (legacy ic_launcher.png)
  adaptiveSize: number;     // 108dp * density (adaptive ic_launcher_foreground.png)
}

const DENSITIES: DensityConfig[] = [
  { name: 'mipmap-ldpi', legacySize: 36, adaptiveSize: 81 },
  { name: 'mipmap-mdpi', legacySize: 48, adaptiveSize: 108 },
  { name: 'mipmap-hdpi', legacySize: 72, adaptiveSize: 162 },
  { name: 'mipmap-xhdpi', legacySize: 96, adaptiveSize: 216 },
  { name: 'mipmap-xxhdpi', legacySize: 144, adaptiveSize: 324 },
  { name: 'mipmap-xxxhdpi', legacySize: 192, adaptiveSize: 432 },
];

async function run() {
  console.log(`Processing high-res master favicon from: ${sourcePath}`);

  // 1. Symmetrical crop around the circular logo mark:
  // Arcs vertical range: y=203 to y=1018 (height 816px, center y=610.5)
  // Arcs horizontal range: x=246 to x=994 (width 748px, center x=620)
  // Italic text horizontal range: x=204 to x=1064
  // Crop centered at (620, 610.5):
  const cropLeft = 170;
  const cropTop = 190;
  const cropWidth = 900;  // 170 + 450 = 620 (exact horizontal center)
  const cropHeight = 840; // 190 + 420 = 610 (exact vertical center)

  console.log(`Extracting logo: left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}`);

  const cropped = await sharp(sourcePath)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Convert to RGBA buffer: pure white logo (#ffffff) with antialiased alpha, transparent background
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

  // Save full-res transparent cropped logo buffer for high-fidelity resizing
  const masterCroppedBuffer = await transparentLogo.png({ compressionLevel: 9 }).toBuffer();

  // Helper to generate a centered icon on any canvas size
  async function renderCenteredIcon(
    canvasSize: number, 
    arcDiameterRatio: number, 
    bgColor: { r: number; g: number; b: number; alpha: number }
  ): Promise<Buffer> {
    const targetArcDiameter = Math.round(canvasSize * arcDiameterRatio);
    const scale = targetArcDiameter / 816; // 816px is original arc diameter
    const targetW = Math.round(cropWidth * scale);
    const targetH = Math.round(cropHeight * scale);

    const resizedLogo = await sharp(masterCroppedBuffer)
      .resize(targetW, targetH, {
        fit: 'contain',
        kernel: sharp.kernel.lanczos3,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const offsetX = Math.round((canvasSize - targetW) / 2);
    const offsetY = Math.round((canvasSize - targetH) / 2);

    return sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: bgColor,
      },
    })
      .composite([{ input: resizedLogo, left: offsetX, top: offsetY }])
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  // 3. Generate 1024x1024 source assets in assets/
  // Safe zone diameter is 66dp of 108dp = 61.1%.
  // We use 56.5% ratio for arcs so logo has ~5% comfortable safe padding inside the mask.
  const arcRatioAdaptive = 60 / 108; // ~0.5555
  const arcRatioLegacy = 0.82;       // Legacy icons fill more of the canvas

  console.log('Generating 1024x1024 source assets in assets/...');

  // assets/icon-background.png (solid black)
  const bg1024 = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  }).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'icon-background.png'), bg1024);

  // assets/icon-foreground.png (transparent background, centered logo)
  const fg1024 = await renderCenteredIcon(1024, arcRatioAdaptive, { r: 0, g: 0, b: 0, alpha: 0 });
  fs.writeFileSync(path.join(assetsDir, 'icon-foreground.png'), fg1024);

  // assets/icon-only.png (solid black background, centered logo)
  const iconOnly1024 = await renderCenteredIcon(1024, arcRatioLegacy, { r: 0, g: 0, b: 0, alpha: 1 });
  fs.writeFileSync(path.join(assetsDir, 'icon-only.png'), iconOnly1024);

  console.log('Successfully created assets/icon-background.png, assets/icon-foreground.png, assets/icon-only.png');

  // 4. Generate all Android density mipmaps directly at native resolutions
  console.log('Generating native-resolution Android density mipmaps...');
  for (const d of DENSITIES) {
    const dirPath = path.join(resDir, d.name);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Adaptive foreground (108dp: 81px to 432px) - transparent
    const fgBuf = await renderCenteredIcon(d.adaptiveSize, arcRatioAdaptive, { r: 0, g: 0, b: 0, alpha: 0 });
    fs.writeFileSync(path.join(dirPath, 'ic_launcher_foreground.png'), fgBuf);

    // Adaptive background (108dp: 81px to 432px) - solid black
    const bgBuf = await sharp({
      create: {
        width: d.adaptiveSize,
        height: d.adaptiveSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    }).png({ compressionLevel: 9 }).toBuffer();
    fs.writeFileSync(path.join(dirPath, 'ic_launcher_background.png'), bgBuf);

    // Legacy square launcher icon (48dp: 36px to 192px) - solid black
    const legacyBuf = await renderCenteredIcon(d.legacySize, arcRatioLegacy, { r: 0, g: 0, b: 0, alpha: 1 });
    fs.writeFileSync(path.join(dirPath, 'ic_launcher.png'), legacyBuf);

    // Legacy round launcher icon (48dp: 36px to 192px) - circular masked
    const roundMask = Buffer.from(
      `<svg width="${d.legacySize}" height="${d.legacySize}"><circle cx="${d.legacySize / 2}" cy="${d.legacySize / 2}" r="${d.legacySize / 2}" fill="#fff" /></svg>`
    );
    const roundBuf = await sharp(legacyBuf)
      .composite([{ input: roundMask, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(dirPath, 'ic_launcher_round.png'), roundBuf);

    console.log(`Generated ${d.name}: adaptive=${d.adaptiveSize}x${d.adaptiveSize}, legacy=${d.legacySize}x${d.legacySize}`);
  }

  // 5. Ensure adaptive icon XMLs in mipmap-anydpi-v26 reference clean drawables
  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) {
    fs.mkdirSync(anydpiDir, { recursive: true });
  }

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf8');

  // Ensure values/ic_launcher_background.xml is #000000
  const valuesDir = path.join(resDir, 'values');
  const colorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#000000</color>
</resources>
`;
  fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), colorXml, 'utf8');

  console.log('Adaptive icon XMLs and colors verified!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
