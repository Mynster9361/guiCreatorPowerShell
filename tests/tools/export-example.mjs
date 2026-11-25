// Regenerates an exported example script (with the design embedded) from js/examples.js.
//
//   node tests/tools/export-example.mjs                          -> examples/ExchangeOnlineAccessControl.ps1
//   node tests/tools/export-example.mjs <exampleFile> <out.ps1>  -> any example by its `file` field
//
// Run it after changing js/codegen.js, js/controls.js or an exported example in js/examples.js,
// so the committed .ps1 in examples/ matches what the designer exports.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const [file = 'ExchangeOnlineAccessRights', out = path.join(root, 'examples', 'ExchangeOnlineAccessControl.ps1')] = process.argv.slice(2);
globalThis.window = globalThis;
for (const f of ['controls.js', 'codegen.js', 'examples.js']) vm.runInThisContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), { filename: f });
const GC = globalThis.GC;
const ex = GC.EXAMPLES.find((e) => e.file === file);
if (!ex) throw new Error(`No example with file "${file}". Known: ${GC.EXAMPLES.map((e) => e.file).join(', ')}`);
const text = GC.genScript(ex.build()).replace(/\n/g, '\r\n');
fs.writeFileSync(out, text);
const back = GC.extractProjectFromScript(text);
console.log(`wrote ${path.relative(root, out)} (${text.length} chars, forms: ${GC.formsOf(back).map((d) => d.form.name).join(', ')})`);
