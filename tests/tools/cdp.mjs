// Drive the GUI Creator designer in headless Microsoft Edge (Chrome DevTools Protocol, no npm deps).
//
//   import { openDesigner } from './tests/tools/cdp.mjs';
//   const b = await openDesigner({ url: 'file:///C:/path/to/guiCreator/index.html' });
//   await b.ev(`GC.app.controls().length`);          // evaluate in the page (GC.app is the test API)
//   await b.mouseClick(x, y); await b.drag(x1, y1, x2, y2); await b.key('F5', 'F5', 116);
//   await b.screenshot('shot.png'); console.log(b.errors); await b.close();
//
// Notes learned the hard way:
// - every browser gets its own --user-data-dir (fresh localStorage); the tour's first-visit offer is
//   suppressed unless you pass { offerTour: true }
// - on file:// pages stylesheets cannot be edited from script (cssRules is blocked); to compare old
//   and new CSS, build a copy of the site from git (git archive HEAD index.html css js)
// - drags need several mouseMoved steps; give auto-advancing UI (tour) ~500 ms before acting
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/microsoft-edge',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function openDesigner({ url, port = 9333 + Math.floor(Math.random() * 500), width = 1600, height = 900, offerTour = false } = {}) {
  if (!EDGE) throw new Error('Microsoft Edge / Chrome not found');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-edge-'));
  const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 40 && !targets; i++) {
    await sleep(250);
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { /* not up yet */ }
  }
  if (!targets) throw new Error('Edge did not start');
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) (pending.get(d.id)(d), pending.delete(d.id));
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  /** Evaluate an expression in the page; throws with the page's exception text. */
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(`${expr.slice(0, 80)} => ${r.result.exceptionDetails.exception?.description}`);
    return r.result.result.value;
  };
  const mouse = (type, x, y, clickCount = 1, modifiers = 0) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount, modifiers });
  const api = {
    send, ev, errors,
    async goto(u) { await send('Page.navigate', { url: u }); await sleep(1200); },
    async mouseClick(x, y, modifiers = 0) { await mouse('mousePressed', x, y, 1, modifiers); await mouse('mouseReleased', x, y, 1, modifiers); await sleep(80); },
    async doubleClick(x, y) { await this.mouseClick(x, y); await mouse('mousePressed', x, y, 2); await mouse('mouseReleased', x, y, 2); await sleep(150); },
    async drag(x1, y1, x2, y2, steps = 8) { await mouse('mousePressed', x1, y1); for (let i = 1; i <= steps; i++) await mouse('mouseMoved', x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps); await mouse('mouseReleased', x2, y2); await sleep(120); },
    /** key('F5','F5',116) ; modifiers: 1 Alt, 2 Ctrl, 4 Meta, 8 Shift */
    async key(key, code, vk, modifiers = 0) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, modifiers }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers }); await sleep(80); },
    /** Types text character by character (triggers autocomplete like a user). */
    async type(text) { for (const ch of text) { await send('Input.insertText', { text: ch }); await sleep(15); } },
    /** Centre of the first element matching a CSS selector. */
    center: (selector) => ev(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`),
    async screenshot(file, clip) { fs.writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })).result.data, 'base64')); },
    async close() {
      const exited = new Promise((r) => (proc.exitCode !== null ? r() : proc.once('exit', r)));
      try { await send('Browser.close'); } catch { /* already gone */ }
      ws.close();
      // wait for Edge to let go of its profile folder before deleting it
      await Promise.race([exited, sleep(5000)]);
      try { proc.kill(); } catch { /* gone */ }
      for (let i = 0; i < 10; i++) {
        try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch { await sleep(300); }
      }
    },
  };
  await send('Runtime.enable');
  await send('Page.enable');
  if (url) {
    await api.goto(url);
    await ev(`localStorage.clear(); ${offerTour ? '' : "localStorage.setItem('guiCreator.tourSeen', '1');"} true`);
    await send('Page.reload');
    for (let i = 0; i < 20 && !(await ev('!!(window.GC && GC.app)').catch(() => false)); i++) await sleep(250);
  }
  return api;
}
