/* GUI Creator - local runner client.
 * When the page is served by Start-GuiCreator.ps1 it carries a <meta name="gc-token">.
 * The runner then posts the generated script to the local server, which runs it with
 * pwsh, and polls for its output. Opened as a plain file, the runner is unavailable. */
(function () {
  'use strict';
  const GC = (window.GC = window.GC || {});
  const $ = (s) => document.querySelector(s);
  const tokenMeta = document.querySelector('meta[name="gc-token"]');
  const token = tokenMeta ? tokenMeta.content : null;

  const state = { available: false, info: null, runId: null, running: false, next: 0, timer: 0, script: '', onLink: null };

  async function api(path, body) {
    const res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: Object.assign({ 'X-GuiCreator-Token': token }, body === undefined ? {} : { 'Content-Type': 'application/json' }),
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  function setStatus(text, cls) {
    const el = $('#outStatus');
    el.textContent = text;
    el.className = cls || '';
    $('#outStop').disabled = !state.running;
    document.dispatchEvent(new CustomEvent('gc-runner', { detail: { running: state.running } }));
  }

  function addLine(stream, text) {
    const box = $('#outLines');
    const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 4;
    const row = document.createElement('div');
    row.className = 'ol-' + stream;
    // Turn "run-xxxxxxxx.ps1:123" into a link to that line of the script that ran.
    const re = /[^\s]*run-[0-9a-f]{8}\.ps1:(\d+)/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      row.append(text.slice(last, m.index));
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = 'line ' + m[1];
      a.title = 'Go to this line';
      const line = +m[1];
      a.addEventListener('click', (e) => {
        e.preventDefault();
        state.onLink && state.onLink(state.script, line);
      });
      row.append(a);
      last = m.index + m[0].length;
    }
    row.append(text.slice(last));
    box.append(row);
    if (atBottom) box.scrollTop = box.scrollHeight;
  }

  async function poll() {
    if (!state.runId) return;
    try {
      const r = await api(`/api/output?id=${state.runId}&from=${state.next}`);
      if (r.id !== state.runId) return;
      r.lines.forEach((l) => addLine(l.s, l.t));
      state.next = r.next;
      if (r.running) {
        state.timer = setTimeout(poll, 300);
      } else {
        state.running = false;
        setStatus(`Exited with code ${r.exitCode}`, r.exitCode === 0 ? 'ok' : 'bad');
      }
    } catch (e) {
      state.running = false;
      setStatus('Lost connection to Start-GuiCreator.ps1: ' + e.message, 'bad');
    }
  }

  GC.runner = {
    get available() {
      return state.available;
    },
    get info() {
      return state.info;
    },
    get running() {
      return state.running;
    },
    /** True when the launcher can run designs: GliderUI and its matching server are installed. */
    get ready() {
      return state.available && !!(state.info && state.info.ready);
    },
    /** Why designs cannot run right now ('' when ready). */
    get problem() {
      return state.available && state.info && !state.info.ready ? state.info.problem || 'GliderUI is not ready.' : '';
    },
    /** Ask the launcher again (e.g. after the user installed GliderUI or the server). */
    async refresh() {
      if (!state.available) return false;
      try {
        state.info = await api('/api/ping');
      } catch (e) {
        /* keep the last known state */
      }
      return this.ready;
    },
    /** Called with (scriptText, lineNumber) when an error location is clicked. */
    set onLink(fn) {
      state.onLink = fn;
    },

    async init() {
      if (!token || !location.protocol.startsWith('http')) return false;
      try {
        state.info = await api('/api/ping');
        state.available = true;
      } catch (e) {
        state.available = false;
      }
      return state.available;
    },

    show() {
      $('#outputPanel').hidden = false;
    },
    hide() {
      $('#outputPanel').hidden = true;
    },
    clear() {
      $('#outLines').replaceChildren();
    },

    /** installsGliderUI: the script installs GliderUI and its server itself if they are missing. */
    async run(script, installsGliderUI) {
      clearTimeout(state.timer);
      state.script = script;
      this.show();
      this.clear();
      addLine('sys', `Running with PowerShell ${state.info.pwsh}${state.info.gliderui ? ', GliderUI ' + state.info.gliderui : ''} ...`);
      if (!state.info.ready) addLine(installsGliderUI ? 'sys' : 'err', installsGliderUI ? 'GliderUI or its server is missing; the script installs it for the current user first (this can take a minute).' : state.info.problem);
      try {
        const r = await api('/api/run', { script, installsGliderUI: !!installsGliderUI });
        state.runId = r.id;
        state.next = 0;
        state.running = true;
        setStatus('Running...', 'run');
        poll();
      } catch (e) {
        state.running = false;
        setStatus('Could not start: ' + e.message, 'bad');
      }
    },

    async stop() {
      if (!state.running) return;
      try {
        await api('/api/stop', {});
      } catch (e) {
        setStatus('Stop failed: ' + e.message, 'bad');
      }
    },
  };
})();
