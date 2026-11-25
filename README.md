# GUI Creator

A browser-based PowerShell GUI designer modeled on the SAPIEN PowerShell Studio form designer. It produces scripts for [GliderUI](https://github.com/mdgrs-mei/GliderUI) by [mdgrs-mei](https://github.com/mdgrs-mei), which provides Avalonia UI for PowerShell 7.4+ on Windows, macOS and Linux.

**Try it online: [guicreator.mynster-it.dk](https://guicreator.mynster-it.dk)**. No install is needed to design and export. To run designs with F5, use the local launcher described below.

> **New to GliderUI?** Watch the PowerShell Wednesday session [Building Cross-Platform GUIs with PowerShell and GliderUI](https://www.youtube.com/watch?v=ZeLMIPD68ZU) (PDQ on YouTube).

There is no build step and nothing to install. Run `pwsh -File .\Start-GuiCreator.ps1` to use it with F5 runs, or just open `index.html` in a browser (Edge, Chrome or Firefox).

## Guided tour

New to GUI Creator? Open **Help → Guided Tour...**. It's also offered the first time you open GUI Creator.

The tour has three chapters:

1. **Basics (11 steps):** place controls, move them, set properties, create an event handler, write code with autocomplete, view the generated script, and run it.
2. **Intermediate (8 steps):** select and align controls, use Anchor to make the window resizable, add containers and a menu, use undo and copy/paste, and save your work.
3. **Advanced (7 steps):** use multiple forms and dialogs (`Show-…`, `Close-Dialog`), build wizard pages, explore the examples, and use the problem checker.

How it works:

- A spotlight highlights the part of the screen each step is about, with an explanation next to it.
- Steps marked **Try it** ask you to do something, such as add a button or double-click it. The tour moves on by itself once you've done it.
- You can jump between chapters, go back, skip a step, or end the tour with **Esc**.
- The tour uses a practice project. Your own design is set aside, and at the end you choose whether to restore it or keep the practice project.

## Features

- **Toolbox**: Button, Label, TextBox (single-line, multiline, password), CheckBox, RadioButton, ToggleButton, ToggleSwitch, HyperlinkButton, ComboBox, ListBox, DataGrid, Slider, ProgressBar, NumericUpDown, DatePicker, CalendarDatePicker and TimePicker. There are three containers (Panel, GroupBox, TabControl) and a menu bar.
- **Designer**: There are three ways to place a control:
  - Drag it from the toolbox onto the form.
  - Click it in the toolbox, then click or drag on the form.
  - Double-click it in the toolbox.
- **Editing**:
  - Move and resize controls with handles. Snap to the grid and to other controls with snaplines.
  - Select several controls with a rubber band, or Shift/Ctrl+click.
  - Drag a control into a container to nest it.
  - Align, make the same size, center and change z-order from the Format menu.
  - Undo and redo, cut, copy, paste, duplicate, and nudge with the arrow keys.
- **Properties and events**: The property grid can be categorized or alphabetical. Double-click a control to create its default event handler and jump to it, as in PowerShell Studio. When you rename a control, references to it in your script are updated.
- **Script tab**: An editor with PowerShell syntax highlighting for your functions and handlers.
- **Generated Script and XAML tabs**: Show the final output.
- **Files**:
  - Autosaves to the browser.
  - Save and open projects as `.guiproj.json`.
  - Export a runnable `.ps1`. The design is embedded in that file, so you can open the exported `.ps1` again to keep editing it.

## Resizable windows (Anchor)

Every control has an **Anchor** property in the Layout section of the property grid. It works like Anchor in PowerShell Studio or WinForms. Click the edges in the small editor to choose which sides of the parent the control stays attached to:

| Anchor | When the window grows |
| --- | --- |
| Top, Left (default) | stays where it is |
| Top, Left, Right | gets wider (for example, a text box across the top) |
| Top, Bottom, Left, Right | fills the space in both directions (for example, a list or grid) |
| Bottom, Right | moves with the bottom-right corner (for example, OK and Cancel buttons) |

Anchors work inside containers too: a control anchored inside a stretching GroupBox or Panel follows that container. When you resize the form or a container in the designer, anchored children move the same way they will at run time. You can set **MinWidth** and **MinHeight** on the window so it can't be shrunk too far.

The generated XAML places controls in a `Grid` using `Margin` and `HorizontalAlignment`/`VerticalAlignment`. With the default anchor this is the same as absolute positioning.

## Script editor

- **Autocomplete** opens by itself as you type:
  - `$` lists controls, the form, your variables and the automatic variables (`$s`, `$e`, …);
  - `$control.` lists that control's properties, methods and `Add<Event>(` methods;
  - a name with `-` (for example `Get-`, `Show-`) lists commands: dialog functions, `Set-Page`/`Get-Page`, `Close-Dialog` and common cmdlets.

  Press Ctrl+Space to open it on demand. Use ↑/↓ to choose, Enter or Tab to accept, and Esc to close.
- **Undo:** the Script tab keeps the editor's own undo. Ctrl+Z in the designer also undoes the script changes the designer made, such as a handler stub from double-clicking or a rename, unless you have typed in that script since.
- **Snippets:** the **Insert snippet...** menu adds a ready-made code pattern at the cursor, filled in with your form's real control names:
  - **Basics:** an event handler, reading and validating input, changing a color.
  - **Lists and data:** filling a ComboBox or ListBox, filling a DataGrid with objects, reading the selected rows.
  - **Long-running work:** disabling buttons while a handler runs, a progress-bar loop, background work with Cancel.
  - **Dialogs:** a Yes/No message box, showing a dialog form and using its result, `Close-Dialog`, file, save and folder pickers.
  - **Window:** wizard Next/Back, remembering settings between runs, closing the window.

  Snippets that only apply to dialogs or wizards appear only when they fit the current form.
- **Reserved names:** a control can't be named after a PowerShell automatic variable (`input`, `host`, `error`, `args`, …) or the handler parameters `s`, `e` and `argumentList`. Those names would break the script silently. The problem checker also flags them in imported projects.

## Multiple forms (dialogs)

A project can hold several forms. They are listed in the **Project** panel. The first form is the **startup form**, the window the script opens. Every other form is a **dialog**.

- To add a dialog, click **+ Dialog** (or File, then Add Dialog Form). A new dialog already has OK and Cancel buttons wired up.
- To choose a different startup form, right-click a form and click **Set as Startup Form**.
- Each form has its own controls and its own Script tab.

The exported script turns every dialog into a function, `Show-<formName>`. The function opens the dialog, disables the window you pass as `-Owner`, and waits until the dialog closes:

```powershell
$result = Show-formAdvanced -Owner $formMain -Values @{ numericThreads = 4 }
if ($result.DialogResult -eq 'OK') {
    $threads = $result.numericThreads
}
```

- `-Values` sets the initial value of controls in the dialog.
- The result contains `DialogResult` and the value of each input control in the dialog. The value read depends on the control: `Text` for a TextBox, `IsChecked` for a CheckBox, `SelectedIndex` for a ComboBox, `Value` for a NumericUpDown, and so on.
- In the dialog's script, close the dialog with `Close-Dialog 'OK'`. The value you pass becomes `DialogResult`. If the user closes the dialog with X, `DialogResult` is `$null`.

GliderUI 0.5.0's `Window.ShowDialog()` fails with an "ambiguous match" error, so the generated function makes the dialog modal itself: it disables the owner window, shows the dialog, and waits on `WaitForClosed()`, which keeps handling clicks while it waits. As a result, the dialog is not attached to its owner in the taskbar.

## Pages (wizards)

The **Pages (Wizard)** container shows one page at a time, with no tab headers. To design a page, select it with the ◀ ▶ switcher in the container's corner or in the Document Outline; the switcher only appears in the designer. Switch pages from your script with the generated helpers:

```powershell
Set-Page $pagesWizard -Next        # or -Previous, or -Index 2
$page = Get-Page $pagesWizard      # index of the visible page
```

To see both features working together, open **Examples, then Setup Wizard (pages + dialog)**.

## Examples

The **Examples** menu opens eight of [GliderUI's examples](https://github.com/mdgrs-mei/GliderUI/tree/main/examples) rebuilt as editable designer projects:

- Quick Start
- Basic Input
- Install Dialog
- Sign-In Form
- Cancel Long-Running Callback
- Multiple Progress Bars
- Storage Provider (file pickers)
- DataGrid (processes)

The original scripts build their windows in code. In these versions the layout is in the designer and the logic is in the Script tab. They are ported under GliderUI's MIT license (Copyright (c) 2026 mdgrs-mei).

### Exchange Online Access Control (complete tool)

**Examples, then Exchange Online Access Control** is a complete, real-world tool. It's a rebuild of the WinForms script [Set calendar and mailbox permissions](https://github.com/Mynster9361/PowerShell/tree/main/GUI/Set%20calendar%20and%20mailbox%20permissions). It checks, gives and removes **Full Access** (with optional auto-mapping), **Send As**, **Send On Behalf** and **calendar** permissions on Exchange Online mailboxes.

- A **Connect** button and status line. If the ExchangeOnlineManagement module is missing, the tool offers to install it for the current user.
- Before and after permission tables, plus the exact commands that ran, appear in a **Results** panel. **Save...** writes them to a text file.
- A **confirmation dialog** (a second form, `formConfirm`) appears before any change is made.
- Input validation, buttons that are disabled while Exchange is working, a resizable window, and an automatic disconnect when the window closes.
- Cmdlets are called with splatted parameters, so text typed into the boxes is never run as code. Send On Behalf adds or removes a single delegate instead of replacing the whole list.

A ready-to-run export is in [examples/ExchangeOnlineAccessControl.ps1](examples/ExchangeOnlineAccessControl.ps1). Run it with `pwsh -File`, or open it in GUI Creator to edit the design.

GliderUI's other examples are not included because the designer can't represent them:

- DrawerPage (navigation pages)
- WebView
- LiveCharts2 (chart controls)
- XamlLoader (custom styles and animations)
- MultipleRunspaces (opens a second window from a thread job)

## Running from the designer (F5)

Start GUI Creator through its local launcher instead of opening `index.html` directly:

```powershell
pwsh -File .\Start-GuiCreator.ps1          # opens http://localhost:8765/ in your browser
```

You can also start it from VS Code with the PowerShell extension (open the file and press F5). The launcher runs in its own scope, so it leaves nothing behind in the terminal session. It keeps running until you stop it with Ctrl+C, Shift+F5 or the stop button; when it stops, it prints whether it was stopped or which error ended it.

- Press **F5** (or click **Run**) to run the current project with `pwsh`. The status bar shows the PowerShell and GliderUI versions it uses.
- The **Output** panel shows the script's output and errors. In an error, click **line N** to jump to that line: in the right form's Script tab if the error is in your code, otherwise in the Generated Script tab.
- Press **Shift+F5** (or click **Stop**) to stop the run. This also closes its windows and GliderUI server process.

How the launcher is protected:

- It listens on `localhost` only.
- Every API call needs a random token that is created at startup and embedded only in the page the launcher serves. Other websites can't read that token.
- Requests with a host name other than localhost are refused, which blocks DNS-rebinding attacks.
- It serves only the designer's own files: `.html`, `.css`, `.js` and images from its folder.
- Runs are temporary scripts in `%TEMP%\GuiCreatorRuns-<pid>`, deleted when the launcher stops (press Ctrl+C).

If you open `index.html` directly, everything except running works. The status bar then shows "Runner offline".

## Running the exported script

```powershell
pwsh -File .\formMain.ps1
```

That's all you need on a machine with PowerShell 7.4+. By default, an exported script checks first whether GliderUI and its matching server are installed:

- If GliderUI is missing, it installs it for the current user with `Install-PSResource -Name GliderUI -Scope CurrentUser`. No admin rights are needed.
- If the server is missing, it runs `Install-GLIServer`. This happens in a separate `pwsh`, because GliderUI only finds a server that already existed when the module was imported.
- Then it imports GliderUI.

The first run takes a little longer (about 15 seconds when nothing was installed); later runs start as usual. There is nothing to *start*: GliderUI starts its own server process when the window opens and stops it when the window closes.

You can change this with the **GliderUISetup** property of the startup form:

| GliderUISetup | When GliderUI or its server is missing |
| --- | --- |
| **InstallIfMissing** (default) | installs it for the current user, then runs |
| **CheckOnly** | stops with a message that names the command to run |
| **ImportOnly** | plain `Import-Module GliderUI`, as in the GliderUI examples |

With the local launcher, Run stays available when the server is missing as long as the design uses InstallIfMissing. The Output panel shows the installation.

Tested with GliderUI 0.5.0 and 0.6.0 (Avalonia 12) on PowerShell 7.6, Windows 11. To install GliderUI yourself instead: `Install-PSResource -Name GliderUI`, then `Install-GLIServer` (add `-TrustRepository` in a non-interactive session).

## How the generated script works

1. The form is written as XAML. Controls are placed with absolute positions on a `Canvas`, using `Canvas.Left` and `Canvas.Top`.
2. The script loads the XAML with `[AvaloniaRuntimeXamlLoader]::Parse($xaml, $null)`, which is the pattern from GliderUI's XamlLoader example.
3. Each named control becomes a variable: `$button1 = $formMain.FindControl('button1')`.
4. Your Script tab code is inserted next. Handlers are script blocks: `$button1_Click = { param($argumentList, $s, $e) ... }`.
5. The script connects each handler with `$button1.AddClick($button1_Click)`, then calls `$formMain.Show()` and `$formMain.WaitForClosed()`.

## Tests

```powershell
Invoke-Pester ./tests -Output Detailed     # needs Node.js and Pester 5+
```

[tests/build-test-scripts.mjs](tests/build-test-scripts.mjs) loads the designer's code generator in Node.js and generates:

- every example,
- a form that uses every control type, anchor and container,
- every snippet, inserted into a real project.

It checks that every wired handler is defined, that names are unique and allowed, and that the embedded project survives a save and reopen. [tests/Generated.Tests.ps1](tests/Generated.Tests.ps1) then checks the results with the PowerShell parser: no syntax errors, well-formed XAML with unique `x:Name`s, a launcher that parses, and the exported example. GitHub Actions runs all of this on every push ([.github/workflows/ci.yml](.github/workflows/ci.yml)), plus PSScriptAnalyzer on the launcher and snippets.

## Publishing

Every push to `main` publishes the designer to **https://guicreator.mynster-it.dk** through GitHub Pages ([.github/workflows/pages.yml](.github/workflows/pages.yml)). Before each publish, the workflow runs the generator checks, so a broken build is never deployed. The published site contains only what the web app needs: `index.html`, `css/`, `js/`, `examples/`, `snippets/`, the launcher script and this README.

The hosted page works like a locally opened `index.html`: you can design, use the tour, the examples and the snippets, save, and export `.ps1` files. **Run (F5)** needs the local launcher, so clone the repo and run `pwsh -File .\Start-GuiCreator.ps1`. Designs are stored in your browser per site, so the hosted page and the local launcher keep separate autosaves. Use **Save Project** and **Open** to move a design between them.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout |
| `css/app.css` | IDE styling and the Fluent-style preview of controls |
| `js/controls.js` | Control types: properties, events, how they are drawn in the designer |
| `js/codegen.js` | XAML and PowerShell generation, and the embedded project data |
| `js/editor.js` | Code editor with highlighting |
| `js/examples.js` | GliderUI examples as designer projects |
| `js/runner.js` | Talks to the local launcher: run, stop, Output panel |
| `Start-GuiCreator.ps1` | Local launcher: serves the page and runs designs with pwsh |
| `js/snippets.js` | Code snippets for the Script tab |
| `js/tour.js` | Interactive guided tour (steps, spotlight, practice project) |
| `js/app.js` | Designer, property grid, menus, commands |

## Notes

- The designer preview approximates Avalonia's Fluent theme, so sizes can differ slightly when the script runs.
- Property and event names follow Avalonia (for example `Content`, `IsChecked`, `SelectionChanged`). To add a control or property, add an entry to `TYPES` in `js/controls.js`.

## Credits

GUI Creator would not exist without **[GliderUI](https://github.com/mdgrs-mei/GliderUI)** by **[mdgrs-mei](https://github.com/mdgrs-mei)**. GliderUI does the hard part: it runs [Avalonia UI](https://avaloniaui.net/) in its own server process and makes the controls, properties and events available to PowerShell. A plain PowerShell 7 script can then build a native, cross-platform window, with responsive event callbacks and background runspaces. GUI Creator only designs the window and writes the script; everything it builds runs on GliderUI.

- **GliderUI:** [github.com/mdgrs-mei/GliderUI](https://github.com/mdgrs-mei/GliderUI). Install it with `Install-PSResource -Name GliderUI` and then `Install-GLIServer`.
- **Learn GliderUI:** the PowerShell Wednesday session [Building Cross-Platform GUIs with PowerShell and GliderUI](https://www.youtube.com/watch?v=ZeLMIPD68ZU) (PDQ on YouTube).
- **Examples:** the Examples menu contains mdgrs-mei's [GliderUI examples](https://github.com/mdgrs-mei/GliderUI/tree/main/examples), rebuilt as designs under GliderUI's MIT License (Copyright (c) 2026 mdgrs-mei). The XAML loading, `[EventCallback]`, runspace pool, `DataSource` and storage-provider patterns that GUI Creator generates and offers as snippets all come from those examples.

If GUI Creator is useful to you, please star [GliderUI](https://github.com/mdgrs-mei/GliderUI) too.
