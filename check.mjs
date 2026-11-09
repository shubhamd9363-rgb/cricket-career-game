import { readdir, readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'maidan-check-'));
const errors = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function nodeCheck(file) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    errors.push(`${relative(root, file)}\n${result.stderr || result.stdout}`);
  }
}

try {
  const files = await walk(root);
  for (const file of files.filter((f) => extname(f) === '.js' || extname(f) === '.mjs')) nodeCheck(file);

  const htmlPath = join(root, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  for (let i = 0; i < inlineScripts.length; i += 1) {
    const tempFile = join(temp, `inline-${i}.cjs`);
    await writeFile(tempFile, inlineScripts[i][1], 'utf8');
    nodeCheck(tempFile);
  }

  const localRefs = [];
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    const ref = match[1];
    if (/^(?:https?:|data:|#|mailto:|tel:|javascript:)/i.test(ref)) continue;
    localRefs.push(ref.split(/[?#]/)[0]);
  }
  for (const ref of localRefs) {
    if (!ref || ref.startsWith('/')) continue;
    const target = join(root, ref);
    try { await readFile(target); }
    catch { errors.push(`Missing local HTML reference: ${ref}`); }
  }

  const serviceWorker = await readFile(join(root, 'service-worker.js'), 'utf8');
  const shellMatch = serviceWorker.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  if (!shellMatch) errors.push('service-worker.js is missing its APP_SHELL list.');
  else {
    for (const match of shellMatch[1].matchAll(/['"](\.\/[^'"]+)['"]/g)) {
      const ref = match[1].replace(/^\.\//, '');
      if (!ref) continue;
      try { await readFile(join(root, ref)); }
      catch { errors.push(`Missing service-worker APP_SHELL reference: ${ref}`); }
    }
  }

  const required = [
    'index.html', 'manifest.webmanifest', 'service-worker.js',
    'standalone.js', 'interactive-cricket.js', 'cloud-config.js',
    'cloud-sync.js', 'maidan-icon.svg', 'icon-192.png', 'icon-512.png',
    'schema.sql'
  ];
  for (const file of required) {
    try { await readFile(join(root, file)); }
    catch { errors.push(`Required project file missing: ${file}`); }
  }

  if (errors.length) {
    console.error(`Maidan source check failed (${errors.length} issue(s)):`);
    console.error(errors.join('\n\n'));
    process.exitCode = 1;
  } else {
    console.log('Maidan source check passed.');
    console.log(`Checked ${files.filter((f) => extname(f) === '.js' || extname(f) === '.mjs').length} JavaScript files, ${inlineScripts.length} inline script block(s), ${localRefs.length} local HTML references, and required PWA/cloud files.`);
    console.log('This is a syntax and packaging check, not a full gameplay or device test.');
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
