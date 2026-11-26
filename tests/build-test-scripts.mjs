// Generates PowerShell scripts from the GUI Creator code generator for testing.
//
//   node tests/build-test-scripts.mjs <outDir>
//
// Loads the browser modules (controls, codegen, examples, snippets) without a browser,
// then writes into <outDir>:
//   examples/<name>.ps1 + <name>.<form>.xaml   every built-in example
//   all-controls.ps1 + .xaml                    one form with every control type and a menu
//   snippets/<n>.ps1                            every Script-tab snippet inside a generated script
// JavaScript-level checks (handlers defined, unique and allowed names, project round-trip)
// run here; tests/Generated.Tests.ps1 checks the files with the PowerShell parser.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests', 'out'));
globalThis.window = globalThis;
for (const f of ['controls.js', 'codegen.js', 'examples.js', 'snippets.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), { filename: f });
}
const GC = globalThis.GC;
const failures = [];
const check = (ok, msg) => ok || failures.push(msg);
const write = (rel, text) => {
  const file = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

function checkProject(label, project) {
  const forms = GC.formsOf(project);
  forms.forEach((d) => {
    GC.bindings(d).forEach((b) => check(GC.handlerRegex(b.handler).test(d.script), `${label}/${d.form.name}: handler $${b.handler} is wired but not defined`));
    const names = [d.form.name, ...GC.allControls(d).map((c) => c.name)];
    names.forEach((n, i) => {
      check(names.indexOf(n) === i, `${label}/${d.form.name}: duplicate name ${n}`);
      check(!GC.nameProblem(n), `${label}/${d.form.name}: ${GC.nameProblem(n)}`);
    });
  });
  const formNames = forms.map((d) => d.form.name);
  check(new Set(formNames).size === formNames.length, `${label}: duplicate form names`);
  const script = GC.genScript(project);
  check(JSON.stringify(GC.extractProjectFromScript(script)) === JSON.stringify(project), `${label}: embedded project does not round-trip`);
  return script;
}

// ---------------------------------------------------------------- examples
fs.rmSync(outDir, { recursive: true, force: true });
for (const ex of GC.EXAMPLES) {
  const project = ex.build();
  const base = ex.file.replace(/\W/g, '');
  write(`examples/${base}.ps1`, checkProject(ex.name, project));
  GC.formsOf(project).forEach((d) => write(`examples/${base}.${d.form.name}.xaml`, GC.genXaml(d)));
}

// ---------------------------------------------------------------- every control type
let id = 1;
const mk = (type, name, x, y, extra = {}) => {
  const t = GC.TYPES[type];
  const n = { id: 'c' + id++, type, name, x, y, w: t.size[0], h: t.size[1], props: {}, events: {} };
  GC.propsFor(type).forEach((p) => (n.props[p.key] = p.def));
  Object.assign(n.props, t.preset || {}, extra);
  if (t.textProp) n.props[t.textProp] = name;
  if (t.container) {
    n.slots = [[]];
    n.activeSlot = 0;
    if (t.slotsProp) n.slots = GC.lines(n.props[t.slotsProp]).map(() => []);
  }
  return n;
};
const form = { id: 'form', type: 'Window', name: 'formAll', props: {}, events: { Opened: 'formAll_Opened' }, slots: [[]] };
GC.FORM_PROPS.forEach((p) => (form.props[p.key] = p.def));
let y = 8;
form.slots[0] = Object.keys(GC.TYPES).map((type, i) => {
  const anchors = ['Top, Left', 'Top, Left, Right', 'Bottom, Right', 'Top, Bottom, Left, Right', 'None'];
  const n = mk(type, `${GC.TYPES[type].prefix}${i + 1}`, 8, (y += 40), { Anchor: anchors[i % anchors.length] });
  if (n.slots) n.slots[0].push(mk('Button', `inner${i + 1}`, 4, 4, { Anchor: 'Bottom, Right' }));
  return n;
});
form.slots[0][0].events.Click = 'button1_Click';
const allControls = {
  version: 2, nextId: id, active: 0,
  forms: [{
    uid: 'f1', form,
    menu: { id: 'menu', type: 'Menu', name: 'menuStrip1', props: { Items: '_File\n    _Open\n    -\n    E_xit' }, events: { menuFileExit: 'menuFileExit_Click' } },
    script: '$button1_Click = { param ($argumentList, $s, $e) }\n$formAll_Opened = { }\n$menuFileExit_Click = { $formAll.Close() }\n',
  }],
};
write('all-controls.ps1', checkProject('all-controls', allControls));
write('all-controls.xaml', GC.genXaml(allControls.forms[0]));

// A TabControl's template copies its HorizontalAlignment/VerticalAlignment onto the inner Border, so
// the Anchor layout must sit on a wrapping Panel; otherwise Bottom/Right anchors inside a tab break.
{
  const lines = GC.genXaml(allControls.forms[0]).split('\n');
  const at = lines.findIndex((l) => /<TabControl\b/.test(l));
  check(at > 0, 'all-controls: no TabControl in the XAML');
  if (at > 0) {
    check(!/\b(HorizontalAlignment|VerticalAlignment|Margin|Width|Height)=/.test(lines[at]), `all-controls: the TabControl carries layout attributes: ${lines[at].trim()}`);
    check(/^\s*<Panel HorizontalAlignment="[^"]+" VerticalAlignment="[^"]+" Margin=/.test(lines[at - 1]), `all-controls: the TabControl is not wrapped in a layout Panel: ${lines[at - 1].trim()}`);
  }
}

// ---------------------------------------------------------------- snippets
// Insert each snippet into the script of a project that has the controls snippets refer to,
// so names and helper functions resolve exactly as they would in the designer.
const wizard = GC.EXAMPLES.find((e) => /Setup Wizard/.test(e.name)).build();
const ctxFor = (d, forms) => ({
  form: d.form.name,
  owner: d.form.name,
  isDialog: forms.indexOf(d) > 0,
  dialogs: forms.filter((f, i) => i > 0 && f !== d).map((f) => f.form.name),
  hasPages: GC.allControls(d).some((c) => c.type === 'Pages'),
  first: (type, fallback) => (GC.allControls(d).find((c) => c.type === type) || { name: fallback }).name,
});
GC.SNIPPETS.forEach((s, i) => {
  const p = JSON.parse(JSON.stringify(wizard));
  const forms = GC.formsOf(p);
  const target = s.available && !s.available(ctxFor(forms[0], forms)) ? forms[1] : forms[0];
  const ctx = ctxFor(target, forms);
  check(!s.available || s.available(ctx), `snippet "${s.name}" has no form it can be used in`);
  target.script += '\n' + s.code(ctx) + '\n';
  write(`snippets/${String(i + 1).padStart(2, '0')}-${s.name.replace(/\W+/g, '-')}.ps1`, GC.genScript(p, { embed: false }));
});

if (failures.length) {
  console.error('FAILED:\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log(`OK: ${GC.EXAMPLES.length} examples, all-controls, ${GC.SNIPPETS.length} snippets -> ${outDir}`);
