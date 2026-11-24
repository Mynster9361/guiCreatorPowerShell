/* GUI Creator - main application (designer, property grid, commands) */
(function () {
  'use strict';
  const GC = window.GC;
  const { TYPES, TOOLBOX, esc, num } = GC;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs)
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k));
    return el;
  }

  // ---------------------------------------------------------------- icons
  const ICONS = {
    new: '<path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13"/>',
    open: '<path d="M1.5 13V3h4l1.5 1.5h5.5V7 M1.5 13l2-6h11l-2 6z"/>',
    save: '<path d="M2 2h10l2 2v10H2z M5 2v4h6V2 M4.5 14V9.5h7V14"/>',
    export: '<path d="M8 10V1.5 M5 4.5l3-3 3 3 M2.5 9v5h11V9"/>',
    copy: '<rect x="5" y="5" width="9" height="9" rx="1"/><path d="M11 5V2H2v9h3"/>',
    cut: '<circle cx="4.5" cy="12" r="2"/><circle cx="11.5" cy="12" r="2"/><path d="M5.8 10.5 12 2 M10.2 10.5 4 2"/>',
    paste: '<path d="M5 2.5H3v12h10v-12h-2 M5.5 1.5h5v2.5h-5z"/>',
    del: '<path d="M2.5 4h11 M6 4V2h4v2 M4 4l.8 10h6.4L12 4"/>',
    undo: '<path d="M5 3 2 6l3 3 M2 6h7.5a4 4 0 0 1 0 8H6"/>',
    redo: '<path d="M11 3l3 3-3 3 M14 6H6.5a4 4 0 0 0 0 8H10"/>',
    alignL: '<path d="M2 1v14 M4 4h9v3H4z M4 9h6v3H4z"/>',
    alignC: '<path d="M8 1v14 M3 4h10v3H3z M5 9h6v3H5z"/>',
    alignR: '<path d="M14 1v14 M3 4h9v3H3z M6 9h6v3H6z"/>',
    alignT: '<path d="M1 2h14 M4 4v9h3V4z M9 4v6h3V4z"/>',
    alignM: '<path d="M1 8h14 M4 3v10h3V3z M9 5v6h3V5z"/>',
    alignB: '<path d="M1 14h14 M4 3v9h3V3z M9 6v6h3V6z"/>',
    sameW: '<path d="M2 2.5h12v4H2z M2 9.5h12v4H2z"/>',
    sameH: '<path d="M2.5 2v12h4V2z M9.5 2v12h4V2z"/>',
    centerH: '<path d="M1.5 1v14 M14.5 1v14 M5 5.5h6v5H5z"/>',
    centerV: '<path d="M1 1.5h14 M1 14.5h14 M5.5 5h5v6h-5z"/>',
    front: '<rect x="1.5" y="1.5" width="8" height="8"/><rect x="6.5" y="6.5" width="8" height="8" fill="currentColor" fill-opacity=".6"/>',
    back: '<rect x="6.5" y="6.5" width="8" height="8"/><rect x="1.5" y="1.5" width="8" height="8" fill="currentColor" fill-opacity=".6"/>',
    grid: '<path d="M1.5 1.5h13v13h-13z M6 1.5v13 M10.5 1.5v13 M1.5 6h13 M1.5 10.5h13"/>',
    snap: '<path d="M3 2v6a5 5 0 0 0 10 0V2h-3v6a2 2 0 0 1-4 0V2z M3 5h3 M10 5h3"/>',
    lines: '<path d="M5 1v14 M1 11h14" stroke-dasharray="2 1.5"/><rect x="5" y="3" width="7" height="8"/>',
    run: '<path d="M4 2.5v11l9-5.5z" fill="currentColor"/>',
    stop: '<rect x="3.5" y="3.5" width="9" height="9" rx="1" fill="currentColor"/>',
    dialog: '<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M1.5 5.5h13 M8.5 10.5h4"/><path d="M4 8.5h3" />',
    Pages: '<rect x="3.5" y="1.5" width="10" height="11" rx="1"/><path d="M2.5 4.5v10h9"/><path d="M6 5h5 M6 7.5h5"/>',
    Window: '<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M1.5 5.5h13"/>',
    Button: '<rect x="1.5" y="4.5" width="13" height="7" rx="2"/><path d="M5 8h6"/>',
    TextBlock: '<path d="M3 3.5h10 M8 3.5v10"/>',
    TextBox: '<rect x="1.5" y="4.5" width="13" height="7" rx="1"/><path d="M4 6.5v3"/>',
    TextBoxMulti: '<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M4 5.5h8 M4 8h8 M4 10.5h5"/>',
    Password: '<rect x="1.5" y="4.5" width="13" height="7" rx="1"/><path d="M5 8h.01 M8 8h.01 M11 8h.01" stroke-width="2.2"/>',
    CheckBox: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5 8l2 2 4-4.5"/>',
    RadioButton: '<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.3" fill="currentColor"/>',
    ToggleButton: '<rect x="1.5" y="4.5" width="13" height="7" rx="2" fill="currentColor" fill-opacity=".35"/>',
    ToggleSwitch: '<rect x="1.5" y="4.5" width="13" height="7" rx="3.5"/><circle cx="11" cy="8" r="2" fill="currentColor"/>',
    HyperlinkButton: '<path d="M7 9.5a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.8.8 M9 6.5a3 3 0 0 0-4.2 0L2.5 8.8a3 3 0 0 0 4.2 4.2l.8-.8"/>',
    ComboBox: '<rect x="1.5" y="4.5" width="13" height="7" rx="1"/><path d="M9.5 4.5v7 M11 7.3l1 1 1-1"/>',
    ListBox: '<rect x="1.5" y="1.5" width="13" height="13" rx="1"/><path d="M4 5h8 M4 8h8 M4 11h8"/>',
    DataGrid: '<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M1.5 6h13 M1.5 9.5h13 M6 2.5v11"/>',
    Slider: '<path d="M1.5 8h13"/><circle cx="6" cy="8" r="2.5" fill="currentColor"/>',
    ProgressBar: '<rect x="1.5" y="6" width="13" height="4" rx="2"/><rect x="1.5" y="6" width="8" height="4" rx="2" fill="currentColor"/>',
    NumericUpDown: '<rect x="1.5" y="3.5" width="13" height="9" rx="1"/><path d="M10 3.5v9 M11 7l1.2-1.5L13.4 7 M11 9l1.2 1.5L13.4 9"/>',
    DatePicker: '<rect x="1.5" y="2.5" width="13" height="12" rx="1"/><path d="M1.5 6h13 M5 1v3 M11 1v3"/>',
    CalendarDatePicker: '<rect x="1.5" y="2.5" width="13" height="12" rx="1"/><path d="M1.5 6h13 M5 1v3 M11 1v3"/><rect x="9" y="9" width="3" height="3" fill="currentColor"/>',
    TimePicker: '<circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/>',
    Border: '<rect x="1.5" y="2.5" width="13" height="11" rx="1" stroke-dasharray="2 1.5"/>',
    GroupBox: '<path d="M4 3.5H1.5v10h13v-10H12 M6 3.5h4"/>',
    TabControl: '<path d="M1.5 14.5v-11h5v2h8v9z M6.5 3.5h4v2"/>',
    Menu: '<path d="M1.5 2.5h13v3h-13z M4 5.5v8h7v-8 M6 8h3 M6 10.5h3"/>',
  };
  const svg = (name) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.Window}</svg>`;
  const typeIcon = (n) => (n.type === 'TextBox' ? (n.props.PasswordChar ? 'Password' : n.props.AcceptsReturn ? 'TextBoxMulti' : 'TextBox') : n.type);

  // ---------------------------------------------------------------- state
  const STORE = 'guiCreator.project.v1';
  const PREFS = 'guiCreator.prefs.v1';
  let project;
  const index = new Map();
  let selection = [];
  let undoStack = [];
  let redoStack = [];
  let lastSnap = '';
  let clip = null;
  let pasteCount = 0;
  let armed = null;
  let activeTab = 'designer';
  let propTab = 'props';
  let alpha = false;
  const closedCats = new Set();
  let menuOpen = -1;
  let drag = null;
  const editors = {};
  let prefs = { grid: 8, showGrid: true, snap: true, snaplines: true };
  try {
    Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS) || '{}'));
  } catch (e) { /* ignore */ }
  const savePrefs = () => localStorage.setItem(PREFS, JSON.stringify(prefs));

  const DEFAULT_SCRIPT = [
    '# Event handlers are script blocks that receive ($argumentList, $s, $e):',
    '#   $s - the control that raised the event, $e - the event arguments.',
    '# Double-click a control in the designer to create its default event handler.',
    '',
  ].join('\n');

  /* A project holds several forms ("docs"). forms[0] is the startup form; every other
     form becomes a modal dialog function Show-<name> in the generated script.
     `doc` always points at the form being edited. */
  let doc;
  const setDoc = () => {
    if (!project.forms[project.active]) project.active = 0;
    doc = project.forms[project.active];
  };
  const mainName = () => project.forms[0].form.name;
  const isDialog = (d) => project.forms.indexOf(d || doc) > 0;

  function blankDoc(name, uid) {
    const d = { uid, form: { id: 'form', type: 'Window', name, x: 0, y: 0, props: {}, events: {}, slots: [[]] }, menu: null, script: DEFAULT_SCRIPT };
    GC.FORM_PROPS.forEach((x) => (d.form.props[x.key] = x.def));
    return d;
  }
  function blankProject() {
    const p = { version: 2, nextId: 1, nextForm: 2, active: 0, forms: [blankDoc('formMain', 'f1')] };
    p.forms[0].form.props.Title = 'My GliderUI Form';
    return p;
  }

  const dialogScript = (name) =>
    [
      '# This form is a dialog. Show it from another form\'s script and use the result:',
      `#     $result = Show-${name} -Owner $${mainName()} -Values @{ labelMessage = 'Hello' }`,
      "#     if ($result.DialogResult -eq 'OK') { ... }",
      '# The result contains DialogResult plus the value of each input control in this form',
      '# (TextBox.Text, CheckBox.IsChecked, ComboBox.SelectedIndex, NumericUpDown.Value, ...).',
      '# Close-Dialog <result> closes the dialog and sets DialogResult.',
      '',
      '$buttonOK_Click = {',
      '    param ($argumentList, $s, $e)',
      "    Close-Dialog 'OK'",
      '}',
      '',
      '$buttonCancel_Click = {',
      '    param ($argumentList, $s, $e)',
      "    Close-Dialog 'Cancel'",
      '}',
      '',
    ].join('\n');

  /** A new dialog form with a message label and OK / Cancel buttons already wired. */
  function createDialogDoc() {
    const taken = new Set(project.forms.map((d) => d.form.name));
    let i = 1;
    while (taken.has('formDialog' + i)) i++;
    const name = 'formDialog' + i;
    const d = blankDoc(name, 'f' + project.nextForm++);
    Object.assign(d.form.props, { Title: 'Dialog', Width: 400, Height: 220, CanResize: false, CanMinimize: false, CanMaximize: false, ShowInTaskbar: false });
    const add = (type, nm, x, y, w, h, props) => {
      const n = createNode({ type }, new Set());
      Object.assign(n, { name: nm, x, y, w, h });
      Object.assign(n.props, props);
      d.form.slots[0].push(n);
      return n;
    };
    add('TextBlock', 'labelMessage', 16, 16, 368, 40, { Text: 'Put the dialog content here.', TextWrapping: 'Wrap' });
    add('Button', 'buttonOK', 184, 172, 96, 32, { Content: 'OK', Classes: 'accent', IsDefault: true }).events.Click = 'buttonOK_Click';
    add('Button', 'buttonCancel', 288, 172, 96, 32, { Content: 'Cancel', IsCancel: true }).events.Click = 'buttonCancel_Click';
    d.script = dialogScript(name);
    return d;
  }

  function sampleProject() {
    project = blankProject();
    setDoc();
    const f = doc.form;
    Object.assign(f.props, { Title: 'Hello GliderUI', Width: 420, Height: 220 });
    const taken = allNames();
    const add = (type, name, x, y, w, h, props) => {
      const n = createNode({ type }, taken);
      Object.assign(n, { name, x, y, w, h });
      Object.assign(n.props, props);
      f.slots[0].push(n);
      return n;
    };
    add('TextBlock', 'labelPrompt', 24, 24, 300, 20, { Text: 'What is your name?' });
    add('TextBox', 'textboxName', 24, 48, 368, 32, { Text: '', Watermark: 'Type your name' });
    const b = add('Button', 'buttonGreet', 24, 96, 120, 32, { Content: 'Say hello', Classes: 'accent', IsDefault: true });
    add('TextBlock', 'labelResult', 24, 144, 368, 24, { Text: '', FontSize: 16 });
    b.events.Click = 'buttonGreet_Click';
    doc.script =
      DEFAULT_SCRIPT +
      '\n$buttonGreet_Click = {\n    param ($argumentList, $s, $e)\n    if ($textboxName.Text) {\n        $labelResult.Text = "Hello, $($textboxName.Text)!"\n    }\n    else {\n        $labelResult.Text = \'Please type your name first.\'\n    }\n}\n';
    return project;
  }

  function reindex() {
    index.clear();
    index.set('form', { node: doc.form, parent: null, slot: 0 });
    if (doc.menu) index.set('menu', { node: doc.menu, parent: null, slot: 0 });
    (function walk(n) {
      (n.slots || []).forEach((list, si) =>
        list.forEach((c) => {
          index.set(c.id, { node: c, parent: n, slot: si });
          walk(c);
        })
      );
    })(doc.form);
  }
  const nodeOf = (id) => (index.get(id) || {}).node;
  const siblingsOf = (id) => {
    const e = index.get(id);
    return e.parent.slots[e.slot];
  };
  function isAncestor(aId, bId) {
    let e = index.get(bId);
    while (e && e.parent) {
      if (e.parent.id === aId) return true;
      e = index.get(e.parent.id);
    }
    return false;
  }
  function removeNode(id) {
    const list = siblingsOf(id);
    list.splice(list.findIndex((c) => c.id === id), 1);
  }
  const ctlIds = () => selection.filter((id) => id !== 'form' && id !== 'menu' && index.has(id));
  /** Selected controls without those whose ancestor is selected too. */
  const topSelected = () => {
    const ids = ctlIds();
    return ids.filter((x) => !ids.some((y) => y !== x && isAncestor(y, x)));
  };

  function allNames() {
    const s = new Set([doc.form.name]);
    if (doc.menu) {
      s.add(doc.menu.name);
      GC.menuLeaves(GC.parseMenu(doc.menu.props.Items)).forEach((i) => s.add(i.name));
    }
    GC.allControls(doc).forEach((c) => s.add(c.name));
    return s;
  }
  function uniqueName(prefix, taken) {
    taken = taken || allNames();
    let i = 1;
    while (taken.has(prefix + i)) i++;
    taken.add(prefix + i);
    return prefix + i;
  }
  const newId = () => 'c' + project.nextId++;

  /** Move / stretch anchored children after their container changed size by dw x dh. */
  function anchorChildren(slots, dw, dh) {
    if (!dw && !dh) return;
    (slots || []).forEach((list) =>
      list.forEach((c) => {
        const a = GC.anchors(c);
        let cw = 0;
        let ch = 0;
        if (a.L && a.R) (cw = Math.max(4, c.w + dw) - c.w), (c.w += cw);
        else if (a.R) c.x += dw;
        else if (!a.L) c.x += Math.round(dw / 2);
        if (a.T && a.B) (ch = Math.max(4, c.h + dh) - c.h), (c.h += ch);
        else if (a.B) c.y += dh;
        else if (!a.T) c.y += Math.round(dh / 2);
        if (c.slots) anchorChildren(c.slots, cw, ch);
      })
    );
  }

  /** Keep one child list per tab / page of a TabControl or Pages container. */
  function syncTabs(n) {
    const count = Math.max(1, GC.lines(n.props[TYPES[n.type].slotsProp]).length);
    while (n.slots.length < count) n.slots.push([]);
    if (n.slots.length > count) n.slots.length = count;
    if ((n.activeSlot || 0) >= count) n.activeSlot = count - 1;
  }

  function createNode(entry, taken) {
    const t = TYPES[entry.type];
    const name = uniqueName(entry.prefix || t.prefix, taken);
    const size = entry.size || t.size;
    const n = { id: newId(), type: entry.type, name, x: 0, y: 0, w: size[0], h: size[1], props: {}, events: {} };
    GC.propsFor(entry.type).forEach((p) => (n.props[p.key] = p.def));
    Object.assign(n.props, t.preset || {}, entry.preset || {});
    if (t.textProp) n.props[t.textProp] = name;
    if (t.container) {
      n.slots = [[]];
      n.activeSlot = 0;
      if (t.slotsProp) syncTabs(n);
    }
    return n;
  }
  function createMenu() {
    doc.menu = { id: 'menu', type: 'Menu', name: 'menuStrip1', props: { Items: '_File\n    _New\n    _Open...\n    -\n    E_xit\n_Help\n    _About' }, events: {} };
  }

  /** Fill in defaults for anything missing (older or hand-edited project files). */
  function normalize(p) {
    // Version 1 projects (and examples) have a single form at the top level.
    if (p && !p.forms && p.form) p = { version: 2, nextId: p.nextId, active: 0, forms: [{ uid: 'f1', form: p.form, menu: p.menu, script: p.script }] };
    if (!p || !Array.isArray(p.forms) || !p.forms.length) throw new Error('This file is not a GUI Creator project.');
    let maxId = 0;
    let maxUid = 0;
    p.forms.forEach((d, i) => {
      if (!d || !d.form || !Array.isArray(d.form.slots)) throw new Error('This file is not a GUI Creator project.');
      d.uid = d.uid || 'f' + (i + 1);
      maxUid = Math.max(maxUid, parseInt(String(d.uid).slice(1), 10) || 0);
      maxId = Math.max(maxId, normalizeDoc(d));
    });
    p.version = 2;
    p.active = Math.min(Math.max(0, p.active | 0), p.forms.length - 1);
    p.nextId = Math.max(p.nextId || 1, maxId + 1);
    p.nextForm = Math.max(p.nextForm || 1, maxUid + 1);
    return p;
  }

  /** Fill in defaults for one form; returns the highest control id number used. */
  function normalizeDoc(p) {
    const base = blankDoc('x', 'x');
    p.form.props = Object.assign({}, base.form.props, p.form.props);
    p.form.events = p.form.events || {};
    p.script = p.script == null ? DEFAULT_SCRIPT : p.script;
    let maxId = 0;
    (function walk(n) {
      (n.slots || []).forEach((l) =>
        l.forEach((c) => {
          if (!TYPES[c.type]) throw new Error('Unknown control type: ' + c.type);
          const defs = {};
          GC.propsFor(c.type).forEach((q) => (defs[q.key] = q.def));
          c.props = Object.assign(defs, c.props);
          c.events = c.events || {};
          maxId = Math.max(maxId, parseInt(String(c.id).slice(1), 10) || 0);
          walk(c);
        })
      );
    })(p.form);
    if (p.menu) p.menu.events = p.menu.events || {};
    return maxId;
  }

  // ---------------------------------------------------------------- change tracking
  function persist() {
    try {
      localStorage.setItem(STORE, JSON.stringify(project));
    } catch (e) { /* quota or private mode */ }
  }
  function afterChange() {
    setDoc();
    reindex();
    selection = selection.filter((id) => index.has(id));
    if (!selection.length) selection = ['form'];
    lastSnap = JSON.stringify(project);
    persist();
    renderAll();
  }
  /* Undo/redo snapshots hold the scripts too. A designer step that edited a script
     (new handler stub, rename) is undone completely, unless the user has typed in
     that script since the step: then their typing is kept. */
  let committedScripts = new Map();
  const scriptsNow = () => new Map(project.forms.map((d) => [d.uid, d.script]));
  function commit() {
    undoStack.push(lastSnap);
    if (undoStack.length > 200) undoStack.shift();
    redoStack = [];
    afterChange();
    committedScripts = scriptsNow();
  }
  /** Change that should not be an undo step (e.g. switching the visible tab page). */
  function quietChange() {
    afterChange();
  }
  function restore(snap) {
    const current = scriptsNow();
    project = JSON.parse(snap);
    project.forms.forEach((d) => {
      if (current.has(d.uid) && current.get(d.uid) !== committedScripts.get(d.uid)) d.script = current.get(d.uid);
    });
    afterChange();
    committedScripts = scriptsNow();
  }
  const undo = () => undoStack.length && (redoStack.push(lastSnap), restore(undoStack.pop()), status('Undo'));
  const redo = () => redoStack.length && (undoStack.push(lastSnap), restore(redoStack.pop()), status('Redo'));

  // ---------------------------------------------------------------- rendering
  function renderAll() {
    renderDesigner();
    renderProject();
    renderOutline();
    renderProps();
    renderStatus();
    updateToolbar();
    $('#docTitle').textContent = mainName() + '.ps1' + (project.forms.length > 1 ? '  —  ' + doc.form.name : '');
    $('#scriptHint').innerHTML = isDialog()
      ? `<b>Dialog form.</b> Show it with <code>$result = Show-${esc(doc.form.name)} -Owner $${esc(mainName())}</code>; close it with <code>Close-Dialog 'OK'</code>.`
      : 'Your functions and event handlers. Controls are variables named after their <b>(Name)</b>, e.g. <code>$button1</code>.';
    if (editors.script && editors.script.value !== doc.script) editors.script.value = doc.script;
    if (activeTab === 'generated' || activeTab === 'xaml') refreshGenerated();
    if (activeTab === 'script') (refreshHandlerJump(), refreshSnippets());
  }

  const accel = (s) => esc(s).replace(/_(.)/, '<u>$1</u>').replace(/_/g, '');

  function renderDesigner() {
    const f = doc.form;
    const p = f.props;
    const win = h('div', {
      class: 'fw' + (p.RequestedThemeVariant === 'Dark' ? ' dark' : '') + (prefs.showGrid ? ' show-grid' : '') + (armed ? ' armed' : '') + (selection.includes('form') ? ' form-sel' : '') + (p.ExtendClientAreaToDecorationsHint ? ' extend' : ''),
      'data-id': 'form',
    });
    win.style.width = num(p.Width, 640) + 'px';
    win.style.setProperty('--grid', prefs.grid + 'px');
    win.append(
      h('div', {
        class: 'fw-title',
        html: `<span class="ico"></span><span class="t">${esc(p.Title)}</span><span class="caps"><span class="${p.CanMinimize === false ? 'off' : ''}">&#8211;</span><span class="${p.CanMaximize === false || p.CanResize === false ? 'off' : ''}">&#9744;</span><span>&#10005;</span></span>`,
      })
    );
    const client = h('div', { class: 'fw-client' });
    client.style.height = num(p.Height, 420) + 'px';
    if (p.Background) client.style.background = p.Background;
    if (p.FontFamily) client.style.fontFamily = p.FontFamily;
    if (p.FontSize !== '' && p.FontSize != null) client.style.fontSize = p.FontSize + 'px';
    if (doc.menu) client.append(renderMenuStrip());
    const slot = h('div', { class: 'slot root', 'data-owner': 'form', 'data-slot': '0' });
    f.slots[0].forEach((c) => slot.append(renderNode(c)));
    client.append(slot);
    win.append(client);
    ['e', 's', 'se'].forEach((d) => win.append(h('div', { class: 'fw-rs ' + d, 'data-fr': d })));
    $('#surface').replaceChildren(win, h('div', { id: 'overlay' }));
    renderOverlay();
  }

  function renderNode(n) {
    const t = TYPES[n.type];
    const p = n.props;
    const el = h('div', { class: 'ctl t-' + n.type, 'data-id': n.id });
    Object.assign(el.style, { left: n.x + 'px', top: n.y + 'px', width: n.w + 'px', height: n.h + 'px' });
    if (p.Background) el.style.setProperty('--ubg', p.Background);
    if (p.Foreground) el.style.setProperty('--ufg', p.Foreground);
    if (p.FontFamily) el.style.fontFamily = p.FontFamily;
    if (p.FontSize !== '' && p.FontSize != null) el.style.fontSize = p.FontSize + 'px';
    if (p.FontWeight && p.FontWeight !== 'Normal') el.style.fontWeight = { Light: 300, SemiBold: 600, Bold: 700, ExtraBold: 800 }[p.FontWeight];
    if (p.FontStyle === 'Italic') el.style.fontStyle = 'italic';
    if (p.Opacity !== '' && p.Opacity != null && Number(p.Opacity) !== 1) el.style.opacity = p.Opacity;
    if (p.IsVisible === false) el.classList.add('hidden-ctl');
    if (p.IsEnabled === false) el.classList.add('disabled-ctl');
    el.innerHTML = t.render(n, p);
    if (t.container)
      el.querySelectorAll('.slot').forEach((s) => {
        if (s.dataset.owner !== n.id) return;
        (n.slots[+s.dataset.slot] || []).forEach((c) => s.append(renderNode(c)));
      });
    return el;
  }

  function renderMenuStrip() {
    const tree = GC.parseMenu(doc.menu.props.Items);
    const strip = h('div', { class: 'menu-strip' });
    if (!tree.filter((i) => !i.sep).length) {
      strip.classList.add('empty');
      strip.textContent = '(empty menu - edit Items in Properties)';
    }
    tree.forEach((it, i) => {
      if (it.sep) return;
      const mi = h('div', { class: 'mi' + (menuOpen === i ? ' open' : ''), 'data-mi': i, 'data-mitem': it.children.length ? null : it.name, html: accel(it.label) });
      strip.append(mi);
      if (menuOpen === i && it.children.length) {
        const drop = h('div', { class: 'menu-drop' });
        it.children.forEach((ch) =>
          drop.append(
            ch.sep
              ? h('div', { class: 'msep' })
              : h('div', { class: 'mdi' + (doc.menu.events[ch.name] ? ' has-ev' : ''), 'data-mitem': ch.name, title: 'Double-click to add a Click handler for $' + ch.name, html: `<span>${accel(ch.label)}</span>${ch.children.length ? '<span>&#9656;</span>' : ''}` })
          )
        );
        mi.append(drop);
      }
    });
    return strip;
  }

  const ctlEl = (id) => $(`#surface .ctl[data-id="${id}"]`);
  const slotEl = (ownerId, si) => $(`#surface .slot[data-owner="${ownerId}"][data-slot="${si}"]`);
  const place = (el, x, y, w, hh) => Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' });

  function renderOverlay() {
    const ov = $('#overlay');
    if (!ov) return;
    ov.replaceChildren();
    const sr = $('#surface').getBoundingClientRect();
    const single = selection.length === 1;
    selection.forEach((id, i) => {
      if (id === 'form') return;
      const el = id === 'menu' ? $('#surface .menu-strip') : ctlEl(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const b = h('div', { class: 'sel-box' + (i === 0 ? ' primary' : '') });
      place(b, r.left - sr.left, r.top - sr.top, r.width, r.height);
      ov.append(b);
      if (single && id !== 'menu')
        for (const d of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
          const hd = h('div', { class: 'hdl ' + d, 'data-h': d });
          hd.style.left = (d.includes('w') ? -4 : d.includes('e') ? r.width - 3 : r.width / 2 - 4) + 'px';
          hd.style.top = (d.includes('n') ? -4 : d.includes('s') ? r.height - 3 : r.height / 2 - 4) + 'px';
          b.append(hd);
        }
    });
    if (drag && drag.decorate) drag.decorate(ov, sr);
  }

  function updateSel() {
    const win = $('#surface .fw');
    if (win) win.classList.toggle('form-sel', selection.includes('form'));
    renderOverlay();
    renderOutline();
    renderProps();
    renderStatus();
    updateToolbar();
  }
  function select(ids) {
    selection = ids.slice();
    ids.forEach(reveal);
    updateSel();
  }
  /** Make sure the control's tab page is showing. */
  function reveal(id) {
    let e = index.get(id);
    let changed = false;
    while (e && e.parent) {
      if (TYPES[e.parent.type] && TYPES[e.parent.type].slotsProp && e.parent.activeSlot !== e.slot) {
        e.parent.activeSlot = e.slot;
        changed = true;
      }
      e = index.get(e.parent.id);
    }
    if (changed) {
      lastSnap = JSON.stringify(project);
      persist();
      renderDesigner();
    }
  }

  // ---------------------------------------------------------------- designer pointer interaction
  const snapV = (v, e) => (prefs.snap && !(e && e.altKey) ? Math.round(v / prefs.grid) * prefs.grid : Math.round(v));
  function slotAt(x, y) {
    return document.elementsFromPoint(x, y).find((el) => el.classList && el.classList.contains('slot') && el.closest('#surface')) || null;
  }
  function setDropHint(el) {
    $$('#surface .drop-hint').forEach((x) => x !== el && x.classList.remove('drop-hint'));
    if (el) el.classList.add('drop-hint');
  }

  function onDesignerDown(e) {
    if (e.button !== 0) return;
    const t = e.target;
    const hd = t.closest('.hdl');
    if (hd) return startResize(e, hd.dataset.h);
    const fr = t.closest('.fw-rs');
    if (fr) return startFormResize(e, fr.dataset.fr);
    if (!t.closest('.fw')) {
      if (menuOpen !== -1) (menuOpen = -1), renderDesigner();
      return select(['form']);
    }
    if (t.closest('.menu-strip')) {
      const mi = t.closest('.mi');
      if (t.closest('.mdi')) return;
      if (mi) menuOpen = menuOpen === +mi.dataset.mi ? -1 : +mi.dataset.mi;
      selection = ['menu'];
      renderDesigner();
      return updateSel();
    }
    if (menuOpen !== -1) {
      menuOpen = -1;
      renderDesigner();
    }
    const pgBtn = t.closest('.pg-btn');
    if (pgBtn && !armed) {
      // design-time page switcher of a Pages container
      const n = nodeOf(pgBtn.closest('.ctl').dataset.id);
      n.activeSlot = Math.max(0, Math.min(n.slots.length - 1, +pgBtn.dataset.page));
      selection = [n.id];
      return quietChange();
    }
    const tab = t.closest('.tab-hdr');
    if (tab && !armed) {
      const n = nodeOf(tab.closest('.ctl').dataset.id);
      n.activeSlot = +tab.dataset.tab;
      selection = [n.id];
      return quietChange();
    }
    if (armed) {
      e.preventDefault();
      return startDrawCreate(e, t.closest('.slot') || $('#surface .slot.root'));
    }
    const ctl = t.closest('.ctl');
    if (ctl) return startMove(e, ctl.dataset.id);
    if (t.closest('.fw-title')) return select(['form']);
    startRubber(e);
  }

  function startMove(e, id) {
    e.preventDefault();
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    const wasSelected = selection.includes(id);
    if (additive) {
      if (wasSelected) {
        select(selection.filter((x) => x !== id));
        if (!selection.length) select(['form']);
        return;
      }
      select(ctlIds().concat(id));
    } else if (!wasSelected) select([id]);
    const items = topSelected().map((x) => {
      const n = nodeOf(x);
      return { id: x, node: n, x0: n.x, y0: n.y, nx: n.x, ny: n.y, el: ctlEl(x) };
    }).filter((it) => it.el);
    const P = items.find((i) => i.id === id) || items[0];
    if (!P) return;
    const sx = e.clientX;
    const sy = e.clientY;
    let started = false;
    let guides = [];
    let parentSlot = null;
    drag = {
      move(ev) {
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        if (!started) {
          if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
          started = true;
          items.forEach((it) => it.el.classList.add('dragging'));
          const pe = index.get(P.id);
          parentSlot = slotEl(pe.parent.id, pe.slot);
        }
        let nx = P.x0 + dx;
        let ny = P.y0 + dy;
        guides = [];
        if (items.length === 1 && prefs.snaplines && !ev.altKey && parentSlot) {
          const r = snapToSiblings(P.node, nx, ny, parentSlot);
          nx = r.sx ? r.x : snapV(nx, ev);
          ny = r.sy ? r.y : snapV(ny, ev);
          guides = r.guides;
        } else {
          nx = snapV(nx, ev);
          ny = snapV(ny, ev);
        }
        items.forEach((it) => {
          it.nx = it.x0 + (nx - P.x0);
          it.ny = it.y0 + (ny - P.y0);
          it.el.style.left = it.nx + 'px';
          it.el.style.top = it.ny + 'px';
        });
        if (items.length === 1) {
          const target = slotAt(ev.clientX, ev.clientY);
          setDropHint(target && target !== parentSlot && !isAncestor(P.id, target.dataset.owner) && target.dataset.owner !== P.id ? target : null);
        }
        renderOverlay();
        status(`${P.node.name}: X ${P.nx}, Y ${P.ny}`);
      },
      decorate(ov, sr) {
        if (!parentSlot) return;
        const pr = parentSlot.getBoundingClientRect();
        guides.forEach((g) => {
          const el = h('div', { class: 'guide ' + g.t });
          if (g.t === 'v') place(el, pr.left - sr.left + g.at, pr.top - sr.top + g.from, 1, g.to - g.from);
          else place(el, pr.left - sr.left + g.from, pr.top - sr.top + g.at, g.to - g.from, 1);
          ov.append(el);
        });
      },
      up(ev) {
        setDropHint(null);
        items.forEach((it) => it.el.classList.remove('dragging'));
        if (!started) {
          if (wasSelected && !additive) select([id].concat(selection.filter((x) => x !== id)));
          return;
        }
        let reparented = false;
        if (items.length === 1) {
          const target = slotAt(ev.clientX, ev.clientY);
          const cur = index.get(P.id);
          if (target) {
            const owner = target.dataset.owner;
            const si = +target.dataset.slot;
            if (!(owner === cur.parent.id && si === cur.slot) && owner !== P.id && !isAncestor(P.id, owner)) {
              const tr = target.getBoundingClientRect();
              const er = P.el.getBoundingClientRect();
              removeNode(P.id);
              P.node.x = snapV(er.left - tr.left, ev);
              P.node.y = snapV(er.top - tr.top, ev);
              nodeOf(owner).slots[si].push(P.node);
              reparented = true;
            }
          }
        }
        if (!reparented) items.forEach((it) => ((it.node.x = it.nx), (it.node.y = it.ny)));
        commit();
      },
    };
  }

  /** Align to edges / centers of sibling controls ("snaplines"). */
  function snapToSiblings(node, nx, ny, parentSlot) {
    const T = 5;
    const sibs = siblingsOf(node.id).filter((s) => s.id !== node.id);
    const W = parentSlot.clientWidth;
    const H = parentSlot.clientHeight;
    const cand = (axis) => {
      const out = [];
      sibs.forEach((s) => {
        const p = axis === 'x' ? s.x : s.y;
        const sz = axis === 'x' ? s.w : s.h;
        const o = axis === 'x' ? [s.y, s.y + s.h] : [s.x, s.x + s.w];
        out.push({ v: p, o }, { v: p + sz, o }, { v: p + sz / 2, c: 1, o });
      });
      out.push({ v: (axis === 'x' ? W : H) / 2, c: 1, o: [0, axis === 'x' ? H : W] });
      return out;
    };
    const res = { x: nx, y: ny, sx: false, sy: false, guides: [] };
    [['x', nx, node.w], ['y', ny, node.h]].forEach(([axis, pos, size]) => {
      let best = null;
      [pos, pos + size, pos + size / 2].forEach((m, mi) =>
        cand(axis).forEach((c) => {
          if (!!c.c !== (mi === 2)) return;
          const d = c.v - m;
          if (Math.abs(d) <= T && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, c };
        })
      );
      if (!best) return;
      const np = Math.round(pos + best.d);
      const other = axis === 'x' ? [ny, ny + node.h] : [nx, nx + node.w];
      const g = { t: axis === 'x' ? 'v' : 'h', at: Math.round(best.c.v), from: Math.min(other[0], best.c.o[0]), to: Math.max(other[1], best.c.o[1]) };
      res.guides.push(g);
      if (axis === 'x') (res.x = np), (res.sx = true);
      else (res.y = np), (res.sy = true);
    });
    return res;
  }

  function startResize(e, dir) {
    e.preventDefault();
    e.stopPropagation();
    const id = selection[0];
    const n = nodeOf(id);
    const el = ctlEl(id);
    if (!n || !el) return;
    const o = { x: n.x, y: n.y, w: n.w, h: n.h };
    let r = null;
    drag = {
      move(ev) {
        const dx = ev.clientX - e.clientX;
        const dy = ev.clientY - e.clientY;
        let { x, y, w, h: hh } = o;
        if (dir.includes('e')) w = Math.max(4, snapV(o.x + o.w + dx, ev) - o.x);
        if (dir.includes('s')) hh = Math.max(4, snapV(o.y + o.h + dy, ev) - o.y);
        if (dir.includes('w')) {
          x = Math.min(snapV(o.x + dx, ev), o.x + o.w - 4);
          w = o.x + o.w - x;
        }
        if (dir.includes('n')) {
          y = Math.min(snapV(o.y + dy, ev), o.y + o.h - 4);
          hh = o.y + o.h - y;
        }
        r = { x, y, w, h: hh };
        place(el, x, y, w, hh);
        renderOverlay();
        status(`${n.name}: W ${w}, H ${hh}`);
      },
      up() {
        if (r) {
          const dw = r.w - n.w;
          const dh = r.h - n.h;
          Object.assign(n, r);
          anchorChildren(n.slots, dw, dh);
          commit();
        }
      },
    };
  }

  function startFormResize(e, dir) {
    e.preventDefault();
    const p = doc.form.props;
    const w0 = num(p.Width, 640);
    const h0 = num(p.Height, 420);
    const win = $('#surface .fw');
    const client = $('#surface .fw-client');
    let r = null;
    drag = {
      move(ev) {
        const w = dir.includes('e') ? Math.max(120, snapV(w0 + ev.clientX - e.clientX, ev)) : w0;
        const hh = dir.includes('s') ? Math.max(60, snapV(h0 + ev.clientY - e.clientY, ev)) : h0;
        r = { w, h: hh };
        win.style.width = w + 'px';
        client.style.height = hh + 'px';
        renderOverlay();
        status(`${doc.form.name}: Width ${w}, Height ${hh}`);
      },
      up() {
        if (!r) return;
        anchorChildren(doc.form.slots, r.w - w0, r.h - h0);
        p.Width = r.w;
        p.Height = r.h;
        selection = ['form'];
        commit();
      },
    };
  }

  function startRubber(e) {
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const additive = e.shiftKey || e.ctrlKey;
    const base = additive ? ctlIds() : [];
    let box = null;
    drag = {
      move(ev) {
        if (!box && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
        box = box || h('div', { class: 'rubber' });
        const x1 = Math.min(sx, ev.clientX), y1 = Math.min(sy, ev.clientY), x2 = Math.max(sx, ev.clientX), y2 = Math.max(sy, ev.clientY);
        const hits = doc.form.slots[0]
          .filter((c) => {
            const r = ctlEl(c.id).getBoundingClientRect();
            return r.left < x2 && r.right > x1 && r.top < y2 && r.bottom > y1;
          })
          .map((c) => c.id);
        selection = [...new Set(base.concat(hits))];
        updateSel();
        const sr = $('#surface').getBoundingClientRect();
        place(box, x1 - sr.left, y1 - sr.top, x2 - x1, y2 - y1);
        $('#overlay').append(box);
      },
      up() {
        if (box) box.remove();
        if (!box && !additive) select(['form']);
        else if (!selection.length) select(['form']);
      },
    };
  }

  function startDrawCreate(e, slot) {
    const entry = armed;
    const sx = e.clientX;
    const sy = e.clientY;
    let box = null;
    drag = {
      move(ev) {
        if (!box && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
        box = box || h('div', { class: 'rubber' });
        const sr = $('#surface').getBoundingClientRect();
        place(box, Math.min(sx, ev.clientX) - sr.left, Math.min(sy, ev.clientY) - sr.top, Math.abs(ev.clientX - sx), Math.abs(ev.clientY - sy));
        $('#overlay').append(box);
      },
      up(ev) {
        if (box) box.remove();
        const r = slot.getBoundingClientRect();
        const x = snapV(Math.min(sx, ev.clientX) - r.left, ev);
        const y = snapV(Math.min(sy, ev.clientY) - r.top, ev);
        const size = box ? { w: Math.max(prefs.grid, snapV(Math.abs(ev.clientX - sx), ev)), h: Math.max(prefs.grid, snapV(Math.abs(ev.clientY - sy), ev)) } : null;
        if (!ev.shiftKey) disarm();
        addControl(entry, slot.dataset.owner, +slot.dataset.slot, x, y, size);
      },
    };
  }

  function addControl(entry, ownerId, si, x, y, size) {
    if (entry.type === 'Menu') {
      if (!doc.menu) createMenu();
      selection = ['menu'];
      commit();
      status('Menu added - edit its Items in the Properties panel');
      return;
    }
    const n = createNode(entry);
    n.x = Math.max(0, x);
    n.y = Math.max(0, y);
    if (size) Object.assign(n, size);
    nodeOf(ownerId).slots[si].push(n);
    selection = [n.id];
    commit();
    status(`Added ${n.name}`);
  }

  /** Add at a free spot in the selected container (or the form). */
  function addAuto(entry) {
    let owner = 'form';
    let si = 0;
    const sel = nodeOf(ctlIds()[0]);
    if (sel && TYPES[sel.type].container) (owner = sel.id), (si = sel.activeSlot || 0);
    const list = nodeOf(owner).slots[si];
    let pos = 16;
    while (list.some((c) => c.x === pos && c.y === pos)) pos += 16;
    addControl(entry, owner, si, pos, pos);
  }

  function onDesignerDblClick(e) {
    if (armed) return;
    const mitem = e.target.closest('[data-mitem]');
    if (mitem && doc.menu) return createHandler(doc.menu, mitem.dataset.mitem);
    if (e.target.closest('.menu-strip')) return;
    const ctl = e.target.closest('.ctl');
    if (ctl) {
      const n = nodeOf(ctl.dataset.id);
      return createHandler(n, TYPES[n.type].defaultEvent);
    }
    if (e.target.closest('.fw')) createHandler(doc.form, 'Opened');
  }

  // ---------------------------------------------------------------- event handlers & script
  function createHandler(node, key) {
    let hn = node.events[key];
    if (!hn) {
      hn = node.type === 'Menu' ? `${key}_Click` : `${node.name}_${key}`;
      node.events[key] = hn;
    }
    if (!GC.handlerRegex(hn).test(doc.script)) doc.script = doc.script.replace(/\s*$/, '\n\n') + GC.handlerStub(hn);
    commit();
    showTab('script');
    setTimeout(() => gotoHandler(hn), 0);
  }

  function gotoHandler(hn) {
    const ed = editors.script;
    const v = ed.value;
    const m = GC.handlerRegex(hn).exec(v);
    if (!m) return toast(`$${hn} is not defined in the script`);
    let ls = v.indexOf('\n', m.index + m[0].length) + 1;
    if (ls === 0) return ed.select(v.length);
    let le = v.indexOf('\n', ls);
    if (le < 0) le = v.length;
    if (/^\s*param\s*\(/i.test(v.slice(ls, le))) {
      ls = le + 1;
      le = v.indexOf('\n', ls);
      if (le < 0) le = v.length;
    }
    ed.select(le);
  }

  const isDefined = (name) => GC.handlerRegex(name).test(doc.script);

  /** Handlers for the "Go to handler" list: script blocks, [EventCallback]s and anything wired to an event. */
  function definedHandlers() {
    const out = new Set();
    const re = /^[ \t]*\$([A-Za-z_][\w]*)\s*=\s*(?:\{|\[EventCallback\])/gim;
    let m;
    while ((m = re.exec(doc.script))) out.add(m[1]);
    GC.bindings(doc).forEach((b) => isDefined(b.handler) && out.add(b.handler));
    return [...out];
  }

  /** Handlers that are wired but never assigned, across all forms. */
  function problems() {
    const multi = project.forms.length > 1;
    return project.forms.flatMap((d) => {
      const where = multi ? `[${d.form.name}] ` : '';
      const names = [d.form.name].concat(GC.allControls(d).map((c) => c.name));
      return GC.bindings(d)
        .filter((b) => !GC.handlerRegex(b.handler).test(d.script))
        .map((b) => `${where}$${b.target}.${b.event} is wired to $${b.handler}, which is not defined in that form's script.`)
        .concat(names.filter((n) => GC.nameProblem(n)).map((n) => `${where}${GC.nameProblem(n)}.`));
    });
  }

  /** Names of the current form, used to fill in snippets. */
  function snippetContext() {
    const ctls = GC.allControls(doc);
    return {
      form: doc.form.name,
      owner: doc.form.name,
      isDialog: isDialog(),
      dialogs: project.forms.filter((d, i) => i > 0 && d !== doc).map((d) => d.form.name),
      hasPages: ctls.some((c) => c.type === 'Pages'),
      first: (type, fallback) => {
        const c = ctls.find((x) => x.type === type);
        return c ? c.name : fallback;
      },
    };
  }
  function refreshSnippets() {
    const sel = $('#snippetPick');
    const ctx = snippetContext();
    const groups = new Map();
    (GC.SNIPPETS || []).forEach((s, i) => {
      if (s.available && !s.available(ctx)) return;
      if (!groups.has(s.group)) groups.set(s.group, h('optgroup', { label: s.group }));
      groups.get(s.group).append(h('option', { value: i, title: s.description }, s.name));
    });
    sel.replaceChildren(h('option', { value: '' }, 'Insert snippet...'), ...groups.values());
  }
  function insertSnippet(i) {
    const s = GC.SNIPPETS[i];
    if (!s) return;
    editors.script.insertBlock(s.code(snippetContext()));
    refreshHandlerJump();
    status(`Inserted snippet: ${s.name}`);
  }

  function refreshHandlerJump() {
    const sel = $('#handlerJump');
    const names = definedHandlers();
    sel.replaceChildren(h('option', { value: '' }, names.length ? `Go to handler (${names.length})...` : 'No event handlers yet'), ...names.map((n) => h('option', { value: n }, '$' + n)));
  }

  // ---------------------------------------------------------------- toolbox
  const TOOL_ENTRIES = [];
  function renderToolbox() {
    const box = $('#toolbox');
    const q = $('#toolSearch').value.trim().toLowerCase();
    box.replaceChildren();
    TOOLBOX.forEach((g) => {
      const items = g.items.filter((it) => !q || (it.label || TYPES[it.type].label).toLowerCase().includes(q));
      if (!items.length) return;
      const grp = h('div', { class: 'tb-group' }, h('div', { class: 'tb-gh', onclick: (e) => e.currentTarget.parentNode.classList.toggle('closed') }, g.group));
      const list = h('div', { class: 'tb-items' });
      items.forEach((it) => {
        let idx = TOOL_ENTRIES.indexOf(it);
        if (idx < 0) idx = TOOL_ENTRIES.push(it) - 1;
        const label = it.label || TYPES[it.type].label;
        const row = h('div', {
          class: 'tb-item' + (armed === it ? ' armed' : ''),
          draggable: 'true',
          title: `${label}\nClick, then click or drag on the form to place it.\nDouble-click to add it, or drag it onto the form.`,
          html: svg(it.icon || it.type) + `<span>${esc(label)}</span>`,
        });
        row.addEventListener('click', () => (armed === it ? disarm() : arm(it)));
        row.addEventListener('dblclick', () => {
          disarm();
          addAuto(it);
        });
        row.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/x-gc-tool', String(idx));
          e.dataTransfer.effectAllowed = 'copy';
        });
        list.append(row);
      });
      grp.append(list);
      box.append(grp);
    });
  }
  function arm(it) {
    armed = it;
    renderToolbox();
    $('#surface .fw') && $('#surface .fw').classList.add('armed');
    status(`Click or drag on the form to place a ${it.label || TYPES[it.type].label} (Shift keeps the tool, Esc cancels)`);
    showTab('designer');
  }
  function disarm() {
    if (!armed) return;
    armed = null;
    renderToolbox();
    $('#surface .fw') && $('#surface .fw').classList.remove('armed');
    status('Ready');
  }

  // ---------------------------------------------------------------- project (forms)
  function renderProject() {
    const box = $('#formsList');
    const list = h('div', { class: 'ol' });
    project.forms.forEach((d, i) =>
      list.append(
        h('div', {
          class: 'ol-row' + (d === doc ? ' sel' : ''),
          title: i === 0 ? 'Startup form: the window the script opens' : `Dialog: call Show-${d.form.name} from another form's script`,
          html: svg(i === 0 ? 'Window' : 'dialog') + `<span>${esc(d.form.name)}</span><span class="ty">${i === 0 ? 'Startup' : 'Dialog'}</span>`,
          onclick: () => openForm(i),
          oncontextmenu: (e) => {
            e.preventDefault();
            showCtx(
              [
                I('Open', () => openForm(i)),
                I('Set as Startup Form', () => setStartup(i), '', { disabled: i === 0 }),
                I(`Copy "Show-${d.form.name}" call`, () => copyText(`$result = Show-${d.form.name} -Owner ${mainName()}\nif ($result.DialogResult -eq 'OK') {\n    \n}`, 'Dialog call'), '', { disabled: i === 0 }),
                '-',
                I('Add Dialog Form', 'addDialog'),
                I('Delete Form', () => deleteForm(i), '', { disabled: project.forms.length < 2 }),
              ],
              e.clientX,
              e.clientY
            );
          },
        })
      )
    );
    box.replaceChildren(list);
  }

  function openForm(i) {
    if (project.active === i) return;
    project.active = i;
    selection = ['form'];
    menuOpen = -1;
    quietChange();
    if (activeTab === 'script') showTab('script');
  }

  function addDialog() {
    const d = createDialogDoc();
    project.forms.push(d);
    project.active = project.forms.length - 1;
    selection = ['form'];
    commit();
    status(`Added dialog ${d.form.name}. Show it from another form with Show-${d.form.name} -Owner ${mainName()}`);
  }

  function deleteForm(i) {
    if (project.forms.length < 2) return;
    const d = project.forms[i];
    if (!confirm(`Delete the form "${d.form.name}" and its script?`)) return;
    const current = doc;
    project.forms.splice(i, 1);
    project.active = Math.max(0, project.forms.indexOf(current));
    selection = ['form'];
    commit();
  }

  function setStartup(i) {
    const current = doc;
    const [d] = project.forms.splice(i, 1);
    project.forms.unshift(d);
    project.active = project.forms.indexOf(current);
    commit();
    status(`${d.form.name} is now the startup form; the other forms are dialogs`);
  }

  // ---------------------------------------------------------------- outline
  function renderOutline() {
    const box = $('#outline');
    const root = h('div', { class: 'ol' });
    const row = (id, depth, label, type, icon, onclick, extraClass) =>
      root.append(
        h('div', {
          class: 'ol-row' + (selection.includes(id) ? ' sel' : '') + (extraClass ? ' ' + extraClass : ''),
          style: `padding-left:${8 + depth * 14}px`,
          html: (icon ? svg(icon) : '') + `<span>${esc(label)}</span>` + (type ? `<span class="ty">${esc(type)}</span>` : ''),
          onclick,
          ondblclick: () => id && id !== 'tab' && id !== 'menu' && nodeOf(id) && createHandler(nodeOf(id), id === 'form' ? 'Opened' : TYPES[nodeOf(id).type].defaultEvent),
        })
      );
    row('form', 0, doc.form.name, 'Window', 'Window', () => select(['form']));
    if (doc.menu) row('menu', 1, doc.menu.name, 'Menu', 'Menu', () => select(['menu']));
    (function walk(list, depth) {
      list.forEach((c) => {
        row(c.id, depth, c.name, TYPES[c.type].label, typeIcon(c), (e) => (e.ctrlKey || e.shiftKey ? select(ctlIds().concat(c.id)) : select([c.id])));
        const sp = TYPES[c.type].slotsProp;
        if (sp)
          GC.lines(c.props[sp]).forEach((t, i) => {
            row('tab', depth + 1, t, c.type === 'Pages' ? `Page ${i + 1}` : 'TabItem', null, () => {
              c.activeSlot = i;
              selection = [c.id];
              quietChange();
            }, 'tab');
            walk(c.slots[i] || [], depth + 2);
          });
        else if (c.slots) walk(c.slots[0], depth + 1);
      });
    })(doc.form.slots[0], 1);
    box.replaceChildren(root);
  }

  // ---------------------------------------------------------------- property grid
  const NAME_PROP = GC.P('(Name)', 'name', '', 'Design', { hint: 'Variable name of the control in PowerShell, e.g. $button1.' });
  function schemaFor(n) {
    if (n.id === 'form') return [NAME_PROP].concat(GC.FORM_PROPS);
    if (n.id === 'menu') return [NAME_PROP].concat(GC.MENU_PROPS);
    return [NAME_PROP].concat(GC.LAYOUT_PROPS, GC.propsFor(n.type));
  }
  const getVal = (n, p) => (p.type === 'name' ? n.name : p.bind ? n[p.bind] : n.props[p.key]);
  const CAT_ORDER = ['Design', 'Common', 'Layout', 'Appearance', 'Behavior', 'Data'];
  const HELP = {
    Content: 'Text (content) shown by the control.',
    Text: 'Text of the control. Read or set it in PowerShell with $control.Text.',
    Watermark: 'Grey hint text shown while the box is empty.',
    Classes: 'Avalonia style classes separated by spaces. "accent" gives a Fluent accent button.',
    IsVisible: 'Hidden controls take no space and are drawn faded in the designer.',
    ToolTip: 'Emitted as the attached property ToolTip.Tip.',
    Items: 'One item per line.',
    SelectedIndex: 'Applied from PowerShell after the window is loaded (so items exist).',
    WindowStartupLocation: 'Where the window opens.',
    RequestedThemeVariant: 'Force the Light or Dark Fluent theme for this window.',
    Background: 'A color name (Red, SteelBlue) or hex (#RRGGBB / #AARRGGBB).',
    Foreground: 'A color name (Red, SteelBlue) or hex (#RRGGBB / #AARRGGBB).',
    BorderThickness: 'Uniform (1) or Left,Top,Right,Bottom (1,2,1,2).',
    PasswordChar: 'Character shown instead of the typed text, e.g. *.',
    Tabs: 'One tab header per line. Each tab gets its own canvas for controls.',
  };
  const EVENT_HELP = {
    Click: 'Raised when the control is clicked.',
    TextChanged: 'Raised whenever the text changes. Read $s.Text for the new value.',
    IsCheckedChanged: 'Raised when IsChecked changes. Read $s.IsChecked.',
    SelectionChanged: 'Raised when the selected item changes. Read $s.SelectedItem / $s.SelectedIndex.',
    ValueChanged: 'Raised when the value changes. Read $s.Value.',
    Opened: 'Raised once the window has been shown.',
    Closing: 'Raised before the window closes. Set $e.Cancel = $true to keep it open.',
  };
  const setHelp = (title, text) => ($('#propHelp').innerHTML = `<b>${esc(title)}</b>${esc(text || '')}`);

  function renderProps() {
    const nodes = selection.map(nodeOf).filter(Boolean);
    // object selector
    const sel = $('#objSelect');
    const opts = [h('option', { value: 'form' }, `${doc.form.name}  (Window)`)];
    if (doc.menu) opts.push(h('option', { value: 'menu' }, `${doc.menu.name}  (Menu)`));
    GC.allControls(doc).forEach((c) => opts.push(h('option', { value: c.id }, `${c.name}  (${TYPES[c.type].label})`)));
    if (nodes.length > 1) opts.unshift(h('option', { value: '' }, `${nodes.length} controls selected`));
    sel.replaceChildren(...opts);
    sel.value = nodes.length === 1 ? nodes[0].id : '';
    $$('.prop-tabs [data-ptab]').forEach((b) => b.classList.toggle('on', b.dataset.ptab === propTab));
    $('#sortBtn').classList.toggle('on', alpha);

    const box = $('#props');
    const focused = document.activeElement && box.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    const scroll = box.scrollTop;
    if (!nodes.length) return box.replaceChildren(h('div', { class: 'prop-empty' }, 'Nothing selected'));
    if (propTab === 'events') renderEvents(nodes, box);
    else renderPropGrid(nodes, box);
    box.scrollTop = scroll;
    if (focused) {
      const el = box.querySelector(`[data-key="${CSS.escape(focused)}"]`);
      if (el) el.focus();
    }
  }

  function renderPropGrid(nodes, box) {
    let schema;
    if (nodes.length === 1) schema = schemaFor(nodes[0]);
    else {
      const sets = nodes.map((n) => schemaFor(n).filter((p) => p.type !== 'name'));
      schema = sets[0].filter((p) => sets.every((s) => s.some((q) => q.key === p.key && q.type === p.type)));
    }
    const table = h('table', { class: 'pg' });
    const addRow = (p) => {
      const vals = nodes.map((n) => getVal(n, p));
      const mixed = vals.some((v) => v !== vals[0]);
      const val = mixed ? '' : vals[0];
      const modified = !mixed && p.type !== 'name' && !p.bind && GC.shouldEmit(Object.assign({}, p, { forceEmit: false }), val);
      const tr = h('tr', { class: modified ? 'mod' : '' }, h('td', { class: 'k', title: p.key }, p.key), h('td', null, editorFor(p, val, nodes)));
      tr.addEventListener('focusin', () => {
        $$('.pg tr.focus').forEach((x) => x.classList.remove('focus'));
        tr.classList.add('focus');
        setHelp(p.key, p.hint || HELP[p.key] || `${p.xaml || p.key} (${p.type})`);
      });
      table.append(tr);
    };
    if (alpha) schema.slice().sort((a, b) => a.key.localeCompare(b.key)).forEach(addRow);
    else
      CAT_ORDER.forEach((cat) => {
        const ps = schema.filter((p) => p.cat === cat);
        if (!ps.length) return;
        const closed = closedCats.has(cat);
        table.append(
          h('tr', { class: 'cat' + (closed ? ' closed' : ''), onclick: () => (closed ? closedCats.delete(cat) : closedCats.add(cat), renderProps()) }, h('td', { colspan: 2 }, cat))
        );
        if (!closed) ps.forEach(addRow);
      });
    box.replaceChildren(table);
  }

  function editorFor(p, val, nodes) {
    const set = (v) => applyProp(nodes, p, v);
    const k = p.key;
    let el;
    const onKeys = (input, revert) =>
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.tagName === 'INPUT') input.blur();
        if (e.key === 'Escape') {
          revert();
          input.blur();
        }
      });
    switch (p.type) {
      case 'bool': {
        el = h('select', { 'data-key': k }, h('option', { value: 'True' }, 'True'), h('option', { value: 'False' }, 'False'));
        if (val === '') el.prepend(h('option', { value: '' }, ''));
        el.value = val === '' ? '' : val ? 'True' : 'False';
        el.addEventListener('change', () => el.value && set(el.value === 'True'));
        return el;
      }
      case 'enum': {
        el = h('select', { 'data-key': k }, ...p.options.map((o) => h('option', { value: o }, o || '(default)')));
        if (!p.options.includes(val)) el.prepend(h('option', { value: val }, val));
        el.value = val;
        el.addEventListener('change', () => set(el.value));
        return el;
      }
      case 'color': {
        const text = h('input', { 'data-key': k, value: val, placeholder: '(default)', spellcheck: 'false' });
        const pick = h('input', { type: 'color', value: toHex(val), title: 'Pick a color' });
        text.addEventListener('change', () => set(text.value.trim()));
        pick.addEventListener('input', () => (text.value = pick.value));
        pick.addEventListener('change', () => set(pick.value));
        onKeys(text, () => (text.value = val));
        return h('div', { class: 'color' }, text, pick);
      }
      case 'multiline':
      case 'list':
      case 'menu': {
        const rows = Math.min(10, Math.max(p.type === 'menu' ? 6 : 2, String(val).split('\n').length + 1));
        el = h('textarea', { 'data-key': k, rows, spellcheck: 'false', placeholder: p.type === 'list' ? 'One item per line' : '' });
        el.value = val;
        el.addEventListener('change', () => set(el.value));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Tab' && p.type === 'menu') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
          }
          if (e.key === 'Escape') (el.value = val), el.blur();
        });
        return el;
      }
      case 'number': {
        el = h('input', { 'data-key': k, value: val, inputmode: 'decimal', placeholder: p.def === '' ? '(default)' : '', spellcheck: 'false' });
        el.addEventListener('change', () => {
          const v = el.value.trim();
          if (v === '') return set(p.def === '' ? '' : p.def);
          if (isNaN(Number(v))) {
            el.classList.add('bad');
            toast(`"${v}" is not a number`);
            el.value = val;
            return;
          }
          set(Number(v));
        });
        onKeys(el, () => (el.value = val));
        return el;
      }
      case 'anchor': {
        // Four clickable edges around a box, like the Anchor editor in PowerShell Studio.
        const a = GC.anchors({ props: { Anchor: val || p.def } });
        const box = h('div', { class: 'anchor-ed', 'data-key': k, tabindex: '0', title: 'Click the edges to anchor to them' });
        [['T', 'Top'], ['L', 'Left'], ['R', 'Right'], ['B', 'Bottom']].forEach(([key, label]) =>
          box.append(
            h('span', {
              class: 'ae-' + key + (a[key] ? ' on' : ''),
              title: label,
              onclick: () => {
                a[key] = !a[key];
                set(GC.anchorText(a));
              },
            })
          )
        );
        box.append(h('span', { class: 'ae-c' }), h('span', { class: 'ae-txt' }, val === '' && nodes.length > 1 ? '(mixed)' : GC.anchorText(a)));
        return box;
      }
      case 'name': {
        el = h('input', { 'data-key': k, value: val, spellcheck: 'false' });
        el.addEventListener('change', () => renameNode(nodes[0], el.value.trim()) || (el.value = nodes[0].name));
        onKeys(el, () => (el.value = val));
        return el;
      }
      default: {
        el = h('input', { 'data-key': k, value: val, spellcheck: 'false', placeholder: p.def === '' ? '' : String(p.def) });
        el.addEventListener('change', () => set(el.value));
        onKeys(el, () => (el.value = val));
        return el;
      }
    }
  }

  function toHex(c) {
    if (!c) return '#000000';
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillStyle = String(c).replace(/^#([0-9a-f]{2})([0-9a-f]{6})$/i, '#$2');
    return /^#[0-9a-f]{6}$/i.test(ctx.fillStyle) ? ctx.fillStyle : '#000000';
  }

  function applyProp(nodes, p, v) {
    nodes.forEach((n) => {
      if (p.bind) {
        let x = Math.round(Number(v) || 0);
        if (p.bind === 'w' || p.bind === 'h') x = Math.max(1, x);
        if (p.bind === 'w') anchorChildren(n.slots, x - n.w, 0);
        if (p.bind === 'h') anchorChildren(n.slots, 0, x - n.h);
        n[p.bind] = x;
      } else if (n.id === 'form' && (p.key === 'Width' || p.key === 'Height')) {
        const x = Math.max(60, Number(v) || p.def);
        const old = num(n.props[p.key], p.def);
        anchorChildren(n.slots, p.key === 'Width' ? x - old : 0, p.key === 'Height' ? x - old : 0);
        n.props[p.key] = x;
      } else {
        n.props[p.key] = v;
        if (TYPES[n.type] && TYPES[n.type].slotsProp === p.key) syncTabs(n);
      }
    });
    commit();
  }

  function renameNode(node, newName) {
    const old = node.name;
    if (newName === old) return true;
    const problem = GC.nameProblem(newName);
    if (problem) {
      toast(problem);
      return false;
    }
    if (allNames().has(newName) || (node.id === 'form' && project.forms.some((d) => d.form.name === newName))) {
      toast(`"${newName}" is already used`);
      return false;
    }
    node.name = newName;
    Object.keys(node.events).forEach((k) => {
      const hn = node.events[k];
      if (hn && hn.startsWith(old + '_')) node.events[k] = newName + hn.slice(old.length);
    });
    const varRe = new RegExp('\\$' + old + '(?![A-Za-z0-9])', 'g');
    if (node.id === 'form') {
      // Forms are referenced from other forms too ($formMain as -Owner, Show-formDialog1 calls).
      const showRe = new RegExp('\\bShow-' + old + '(?![A-Za-z0-9_])', 'g');
      project.forms.forEach((d) => (d.script = d.script.replace(varRe, '$$' + newName).replace(showRe, 'Show-' + newName)));
    } else if (node.id !== 'menu') doc.script = doc.script.replace(varRe, '$$' + newName);
    commit();
    status(`Renamed $${old} to $${newName} (script references updated)`);
    return true;
  }

  function renderEvents(nodes, box) {
    if (nodes.length > 1) return box.replaceChildren(h('div', { class: 'prop-empty' }, 'Select a single control to edit its events.'));
    const n = nodes[0];
    let evs;
    let def;
    if (n.id === 'form') (evs = GC.FORM_EVENTS.map((e) => ({ key: e, label: e }))), (def = 'Opened');
    else if (n.id === 'menu') evs = GC.menuLeaves(GC.parseMenu(n.props.Items)).map((i) => ({ key: i.name, label: i.name + '.Click' }));
    else (evs = GC.eventsFor(n.type).map((e) => ({ key: e, label: e }))), (def = TYPES[n.type].defaultEvent);
    const table = h('table', { class: 'pg' });
    table.append(h('tr', { class: 'cat' }, h('td', { colspan: 2 }, n.id === 'menu' ? 'Menu item Click events' : 'Events')));
    evs.forEach((ev) => {
      const val = n.events[ev.key] || '';
      const input = h('input', { 'data-key': 'ev:' + ev.key, value: val, placeholder: '', spellcheck: 'false', title: val && !isDefined(val) ? 'Not defined in the script yet' : '' });
      if (val && !isDefined(val)) input.classList.add('bad');
      input.addEventListener('change', () => {
        const v = input.value.trim().replace(/^\$/, '');
        if (v && !/^[A-Za-z_][\w]*$/.test(v)) {
          toast('Handler names must be valid PowerShell variable names');
          input.value = val;
          return;
        }
        if (v) n.events[ev.key] = v;
        else delete n.events[ev.key];
        commit();
      });
      input.addEventListener('keydown', (e) => e.key === 'Enter' && input.blur());
      const go = h('button', { title: val ? 'Go to handler' : 'Create handler', html: val ? '&#10140;' : '&#43;', onclick: () => createHandler(n, ev.key) });
      const tr = h('tr', { class: (val ? 'mod' : '') + (ev.key === def ? ' ev-default' : '') }, h('td', { class: 'k', title: 'Double-click to create the handler', ondblclick: () => createHandler(n, ev.key) }, ev.label), h('td', null, h('div', { class: 'ev' }, input, go)));
      tr.addEventListener('focusin', () => setHelp(ev.label, (EVENT_HELP[ev.key] || (n.id === 'menu' ? EVENT_HELP.Click : '')) + ' Double-click the name to create a handler.'));
      table.append(tr);
    });
    box.replaceChildren(table);
  }

  // ---------------------------------------------------------------- status / toolbar
  function status(msg) {
    $('#stMsg').textContent = msg;
  }
  function renderStatus() {
    const n = nodeOf(selection[0]);
    let s = '';
    if (selection.length > 1) s = `${selection.length} selected`;
    else if (n && n.id === 'form') s = `${n.name}  ${n.props.Width} x ${n.props.Height}`;
    else if (n && n.id !== 'menu') s = `${n.name}  X ${n.x}  Y ${n.y}  W ${n.w}  H ${n.h}`;
    else if (n) s = n.name;
    $('#stSel').textContent = s;
    const pr = problems();
    const b = $('#stProblems');
    b.textContent = pr.length ? `⚠ ${pr.length} problem${pr.length > 1 ? 's' : ''}` : '✓ No problems';
    b.classList.toggle('warn', pr.length > 0);
  }
  let statusTimer = 0;
  const renderStatusSoon = () => (clearTimeout(statusTimer), (statusTimer = setTimeout(renderStatus, 400)));

  const TOOLBAR = [
    ['new', 'New project', 'new'], ['open', 'Open project or exported .ps1 (Ctrl+O)', 'open'], ['save', 'Save project (Ctrl+S)', 'save'], ['export', 'Export PowerShell script (Ctrl+Shift+S)', 'export', 'Export .ps1'],
    '|', ['dialog', 'Add a dialog form to the project', 'addDialog', 'Add Dialog'],
    '|', ['undo', 'Undo (Ctrl+Z)', 'undo'], ['redo', 'Redo (Ctrl+Y)', 'redo'],
    '|', ['cut', 'Cut (Ctrl+X)', 'cut'], ['copy', 'Copy (Ctrl+C)', 'copy'], ['paste', 'Paste (Ctrl+V)', 'paste'], ['del', 'Delete (Del)', 'delete'],
    '|', ['alignL', 'Align lefts', 'alignL'], ['alignC', 'Align centers', 'alignC'], ['alignR', 'Align rights', 'alignR'], ['alignT', 'Align tops', 'alignT'], ['alignM', 'Align middles', 'alignM'], ['alignB', 'Align bottoms', 'alignB'],
    '|', ['sameW', 'Make same width', 'sameW'], ['sameH', 'Make same height', 'sameH'], ['centerH', 'Center horizontally in parent', 'centerH'], ['centerV', 'Center vertically in parent', 'centerV'],
    '|', ['front', 'Bring to front', 'front'], ['back', 'Send to back', 'back'],
    '|', ['grid', 'Show grid', 'toggleGrid'], ['snap', 'Snap to grid (hold Alt to disable while dragging)', 'toggleSnap'], ['lines', 'Snaplines (align to other controls)', 'toggleSnaplines'],
    '>', ['stop', 'Stop the running script (Shift+F5)', 'stop'], ['run', 'Run the GUI with pwsh (F5)', 'run', 'Run'],
  ];
  function renderToolbar() {
    const bar = $('#toolbar');
    TOOLBAR.forEach((t) => {
      if (t === '|') return bar.append(h('span', { class: 'sep' }));
      if (t === '>') return bar.append(h('span', { class: 'spacer' }));
      const [icon, title, cmd, label] = t;
      bar.append(h('button', { class: 'tb' + (cmd === 'run' ? ' run' : ''), title, 'data-cmd': cmd, html: svg(icon) + (label ? `<span>${label}</span>` : '') }));
    });
  }
  function updateToolbar() {
    const n = topSelected().length;
    const fm = fmtNodes();
    const dis = {
      undo: !undoStack.length, redo: !redoStack.length, cut: !n, copy: !n, paste: !clip, delete: !n && !selection.includes('menu'),
      alignL: !fm || fm.length < 2, alignC: !fm || fm.length < 2, alignR: !fm || fm.length < 2, alignT: !fm || fm.length < 2, alignM: !fm || fm.length < 2, alignB: !fm || fm.length < 2,
      sameW: !fm || fm.length < 2, sameH: !fm || fm.length < 2, centerH: !fm, centerV: !fm, front: !n, back: !n, stop: !GC.runner.running,
    };
    $$('#toolbar .tb').forEach((b) => {
      b.disabled = !!dis[b.dataset.cmd];
    });
    const on = { toggleGrid: prefs.showGrid, toggleSnap: prefs.snap, toggleSnaplines: prefs.snaplines };
    $$('#toolbar .tb').forEach((b) => b.dataset.cmd in on && b.classList.toggle('on', on[b.dataset.cmd]));
  }

  // ---------------------------------------------------------------- commands
  /** Selected controls sharing the primary control's parent. */
  function fmtNodes() {
    const ids = ctlIds();
    if (!ids.length || !index.size) return null;
    const pe = index.get(ids[0]);
    return ids.filter((id) => {
      const e = index.get(id);
      return e.parent === pe.parent && e.slot === pe.slot;
    }).map(nodeOf);
  }
  function align(kind) {
    const ns = fmtNodes();
    if (!ns || ns.length < 2) return;
    const p = ns[0];
    ns.slice(1).forEach((n) => {
      if (kind === 'L') n.x = p.x;
      if (kind === 'C') n.x = Math.round(p.x + p.w / 2 - n.w / 2);
      if (kind === 'R') n.x = p.x + p.w - n.w;
      if (kind === 'T') n.y = p.y;
      if (kind === 'M') n.y = Math.round(p.y + p.h / 2 - n.h / 2);
      if (kind === 'B') n.y = p.y + p.h - n.h;
      if (kind === 'W') n.w = p.w;
      if (kind === 'H') n.h = p.h;
    });
    commit();
  }
  function centerIn(axis) {
    const ns = fmtNodes();
    if (!ns) return;
    const pe = index.get(ns[0].id);
    const s = slotEl(pe.parent.id, pe.slot);
    if (!s) return;
    if (axis === 'H') {
      const x1 = Math.min(...ns.map((n) => n.x)), x2 = Math.max(...ns.map((n) => n.x + n.w));
      const d = Math.round((s.clientWidth - (x2 - x1)) / 2) - x1;
      ns.forEach((n) => (n.x += d));
    } else {
      const y1 = Math.min(...ns.map((n) => n.y)), y2 = Math.max(...ns.map((n) => n.y + n.h));
      const d = Math.round((s.clientHeight - (y2 - y1)) / 2) - y1;
      ns.forEach((n) => (n.y += d));
    }
    commit();
  }
  function zorder(front) {
    topSelected().forEach((id) => {
      const list = siblingsOf(id);
      const i = list.findIndex((c) => c.id === id);
      const [n] = list.splice(i, 1);
      front ? list.push(n) : list.unshift(n);
    });
    commit();
  }

  function copySel() {
    const ids = topSelected();
    if (!ids.length) return false;
    clip = ids.map((id) => JSON.parse(JSON.stringify(nodeOf(id))));
    pasteCount = 0;
    updateToolbar();
    status(`Copied ${ids.length} control${ids.length > 1 ? 's' : ''}`);
    return true;
  }
  function deleteSel() {
    if (selection.includes('menu')) doc.menu = null;
    topSelected().forEach(removeNode);
    selection = ['form'];
    commit();
  }
  function paste() {
    if (!clip) return;
    let owner = 'form';
    let si = 0;
    const sel = nodeOf(ctlIds()[0]);
    if (sel) {
      if (TYPES[sel.type].container && !clip.some((c) => c.id === sel.id)) (owner = sel.id), (si = sel.activeSlot || 0);
      else {
        const e = index.get(sel.id);
        (owner = e.parent.id), (si = e.slot);
      }
    }
    pasteCount++;
    const taken = allNames();
    const fresh = clip.map((orig) => {
      const c = JSON.parse(JSON.stringify(orig));
      (function re(x) {
        x.id = newId();
        x.name = uniqueName(x.name.replace(/\d+$/, '') || TYPES[x.type].prefix, taken);
        x.events = {};
        (x.slots || []).forEach((l) => l.forEach(re));
      })(c);
      c.x += prefs.grid * 2 * pasteCount;
      c.y += prefs.grid * 2 * pasteCount;
      return c;
    });
    nodeOf(owner).slots[si].push(...fresh);
    selection = fresh.map((c) => c.id);
    commit();
  }
  function selectAll() {
    const first = ctlIds()[0];
    const list = first ? siblingsOf(first) : doc.form.slots[0];
    select(list.map((c) => c.id).length ? list.map((c) => c.id) : ['form']);
  }
  function nudge(dx, dy, resize) {
    const ns = topSelected().map(nodeOf);
    if (!ns.length) return;
    ns.forEach((n) => {
      if (resize) (n.w = Math.max(4, n.w + dx)), (n.h = Math.max(4, n.h + dy));
      else (n.x += dx), (n.y += dy);
    });
    commit();
  }

  function download(name, text, type) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    document.body.append(a);
    a.click();
    setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 1000);
  }
  async function copyText(text, what) {
    try {
      await navigator.clipboard.writeText(text);
      toast(what + ' copied to the clipboard');
    } catch (e) {
      toast('Clipboard is not available in this browser context');
    }
  }

  function loadExample(ex) {
    if (GC.allControls(doc).length && !confirm('Open the "' + ex.name + '" example? It replaces the current design (save it first if you need it).')) return;
    loadProject(ex.build());
    showTab('designer');
    toast('Loaded example: ' + ex.name);
    status(ex.description);
  }

  function loadProject(p) {
    project = normalize(p);
    undoStack = [];
    redoStack = [];
    selection = ['form'];
    menuOpen = -1;
    afterChange();
    committedScripts = scriptsNow();
  }

  const CMD = {
    addDialog: () => addDialog(),
    new() {
      if (GC.allControls(doc).length && !confirm('Start a new form? The current design will be replaced (save it first if you need it).')) return;
      loadProject(blankProject());
      status('New form');
    },
    open: () => $('#fileInput').click(),
    save() {
      download(`${mainName()}.guiproj.json`, JSON.stringify(project, null, 2), 'application/json');
      status('Project saved');
    },
    export() {
      const pr = problems();
      download(`${mainName()}.ps1`, GC.genScript(project).replace(/\n/g, '\r\n'), 'text/plain');
      if (pr.length) toast(`Exported with ${pr.length} problem${pr.length > 1 ? 's' : ''} - see the status bar`);
      else status(`Exported ${mainName()}.ps1`);
    },
    copyScript: () => copyText(GC.genScript(project), 'Script'),
    copyXaml: () => copyText(GC.genXaml(doc), 'XAML'),
    undo, redo,
    cut: () => copySel() && deleteSel(),
    copy: copySel,
    paste,
    duplicate: () => copySel() && paste(),
    delete: deleteSel,
    selectAll,
    alignL: () => align('L'), alignC: () => align('C'), alignR: () => align('R'),
    alignT: () => align('T'), alignM: () => align('M'), alignB: () => align('B'),
    sameW: () => align('W'), sameH: () => align('H'), sameS: () => (align('W'), align('H')),
    centerH: () => centerIn('H'), centerV: () => centerIn('V'),
    front: () => zorder(true), back: () => zorder(false),
    toggleGrid: () => ((prefs.showGrid = !prefs.showGrid), savePrefs(), renderDesigner(), updateToolbar()),
    toggleSnap: () => ((prefs.snap = !prefs.snap), savePrefs(), updateToolbar()),
    toggleSnaplines: () => ((prefs.snaplines = !prefs.snaplines), savePrefs(), updateToolbar()),
    run() {
      if (GC.runner.available) {
        const pr = problems();
        if (pr.length) toast(`Running with ${pr.length} problem${pr.length > 1 ? 's' : ''} - see the status bar`);
        GC.runner.run(GC.genScript(project, { embed: false }));
        return;
      }
      const file = mainName() + '.ps1';
      const cmds = `# One-time setup (PowerShell 7.4 or newer)\nInstall-PSResource -Name GliderUI\nInstall-GLIServer\n\n# Run your GUI\npwsh -File .\\${file}`;
      modal(
        'Run your GUI',
        `<p><b>Run straight from the designer:</b> start GUI Creator through its local launcher, then press <b>F5</b>. Output and errors appear in an Output panel.</p><pre>pwsh -File .\\Start-GuiCreator.ps1</pre>
        <p>The launcher serves this page on <code>http://localhost</code> and runs your design with <code>pwsh</code>. Without it, a web page cannot start PowerShell, so export the script and run it yourself with <b>PowerShell 7.4+</b>:</p><pre>${esc(cmds)}</pre>
        <p>GliderUI renders the window in its own server process (Avalonia), so it runs on Windows, macOS and Linux.</p>
        <p>The design is embedded at the end of the exported <code>.ps1</code>. Open that file here later to continue designing.</p>`,
        [
          { label: 'Copy commands', action: () => copyText(cmds, 'Commands') },
          { label: 'Export ' + file, primary: true, action: () => CMD.export() },
        ]
      );
    },
    stop: () => GC.runner.stop(),
    shortcuts() {
      const rows = [
        ['Click toolbox item, then click/drag on form', 'Place a control (Shift keeps the tool)'], ['Double-click toolbox item', 'Add control to the form / selected container'],
        ['Double-click control', 'Create / go to its default event handler'], ['Drag control into Panel/GroupBox/Tab', 'Move it into that container'],
        ['Shift/Ctrl + Click', 'Add to selection'], ['Drag on empty form', 'Rubber-band select'], ['Alt while dragging', 'Disable snapping'],
        ['Arrow keys', 'Move 1 px (Shift: one grid step)'], ['Ctrl + Arrow keys', 'Resize (Shift: one grid step)'],
        ['Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+D', 'Copy / Cut / Paste / Duplicate'], ['Del', 'Delete'], ['Ctrl+A', 'Select all siblings'],
        ['Ctrl+Z / Ctrl+Y', 'Undo / Redo (designer; also undoes handler stubs and renames it made in your script)'],
        ['Ctrl+Space (Script tab)', 'Autocomplete: controls, members, events, commands. Opens by itself after $, $control. and Verb-'], ['Esc', 'Cancel tool / select parent'],
        ['Ctrl+S / Ctrl+Shift+S / Ctrl+O', 'Save project / Export .ps1 / Open'], ['F5 / Shift+F5', 'Run with pwsh (needs Start-GuiCreator.ps1) / Stop'],
      ];
      modal('Keyboard & mouse', `<table>${rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>`);
    },
    about() {
      modal(
        'About GUI Creator',
        `<p>A PowerShell GUI designer in the spirit of SAPIEN PowerShell Studio's form designer, producing scripts for <a href="https://github.com/mdgrs-mei/GliderUI" target="_blank" rel="noopener">GliderUI</a> (Avalonia UI for PowerShell).</p>
        <p><b>How the generated script works:</b> the designer writes XAML with a <code>Canvas</code> for absolute positioning, loads it with <code>[AvaloniaRuntimeXamlLoader]::Parse()</code>, gets every named control with <code>$window.FindControl('name')</code> and wires your handlers with <code>$control.Add&lt;Event&gt;($handler)</code>.</p>
        <p>The designer preview approximates the Avalonia Fluent theme; exact sizes can differ slightly at run time.</p>`
      );
    },
    gliderui: () => window.open('https://github.com/mdgrs-mei/GliderUI', '_blank', 'noopener'),
    examples: () => window.open('https://github.com/mdgrs-mei/GliderUI/tree/main/examples', '_blank', 'noopener'),
  };

  // ---------------------------------------------------------------- menus, context menu, modal, toast
  let ctxOwner = null;
  function showCtx(items, x, y, owner) {
    const m = $('#ctxMenu');
    m.replaceChildren(
      ...items.map((it) =>
        it === '-'
          ? h('div', { class: 'cs' })
          : h(
              'div',
              {
                class: 'ci' + (it.disabled ? ' dis' : ''),
                onclick: () => {
                  if (it.disabled) return;
                  closeCtx();
                  it.action();
                },
              },
              h('span', { class: 'ck' }, it.checked ? '✓' : ''),
              h('span', null, it.label),
              it.sc ? h('span', { class: 'sc' }, it.sc) : null
            )
      )
    );
    m.hidden = false;
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(x, innerWidth - r.width - 4) + 'px';
    m.style.top = Math.min(y, innerHeight - r.height - 4) + 'px';
    ctxOwner = owner || null;
    $$('#menus > button').forEach((b) => b.classList.toggle('open', b === owner));
  }
  function closeCtx() {
    $('#ctxMenu').hidden = true;
    ctxOwner = null;
    $$('#menus > button').forEach((b) => b.classList.remove('open'));
  }
  const I = (label, cmd, sc, extra) => Object.assign({ label, sc, action: typeof cmd === 'function' ? cmd : CMD[cmd] }, extra || {});

  const MENUS = {
    File: () => [I('New Project', 'new'), I('Open...', 'open', 'Ctrl+O'), I('Save Project', 'save', 'Ctrl+S'), '-', I('Add Dialog Form', 'addDialog'), I('Set Current Form as Startup', () => setStartup(project.active), '', { disabled: !isDialog() }), '-', I('Export PowerShell Script (.ps1)', 'export', 'Ctrl+Shift+S'), I('Copy Script to Clipboard', 'copyScript'), '-', I('Run', 'run', 'F5'), I('Stop', 'stop', 'Shift+F5', { disabled: !GC.runner.running })],
    Edit: () => {
      const n = !topSelected().length;
      return [
        I('Undo', 'undo', 'Ctrl+Z', { disabled: !undoStack.length }), I('Redo', 'redo', 'Ctrl+Y', { disabled: !redoStack.length }), '-',
        I('Cut', 'cut', 'Ctrl+X', { disabled: n }), I('Copy', 'copy', 'Ctrl+C', { disabled: n }), I('Paste', 'paste', 'Ctrl+V', { disabled: !clip }),
        I('Duplicate', 'duplicate', 'Ctrl+D', { disabled: n }), I('Delete', 'delete', 'Del', { disabled: n && !selection.includes('menu') }), '-', I('Select All', 'selectAll', 'Ctrl+A'),
      ];
    },
    Format: () => {
      const fm = fmtNodes();
      const two = !fm || fm.length < 2;
      return [
        I('Align Lefts', 'alignL', '', { disabled: two }), I('Align Centers', 'alignC', '', { disabled: two }), I('Align Rights', 'alignR', '', { disabled: two }), '-',
        I('Align Tops', 'alignT', '', { disabled: two }), I('Align Middles', 'alignM', '', { disabled: two }), I('Align Bottoms', 'alignB', '', { disabled: two }), '-',
        I('Make Same Width', 'sameW', '', { disabled: two }), I('Make Same Height', 'sameH', '', { disabled: two }), I('Make Same Size', 'sameS', '', { disabled: two }), '-',
        I('Center Horizontally', 'centerH', '', { disabled: !fm }), I('Center Vertically', 'centerV', '', { disabled: !fm }), '-',
        I('Bring to Front', 'front', '', { disabled: !fm }), I('Send to Back', 'back', '', { disabled: !fm }),
      ];
    },
    View: () => [
      I('Designer', () => showTab('designer'), '', { checked: activeTab === 'designer' }), I('Script', () => showTab('script'), '', { checked: activeTab === 'script' }),
      I('Generated Script', () => showTab('generated'), '', { checked: activeTab === 'generated' }), I('XAML', () => showTab('xaml'), '', { checked: activeTab === 'xaml' }), '-',
      I('Show Grid', 'toggleGrid', '', { checked: prefs.showGrid }), I('Snap to Grid', 'toggleSnap', '', { checked: prefs.snap }), I('Snaplines', 'toggleSnaplines', '', { checked: prefs.snaplines }), '-',
      ...[4, 8, 16].map((g) => I(`Grid Size ${g} px`, () => ((prefs.grid = g), savePrefs(), renderDesigner()), '', { checked: prefs.grid === g })),
    ],
    Examples: () => GC.EXAMPLES.map((ex) => I(ex.name, () => loadExample(ex), ex.tag)).concat('-', I('Browse GliderUI examples on GitHub', 'examples')),
    Help: () => [I('Guided Tour...', () => GC.tour.open()), '-', I('Running Your GUI', 'run', 'F5'), I('Keyboard & Mouse', 'shortcuts'), '-', I('GliderUI on GitHub', 'gliderui'), I('GliderUI Examples', 'examples'), '-', I('About GUI Creator', 'about')],
  };

  function designerCtx(e) {
    e.preventDefault();
    const ctl = e.target.closest('.ctl');
    if (ctl && !selection.includes(ctl.dataset.id)) select([ctl.dataset.id]);
    if (!ctl && e.target.closest('.menu-strip')) select(['menu']);
    else if (!ctl) select(['form']);
    const n = nodeOf(selection[0]);
    const has = topSelected().length > 0;
    const items = [];
    if (n && n.id !== 'form' && n.id !== 'menu') items.push(I(`Add ${TYPES[n.type].defaultEvent} Event Handler`, () => createHandler(n, TYPES[n.type].defaultEvent)), I('Edit Events...', () => ((propTab = 'events'), renderProps())), '-');
    if (n && n.id === 'form') items.push(I('Add Opened Event Handler', () => createHandler(n, 'Opened')), '-');
    items.push(
      I('Cut', 'cut', 'Ctrl+X', { disabled: !has }), I('Copy', 'copy', 'Ctrl+C', { disabled: !has }), I('Paste', 'paste', 'Ctrl+V', { disabled: !clip }),
      I('Duplicate', 'duplicate', 'Ctrl+D', { disabled: !has }), I('Delete', 'delete', 'Del', { disabled: !has && n.id !== 'menu' }), '-',
      I('Bring to Front', 'front', '', { disabled: !has }), I('Send to Back', 'back', '', { disabled: !has }), '-', I('View Script', () => showTab('script'))
    );
    showCtx(items, e.clientX, e.clientY);
  }

  function modal(title, html, buttons) {
    const m = $('#modal');
    $('.modal-title', m).textContent = title;
    $('.modal-body', m).innerHTML = html;
    const foot = $('.modal-foot', m);
    foot.replaceChildren(...(buttons || []).map((b) => h('button', { class: 'btn' + (b.primary ? ' primary' : ''), onclick: () => b.action() }, b.label)), h('button', { class: 'btn', onclick: () => (m.hidden = true) }, 'Close'));
    m.hidden = false;
  }
  function toast(msg) {
    const t = h('div', { class: 'toast' }, msg);
    document.body.append(t);
    setTimeout(() => (t.style.opacity = '0'), 2200);
    setTimeout(() => t.remove(), 2600);
  }

  // ---------------------------------------------------------------- tabs & editors
  function showTab(name) {
    activeTab = name;
    $$('#docTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
    $$('#center .view').forEach((v) => v.classList.toggle('on', v.id === name + 'View'));
    if (name === 'script') {
      editors.script.value = doc.script;
      editors.script.refresh();
      refreshHandlerJump();
      refreshSnippets();
    }
    if (name === 'generated' || name === 'xaml') refreshGenerated();
    if (name === 'designer') renderOverlay();
  }
  function refreshGenerated() {
    if (activeTab === 'generated') editors.generated.value = GC.genScript(project, { embed: false });
    if (activeTab === 'xaml') editors.xaml.value = GC.genXaml(doc);
  }

  // ---------------------------------------------------------------- keyboard
  function onKey(e) {
    const k = e.key;
    const kl = k.toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (!$('#modal').hidden && k === 'Escape') return ($('#modal').hidden = true);
    if (!$('#ctxMenu').hidden && k === 'Escape') return closeCtx();
    if (mod && kl === 's') {
      e.preventDefault();
      return e.shiftKey ? CMD.export() : CMD.save();
    }
    if (mod && kl === 'o') {
      e.preventDefault();
      return CMD.open();
    }
    if (k === 'F5') {
      e.preventDefault();
      return e.shiftKey ? CMD.stop() : CMD.run();
    }
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (activeTab !== 'designer') return;
    const run = (f) => (e.preventDefault(), f());
    if (mod && (kl === 'y' || (kl === 'z' && e.shiftKey))) return run(redo);
    if (mod && kl === 'z') return run(undo);
    if (mod && kl === 'c') return run(CMD.copy);
    if (mod && kl === 'x') return run(CMD.cut);
    if (mod && kl === 'v') return run(paste);
    if (mod && kl === 'd') return run(CMD.duplicate);
    if (mod && kl === 'a') return run(selectAll);
    if (k === 'Delete' || k === 'Backspace') return run(deleteSel);
    const step = e.shiftKey ? prefs.grid : 1;
    const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[k]) return run(() => nudge(arrows[k][0], arrows[k][1], mod));
    if (k === 'Escape') {
      if (armed) return disarm();
      const e0 = index.get(ctlIds()[0]);
      return select([e0 && e0.parent ? e0.parent.id : 'form']);
    }
    if (k === 'Enter' && selection.length === 1) {
      const first = $('#props [data-key]');
      if (first) run(() => first.focus());
    }
  }

  // ---------------------------------------------------------------- init
  function init() {
    let loaded = null;
    try {
      const s = localStorage.getItem(STORE);
      if (s) loaded = normalize(JSON.parse(s));
    } catch (e) {
      loaded = null;
    }
    project = loaded || sampleProject();
    setDoc();
    reindex();
    selection = ['form'];
    lastSnap = JSON.stringify(project);

    renderToolbar();
    renderToolbox();
    Object.keys(MENUS).forEach((name) => {
      const b = h('button', { 'data-menu': name }, name);
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (ctxOwner === b) return closeCtx();
        const r = b.getBoundingClientRect();
        showCtx(MENUS[name](), r.left, r.bottom + 2, b);
      });
      b.addEventListener('pointerenter', () => {
        if (ctxOwner && ctxOwner !== b && ctxOwner.dataset.menu) {
          const r = b.getBoundingClientRect();
          showCtx(MENUS[name](), r.left, r.bottom + 2, b);
        }
      });
      $('#menus').append(b);
    });

    editors.script = GC.createEditor($('#scriptEditor'), {
      lang: 'ps',
      complete: scriptCompletions,
      onChange: (v) => {
        doc.script = v;
        lastSnap = JSON.stringify(project); // so the next designer step can undo back to this text
        persistSoon();
        renderStatusSoon();
      },
      onCursor: (p) => ($('#stPos').textContent = `Ln ${p.line}, Col ${p.col}`),
    });
    editors.generated = GC.createEditor($('#generatedEditor'), { lang: 'ps', readOnly: true });
    editors.xaml = GC.createEditor($('#xamlEditor'), { lang: 'xml', readOnly: true });
    editors.script.value = doc.script;

    // wiring
    document.addEventListener('click', (e) => {
      const c = e.target.closest('[data-cmd]');
      if (c && !c.disabled && CMD[c.dataset.cmd]) CMD[c.dataset.cmd]();
    });
    $$('#docTabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
    $$('.prop-tabs [data-ptab]').forEach((b) => b.addEventListener('click', () => ((propTab = b.dataset.ptab), renderProps())));
    $('#sortBtn').addEventListener('click', () => ((alpha = !alpha), renderProps()));
    $('#objSelect').addEventListener('change', (e) => e.target.value && select([e.target.value]));
    $('#toolSearch').addEventListener('input', renderToolbox);
    $('#snippetPick').addEventListener('change', (e) => {
      if (e.target.value !== '') insertSnippet(+e.target.value);
      e.target.value = '';
    });
    $('#handlerJump').addEventListener('change', (e) => {
      if (e.target.value) gotoHandler(e.target.value);
      e.target.value = '';
    });
    $('#stProblems').addEventListener('click', () => {
      const pr = problems();
      modal('Problems', pr.length ? `<ul>${pr.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><p>Create the handler in the Script tab, or clear the binding in the Events tab.</p>` : '<p>No problems found.</p>');
    });

    const dz = $('#dz');
    dz.addEventListener('pointerdown', onDesignerDown);
    dz.addEventListener('dblclick', onDesignerDblClick);
    dz.addEventListener('contextmenu', designerCtx);
    dz.addEventListener('pointermove', (e) => {
      if (drag) return;
      const root = $('#surface .slot.root');
      if (!root) return;
      const r = root.getBoundingClientRect();
      $('#stPos').textContent = `X ${Math.round(e.clientX - r.left)}, Y ${Math.round(e.clientY - r.top)}`;
    });
    dz.addEventListener('dragover', (e) => {
      if (!e.dataTransfer.types.includes('text/x-gc-tool')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDropHint(e.target.closest('.slot') || $('#surface .slot.root'));
    });
    dz.addEventListener('dragleave', (e) => !dz.contains(e.relatedTarget) && setDropHint(null));
    dz.addEventListener('drop', (e) => {
      const idx = e.dataTransfer.getData('text/x-gc-tool');
      if (idx === '') return;
      e.preventDefault();
      setDropHint(null);
      const s = e.target.closest('.slot') || $('#surface .slot.root');
      const r = s.getBoundingClientRect();
      addControl(TOOL_ENTRIES[+idx], s.dataset.owner, +s.dataset.slot, snapV(e.clientX - r.left, e), snapV(e.clientY - r.top, e));
    });
    window.addEventListener('pointermove', (e) => drag && drag.move(e));
    window.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.up(e);
      renderOverlay();
    });
    window.addEventListener('resize', renderOverlay);
    document.addEventListener('pointerdown', (e) => !e.target.closest('#ctxMenu') && !e.target.closest('#menus') && closeCtx(), true);
    window.addEventListener('blur', closeCtx);
    document.addEventListener('keydown', onKey);
    $('#modal').addEventListener('pointerdown', (e) => e.target.id === 'modal' && ($('#modal').hidden = true));
    $('#fileInput').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const text = await f.text();
        const p = /\.ps1$/i.test(f.name) ? GC.extractProjectFromScript(text) : JSON.parse(text);
        if (!p) throw new Error('No GUI Creator design data was found in this script. Only scripts exported by GUI Creator can be opened.');
        loadProject(p);
        status('Opened ' + f.name);
      } catch (err) {
        modal('Could not open file', `<p>${esc(err.message)}</p>`);
      }
    });

    // local runner (Start-GuiCreator.ps1)
    GC.runner.onLink = gotoRunLine;
    document.addEventListener('gc-runner', updateToolbar);
    $('#outStop').addEventListener('click', () => GC.runner.stop());
    $('#outClear').addEventListener('click', () => GC.runner.clear());
    $('#outClose').addEventListener('click', () => GC.runner.hide());
    $('#stRunner').addEventListener('click', () => (GC.runner.available ? GC.runner.show() : CMD.run()));
    GC.runner.init().then((ok) => {
      const el = $('#stRunner');
      const i = GC.runner.info;
      el.textContent = ok ? `\u25B6 pwsh ${i.pwsh} \u00B7 GliderUI ${i.gliderui || 'not installed'}` : 'Runner offline';
      el.title = ok ? 'Connected to Start-GuiCreator.ps1 - press F5 to run' : 'Start GUI Creator with Start-GuiCreator.ps1 to run designs with F5';
      el.classList.toggle('off', !ok);
    });

    renderAll();
    if (GC.tour) setTimeout(() => GC.tour.offer(), 300);
  }

  // ---------------------------------------------------------------- script autocomplete
  const COMMON_MEMBERS = ['IsEnabled', 'IsVisible', 'Opacity', 'Tag', 'Width', 'Height', 'Margin', 'Name', 'Classes', 'Focus()'];
  const EXTRA_MEMBERS = {
    Window: ['Close()', 'Show()', 'Hide()', 'Activate()', 'FindControl(', 'Content', 'WindowState', 'StorageProvider', 'WaitForClosed()'],
    TextBox: ['Text', 'SelectedText', 'CaretIndex', 'SelectAll()', 'Clear()'],
    ComboBox: ['Items', 'SelectedItem', 'SelectedIndex', 'IsDropDownOpen'],
    ListBox: ['Items', 'SelectedItem', 'SelectedItems', 'SelectedIndex', 'ScrollIntoView('],
    DataGrid: ['ItemsSource', 'SelectedItem', 'SelectedItems', 'SelectedIndex', 'Columns'],
    TabControl: ['Items', 'SelectedItem'],
    Pages: ['Children'],
    DatePicker: ['SelectedDate'],
    CalendarDatePicker: ['SelectedDate'],
    TimePicker: ['SelectedTime'],
  };
  const CMDLETS = ['Write-Host', 'Write-Output', 'Write-Warning', 'Start-Sleep', 'ForEach-Object', 'Where-Object', 'Select-Object', 'Sort-Object', 'Measure-Object',
    'Get-Process', 'Get-Service', 'Get-ChildItem', 'Get-Content', 'Set-Content', 'Add-Content', 'Get-Item', 'New-Item', 'Remove-Item', 'Copy-Item', 'Move-Item',
    'Test-Path', 'Join-Path', 'Split-Path', 'Get-Date', 'Out-Null', 'Out-String', 'Start-Process', 'Invoke-RestMethod', 'Invoke-WebRequest',
    'ConvertTo-Json', 'ConvertFrom-Json', 'Import-Csv', 'Export-Csv', 'Start-ThreadJob', 'Set-GLIRunspacePoolOption'];

  const memberItem = (label, detail) => ({
    label,
    insert: label,
    kind: /^Add[A-Z]\w*\($/.test(label) ? 'event' : /[()]$/.test(label) ? 'method' : 'property',
    detail,
  });
  function membersFor(name) {
    const out = new Map();
    const add = (label, detail) => !out.has(label) && out.set(label, memberItem(label, detail));
    if (name === doc.form.name) {
      GC.FORM_EVENTS.forEach((e) => add(`Add${e}(`, 'event'));
      EXTRA_MEMBERS.Window.forEach((m) => add(m, 'Window'));
      GC.FORM_PROPS.forEach((p) => add(p.key, 'Window'));
      COMMON_MEMBERS.forEach((m) => add(m));
      return [...out.values()];
    }
    const c = GC.allControls(doc).find((x) => x.name === name);
    if (c) {
      const t = TYPES[c.type];
      GC.eventsFor(c.type).forEach((e) => add(`Add${e}(`, 'event'));
      t.props.filter((p) => !p.noXaml || p.key === 'Items').forEach((p) => add(p.key, t.label));
      (EXTRA_MEMBERS[c.type] || []).forEach((m) => add(m, t.label));
      COMMON_MEMBERS.forEach((m) => add(m));
      GC.COMMON_PROPS.filter((p) => !p.xaml).forEach((p) => add(p.key));
      return [...out.values()];
    }
    if (doc.menu && name === doc.menu.name) return [memberItem('Items', 'Menu'), ...COMMON_MEMBERS.map((m) => memberItem(m))];
    if (doc.menu && GC.menuLeaves(GC.parseMenu(doc.menu.props.Items)).some((i) => i.name === name))
      return ['AddClick(', 'Header', 'IsEnabled', 'IsVisible', 'IsChecked'].map((m) => memberItem(m, 'MenuItem'));
    return null;
  }

  function variableItems() {
    const items = new Map();
    const add = (name, kind, detail) => !items.has(name) && items.set(name, { label: '$' + name, kind, detail });
    add(doc.form.name, 'control', isDialog() ? 'this dialog' : 'Window');
    GC.allControls(doc).forEach((c) => {
      add(c.name, 'control', TYPES[c.type].label);
      if (c.type === 'Pages') GC.lines(c.props.Pages).forEach((pg, i) => add(`${c.name}_Page${i + 1}`, 'control', 'page: ' + pg));
    });
    if (doc.menu) {
      add(doc.menu.name, 'control', 'Menu');
      GC.menuLeaves(GC.parseMenu(doc.menu.props.Items)).forEach((i) => add(i.name, 'control', 'MenuItem'));
    }
    const re = /\$(?:script:)?([A-Za-z_]\w*)\s*=/g;
    let m;
    while ((m = re.exec(doc.script))) add(m[1], 'variable', 'script');
    if (isDialog()) (add('Owner', 'variable', 'dialog parameter'), add('Values', 'variable', 'dialog parameter'));
    [['s', 'event sender'], ['e', 'event args'], ['argumentList', 'event arguments'], ['_', 'pipeline item'], ['true'], ['false'], ['null'], ['PSScriptRoot']].forEach(([n, d]) => add(n, 'variable', d || 'automatic'));
    return [...items.values()];
  }

  function commandItems() {
    const items = [];
    project.forms.forEach((d, i) => i > 0 && d !== doc && items.push({ label: `Show-${d.form.name}`, insert: `Show-${d.form.name} -Owner $${doc.form.name}`, kind: 'command', detail: 'dialog' }));
    if (project.forms.some((d) => GC.allControls(d).some((c) => c.type === 'Pages')))
      items.push({ label: 'Set-Page', kind: 'command', detail: '-Next / -Previous / -Index' }, { label: 'Get-Page', kind: 'command', detail: 'current page index' });
    if (isDialog()) items.push({ label: 'Close-Dialog', insert: "Close-Dialog 'OK'", kind: 'command', detail: 'close with a result' });
    CMDLETS.forEach((c) => items.push({ label: c, kind: 'command' }));
    return items;
  }

  /** Completion provider for the Script editor: returns { from, items } or null. */
  function scriptCompletions(text, pos, explicit) {
    const before = text.slice(Math.max(0, text.lastIndexOf('\n', pos - 1) + 1), pos);
    if (/(^|[^'"`])#/.test(before.replace(/'[^']*'/g, "''"))) return null; // in a comment
    let m;
    if ((m = before.match(/\$(?:script:)?([A-Za-z_]\w*)\.(\w*)$/))) {
      const items = membersFor(m[1]);
      return items ? { from: pos - m[2].length, items } : null;
    }
    if ((m = before.match(/\$([A-Za-z_]\w*)?$/))) return { from: pos - (m[1] || '').length - 1, items: variableItems() };
    // commands only once a "-" is typed (Get-, Show-, ...) or on Ctrl+Space, so words like "foreach" are left alone
    if ((m = before.match(/(?:^|[\s(;{|=])([A-Za-z][\w-]*)$/)) && (explicit || m[1].includes('-'))) return { from: pos - m[1].length, items: commandItems() };
    return null;
  }

  /** Jump from "run-xxxx.ps1:<line>" in the Output panel to the matching code. */
  function gotoRunLine(script, line) {
    const lines = script.split('\n');
    for (let i = 0; i < project.forms.length; i++) {
      const d = project.forms[i];
      const start = lines.indexOf('#region Script - ' + d.form.name);
      if (start < 0) continue;
      const count = String(d.script || '').replace(/\s+$/, '').split('\n').length;
      const rel = line - 1 - start; // 1-based line inside the form's script
      if (rel >= 1 && rel <= count) {
        if (project.active !== i) openForm(i);
        showTab('script');
        return setTimeout(() => selectLine(editors.script, rel), 0);
      }
    }
    showTab('generated');
    if (editors.generated.value !== script) toast('The design changed since this run; line numbers may not match');
    setTimeout(() => selectLine(editors.generated, line), 0);
  }
  function selectLine(ed, n) {
    const v = ed.value;
    let start = 0;
    for (let i = 1; i < n && start >= 0; i++) start = v.indexOf('\n', start) + 1;
    let end = v.indexOf('\n', start);
    if (end < 0) end = v.length;
    ed.select(start, end);
  }
  let persistTimer = 0;
  const persistSoon = () => (clearTimeout(persistTimer), (persistTimer = setTimeout(persist, 400)));

  /** Small API for the guided tour (js/tour.js). */
  GC.app = {
    get project() {
      return project;
    },
    get doc() {
      return doc;
    },
    get selection() {
      return selection.slice();
    },
    get activeTab() {
      return activeTab;
    },
    get propTab() {
      return propTab;
    },
    setPropTab(t) {
      propTab = t;
      renderProps();
    },
    controls: () => GC.allControls(doc),
    select: (ids) => select(ids),
    showTab: (t) => showTab(t),
    openForm: (i) => openForm(i),
    snapshot: () => JSON.stringify(project),
    load(p) {
      loadProject(typeof p === 'string' ? JSON.parse(p) : p);
      showTab('designer');
    },
    blankProject: () => blankProject(),
    sampleProject: () => {
      const keep = project; // sampleProject() builds into the global project; put it back
      const p = JSON.parse(JSON.stringify(sampleProject()));
      project = keep;
      setDoc();
      reindex();
      return p;
    },
    run: (name) => CMD[name] && CMD[name](),
    modal: (title, html, buttons) => modal(title, html, buttons),
    closeModal: () => ($('#modal').hidden = true),
  };

  init();
})();
