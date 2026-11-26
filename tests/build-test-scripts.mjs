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
  version: 2, layout: 2, nextId: id, active: 0,
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

// Values whose Avalonia default differs from what the designer draws are always written: Button
// content is Left/Top in Avalonia (the designer centers it), and TimePicker follows the culture.
{
  const xaml = GC.genXaml(allControls.forms[0]);
  check(/<Button x:Name="button1"[^>]*HorizontalContentAlignment="Center"[^>]*VerticalContentAlignment="Center"/.test(xaml), 'all-controls: Button content alignment is not written');
  check(/<TimePicker [^>]*ClockIdentifier="12HourClock"/.test(xaml), 'all-controls: TimePicker ClockIdentifier is not written');
}

// Avalonia colours put alpha first (#AARRGGBB); the designer preview (CSS) needs it last.
for (const [avalonia, css] of [['#CC0078D4', '#0078D4CC'], ['#8F00', '#F008'], ['#0078D4', '#0078D4'], ['Gray', 'Gray'], ['', '']]) {
  check(GC.cssColor(avalonia) === css, `cssColor(${avalonia}) is ${GC.cssColor(avalonia)}, expected ${css}`);
}

// ---------------------------------------------------------------- container sizes (Fluent2)
// Measured with UI Automation in real GliderUI 0.6.0 windows (270x220 containers): GroupBox content
// at 13,45 with 13px insets (13,25 without a Header), TabControl content at 0,41.
for (const [label, n, want] of [
  ['GroupBox with Header', { type: 'GroupBox', w: 270, h: 220, props: { Header: 'Group' } }, [244, 162]],
  ['GroupBox without Header', { type: 'GroupBox', w: 270, h: 220, props: { Header: '' } }, [244, 182]],
  ['TabControl', { type: 'TabControl', w: 270, h: 220, props: {} }, [270, 179]],
]) {
  const got = GC.slotSize(n);
  check(got[0] === want[0] && got[1] === want[1], `slotSize(${label}) is ${got}, measured ${want}`);
}

// ---------------------------------------------------------------- layout upgrade (Fluent -> Fluent2)
// Designs made with the old container sizes (no `layout: 2`) must generate exactly the same XAML
// after GC.upgradeLayout as before it, with the old GC.slotSize.
{
  const newSlotSize = GC.slotSize;
  const oldSlotSize = (owner, doc) =>
    owner.type === 'GroupBox' ? [owner.w - 18, owner.h - 42] : owner.type === 'TabControl' ? [owner.w, owner.h - 48] : newSlotSize(owner, doc);
  const xamlOf = (p, slotSize) => {
    GC.slotSize = slotSize;
    try {
      return GC.formsOf(p).map((d) => GC.genXaml(d)).join('\n');
    } finally {
      GC.slotSize = newSlotSize;
    }
  };
  const compare = (label, build) => {
    const before = xamlOf(build(), oldSlotSize);
    const upgraded = GC.upgradeLayout(build());
    check(upgraded.layout === 2, `${label}: upgradeLayout did not set layout: 2`);
    const after = xamlOf(upgraded, newSlotSize);
    const again = xamlOf(GC.upgradeLayout(upgraded), newSlotSize);
    if (before !== after) {
      const a = before.split('\n');
      const b = after.split('\n');
      const i = a.findIndex((l, k) => l !== b[k]);
      failures.push(`${label}: XAML changed by the layout upgrade:\n    before: ${(a[i] || '').trim()}\n    after:  ${(b[i] || '').trim()}`);
    }
    check(again === after, `${label}: upgradeLayout is not idempotent`);
  };
  const noUpgrade = GC.upgradeLayout;
  for (const e of GC.EXAMPLES) {
    // build() must return the upgraded design (the app, export-example.mjs and these tests use it)
    check(e.build().layout === 2, `example ${e.name}: build() does not return an upgraded layout (layout: 2)`);
    GC.upgradeLayout = (p) => p; // ex.build() upgrades; get the original design
    let raw;
    try {
      raw = e.build();
    } finally {
      GC.upgradeLayout = noUpgrade;
    }
    if (raw.layout >= 2) continue; // written with the Fluent2 sizes: nothing to upgrade
    const json = JSON.stringify(raw);
    compare(`example ${e.name}`, () => JSON.parse(json));
  }
  // Every anchor combination inside each container, plus a GroupBox nested in a tab.
  const combos = [];
  for (const v of ['Top', 'Bottom', 'Top, Bottom', '']) for (const h of ['Left', 'Right', 'Left, Right', '']) combos.push([v, h].filter(Boolean).join(', ') || 'None');
  const sized = (type, name, x, y, w, h, props) => {
    const n = mk(type, name, x, y, {});
    Object.assign(n.props, props);
    return Object.assign(n, { w, h });
  };
  const fill = (owner, slot = 0) => {
    owner.slots[slot] = combos.map((anchor, i) => sized('Button', `${owner.name}_b${slot}_${i}`, 6 + (i % 4) * 30, 6 + Math.floor(i / 4) * 20, 30, 30, { Anchor: anchor }));
    // 30x30 so that no stretched child hits upgradeLayout's minimum size of 8 (which, by design,
    // changes the margins of children that would otherwise get a size of 8 or less)
    return owner;
  };
  const synthetic = () => {
    id = 1000;
    const f = { id: 'form', type: 'Window', name: 'formLayout', props: {}, events: {}, slots: [[]] };
    GC.FORM_PROPS.forEach((p) => (f.props[p.key] = p.def));
    const gb = fill(sized('GroupBox', 'gbHeader', 10, 10, 300, 220, { Header: 'Header' }));
    const gb0 = fill(sized('GroupBox', 'gbNoHeader', 320, 10, 300, 220, { Header: '' }));
    const tc = fill(sized('TabControl', 'tcTabs', 10, 240, 330, 260, { Anchor: 'Top, Bottom, Left, Right' }));
    tc.slots[1] = [fill(sized('GroupBox', 'gbNested', 5, 5, 300, 200, { Header: 'In a tab', Anchor: 'Top, Bottom, Left, Right' }))];
    f.slots[0] = [gb, gb0, tc];
    return { version: 2, nextId: id, active: 0, forms: [{ uid: 'f1', form: f, menu: null, script: '' }] };
  };
  const json = JSON.stringify(synthetic());
  const xaml = xamlOf(JSON.parse(json), newSlotSize);
  check((xaml.match(/<Button /g) || []).length === combos.length * 4, 'synthetic layout form: not every test button was generated');
  check(/gbNoHeader"[^>]*>/.test(xaml) && !/gbNoHeader"[^>]*Header=/.test(xaml), 'synthetic layout form: the no-header GroupBox has a Header');
  check(combos.every((c) => c === 'None' || xaml.includes(`HorizontalAlignment="${/Left, Right/.test(c) ? 'Stretch' : /Right/.test(c) ? 'Right' : /Left/.test(c) ? 'Left' : 'Center'}"`)), 'synthetic layout form: anchors were not applied');
  compare('every anchor in GroupBox/TabControl', () => JSON.parse(json));
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
