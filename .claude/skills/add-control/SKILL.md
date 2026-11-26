---
name: add-control
description: Add a new control type (e.g. Expander, Image, ScrollViewer, Calendar) to the GUI Creator designer, end to end - control definition, XAML/PowerShell generation, designer preview, toolbox icon, autocomplete members, tests and a real GliderUI run. Use when asked to support another Avalonia control or a new property/event on an existing one.
---

# Add a control type to GUI Creator

A control lives in several places. Work through every step; a half-added control usually generates XAML that GliderUI rejects at run time, which CI cannot see.

## 1. Check that Avalonia/GliderUI really has it

- Confirm the element name, the properties you want to expose and the event names in Avalonia 12 (GliderUI 0.5/0.6 wraps Avalonia 12). Prefer facts from GliderUI's examples or a quick real run (step 7) over memory. The `gliderui-researcher` agent can do this.
- Events must exist as .NET events: GliderUI exposes them as `$ctl.Add<EventName>(...)`.

## 2. Define it in `js/controls.js` (`TYPES`)

```js
Expander: {
  label: 'Expander', prefix: 'expander', size: [240, 160],
  textProp: 'Header',            // optional: a property set to the control name when it is created
  valueProp: 'IsExpanded',       // optional: read and written by dialogs (-Values / result)
  defaultEvent: 'Expanded',      // created when the control is double-clicked
  container: true,               // optional: has child slots (also add slotsProp for multi-slot)
  props: [P('Header', 'text', '', 'Common'), P('IsExpanded', 'bool', false, 'Behavior')],
  events: ['Expanded', 'Collapsed'],
  render: (n, p) => `<div class="v-expander">...</div>`,   // designer preview (HTML string)
},
```

- `P(key, type, default, category, extra)`. Types: text, multiline, number, bool, enum (`options`), color, list, anchor.
- `extra`: `noXaml` (handled in code), `post` (set after load, e.g. `SelectedIndex`), `xaml` (attribute name, e.g. `ToolTip.Tip`), `hint` (help text).
- Only values that differ from the default are written to the XAML, so defaults must match Avalonia's real defaults.
- If the XAML element differs from the type key, set `element: 'Panel'`. For child items, add `xamlChildren(n, indent)`.
- For containers, `GC.slotSize()` in `js/codegen.js` must return the inner size that matches your CSS, or Anchor margins are off.
- Add it to `TOOLBOX` in the right group.

## 3. Designer preview (`css/app.css`)

Add `.v-<name>` styles using the theme variables (`--bg`, `--fg`, `--ctl`, `--bdr`, `--acc`, …) and `var(--ubg, …)` / `var(--ufg, …)`, so Background and Foreground work, in light and dark.

## 4. Icon and autocomplete (`js/app.js`)

- Add a 16×16 stroke icon to `ICONS` under the type key.
- If useful, add runtime-only members (methods, collections) to `EXTRA_MEMBERS` for autocomplete.

## 5. Generated checks

```bash
for f in js/*.js; do node --check "$f"; done
node tests/build-test-scripts.mjs "$TEMP/gc-out"      # the all-controls form picks up new types automatically
pwsh -NoProfile -Command "Invoke-Pester ./tests -Output Detailed"
```

## 6. Designer check

Use the `test-designer-ui` skill (`tests/tools/cdp.mjs`): add the control from the toolbox, set its properties, check `GC.genXaml(GC.app.doc)` and that there are no page errors.

## 7. Real run (required)

Use the `verify-gui-runtime` skill: export a design that uses the control and run `tests/tools/Test-GeneratedScript.ps1 -Path <file>`. It must print `OK: window shown`. Wire one event and fire it through `tests/tools/UIAutomation.psm1` if the control has interactive behaviour.

## 8. Finish

- If `codegen.js` changed, run `node tests/tools/export-example.mjs` and commit the regenerated example.
- Mention the control in the README toolbox list.
- Commit with a message that says what was verified (the `publish-change` skill).
