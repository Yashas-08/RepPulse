import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sourceFile = path.resolve(__dirname, '../logo-source.svg');
if (!fs.existsSync(sourceFile)) {
  throw new Error('Source logo file logo-source.svg must exist in the project root.');
}

const outputs = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512 },
];

async function main() {
  const image = sharp(sourceFile).resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } });

  const generatedPngs: Record<string, string> = {};

  for (const output of outputs) {
    const outPath = path.join(publicDir, output.name);
    await image
      .clone()
      .resize(output.size, output.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png({ quality: 100 })
      .toFile(outPath);
    generatedPngs[output.name] = outPath;
    console.log(`Created ${output.name}`);
  }

  const faviconPng = path.join(publicDir, 'favicon-32x32.png');
  const faviconIcoPath = path.join(publicDir, 'favicon.ico');
  const icoBuffer = await pngToIco([faviconPng]);
  fs.writeFileSync(faviconIcoPath, icoBuffer);
  console.log('Created favicon.ico');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
