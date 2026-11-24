const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(`${__dirname}/sharing-story.html`, 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const scope = {};
for (const name of ['toggleReaction', 'photoError']) {
  const start = script.indexOf(`function ${name}(`);
  const end = script.indexOf('\nfunction ', start + 1);
  vm.runInNewContext(script.slice(start, end), scope);
}
const story = {counts: [3, 0, 0, 0]};
assert.equal(scope.toggleReaction(story, 0), 4);
assert.equal(scope.toggleReaction(story, 0), 3);
assert.equal(scope.toggleReaction(story, 1), 1);
assert.deepEqual(story.counts, [3, 0, 0, 0]);
const photo = {type: 'image/png', size: 8 * 1024 * 1024};
assert.equal(scope.photoError(photo, 3), '');
assert.ok(scope.photoError(photo, 4));
assert.ok(scope.photoError({...photo, size: photo.size + 1}, 0));
assert.ok(scope.photoError({...photo, type: 'text/html'}, 0));
assert.ok(!html.includes('__MASCOT_DATA__'));
assert.equal((html.match(/data:image\/png;base64,/g) || []).length, 4);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length);
for (const [, id] of script.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id), id);
console.log('PASS: script syntax, reaction toggle, upload limits, embedded assets, DOM references');
