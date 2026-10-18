import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') throw new Error('Invalid output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'public'), output, { recursive: true });
// Version every module together so cached imports cannot mix two deployments.
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => entry.isDirectory() ? listFiles(path.join(directory, entry.name)) : path.join(directory, entry.name)));
  return files.flat().sort();
}
const source = path.join(root, 'public');
const files = await listFiles(source);
const digest = createHash('sha256');
for (const file of files) digest.update(path.relative(source, file).split(path.sep).join('/')).update(await readFile(file));
const version = digest.digest('hex').slice(0, 12);
for (const file of files.filter(file => file.endsWith('.js'))) {
  const code = (await readFile(file, 'utf8')).replace(/((?:from\s+|import\s*)['"])(\.[^'"]+\.js)(['"])/g, `$1$2?v=${version}$3`);
  await writeFile(path.join(output, path.relative(source, file)), code);
}
const html = (await readFile(path.join(source, 'index.html'), 'utf8'))
  .replace('./assets/styles.css', `./assets/styles.css?v=${version}`)
  .replace('./js/app.js', `./js/app.js?v=${version}`);
await writeFile(path.join(output, 'index.html'), html);
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Static site ready in dist/ (${version})`);
