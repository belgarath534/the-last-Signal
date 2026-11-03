// Writes the whole story (web/js/content) to one JSON file for the iPhone version.
// Run from the repo root: node tools/export-content.mjs
import { writeFileSync } from 'node:fs';
import { content } from '../web/js/content/index.js';

const functions = [];
const json = JSON.stringify(content, function (key, value) {
  if (typeof value === 'function') { functions.push(key + ': ' + value.toString().slice(0, 80)); return undefined; }
  return value;
}, 1);
if (functions.length) { console.error('Content contains functions, which JSON cannot hold:\n' + functions.join('\n')); process.exit(1); }
writeFileSync('LastSignal/Story/story.json', json);
console.log('wrote LastSignal/Story/story.json', (json.length / 1024).toFixed(0) + ' KB');
