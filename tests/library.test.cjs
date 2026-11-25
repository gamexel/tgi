const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const S = require('../busqueda.js');
const sandbox = { window: {} };
for (const file of fs.readdirSync(path.join(root, 'datos')).sort()) vm.runInNewContext(fs.readFileSync(path.join(root, 'datos', file), 'utf8'), sandbox);
const modules = sandbox.window.TGI_MODULES;
const topics = modules.flatMap(m => m.topics);
const sources = new Map(topics.flatMap(t => t.blocks).map(b => [b.id, b]));

test('all five modules, images and original references remain available', () => {
  assert.equal(modules.length, 5);
  assert.equal(topics.length, 65);
  assert.equal(topics.reduce((n, t) => n + t.cards.length, 0), 326);
  assert.equal([...sources.values()].filter(b => b.type === 'image').length, 1629);
  assert.equal(modules.flatMap(m => m.questions).length, 97);
  for (const t of topics) {
    assert.ok(fs.existsSync(path.join(root, t.textFile)));
    for (const b of t.blocks) if (b.type === 'image') assert.ok(fs.existsSync(path.join(root, b.image)), b.image);
    for (const card of t.cards) for (const ref of card.refs) assert.ok(sources.has(ref), ref);
  }
  for (const q of modules.flatMap(m => m.questions)) {
    for (const ref of q.refs) assert.ok(sources.has(ref), ref);
    if (q.answer) assert.ok(q.refs.some(ref => /La respuesta correcta es/i.test(sources.get(ref).text)));
  }
});

test('search retains aliases and multiword results across modules', () => {
  const docs = topics.flatMap(t => [...t.cards.map(c => ({ ...c, kind: 'summary', topic: t.id, path: t.title })), ...t.blocks.map(b => ({ ...b, kind: 'source', path: t.title }))]).map(S.prepare);
  for (const [query, prefix] of [['liquen clobetasol', 'm04-t07'], ['Nugent', 'm02-t03'], ['Sedlis', 'm05-t02'], ['Schiller', 'm01-t07']]) {
    assert.ok(S.search(docs, query).some(d => d.id.startsWith(prefix)), query);
  }
  const ids = query => S.search(docs, query).map(d => d.id).sort().join(',');
  assert.equal(ids('HPV'), ids('VPH'));
  assert.equal(ids('biopsia'), ids('BX'));
});

test('portable files and the full deployment match the offline inventory', () => {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'offline-manifest.js'), 'utf8'), context);
  const config = context.TGI_OFFLINE;
  assert.equal(config.assets.length, 1694);
  for (const file of [...config.shell, ...config.assets, 'sw.js']) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
    assert.equal(Buffer.compare(fs.readFileSync(path.join(root, file)), fs.readFileSync(path.join(root, 'dist', file))), 0, file);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest')));
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
});
