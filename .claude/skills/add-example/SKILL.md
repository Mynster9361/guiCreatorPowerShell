---
name: add-example
description: Add a new example project to GUI Creator's Examples menu (js/examples.js), e.g. porting an existing WinForms/WPF PowerShell GUI or a GliderUI example into an editable design with its logic in the Script tab. Use when asked to add, port, recreate or convert a GUI as an example.
---

# Add an example to the Examples menu

Examples are built in code in `js/examples.js` and appear under **Examples**. Good examples show real patterns that work and are tested end to end.

## 1. Understand the source

- If you're porting an existing script, fetch it (`gh api repos/<owner>/<repo>/contents/<path>` and base64-decode) and list its controls, layout, event logic and external dependencies.
- Plan improvements in the GliderUI style rather than copying WinForms habits:
  - results inside the app, not temp files opened in Notepad;
  - input validation and a status line;
  - `[EventCallback]` with `DisabledControlsWhileProcessing` for slow work;
  - a confirmation dialog (a second form) before destructive actions;
  - anchors so the window can be resized.
- Fix real bugs you find, and list them for the user.

## 2. Build it with the helpers

```js
{
  name: 'My Tool', file: 'MyTool', tag: 'Real-world',
  description: 'One sentence for the status bar.',
  build: () => {
    nid = 1;
    const main = project('formMyTool', { Title: 'My Tool', Width: 600, Height: 400 }, [
      ctl('TextBox', 'textboxInput', 16, 16, 300, 32, { Watermark: '...', Anchor: 'Top, Left, Right' }),
      ctl('Button', 'buttonGo', 324, 16, 100, 32, { Content: 'Go', Classes: 'accent' }, { events: { Click: 'buttonGo_Click' } }),
      ctl('GroupBox', 'groupX', 16, 64, 300, 200, { Header: 'X' }, { children: [ /* ctl(...) relative to the group */ ] }),
    ], String.raw`# script for the startup form
$buttonGo_Click = {
    param ($argumentList, $s, $e)
}
`);
    return main;                       // or multi(main, dialogForm) for several forms
  },
},
```

- `ctl(type, name, x, y, w, h, props, { events, children, slots })`; `project(formName, formProps, controls, script, formEvents)`; `multi(...projects)` (first = startup form).
- Positions are in the parent's coordinates. With the Fluent2 sizes (GliderUI 0.6+), GroupBox content is w−26 × h−58 (h−38 without a Header) and TabControl content is h−41.
- **Mark a new example as Fluent2 layout:** the existing examples were laid out with the old sizes, so every `build()` runs `GC.upgradeLayout`. Return `Object.assign(project(...), { layout: 2 })` (or set `layout: 2` on the `multi(...)` result) so a new example's positions are used as written. Without it, children of GroupBoxes and TabControls are shifted.
- Credit ported third-party code in the script header (`credit('<GliderUI example file>')` exists for GliderUI's examples).

## 3. PowerShell inside `String.raw` - rules

- **No backtick and no `${`** anywhere in the code (they end the template or become JavaScript interpolation). Use `[Environment]::NewLine`, `"$($x)"` and `-f`.
- Write `"$($m)?"`, never `"$m?"`. Wrap expressions in command-mode arguments: `Show-Report "x" (@(...) + $list)`.
- Splat cmdlets that use user input; never `Invoke-Expression`.
- Every wired handler must be defined (`$name_Click = ...`). Control names must not be reserved (`GC.RESERVED_NAMES`).
- Dialog forms are closed with `Close-Dialog 'OK'` and called as `Show-<form> -Owner $<startupForm> -Values @{...}`.

## 4. Verify

```bash
node --check js/examples.js
node tests/build-test-scripts.mjs "$TEMP/gc-out"        # handlers defined, names valid, round trip
pwsh -NoProfile -Command "Invoke-Pester ./tests"        # parser + XAML for the new example too
```

Then a real run with the `verify-gui-runtime` skill:

- Mock every external cmdlet (Exchange, Graph, AD, …) with functions that keep in-memory state and log their calls, and pass them with `-Prepend`. **Never connect to a real tenant or service.**
- Drive the main flows through UI Automation: validation messages, the happy path, cancel paths in dialogs, and the window closing cleanly.

## 5. Export (optional)

To ship a ready-to-run `.ps1` like `examples/ExchangeOnlineAccessControl.ps1`, run `node tests/tools/export-example.mjs <file> examples/<Name>.ps1`, add a README section, and add a Pester check if it needs special treatment.
