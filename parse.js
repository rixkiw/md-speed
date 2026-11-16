// parse.js: parse(markdown) returns the HTML marked 18.1.3 renders with its default options.
// vendor/marked/marked.esm.js is marked's npm build byte for byte (MIT, vendor/marked/LICENSE).
import { marked } from './vendor/marked/marked.esm.js';

/** The HTML marked renders for `markdown`, with marked's defaults. */
export function parse(markdown) {
  return marked.parse(markdown);
}
