const fs = require('node:fs');
const sharp = require('sharp');
const LIMIT = 98000;

async function main() {
  const files = ['.', 'images'].flatMap(dir => fs.readdirSync(dir)
    .filter(name => name.endsWith('.webp'))
    .map(name => dir === '.' ? name : `${dir}/${name}`));
  const report = [];
  for (const file of files) {
    const before = fs.statSync(file).size;
    if (before < LIMIT) {
      report.push({ file, before, after: before, unchanged: true });
      continue;
    }
    const stem = file.slice(0, -5);
    const source = [stem, `${stem}.png`, `${stem}.jpg`, `${stem}.jpeg`]
      .find(candidate => /\.(png|jpe?g)$/i.test(candidate) && fs.existsSync(candidate));
    if (!source) throw new Error(`Original missing: ${file}`);
    const metadata = await sharp(source).metadata();
    let width = metadata.width;
    const encode = quality => sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 100, effort: 6, smartSubsample: true }).toBuffer();
    let buffer = await encode(75);
    while (buffer.length >= LIMIT) {
      width = Math.max(1, Math.floor(width * 0.85));
      buffer = await encode(75);
    }
    let quality = 75;
    let low = 76;
    let high = 100;
    while (low <= high) {
      const trialQuality = Math.floor((low + high) / 2);
      const trial = await encode(trialQuality);
      if (trial.length < LIMIT) {
        buffer = trial;
        quality = trialQuality;
        low = trialQuality + 1;
      } else high = trialQuality - 1;
    }
    await sharp(buffer).raw().toBuffer();
    fs.writeFileSync(file, buffer);
    report.push({ file, before, after: buffer.length, sourceWidth: metadata.width, width, quality });
    console.log(`${file}: ${buffer.length} bytes, width ${width}, quality ${quality}`);
  }
  fs.writeFileSync('image-compression-report.json', JSON.stringify(report, null, 2) + '\n');
  for (const file of files) {
    if (fs.statSync(file).size >= LIMIT) throw new Error(`Over limit: ${file}`);
    await sharp(file).raw().toBuffer();
  }
  console.log(`Verified all ${files.length} WebP images are below ${LIMIT} bytes and decode successfully.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
