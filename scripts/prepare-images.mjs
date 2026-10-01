import sharp from 'sharp';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep this explicit list in the same order as the 27 supplied project photos.
const sourceFiles = [
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-1bf07a52-f5d3-457b-92ab-2c6c636849e7.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-b96784cd-d739-4934-9090-8f0b34ccda24.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-0ebee15c-b906-4e2d-9996-61348d3645dd.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-c97c6443-9e56-41d1-a4a4-cb993864fda1.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-3a4f76dc-a4eb-4d44-bf37-35f21c9c404c.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-1ff8ea40-4af2-411b-ab4c-addcdecb3b2c.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-b6be4956-a5c6-4535-b3e3-3ff323f32969.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-3f71b0f1-dfd4-4c8c-b843-28ae976c3637.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-2440bada-d3b7-4748-86d4-23ebce6de913.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-5c444e83-f14e-4f44-9a14-fd024ecfb653.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-7eecb85d-66dc-46bc-b886-98aa94fbbf3a.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-10d33d77-54f5-48e4-a92f-223db3d59b61.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-d3872b4c-74f8-49cc-a102-2353ddf496ff.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-a250eecc-47d9-452b-a734-da02910daf65.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-0fea4823-6485-4fea-9c4e-40a6cd1bacd3.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-ea476fda-dde4-4782-b9f1-38731e66f34b.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-67f12a9e-a43a-4c8c-9018-6ed43d603c59.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-204dd56c-a678-48d6-b96f-289593768d87.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-e68b7976-e47e-4c7f-b4d7-b630504a43dd.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-838ece10-d438-406c-85fd-d8d0f70a4d7b.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-f1cd5fdc-8a91-44f2-8d69-87805d21c2fc.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-80278e9a-3ee0-416a-b408-718a97ce3cd6.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-6a206266-2334-4adc-81a0-2e613a6cf97e.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-9e981da4-0ea3-4a49-b627-23f31b2d2ecb.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-037eeed1-e1e1-43de-8e8c-761875c0ae52.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-45f128db-2da1-4555-a183-04c0606a6288.png',
  'C:/Users/User/AppData/Local/Temp/codex-clipboard-a9c4877a-cb44-4f65-8df1-0afa878ea699.png',
];

const outputDirectory = fileURLToPath(new URL('../public/images/', import.meta.url));
await mkdir(outputDirectory, { recursive: true });
const manifest = [];

for (const [index, source] of sourceFiles.entries()) {
  const number = String(index + 1).padStart(2, '0');
  const filename = `image-${number}.webp`;
  const thumbFilename = `image-${number}-thumb.webp`;
  const original = await sharp(source).metadata();
  const sourceStat = await stat(source);
  const full = await sharp(source)
    .rotate()
    .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72, effort: 6 })
    .toFile(path.join(outputDirectory, filename));
  const thumb = await sharp(source)
    .rotate()
    .resize(700, 700, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 68, effort: 6 })
    .toFile(path.join(outputDirectory, thumbFilename));

  manifest.push({
    id: index + 1,
    src: `/images/${filename}`,
    thumbnail: `/images/${thumbFilename}`,
    width: full.width,
    height: full.height,
    bytes: full.size,
    thumbnailWidth: thumb.width,
    thumbnailHeight: thumb.height,
    thumbnailBytes: thumb.size,
    originalWidth: original.width,
    originalHeight: original.height,
    originalBytes: sourceStat.size,
  });
}

await writeFile(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
const totalBytes = manifest.reduce((sum, photo) => sum + photo.bytes + photo.thumbnailBytes, 0);
const originalBytes = manifest.reduce((sum, photo) => sum + photo.originalBytes, 0);
console.log(JSON.stringify({ photos: manifest.length, webpFiles: manifest.length * 2, originalBytes, totalBytes }));
