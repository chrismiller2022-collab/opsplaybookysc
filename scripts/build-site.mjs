// Builds the static site into public/ for Vercel.
//   site/     static pages and assets, copied as is
//   data/     demo CSVs, copied to public/data/
//   docs/     markdown rendered into /playbook/ and /learning-plan/
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const OUT = 'public';
rmSync(OUT, { recursive: true, force: true });
cpSync('site', OUT, { recursive: true });

const csvs = existsSync('data') ? readdirSync('data').filter(f => f.endsWith('.csv')) : [];
mkdirSync(join(OUT, 'data'), { recursive: true });
csvs.forEach(f => cpSync(join('data', f), join(OUT, 'data', f)));
if (!csvs.length) console.warn('warning: no CSVs in data/; the dashboard demo will show "missing" states');

const NAV = [
  ['/dashboard/', 'Command Center'],
  ['/playbook/', 'Operations Playbook'],
  ['/learning-plan/', 'Platform Learning Plan']
];

const page = ({ title, description, path, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<nav class="site-nav">
  <a class="brand" href="/">Sports Office Admin Prep</a>
${NAV.map(([href, label]) => `  <a href="${href}"${href === path ? ' aria-current="page"' : ''}>${label}</a>`).join('\n')}
</nav>
<main class="prose">
${body}
</main>
<footer class="site-foot">All clubs, people and numbers on this site are fictional.</footer>
</body>
</html>
`;

const DOCS = [
  { file: 'docs/03-riverbend-operations-playbook.md', path: '/playbook/', title: 'Riverbend YSC Operations Playbook',
    description: 'A sample operations playbook for a fictional youth soccer club, run by a virtual administrator.' },
  { file: 'docs/02-platform-learning-plan.md', path: '/learning-plan/', title: 'Sports Platform Learning Plan',
    description: 'A two-week, hands-on plan for learning six youth sports management platforms.' }
];

for (const d of DOCS) {
  const body = existsSync(d.file)
    ? marked.parse(readFileSync(d.file, 'utf8'))
    : `<h1>${d.title}</h1>\n<p class="lede">Coming soon.</p>`;
  const dir = join(OUT, d.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page({ ...d, body }));
  if (!existsSync(d.file)) console.warn(`warning: ${d.file} not found; wrote a placeholder page`);
}

console.log(`built ${OUT}/ with ${csvs.length} CSVs`);
