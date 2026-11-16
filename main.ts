// main.ts: the program the harness runs (`node /bot/main.ts`, node22). It reads every case from
// /input/cases.json (a JSON array of {id, markdown}), renders each one with parse() from parse.js,
// and writes /output/html.json: a JSON array of the HTML strings, one per case, in the cases' order.
// Outside a container MAKEFUN_INPUT_DIR and MAKEFUN_OUTPUT_DIR stand in for /input and /output.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const inputArg = (() => {
  const i = process.argv.indexOf('--input');
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();

const casesPath = inputArg ?? join(INPUT_DIR, 'cases.json');

// Stream the cases one at a time and render each as soon as it's parsed, rather than
// materializing the whole parsed input array before rendering. `readFileSync` gives us the
// raw text; we decode it and walk the JSON array element by element with a small scanner so
// we never hold more than one markdown source plus its rendered HTML per case.
const decoder = new TextDecoder();
const source = readFileSync(casesPath);

const html: string[] = [];
let pos = 0;
const len = source.length;
const skipWs = () => {
  while (pos < len) {
    const b = source[pos];
    if (b === 0x20 || b === 0x09 || b === 0x0a || b === 0x0d) pos++;
    else break;
  }
};

skipWs();
if (pos >= len || source[pos] !== 0x5b /* [ */) throw new SyntaxError('cases.json must be a JSON array');
pos++;

skipWs();
if (pos < len && source[pos] !== 0x5d /* ] */) {
  for (;;) {
    const start = pos;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (; pos < len; pos++) {
      const b = source[pos];
      if (inString) {
        if (escaped) escaped = false;
        else if (b === 0x5c /* \ */) escaped = true;
        else if (b === 0x22 /* " */) inString = false;
      } else if (b === 0x22) {
        inString = true;
      } else if (b === 0x7b /* { */ || b === 0x5b /* [ */) {
        depth++;
      } else if (b === 0x7d /* } */ || b === 0x5d /* ] */) {
        if (depth === 0) break;
        depth--;
      } else if (b === 0x2c /* , */ && depth === 0) {
        break;
      }
    }
    const c = JSON.parse(decoder.decode(source.subarray(start, pos))) as { id: string; markdown: string };
    html.push(parse(c.markdown));
    skipWs();
    if (pos < len && source[pos] === 0x2c /* , */) {
      pos++;
      skipWs();
    } else {
      break;
    }
  }
}

writeFileSync(join(OUTPUT_DIR, 'html.json'), JSON.stringify(html));
