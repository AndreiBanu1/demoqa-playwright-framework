import { readdirSync } from 'node:fs';
import path from 'node:path';

const PROJECT_TREES = [
  { dir: 'src/tests/api', suffix: '.api.spec.ts' },
  { dir: 'src/tests/ui', suffix: '.ui.spec.ts' },
];

function specsIn(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...specsIn(full));
    } else if (entry.name.endsWith('.spec.ts')) {
      found.push(full);
    }
  }
  return found;
}

const problems = [];
const claimed = new Set();

for (const { dir, suffix } of PROJECT_TREES) {
  for (const file of specsIn(dir)) {
    claimed.add(file);
    if (!file.endsWith(suffix)) {
      problems.push(`${file}\n      is under ${dir}/ so it must be named *${suffix}`);
    }
  }
}

for (const file of specsIn('src')) {
  if (!claimed.has(file)) {
    problems.push(
      `${file}\n      is outside src/tests/{api,ui} — no Playwright project will run it`,
    );
  }
}

if (problems.length > 0) {
  console.error('Spec placement check FAILED:\n');
  for (const problem of problems) {
    console.error(`  ✗ ${problem}\n`);
  }
  console.error('These files would be silently skipped by `playwright test`.');
  process.exit(1);
}

console.log(`Spec placement OK — ${claimed.size} spec files, all claimed by a project.`);
