const fs = require('node:fs');
const sharp = require('sharp');

async function main() {
  const sources = ['.', 'images'].flatMap(dir => fs.readdirSync(dir)
    .filter(name => /\.(png|jpe?g)$/i.test(name))
    .map(name => dir === '.' ? name : `${dir}/${name}`));
  const replacements = new Map();
  for (const source of sources) {
    const stem = source.replace(/\.[^.]+$/, '');
    const target = /\.png$/i.test(source) || !fs.existsSync(`${stem}.png`)
      ? `${stem}.webp` : `${source}.webp`;
    await sharp(source).webp({ lossless: true, effort: 6 }).toFile(target);
    const original = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const converted = await sharp(target).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (original.info.width !== converted.info.width || original.info.height !== converted.info.height)
      throw new Error(`Dimensions changed: ${source}`);
    for (let i = 0; i < original.data.length; i += 4) {
      if (original.data[i + 3] !== converted.data[i + 3] ||
          (original.data[i + 3] !== 0 && !original.data.subarray(i, i + 3).equals(converted.data.subarray(i, i + 3))))
        throw new Error(`Visible pixels changed: ${source}`);
    }
    replacements.set(source, target);
    console.log(`Verified ${target}`);
  }
  for (const file of fs.readdirSync('.').filter(name => /\.(html|css|js)$/i.test(name))) {
    const bytes = fs.readFileSync(file);
    const encoding = bytes.includes(0) ? 'utf16le' : 'utf8';
    const original = bytes.toString(encoding);
    let updated = original.replace(/(["'])([^"'\s]+\.(?:png|jpe?g))\1/g,
      (match, quote, source) => replacements.has(source) ? `${quote}${replacements.get(source)}${quote}` : match);
    if (file === 'all-images.html') updated = updated.replace('images.forEach((src)', '[...new Set(images)].forEach((src)');
    if (updated !== original) fs.writeFileSync(file, updated, encoding);
  }
  console.log(`Converted and verified ${sources.length} images; website references updated.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
