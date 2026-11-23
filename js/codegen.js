/* GUI Creator - XAML and PowerShell (GliderUI) code generation */
(function () {
  'use strict';
  const GC = (window.GC = window.GC || {});

  GC.xattr = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]).replace(/\r?\n/g, '&#10;');

  const fmt = (v) => (v === true ? 'True' : v === false ? 'False' : String(v));

  /** Should a property value be written out (i.e. differs from the default)? */
  function shouldEmit(prop, v) {
    if (v === undefined || v === null || v === '') return false;
    if (prop.forceEmit) return true;
    if (prop.type === 'number') return prop.def === '' || Number(v) !== Number(prop.def);
    return v !== prop.def;
  }
  GC.shouldEmit = shouldEmit;

  const psStr = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  const psVal = (prop, v) => (prop.type === 'number' ? String(Number(v)) : prop.type === 'bool' ? (v ? '$true' : '$false') : psStr(v));

  /* ---------------------------------------------------------------- layout
   * Controls are placed in a single-cell Grid using Margin + alignment instead of
   * Canvas.Left/Top. With the default anchor (Top, Left) this is identical to absolute
   * positioning; other anchors make controls move or stretch when the window resizes,
   * like the Anchor property in WinForms / PowerShell Studio. */
  GC.MENU_HEIGHT = 32;
  GC.anchors = (n) => {
    const s = String((n.props && n.props.Anchor) || 'Top, Left');
    return { T: /top/i.test(s), B: /bottom/i.test(s), L: /left/i.test(s), R: /right/i.test(s) };
  };
  GC.anchorText = (a) => ['Top', 'Bottom', 'Left', 'Right'].filter((k) => a[k[0]]).join(', ') || 'None';

  /** Inner size of a container slot (matches the designer's drawing of each container). */
  GC.slotSize = (owner, doc) => {
    if (owner.id === 'form') return [num(owner.props.Width, 640), num(owner.props.Height, 420) - (doc && doc.menu ? GC.MENU_HEIGHT : 0)];
    if (owner.type === 'Border') {
      const bt = num(String(owner.props.BorderThickness).split(/[ ,]+/)[0], 0);
      return [owner.w - 2 * bt, owner.h - 2 * bt];
    }
    if (owner.type === 'GroupBox') return [owner.w - 18, owner.h - 42];
    if (owner.type === 'TabControl') return [owner.w, owner.h - 48];
    return [owner.w, owner.h];
  };
  const num = (v, d) => (v === '' || v == null || isNaN(Number(v)) ? d : Number(v));

  /** Alignment, Margin and size attributes for a control inside a W x H container. */
  function layoutAttrs(n, W, H) {
    const a = GC.anchors(n);
    const axis = (lo, hi, pos, size, total) => {
      // returns [alignment, marginLow, marginHigh, keepSize]
      if (lo && hi) return ['Stretch', pos, total - pos - size, false];
      if (hi) return [null, 0, total - pos - size, true];
      if (lo) return [null, pos, 0, true];
      const d = total - 2 * pos - size; // centered: keep the same position at design size
      return ['Center', d < 0 ? -d : 0, d > 0 ? d : 0, true];
    };
    const [ha, ml, mr, keepW] = axis(a.L, a.R, n.x, n.w, W);
    const [va, mt, mb, keepH] = axis(a.T, a.B, n.y, n.h, H);
    const r = Math.round;
    return [
      `HorizontalAlignment="${ha || (a.R ? 'Right' : 'Left')}"`,
      `VerticalAlignment="${va || (a.B ? 'Bottom' : 'Top')}"`,
      `Margin="${r(ml)},${r(mt)},${r(mr)},${r(mb)}"`,
    ]
      .concat(keepW ? [`Width="${n.w}"`] : [])
      .concat(keepH ? [`Height="${n.h}"`] : []);
  }

  function genNode(n, ind, out, W, H) {
    const t = GC.TYPES[n.type];
    const attrs = [`x:Name="${n.name}"`].concat(layoutAttrs(n, W, H));
    GC.propsFor(n.type).forEach((p) => {
      if (p.noXaml || p.post) return;
      const v = n.props[p.key];
      if (shouldEmit(p, v)) attrs.push(`${p.xaml || p.key}="${GC.xattr(fmt(v))}"`);
    });
    const el = t.element || n.type;
    const head = `${ind}<${el} ${attrs.join(' ')}`;
    const inner = [];
    const ci = ind + '    ';
    const [sw, sh] = t.container ? GC.slotSize(n) : [0, 0];
    if (t.xamlChildren) inner.push(...t.xamlChildren(n, ci));
    if (n.type === 'TabControl') {
      const tabs = GC.lines(n.props.Tabs);
      tabs.forEach((hdr, i) => {
        inner.push(`${ci}<TabItem Header="${GC.xattr(hdr)}">`);
        genPanel(n.slots[i] || [], ci + '    ', inner, sw, sh);
        inner.push(`${ci}</TabItem>`);
      });
    } else if (n.type === 'Pages') {
      // One Grid per page inside a Panel; only the start page is visible.
      const pages = GC.lines(n.props.Pages);
      const start = startPage(n);
      pages.forEach((title, i) => {
        inner.push(`${ci}<!-- Page ${i + 1}: ${title.replace(/--/g, '- -')} -->`);
        genPanel(n.slots[i] || [], ci, inner, sw, sh, `x:Name="${pageName(n, i)}"${i === start ? '' : ' IsVisible="False"'}`);
      });
    } else if (t.container) {
      genPanel(n.slots[0], ci, inner, sw, sh);
    }
    if (inner.length) {
      out.push(head + '>');
      out.push(...inner);
      out.push(`${ind}</${el}>`);
    } else out.push(head + ' />');
  }

  const pageName = (n, i) => `${n.name}_Page${i + 1}`;
  const startPage = (n) => Math.min(Math.max(0, Math.round(Number(n.props.StartPage) || 0)), Math.max(0, GC.lines(n.props.Pages).length - 1));

  function genPanel(children, ind, out, W, H, attrs) {
    const a = attrs ? ' ' + attrs : '';
    if (!children.length) {
      out.push(`${ind}<Grid${a} />`);
      return;
    }
    out.push(`${ind}<Grid${a}>`);
    children.forEach((c) => genNode(c, ind + '    ', out, W, H));
    out.push(`${ind}</Grid>`);
  }

  function genMenuItems(items, ind, out) {
    items.forEach((it) => {
      if (it.sep) return out.push(`${ind}<Separator />`);
      const head = `${ind}<MenuItem x:Name="${it.name}" Header="${GC.xattr(it.label)}"`;
      if (!it.children.length) return out.push(head + ' />');
      out.push(head + '>');
      genMenuItems(it.children, ind + '    ', out);
      out.push(`${ind}</MenuItem>`);
    });
  }

  GC.genXaml = function (doc) {
    const f = doc.form;
    const out = [];
    const attrs = ['xmlns="https://github.com/avaloniaui"', 'xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"'];
    GC.FORM_PROPS.forEach((p) => {
      const v = f.props[p.key];
      if (shouldEmit(p, v)) attrs.push(`${p.key}="${GC.xattr(fmt(v))}"`);
    });
    out.push(`<Window ${attrs.join('\n        ')}>`);
    const [W, H] = GC.slotSize(f, doc);
    if (doc.menu) {
      out.push('    <DockPanel>');
      out.push(`        <Menu x:Name="${doc.menu.name}" DockPanel.Dock="Top" Height="${GC.MENU_HEIGHT}">`);
      genMenuItems(GC.parseMenu(doc.menu.props.Items), '            ', out);
      out.push('        </Menu>');
      genPanel(f.slots[0], '        ', out, W, H);
      out.push('    </DockPanel>');
    } else {
      genPanel(f.slots[0], '    ', out, W, H);
    }
    out.push('</Window>');
    return out.join('\n');
  };

  /** Every named control in document order. */
  GC.allControls = function (project) {
    const out = [];
    (function walk(node) {
      (node.slots || []).forEach((list) => list.forEach((c) => (out.push(c), walk(c))));
    })(project.form);
    return out;
  };

  /** List of { target, event, handler } bindings. */
  GC.bindings = function (project) {
    const b = [];
    const f = project.form;
    Object.entries(f.events).forEach(([e, hnd]) => hnd && b.push({ target: f.name, event: e, handler: hnd, node: f }));
    if (project.menu) {
      const names = new Set(GC.menuLeaves(GC.parseMenu(project.menu.props.Items)).map((i) => i.name));
      Object.entries(project.menu.events).forEach(([item, hnd]) => hnd && names.has(item) && b.push({ target: item, event: 'Click', handler: hnd, node: project.menu }));
    }
    GC.allControls(project).forEach((c) => Object.entries(c.events).forEach(([e, hnd]) => hnd && b.push({ target: c.name, event: e, handler: hnd, node: c })));
    return b;
  };

  /** A handler counts as defined once the variable is assigned: a script block, an [EventCallback] or anything else. */
  GC.handlerRegex = (name) => new RegExp('^[ \\t]*\\$(?:script:)?' + name.replace(/[^A-Za-z0-9_]/g, '') + '\\s*=(?!=)', 'mi');

  GC.encodeProject = function (project) {
    const bytes = new TextEncoder().encode(JSON.stringify(project));
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/.{1,100}/g, '$&\n').trimEnd();
  };
  GC.decodeProject = function (b64) {
    const bin = atob(b64.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  };
  GC.extractProjectFromScript = function (text) {
    const m = text.match(/<#\s*GUICREATOR-PROJECT\s*([\s\S]*?)#>/);
    return m ? GC.decodeProject(m[1]) : null;
  };

  /** All forms of a project (also accepts an old single-form project). */
  GC.formsOf = (project) => project.forms || [project];

  /** Variable names to fetch with FindControl, in document order. */
  function controlNames(doc) {
    const names = [];
    GC.allControls(doc).forEach((c) => {
      names.push(c.name);
      if (c.type === 'Pages') GC.lines(c.props.Pages).forEach((_, i) => names.push(pageName(c, i)));
    });
    if (doc.menu) {
      names.push(doc.menu.name);
      GC.menuLeaves(GC.parseMenu(doc.menu.props.Items)).forEach((i) => names.push(i.name));
    }
    return names;
  }

  /** XAML here-string, Parse() and FindControl lines for one form. */
  function genFormLoad(doc, ind, L) {
    const f = doc.form;
    const fv = '$' + f.name;
    L.push(`${ind}$${f.name}Xaml = @'`);
    L.push(GC.genXaml(doc));
    L.push(`'@`); // must stay at column 0
    L.push(`${ind}${fv} = [AvaloniaRuntimeXamlLoader]::Parse($${f.name}Xaml, $null)`);
    const names = controlNames(doc);
    const width = Math.max(0, ...names.map((n) => n.length));
    names.forEach((n) => L.push(`${ind}$${n.padEnd(width)} = ${fv}.FindControl('${n}')`));
    // Properties that must be applied after the items exist (e.g. SelectedIndex)
    GC.allControls(doc).forEach((c) =>
      GC.propsFor(c.type).forEach((p) => {
        if (p.post && shouldEmit(p, c.props[p.key])) L.push(`${ind}$${c.name}.${p.key} = ${psVal(p, c.props[p.key])}`);
      })
    );
  }

  function genScriptRegion(doc, L) {
    L.push(`#region Script - ${doc.form.name}`);
    L.push(String(doc.script || '').replace(/\s+$/, ''));
    L.push('#endregion');
  }

  function genWiring(doc, ind, L) {
    const b = GC.bindings(doc);
    if (!b.length) return;
    L.push(`${ind}#region Event wiring - ${doc.form.name}`);
    b.forEach((x) => L.push(`${ind}$${x.target}.Add${x.event}($${x.handler})`));
    L.push(`${ind}#endregion`);
  }

  /** Controls a dialog accepts in -Values and returns in its result. */
  GC.dialogValues = (doc) =>
    GC.allControls(doc)
      .filter((c) => GC.TYPES[c.type].valueProp)
      .map((c) => ({ name: c.name, prop: GC.TYPES[c.type].valueProp, inputOnly: !!GC.TYPES[c.type].valueInputOnly }));

  function genDialog(doc, L, ownerName) {
    const name = doc.form.name;
    const fv = '$' + name;
    const vals = GC.dialogValues(doc);
    const outs = vals.filter((v) => !v.inputOnly);
    L.push(`#region Dialog - ${name}`);
    L.push(`function Show-${name} {`);
    L.push('    <#');
    L.push('    .SYNOPSIS');
    L.push(`        Shows the "${doc.form.props.Title || name}" dialog and waits until it is closed.`);
    L.push('    .OUTPUTS');
    L.push(`        An object with DialogResult (the value passed to Close-Dialog, $null if closed with X)${outs.length ? ' and:' : '.'}`);
    outs.forEach((v) => L.push(`            ${v.name} (${v.prop})`));
    L.push('    .EXAMPLE');
    const sample = outs[0] || vals[0];
    L.push(`        $result = Show-${name} -Owner $${ownerName}${sample ? ` -Values @{ ${sample.name} = ... }` : ''}`);
    L.push(`        if ($result.DialogResult -eq 'OK') { ... }`);
    L.push('    #>');
    L.push('    param (');
    L.push('        # Window that is disabled while the dialog is open.');
    L.push('        $Owner,');
    L.push('        # Initial values: @{ controlName = value } (sets Text, IsChecked, SelectedIndex, Value, ...).');
    L.push('        [hashtable]$Values = @{}');
    L.push('    )');
    L.push('');
    genFormLoad(doc, '    ', L);
    L.push('');
    L.push(`    $__valueProperty = [ordered]@{${vals.map((v) => ` ${v.name} = '${v.prop}'`).join(';')}${vals.length ? ' ' : ''}}`);
    L.push(`    $__outputs = @(${outs.map((v) => `'${v.name}'`).join(', ')})`);
    L.push('    $__dialog = @{ DialogResult = $null }');
    L.push('    # Close-Dialog <result> closes this dialog and sets DialogResult.');
    L.push(`    function Close-Dialog ($Result) { $__dialog.DialogResult = $Result; ${fv}.Close() }`);
    L.push('    foreach ($__key in $Values.Keys) {');
    L.push("        if (-not $__valueProperty.Contains($__key)) { throw \"Show-" + name + ": unknown control '$__key' in -Values\" }");
    L.push('        (Get-Variable -Name $__key -ValueOnly).($__valueProperty[$__key]) = $Values[$__key]');
    L.push('    }');
    L.push('');
    genScriptRegion(doc, L);
    L.push('');
    genWiring(doc, '    ', L);
    L.push('');
    L.push('    if ($Owner) { $Owner.IsEnabled = $false }');
    L.push(`    ${fv}.Show()`);
    L.push(`    ${fv}.WaitForClosed()`);
    L.push('    if ($Owner) { $Owner.IsEnabled = $true }');
    L.push('');
    L.push('    $__result = [ordered]@{ DialogResult = $__dialog.DialogResult }');
    L.push('    foreach ($__key in $__outputs) { $__result[$__key] = (Get-Variable -Name $__key -ValueOnly).($__valueProperty[$__key]) }');
    L.push('    [pscustomobject]$__result');
    L.push('}');
    L.push('#endregion');
  }

  const PAGE_HELPERS = [
    '#region Page helpers - generated by GUI Creator',
    'function Get-Page {',
    '    <# Returns the index of the visible page of a Pages container. #>',
    '    param ($Pages)',
    '    $i = 0',
    '    foreach ($page in $Pages.Children) {',
    '        if ($page.IsVisible) { return $i }',
    '        $i++',
    '    }',
    '    -1',
    '}',
    '',
    'function Set-Page {',
    '    <# Shows one page of a Pages container: Set-Page $pages1 -Index 2 / -Next / -Previous #>',
    '    param ($Pages, [int]$Index = 0, [switch]$Next, [switch]$Previous)',
    '    $list = @(foreach ($page in $Pages.Children) { $page })',
    '    if ($Next -or $Previous) {',
    '        $current = [Math]::Max(0, (Get-Page $Pages))',
    '        $Index = if ($Next) { $current + 1 } else { $current - 1 }',
    '    }',
    '    $Index = [Math]::Min([Math]::Max($Index, 0), $list.Count - 1)',
    '    for ($i = 0; $i -lt $list.Count; $i++) { $list[$i].IsVisible = ($i -eq $Index) }',
    '}',
    '#endregion',
  ];

  GC.genScript = function (project, opts) {
    opts = Object.assign({ embed: true }, opts);
    const forms = GC.formsOf(project);
    const main = forms[0];
    const f = main.form;
    const fv = '$' + f.name;
    const L = [];
    L.push('<#');
    L.push('.SYNOPSIS');
    L.push('    ' + (f.props.Title || f.name));
    L.push('.NOTES');
    L.push('    Generated by GUI Creator for GliderUI (https://github.com/mdgrs-mei/GliderUI)');
    L.push('    Requires PowerShell 7.4+ and the GliderUI module:');
    L.push('        Install-PSResource -Name GliderUI');
    L.push('        Install-GLIServer');
    L.push('#>');
    L.push('#Requires -Version 7.4');
    L.push('using namespace GliderUI');
    L.push('using namespace GliderUI.Avalonia');
    L.push('using namespace GliderUI.Avalonia.Controls');
    L.push('using namespace GliderUI.Avalonia.Media');
    L.push('using namespace GliderUI.Avalonia.Markup.Xaml');
    L.push('');
    L.push('if (-not (Get-Module GliderUI)) {');
    L.push('    Import-Module GliderUI');
    L.push('}');
    if (forms.some((d) => GC.allControls(d).some((c) => c.type === 'Pages'))) {
      L.push('');
      L.push(...PAGE_HELPERS);
    }
    forms.slice(1).forEach((d) => {
      L.push('');
      genDialog(d, L, f.name);
    });
    L.push('');
    L.push(`#region Designer generated code - ${f.name} (regenerated by GUI Creator, do not edit by hand)`);
    genFormLoad(main, '', L);
    L.push('#endregion');
    L.push('');
    genScriptRegion(main, L);
    if (GC.bindings(main).length) {
      L.push('');
      genWiring(main, '', L);
    }
    L.push('');
    L.push(`${fv}.Show()`);
    L.push(`${fv}.WaitForClosed()`);
    if (opts.embed) {
      L.push('');
      L.push('<# GUICREATOR-PROJECT');
      L.push(GC.encodeProject(project));
      L.push('#>');
    }
    return L.join('\n') + '\n';
  };

  GC.handlerStub = (name) => `$${name} = {\n    param ($argumentList, $s, $e)\n    \n}\n`;
})();
