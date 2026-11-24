/* GUI Creator - interactive guided tour (Basics -> Intermediate -> Advanced).
 * A spotlight highlights part of the UI and a card explains it. "Try it" steps watch
 * the designer state and continue on their own once the user has done the task.
 * The tour works in a practice project; the user's own design is put aside and can be
 * restored at the end. */
(function () {
  'use strict';
  const GC = (window.GC = window.GC || {});
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const SEEN = 'guiCreator.tourSeen';
  const BACKUP = 'guiCreator.tourBackup';
  const app = () => GC.app;

  // ---------------------------------------------------------------- helpers used by the steps
  const ctl = (type) => app().controls().filter((c) => c.type === type);
  const first = (type) => ctl(type)[0];
  const tool = (label) => $$('.tb-item').find((e) => e.textContent.trim() === label);
  const propRow = (key) => {
    const el = $(`#props [data-key="${key}"]`);
    return el && el.closest('tr');
  };
  const selectFirst = (type) => {
    const c = first(type);
    if (c) app().select([c.id]);
    return c;
  };
  const code = (s) => `<code>${s}</code>`;
  const kbd = (s) => `<kbd>${s}</kbd>`;
  const handlerBody = () => {
    const b = first('Button');
    const hn = b && b.events.Click;
    if (!hn) return '';
    const m = app().doc.script.match(new RegExp('\\$' + hn + '\\s*=\\s*\\{([\\s\\S]*?)\\n\\}'));
    return m ? m[1] : '';
  };

  // ---------------------------------------------------------------- the steps
  const CHAPTERS = [
    { id: 'basics', title: 'Basics', blurb: 'Build a first window: place controls, set properties, write an event handler and run it.' },
    { id: 'intermediate', title: 'Intermediate', blurb: 'Arrange and align, make the window resizable with Anchor, containers, menus, files.' },
    { id: 'advanced', title: 'Advanced', blurb: 'Multiple forms and dialogs, wizard pages, the examples and the problem checker.' },
  ];

  const STEPS = [
    // ============================== Basics
    {
      chapter: 'basics',
      title: 'Welcome to GUI Creator',
      body: `This tour shows you around the designer, from the first button to multi-window apps.<br><br>
        Steps marked <span class="tour-try">Try it</span> ask you to do something; the tour continues as soon as you have done it.
        You can always use <b>Next</b> to skip ahead.<br><br>The tour uses a practice project. Your own design is kept safe and you can restore it at the end.`,
    },
    {
      chapter: 'basics',
      title: 'The Toolbox',
      target: () => $('#toolboxPanel'),
      place: 'right',
      body: `All controls you can place are listed here, grouped by kind. There are three ways to add one:<ul>
        <li><b>drag</b> it onto the form,</li><li><b>click</b> it, then click or drag on the form to draw it,</li><li><b>double-click</b> it to drop it on the form.</li></ul>
        The search box filters the list.`,
    },
    {
      chapter: 'basics',
      title: 'Add a button',
      try: true,
      target: () => tool('Button'),
      place: 'right',
      enter: () => app().showTab('designer'),
      body: `<b>Double-click "Button"</b> in the toolbox (or drag it onto the form).`,
      done: () => ctl('Button').length > 0,
    },
    {
      chapter: 'basics',
      title: 'The designer',
      try: true,
      target: () => $('#surface .fw'),
      place: 'right',
      body: `This is your window, drawn the way the Fluent theme will show it.<ul>
        <li><b>Drag</b> the button to move it. Pink snaplines appear when it lines up with something; hold ${kbd('Alt')} to move freely.</li>
        <li>Drag the white <b>handles</b> to resize it, or the window's corner to resize the window.</li>
        <li>${kbd('Arrow keys')} nudge the selection, ${kbd('Del')} deletes it.</li></ul>
        <b>Move the button somewhere else</b> to continue.`,
      enter(st) {
        const b = first('Button');
        st.start = b ? `${b.x},${b.y}` : '';
      },
      done: (st) => {
        const b = first('Button');
        return b && `${b.x},${b.y}` !== st.start;
      },
    },
    {
      chapter: 'basics',
      title: 'Properties',
      try: true,
      target: () => propRow('Content') || $('#propsPanel'),
      place: 'left',
      enter: () => {
        selectFirst('Button');
        app().setPropTab('props');
      },
      body: `The property grid shows the selected control's settings. Changed values are <b>bold</b>, and the box at the bottom explains the property you are on.<br><br>
        <b>Change the button's Content to ${code('Say hello')}</b> and press ${kbd('Enter')}.`,
      done: () => {
        const b = first('Button');
        return b && /^say hello$/i.test(String(b.props.Content).trim());
      },
    },
    {
      chapter: 'basics',
      title: 'Add a text box and a label',
      try: true,
      target: () => $('#toolboxPanel'),
      place: 'right',
      body: `Now add a <b>TextBox</b> (for a name) and a <b>Label</b> (to show the greeting). Place them wherever you like.`,
      done: () => ctl('TextBox').length > 0 && ctl('TextBlock').length > 0,
    },
    {
      chapter: 'basics',
      title: 'Names matter',
      target: () => $('#outlinePanel'),
      place: 'right',
      body: `Every control has a <b>(Name)</b>: in your script it becomes a variable, for example ${code('$textbox1')}.
        The <b>Document Outline</b> lists all controls; click one to select it, even if it is hidden behind another.<br><br>
        Tip: give controls meaningful names such as ${code('textboxName')}. When you rename a control, references in your script are updated too.`,
    },
    {
      chapter: 'basics',
      title: 'Create an event handler',
      try: true,
      target: () => $('#surface .t-Button'),
      place: 'right',
      enter: () => app().showTab('designer'),
      body: `<b>Double-click the button</b> in the designer. GUI Creator creates its <b>Click</b> handler and opens it in the Script tab, just like PowerShell Studio.`,
      done: () => {
        const b = first('Button');
        return b && b.events.Click && app().activeTab === 'script';
      },
    },
    {
      chapter: 'basics',
      title: 'Write the handler (with autocomplete)',
      try: true,
      target: () => $('#scriptView'),
      place: 'top',
      enter: () => app().showTab('script'),
      body: () => {
        const tb = first('TextBox');
        const lb = first('TextBlock');
        const line = `$${lb ? lb.name : 'label1'}.Text = "Hello, $($${tb ? tb.name : 'textbox1'}.Text)!"`;
        return `Inside the handler, type:<pre>${line}</pre>
          Watch the <b>autocomplete</b>: ${code('$')} lists your controls, ${code('$label1.')} lists properties and events.
          Use ${kbd('↑')}${kbd('↓')} and ${kbd('Enter')}, or ${kbd('Ctrl+Space')} to open it yourself.`;
      },
      done: () => /\$\w+\.Text\s*=/.test(handlerBody()),
    },
    {
      chapter: 'basics',
      title: 'See the generated script',
      target: () => $('#docTabs'),
      place: 'bottom',
      body: `<b>Generated Script</b> shows the complete PowerShell file: the XAML, a variable for every control, your script and the event wiring.
        <b>XAML</b> shows only the layout. Both update live while you design.`,
    },
    {
      chapter: 'basics',
      title: 'Run it',
      try: () => GC.runner && GC.runner.available,
      target: () => $('#toolbar [data-cmd=run]'),
      place: 'bottom',
      body: () =>
        GC.runner && GC.runner.available
          ? `Press ${kbd('F5')} (or <b>Run</b>). Your window opens with PowerShell, and its output and errors appear in the <b>Output</b> panel.
            Errors show a <b>line N</b> link that jumps to the code. ${kbd('Shift+F5')} stops it.<br><br><b>Run your window now</b>, type a name and click the button.`
          : `To run straight from the designer, get GUI Creator from <a href="${GC.CREDITS.repo}" target="_blank" rel="noopener">GitHub</a>
            and start it with its local launcher, ${code('pwsh -File ./Start-GuiCreator.ps1')}; then ${kbd('F5')} runs your window and shows its output here.
            Click <b>Run</b> any time for the step-by-step commands.<br><br>Without the launcher, use <b>Export .ps1</b> and run the file with PowerShell 7.4+ and GliderUI installed.`,
      done: () => GC.runner && GC.runner.available && !$('#outputPanel').hidden,
    },

    // ============================== Intermediate
    {
      chapter: 'intermediate',
      title: 'Select several controls',
      target: () => $('#surface .fw'),
      place: 'right',
      enter: () => app().showTab('designer'),
      body: `Hold ${kbd('Shift')} or ${kbd('Ctrl')} and click to select several controls, or drag a rectangle on an empty part of the form.
        The first one you select is the <b>primary</b> (solid outline): alignment uses it as the reference.`,
    },
    {
      chapter: 'intermediate',
      title: 'Align and size',
      target: () => ['alignL', 'alignC', 'alignR', 'alignT', 'alignM', 'alignB', 'sameW', 'sameH', 'centerH', 'centerV', 'front', 'back'].map((c) => $(`#toolbar [data-cmd=${c}]`)),
      place: 'bottom',
      body: `With several controls selected, these buttons align edges or centers, make sizes equal, center controls in their parent and change which one is on top.
        The same commands are in the <b>Format</b> menu and the right-click menu.`,
    },
    {
      chapter: 'intermediate',
      title: 'Resizable windows: Anchor',
      try: true,
      target: () => (propRow('Anchor') ? propRow('Anchor') : $('#propsPanel')),
      place: 'left',
      enter: () => {
        selectFirst('Button');
        app().setPropTab('props');
      },
      body: `<b>Anchor</b> decides what a control does when the window is resized. Click the edges in the little editor:
        Left + Right stretches it, Bottom + Right makes it follow the bottom-right corner.<br><br>
        <b>Anchor the button to Bottom and Right only.</b>`,
      done: () => {
        const b = first('Button');
        const a = b && GC.anchors(b);
        return a && a.B && a.R && !a.T && !a.L;
      },
    },
    {
      chapter: 'intermediate',
      title: 'Try resizing the window',
      try: true,
      target: () => $('#surface .fw-rs.se') && $('#surface .fw'),
      place: 'right',
      body: `<b>Drag the window's bottom-right corner</b> to make it bigger. The anchored button moves along, exactly as it will in the running window.
        Set <b>MinWidth</b>/<b>MinHeight</b> on the window to stop users shrinking it too far.`,
      enter(st) {
        const f = app().doc.form.props;
        st.size = `${f.Width}x${f.Height}`;
      },
      done: (st) => {
        const f = app().doc.form.props;
        return `${f.Width}x${f.Height}` !== st.size;
      },
    },
    {
      chapter: 'intermediate',
      title: 'Containers',
      try: true,
      target: () => $$('.tb-group').find((g) => /Containers/.test(g.textContent)),
      place: 'right',
      body: `<b>Panel</b>, <b>GroupBox</b>, <b>TabControl</b> and <b>Pages</b> hold other controls. Drag a control into a container to move it inside;
        drag it out again to take it out. Anchors work inside containers too.<br><br><b>Add a GroupBox</b> to continue.`,
      done: () => ctl('GroupBox').length > 0 || ctl('Border').length > 0 || ctl('TabControl').length > 0,
    },
    {
      chapter: 'intermediate',
      title: 'A menu bar',
      target: () => tool('Menu'),
      place: 'right',
      body: `<b>Menu</b> adds a menu bar to the window. Edit its <b>Items</b> property: one item per line, indent sub-items with four spaces,
        ${code('-')} for a separator and ${code('_')} before the access-key letter. Click a menu in the designer to open it, and double-click an item to create its Click handler.`,
    },
    {
      chapter: 'intermediate',
      title: 'Undo, copy and paste',
      target: () => ['undo', 'redo', 'cut', 'copy', 'paste', 'delete'].map((c) => $(`#toolbar [data-cmd=${c}]`)),
      place: 'bottom',
      body: `${kbd('Ctrl+Z')}/${kbd('Ctrl+Y')} undo and redo designer changes, including handler stubs and renames the designer made in your script.
        ${kbd('Ctrl+C')}, ${kbd('Ctrl+V')} and ${kbd('Ctrl+D')} copy, paste and duplicate controls (also between forms).
        The Script tab has its own undo while you type.`,
    },
    {
      chapter: 'intermediate',
      title: 'Saving your work',
      target: () => ['new', 'open', 'save', 'export'].map((c) => $(`#toolbar [data-cmd=${c}]`)),
      place: 'bottom',
      body: `Your design is saved in the browser automatically. <b>Save</b> downloads a ${code('.guiproj.json')} project file,
        <b>Export .ps1</b> the finished script. The design is embedded at the end of the exported script, so <b>Open</b> accepts either file.`,
    },

    // ============================== Advanced
    {
      chapter: 'advanced',
      title: 'Multiple forms',
      try: true,
      target: () => $('#projectPanel'),
      place: 'right',
      body: `A project can contain several forms. The first is the <b>startup</b> window; every other form is a <b>dialog</b>.<br><br>
        <b>Click "+ Dialog"</b> to add one. It comes with OK and Cancel buttons that are already wired up.`,
      done: () => app().project.forms.length > 1,
    },
    {
      chapter: 'advanced',
      title: 'Dialogs in code',
      target: () => $('#scriptView'),
      place: 'top',
      enter: () => app().showTab('script'),
      body: () => {
        const p = app().project;
        const dlg = p.forms[1] ? p.forms[1].form.name : 'formDialog1';
        return `Each dialog becomes a function in the generated script. Show it from another form, optionally with initial values, and read the result:
          <pre>$result = Show-${dlg} -Owner $${p.forms[0].form.name}
if ($result.DialogResult -eq 'OK') {
    $result.textbox1   # values of the dialog's controls
}</pre>Inside the dialog, ${code("Close-Dialog 'OK'")} closes it and sets DialogResult. Autocomplete offers ${code('Show-')} once you type it.`;
      },
    },
    {
      chapter: 'advanced',
      title: 'Switching forms',
      target: () => $('#formsList'),
      place: 'right',
      body: `Click a form in the <b>Project</b> panel to edit it; every form has its own controls and Script tab.
        Right-click a form to make it the startup form, copy a ready-made ${code('Show-')} call or delete it.`,
    },
    {
      chapter: 'advanced',
      title: 'Wizards with Pages',
      target: () => tool('Pages (Wizard)'),
      place: 'right',
      body: `<b>Pages (Wizard)</b> shows one page at a time without tabs, perfect for Next/Back wizards. Use the ◀ ▶ switcher in its corner to design each page,
        and switch pages from your script with ${code('Set-Page $pages1 -Next')}, ${code('-Previous')} or ${code('-Index 2')}; ${code('Get-Page')} tells you where you are.`,
    },
    {
      chapter: 'advanced',
      title: 'Learn from the examples',
      target: () => $('#menus [data-menu=Examples]'),
      place: 'bottom',
      body: `The <b>Examples</b> menu opens GliderUI's official examples rebuilt as editable designs, plus a <b>Setup Wizard</b> that combines pages and a dialog.
        They show background work with ${code('[EventCallback]')}, runspace pools, file pickers and a DataGrid.`,
    },
    {
      chapter: 'advanced',
      title: 'Problems',
      target: () => $('#stProblems'),
      place: 'top',
      body: `The status bar checks that every event that is wired to a handler has that handler defined in the script. Click it to see the list.
        Wired handlers live in the <b>Events</b> tab of the property grid; double-click an event name there to create its handler.`,
    },
    {
      chapter: 'advanced',
      title: "You're all set!",
      body: () => `That's the tour. Handy references:<ul>
        <li><b>Help → Keyboard &amp; Mouse</b> for all shortcuts,</li><li><b>Help → Guided Tour</b> to take this tour again or jump to a chapter,</li>
        <li><b>README.md</b> for how the generated scripts work.</li></ul>
        Everything GUI Creator builds runs on <a href="${GC.CREDITS.gliderUrl}" target="_blank" rel="noopener">GliderUI</a> by
        <a href="${GC.CREDITS.authorUrl}" target="_blank" rel="noopener">${GC.CREDITS.author}</a>. To learn more about GliderUI itself, watch the PowerShell Wednesday session
        <a href="${GC.CREDITS.video}" target="_blank" rel="noopener">${GC.CREDITS.videoTitle}</a>.`,
    },
  ];

  // ---------------------------------------------------------------- runtime
  const T = { on: false, i: 0, st: {}, timer: 0, doneAt: 0 };
  let spot;
  let card;

  function build() {
    if (spot) return;
    spot = document.createElement('div');
    spot.className = 'tour-spot';
    card = document.createElement('div');
    card.className = 'tour-card';
    document.body.append(spot, card);
    card.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tour]');
      if (!b) return;
      const a = b.dataset.tour;
      if (a === 'next') go(T.i + 1);
      if (a === 'back') go(T.i - 1);
      if (a === 'end') finish(false);
      if (a === 'chapter') go(STEPS.findIndex((s) => s.chapter === b.dataset.ch));
    });
    window.addEventListener('resize', place);
    document.addEventListener('keydown', (e) => {
      if (!T.on || e.key !== 'Escape' || document.activeElement.tagName === 'TEXTAREA') return;
      finish(false);
    });
  }

  const val = (v, st) => (typeof v === 'function' ? v(st) : v);
  const targetsOf = (step) => {
    let t = step.target ? step.target() : null;
    t = (Array.isArray(t) ? t : [t]).filter((el) => el && el.getClientRects().length);
    return t;
  };

  function place() {
    if (!T.on) return;
    const step = STEPS[T.i];
    const els = targetsOf(step);
    let r = null;
    els.forEach((el) => {
      const b = el.getBoundingClientRect();
      r = r ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) } : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    });
    const pad = 6;
    if (r) {
      Object.assign(spot.style, { display: 'block', left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.right - r.left + 2 * pad + 'px', height: r.bottom - r.top + 2 * pad + 'px' });
      spot.classList.remove('full');
    } else {
      Object.assign(spot.style, { display: 'block', left: '50%', top: '50%', width: '0px', height: '0px' });
      spot.classList.add('full');
    }
    // card next to the target, kept inside the viewport
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const vw = innerWidth;
    const vh = innerHeight;
    let x;
    let y;
    if (!r) (x = (vw - cw) / 2), (y = (vh - ch) / 2);
    else {
      const p = step.place || 'right';
      const gap = 16;
      if (p === 'right') (x = r.right + gap), (y = r.top);
      if (p === 'left') (x = r.left - cw - gap), (y = r.top);
      if (p === 'bottom') (x = r.left), (y = r.bottom + gap);
      if (p === 'top') (x = r.left), (y = r.top - ch - gap);
      // flip when it does not fit
      if (p === 'right' && x + cw > vw - 8) x = r.left - cw - gap;
      if (p === 'left' && x < 8) x = r.right + gap;
      if (p === 'top' && y < 8) y = r.bottom + gap;
      if (p === 'bottom' && y + ch > vh - 8) y = r.top - ch - gap;
      if (x < 8 || x + cw > vw - 8) x = Math.max(8, Math.min(vw - cw - 8, x));
      y = Math.max(8, Math.min(vh - ch - 8, y));
      // if the card still covers the target (e.g. a large target), move it to a corner of the target
      if (x < r.right && x + cw > r.left && y < r.bottom && y + ch > r.top) (x = Math.max(8, Math.min(vw - cw - 8, r.right - cw - 12))), (y = Math.max(8, Math.min(vh - ch - 8, r.bottom - ch - 12)));
    }
    card.style.left = Math.round(x) + 'px';
    card.style.top = Math.round(y) + 'px';
  }

  function render() {
    const step = STEPS[T.i];
    const isTry = !!val(step.try, T.st);
    const done = isTry && step.done && step.done(T.st);
    const chIdx = CHAPTERS.findIndex((c) => c.id === step.chapter);
    const inCh = STEPS.filter((s) => s.chapter === step.chapter);
    const pos = inCh.indexOf(step) + 1;
    const last = T.i === STEPS.length - 1;
    card.innerHTML = `
      <div class="tour-head">
        <div class="tour-chapters">${CHAPTERS.map((c, i) => `<button data-tour="chapter" data-ch="${c.id}" class="${i === chIdx ? 'on' : i < chIdx ? 'past' : ''}" title="${c.blurb}">${i + 1}. ${c.title}</button>`).join('')}</div>
        <button class="tour-x" data-tour="end" title="End the tour (Esc)">&#10005;</button>
      </div>
      <div class="tour-title">${isTry ? '<span class="tour-try">Try it</span>' : ''}${step.title}</div>
      <div class="tour-body">${val(step.body, T.st)}</div>
      ${isTry ? `<div class="tour-status ${done ? 'ok' : ''}">${done ? '&#10003; Nicely done!' : '&#9679; Waiting for you to try it&hellip;'}</div>` : ''}
      <div class="tour-foot">
        <span class="tour-prog">${CHAPTERS[chIdx].title} &middot; ${pos} of ${inCh.length}</span>
        <div class="tour-bar"><i style="width:${Math.round(((T.i + 1) / STEPS.length) * 100)}%"></i></div>
        <button class="btn" data-tour="back" ${T.i === 0 ? 'disabled' : ''}>Back</button>
        <button class="btn primary" data-tour="${last ? 'end' : 'next'}">${last ? 'Finish' : isTry && !done ? 'Skip' : 'Next'}</button>
      </div>`;
    card.classList.toggle('done', !!done);
    place();
  }

  function go(i) {
    if (i < 0 || i >= STEPS.length) return;
    T.i = i;
    T.st = {};
    T.doneAt = 0;
    const step = STEPS[i];
    // make sure the practice project has what a chapter expects
    if (step.chapter !== 'basics' && !first('Button') && !STEPS.slice(0, i).some((s) => s.chapter === step.chapter)) app().load(app().sampleProject());
    if (step.enter) step.enter(T.st);
    // bring the target on screen (e.g. toolbox entries below the fold)
    targetsOf(step).forEach((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
    render();
  }

  /** Re-check "Try it" steps and keep the spotlight on moving targets. */
  function tick() {
    if (!T.on) return;
    const step = STEPS[T.i];
    const isTry = !!val(step.try, T.st);
    if (isTry && step.done) {
      const done = step.done(T.st);
      if (done !== card.classList.contains('done')) render();
      if (done && !T.doneAt) T.doneAt = Date.now();
      if (done && Date.now() - T.doneAt > 1400 && T.i < STEPS.length - 1) return go(T.i + 1);
    } else place();
    if (isTry) place();
  }

  function start(chapter) {
    build();
    localStorage.setItem(SEEN, '1');
    // put the user's design aside and start a practice project
    if (!T.on) {
      localStorage.setItem(BACKUP, app().snapshot());
      app().load(chapter && chapter !== 'basics' ? app().sampleProject() : app().blankProject());
    }
    T.on = true;
    document.body.classList.add('touring');
    clearInterval(T.timer);
    T.timer = setInterval(tick, 400);
    go(chapter ? STEPS.findIndex((s) => s.chapter === chapter) : 0);
  }

  function finish() {
    if (!T.on) return;
    T.on = false;
    clearInterval(T.timer);
    spot.style.display = 'none';
    card.innerHTML = '';
    card.style.left = '-9999px';
    document.body.classList.remove('touring');
    const backup = localStorage.getItem(BACKUP);
    if (!backup) return;
    app().modal(
      'Tour finished',
      '<p>Do you want to keep the practice project from the tour, or go back to the design you had before?</p>',
      [
        { label: 'Keep the practice project', action: () => (localStorage.removeItem(BACKUP), app().closeModal()) },
        {
          label: 'Restore my design',
          primary: true,
          action: () => {
            app().load(backup);
            localStorage.removeItem(BACKUP);
            app().closeModal();
          },
        },
      ]
    );
  }

  /** Start screen: pick a chapter. */
  function open() {
    if (T.on) return;
    app().modal(
      'Guided tour',
      `<p>Learn GUI Creator step by step. Each chapter takes a few minutes; steps marked <span class="tour-try">Try it</span> are hands-on.</p>
       <div class="tour-pick">${CHAPTERS.map((c, i) => `<button class="tour-ch" data-ch="${c.id}"><b>${i + 1}. ${c.title}</b><span>${c.blurb}</span><em>${STEPS.filter((s) => s.chapter === c.id).length} steps</em></button>`).join('')}</div>
       <p class="tour-note">Your current design is put aside during the tour; at the end you can restore it.</p>`,
      []
    );
    $$('#modal .tour-ch').forEach((b) =>
      b.addEventListener('click', () => {
        app().closeModal();
        start(b.dataset.ch);
      })
    );
  }

  /** First visit: offer the tour once. */
  function offer() {
    if (localStorage.getItem(SEEN)) return;
    localStorage.setItem(SEEN, '1');
    app().modal(
      'Welcome to GUI Creator',
      `<p>Design PowerShell GUIs visually, write the event handlers, and export (or run) a script that uses
       <a href="${GC.CREDITS.gliderUrl}" target="_blank" rel="noopener"><b>GliderUI</b></a> by ${GC.CREDITS.author}.</p>
       <p>New here? A short interactive tour shows you everything from your first button to multi-window apps.</p>`,
      [
        { label: 'Maybe later', action: () => app().closeModal() },
        { label: 'Start the tour', primary: true, action: () => (app().closeModal(), start('basics')) },
      ]
    );
  }

  GC.tour = { open, start, finish, offer, get active() { return T.on; }, get step() { return T.i; }, steps: STEPS };
})();
