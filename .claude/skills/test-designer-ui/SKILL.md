---
name: test-designer-ui
description: Test the GUI Creator web designer itself in headless Microsoft Edge with real mouse/keyboard input (tests/tools/cdp.mjs) - toolbox, drag/resize, property grid, events, script editor and autocomplete, tour, menus, runner/Output panel, layout regressions and screenshots. Use after changing index.html, css/app.css or any js/ file that affects the page.
---

# Test the designer in a real browser

`tests/tools/cdp.mjs` starts a headless Edge with its own profile, opens the page, suppresses the tour's first-visit offer, and gives you `ev`, mouse, keyboard and screenshot helpers. Write a small `.mjs` script in the scratchpad (not in the repo) and run it from the repo root with `node <script>`. The script is outside the repo, so it builds the paths from the current directory:

```js
import { pathToFileURL } from 'node:url';
const repo = pathToFileURL(process.cwd() + '/').href;          // run from the repo root
const { openDesigner } = await import(repo + 'tests/tools/cdp.mjs');
const b = await openDesigner({ url: repo + 'index.html' });
const [x, y] = await b.center('.tb-item');            // CSS selector -> centre point
await b.doubleClick(x, y);                            // add the first toolbox control
await b.key('z', 'KeyZ', 90, 2);                      // Ctrl+Z  (modifiers: 1 Alt, 2 Ctrl, 8 Shift)
console.log(await b.ev('GC.app.controls().length'));  // GC.app: project, doc, selection, select(), showTab(), load(), run(), ...
await b.screenshot('C:/.../shot.png');                // look at it with the Read tool
console.log('page errors:', b.errors);                // must be empty
await b.close();
```

## What to check

- Exercise the change through **real input** (clicks, drags, typing). Use `ev()` for state and assertions, not as a substitute for the interaction.
- **No page errors** (`b.errors`) in every test.
- **Persistence:** read `JSON.parse(localStorage.getItem('guiCreator.project.v1'))`. A migrated project is only saved after the next edit.
- **Screenshots** for anything visual. Read the PNG and look at it.
- **Before/after comparisons** (for example layout jitter): `file://` blocks editing stylesheets from script, so build a copy of the previous version with `git archive HEAD index.html css js | tar -x -C <dir>` and measure both the same way.
- **Hosted behaviour (GitHub Pages):** serve the folder with a tiny static Node server on `127.0.0.1`. That gives an `http:` page without the launcher token, like the live site. `file://` is the "local copy" case.
- **Launcher behaviour:** start `pwsh -File ./Start-GuiCreator.ps1 -NoBrowser -Port <free port>` and open `http://localhost:<port>/`. Stop it afterwards by matching its unique `-Port` on the command line.
- **Timing:**
  - drags need several `mouseMoved` steps (`drag()` does this);
  - the tour auto-advances about 1.4 s after a "Try it" step is done, so wait about 500 ms before the next action;
  - the GliderUI window from an F5 run is a separate desktop window (use the `verify-gui-runtime` skill for it).

## Clean up

`close()` waits for Edge to exit and removes its profile. If a script crashes, stop only Edge processes whose command line contains `gc-edge-`, and remove leftover `%TEMP%\gc-edge-*` folders.
