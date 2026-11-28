# GUI Creator

A browser-based PowerShell GUI designer (in the style of SAPIEN PowerShell Studio) that generates PowerShell 7.4+ scripts for [GliderUI](https://github.com/mdgrs-mei/GliderUI) by mdgrs-mei (Avalonia UI for PowerShell).

- Live site: https://guicreator.mynster-it.dk (GitHub Pages; every push to `main` deploys it)
- Repo: https://github.com/Mynster9361/guiCreatorPowerShell (public)
- Generated scripts need **GliderUI 0.6.0+** (Fluent2 theme): `Initialize-GliderUI` installs or updates it. The minimum lives in `GC.GLIDERUI_MIN` (codegen.js) and `$minimumGliderUI` (Start-GuiCreator.ps1); keep them equal.
- The developer's machine is Windows 11 with PowerShell 7.6. Its installed GliderUI may still be 0.5.0: for tests, put a saved 0.6.0 (`Save-PSResource` into a temp folder) first on `PSModulePath`, or a test run will really install 0.6.0 into the profile.

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `css/app.css` | Page layout and styles, including the Fluent look-alike preview of controls (`.v-*` classes) |
| `img/` | GliderUI glider logo: `gliderui.svg` (white, for the dark header and About), `favicon.svg` (dark or white via `prefers-color-scheme`), `apple-touch-icon.png` (white on the header grey) |
| `js/controls.js` | `GC.TYPES`: every control type (props, events, `valueProp`, render, `xamlChildren`), `FORM_PROPS`, toolbox |
| `js/codegen.js` | XAML and PowerShell generation (`GC.genScript`, `GC.genXaml`), Anchor layout, reserved names, `GC.CREDITS`, embedded project |
| `js/editor.js` | Code editor: highlighting, autocomplete popup, `insertBlock` |
| `js/examples.js` | `GC.EXAMPLES`: GliderUI examples rebuilt as designs, plus the Setup Wizard and Exchange Online tools |
| `js/snippets.js` | `GC.SNIPPETS` for the Script tab's "Insert snippet" menu |
| `js/runner.js` | Browser side of the local launcher (Output panel, run, stop, `ready`) |
| `js/tour.js` | Guided tour (`GC.tour`) |
| `js/app.js` | Designer, property grid, project/forms, commands, autocomplete provider. `GC.app` is a small API for the tour and tests |
| `Start-GuiCreator.ps1` | Local launcher: serves the page on localhost and runs designs with pwsh (F5) |
| `examples/ExchangeOnlineAccessControl.ps1` | Committed export of an example; regenerate it with `node tests/tools/export-example.mjs` |
| `snippets/Show-MessageDialog.ps1` | Standalone snippet |
| `docs/` | README demo video (`GUI-Creator-demo.mp4`, 17 MB) and its poster (`.jpg`). Not deployed: `pages.yml` copies an explicit folder list |
| `tests/` | `build-test-scripts.mjs` (generator checks), `Generated.Tests.ps1` (Pester), `tools/` (runtime and browser test tools) |
| `.github/workflows/` | `ci.yml` (checks), `pages.yml` (deploy) |

## Architecture rules

- **No build step, no npm dependencies, no ES modules in the app.** These are classic `<script>` files that share `window.GC`, and the page must keep working from `file://`, GitHub Pages and the launcher. The script order in `index.html` matters: controls, codegen, editor, examples, snippets, runner, tour, app.
- **Project model (v2):** `{ version, nextId, nextForm, active, forms: [{ uid, form, menu, script }] }`.
  - `forms[0]` is the startup form; every other form becomes a `Show-<name>` dialog function.
  - In `app.js`, `doc` is the active form.
  - `normalize()` migrates v1 projects (examples are built in the v1 shape).
- **Examples are copies.** The open design is kept in localStorage, so a design opened from an example stays that version after the example changes. Exporting it gives the old script. `loadExample` records `project.example = { file, stamp, design }`, and on start `checkExampleUpdate()` offers the updated example. Designs saved before that are recognised by their startup form's name and title.
- **Caching:** the launcher sends `Cache-Control: no-store`. GitHub Pages sends `max-age=600`, so `pages.yml` adds `?v=<commit>` to every js/css URL in the deployed `index.html`, and the deploy fails if one is missed.
- **Undo** snapshots the whole project. `restore()` keeps the script text you typed after the last designer step (`committedScripts`); every script keystroke updates `lastSnap`.
- **Generated script order** (`genScript`):
  1. header and credits,
  2. `#Requires` and `using namespace`,
  3. `Initialize-GliderUI` (the GliderUISetup setting),
  4. page helpers,
  5. dialog functions,
  6. main form XAML and `FindControl`,
  7. your script,
  8. `Add<Event>` wiring,
  9. `Show()` and `WaitForClosed()`,
  10. the base64 project in a `<# GUICREATOR-PROJECT #>` comment. It is base64 because `#>` in user code would end a plain comment.
- **Layout:** controls are placed in a `Grid` using Margin and alignment derived from **Anchor**. `GC.slotSize()` must match the CSS of the containers and GliderUI 0.6's Fluent2 theme (measured with UI Automation; `build-test-scripts.mjs` pins the values):
  - GroupBox: border 1 + padding 12, a 20px header and a 12px gap, so content starts at 13,45 and is w−26 × h−58; with no Header it starts at 13,25 and is w−26 × h−38;
  - TabControl: tab strip 41;
  - Menu: 32 (written into the XAML).
- **Layout upgrade:** projects without `layout: 2` were designed with the old Fluent sizes (GroupBox w−18 × h−42, tab strip 48). `GC.upgradeLayout()` moves or resizes their GroupBox/TabControl children so every generated Margin stays the same. `normalize()` and every `GC.EXAMPLES[].build()` call it. If container sizes change again, bump `layout` and extend the upgrade the same way.

  A TabControl's layout attributes go on a wrapping `<Panel>`, not on the TabControl. Its template (Fluent and Fluent2) copies `HorizontalAlignment`/`VerticalAlignment` onto its inner Border, so a Left/Top-aligned TabControl shrinks its tab content to the size of the tab headers, and Bottom/Right anchors inside a tab break.

  If you change one, change the other.
- **Links** (GliderUI, author, video, this repo) live only in `GC.CREDITS` in `codegen.js`.
- **Launcher security:** listens on localhost only, needs the random token injected into the served `index.html`, rejects foreign Host headers, and serves only allowlisted static files. Never weaken this. Its body runs in `& { }` so dot-sourcing (VS Code F5) leaks nothing, and runs share its console (WAM needs it).

## Commands

```bash
failed=; for f in js/*.js tests/*.mjs tests/tools/*.mjs; do node --check "$f" || failed="$failed $f"; done; [ -z "$failed" ] || { echo "SYNTAX ERRORS:$failed"; false; }   # same files as CI
node tests/build-test-scripts.mjs "$TEMP/gc-out"                # generator consistency checks
node tests/tools/export-example.mjs                             # after codegen/example changes
```
```powershell
Invoke-Pester ./tests -Output Detailed                          # 117+ tests (Pester 5+); needs node
foreach ($p in './Start-GuiCreator.ps1', './snippets') { Invoke-ScriptAnalyzer -Path $p -Recurse -Severity Error }   # same as CI
pwsh -File ./Start-GuiCreator.ps1                               # run the app locally (F5 runs designs)
```

CI only parses scripts. Real behaviour needs Windows with GliderUI: see the `verify-gui-runtime` and `test-designer-ui` skills.

## Verified GliderUI facts (0.5.0 / 0.6.0)

- 0.6.0 switched the server to Avalonia 12.2's **Fluent2** theme (`<Fluent2Theme />`); the DataGrid still uses the old Fluent styles (black header in Dark). The `.v-*` preview was compared with real 0.6.0 windows in Dark and Light.
- Avalonia defaults that differ from what the designer draws are written with `forceEmit`: Button content alignment (Avalonia: Left/Top) and TimePicker `ClockIdentifier` (Avalonia: 24-hour when the culture's time pattern has `H`). DatePicker column order and the CalendarDatePicker watermark follow the culture; the preview uses the browser's locale.
- **Generate only what GliderUI supports.** GUI Creator must not extend GliderUI: no Add-Type, custom C# or helper layers in generated scripts. Prove each new XAML feature with `[AvaloniaRuntimeXamlLoader]::Parse` and a screenshot of a real window first.
  - Checked in 0.6.0 (parsed and rendered): `#AARRGGBB` colours, Segoe Fluent Icons through `FontFamily` (also as a fallback list, e.g. `Segoe UI, Segoe Fluent Icons`), `PathIcon`, `Path`, `Image` (file path or `file:///` URI), `LinearGradientBrush` as element syntax, `Border.BackdropEffect` with `BlurEffect`, `BoxShadow`, `StackPanel Spacing`, `FlexPanel`.
  - Not supported: brush strings like `linear-gradient(...)` ("Invalid brush string"). Window `TransparencyLevelHint` parses, but its rendering is not checked yet.
- **Bubbling events crash the server.** With a `SelectionChanged` handler on a container (TabControl, the default event when it is double-clicked) and on a ListBox, ComboBox or DataGrid inside it, selecting in the inner control kills the GliderUI server: `Object [sN] already exists` in `EventCallbackBinder`. A minimal repro confirms it in 0.6.0. Don't subscribe the same routed event on a control and on its ancestor.
- **Every read or write of a control or `[DataSource]` property is a server round trip** (about 15 ms; `FindControl` costs the same). Large windows must compute on plain PowerShell objects and only touch the controls of the visible view. The Project Dashboard example shows the pattern: model objects with a `.Row` DataSource, with an `Id` to map a selected row back to its object.
- `ListBox.Items.Add/Insert/RemoveAt/Clear` work from PowerShell. One DataSource can be shown in several grids, and a change updates all of them. `[SolidColorBrush]::Parse('#RRGGBB')` sets brushes from hex colours.
- **A `[DataSource]` is enumerable:** a function that returns one must use `, [DataSource]@{...}` (unary comma). Without it, PowerShell sends its key/value pairs down the pipeline, and `.Add()` fails with "Cannot find an overload".
- Values set while the script starts raise events before the `Add<Event>` wiring exists, so those handlers don't run for them. Set dependent values (labels and so on) directly as well.
- With `ExtendClientAreaToDecorationsHint`, Avalonia still draws the window Title (no icon) at the top left. Don't put your own title label there.
- If the **same GliderUI server version is installed twice** (two module folders), GliderUI 0.6.0 joins both paths and the window can't start. Never add a temp copy of a version that is already installed.

- The generated pattern is `[AvaloniaRuntimeXamlLoader]::Parse($xaml, $null)`, then `$win.FindControl('name')`, then `$ctl.Add<Event>($handler)`. Handlers are script blocks or `[EventCallback]@{...}` with `param ($argumentList, $s, $e)`.
- **Main-runspace callbacks only run while the script is inside `WaitForClosed()`.** Never block before it. A nested `$dialog.WaitForClosed()` inside a handler works; that is how the modal `Show-<form>` dialogs work.
- `Window.ShowDialog()` throws AmbiguousMatchException and `Show(owner)` does not exist (0.5.0). Dialogs disable the owner instead.
- **The server is not a service.** Each script starts its own and stops it when its window closes. It must be installed (`Install-GLIServer`, matching the module version) **before** `Import-Module` in that session, otherwise you get "Object type mapping not found". `Initialize-GliderUI` therefore installs the server from a separate `pwsh`.
- `Install-PSResource` / `Install-GLIServer` need `-TrustRepository` when non-interactive.
- **Don't raise events from PowerShell.** Raising Avalonia events with client-created `RoutedEventArgs` crashes the server. Test through UI Automation instead.
- **WAM sign-in** (`Connect-ExchangeOnline`, `Connect-MgGraph`) needs a console window: "A window handle must be configured". `-DisableWAM` is the fallback.
- **Brushes:** `[SolidColorBrush]::new([Colors]::Name, 1)` works. In XAML the window property is `Topmost`, and `TextBox.Watermark` works.

## Pitfalls we hit

**PowerShell**
- `"on $m?"` reads the variable `m?`. Write `"$($m)?"` instead.
- `using namespace` must come before any other statement.
- Command-mode parsing: `Show-Report "x" @(...) + $list` passes separate arguments, so wrap the expression in parentheses.
- Control names must not shadow automatic variables (`GC.RESERVED_NAMES`: input, host, error, args, s, e, …).
- Never `Invoke-Expression` user input; splat parameters.

**Editing files**
- **Don't pass code containing backticks or `$` through bash `node -e` or `sed` strings.** It has corrupted files twice: once it appended a duplicated tail to `app.js`, once it ran README text as commands. Use the Edit/Write tools, or write a script file first.
- In JavaScript, `String.replace` treats `$$` in the replacement as `$`. Pass a function: `s.replace(a, () => b)`.
- `examples.js` holds PowerShell in `String.raw` template literals, so that code must not contain a backtick or `${`.
- In bash, `$PWD` is `/c/...`. Pass Windows paths (`cygpath -w`) to `pwsh`. LF→CRLF warnings on commit are expected.

## Testing rules

- **Never connect to a real Microsoft 365 tenant** in tests. Use mock functions for external cmdlets (`Test-GeneratedScript.ps1 -Prepend`).
- **Never change the developer's installed modules** without a backup and a verified restore. Move folders aside; don't uninstall them.
- **Clean up only your own processes:** match by a unique command line or profile folder. The developer runs GliderUI scripts and launchers from VS Code; never kill those.
- **A test that never fails proves nothing.** For new checks, break the code on purpose in a temporary copy and confirm the test catches it.

## Commits and publishing

- Commit messages: an imperative subject; a body that says why, what changed and how it was verified; end with the `Co-Authored-By` line. Split unrelated changes into separate commits.
- Pushing `main` triggers **CI** and the **Pages deploy**. Watch both with `gh run watch`, then check the live site (the `publish-change` skill).
- Regenerate `examples/ExchangeOnlineAccessControl.ps1` whenever its generated output would change, then check `git diff`.
