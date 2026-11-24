/* GUI Creator - lightweight code editor with PowerShell / XML highlighting */
(function () {
  'use strict';
  const GC = (window.GC = window.GC || {});
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  const PS_RULES = [
    ['cm', /<#[\s\S]*?#>/y],
    ['cm', /#.*/y],
    ['st', /@'[\s\S]*?\n'@/y],
    ['st', /@"[\s\S]*?\n"@/y],
    ['st', /'(?:[^']|'')*'/y],
    ['st', /"(?:[^"`]|`[\s\S])*"/y],
    ['va', /\$\{[^}]*\}|\$(?:[A-Za-z_][\w]*:)?[\w?^$]+/y],
    ['ty', /\[[A-Za-z_][\w.`]*(?:\[\])?\]/y],
    ['op', /-(?:eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|and|or|not|xor|band|bor|is|isnot|as|replace|split|join|f|ceq|ieq)\b/iy],
    ['kw', /\b(?:if|else|elseif|foreach|for|while|do|until|switch|function|filter|param|return|try|catch|finally|throw|break|continue|begin|process|end|in|using|namespace|class|enum|trap|exit|default)\b/iy],
    ['cmd', /\b[A-Za-z]+-[A-Za-z][A-Za-z0-9]*\b/y],
    ['nu', /\b\d+(?:\.\d+)?\b/y],
  ];
  const XML_RULES = [
    ['cm', /<!--[\s\S]*?-->/y],
    ['tag', /<\/?[\w:.]+/y],
    ['tag', /\/?>/y],
    ['st', /"[^"]*"/y],
    ['at', /[\w:.]+(?==)/y],
  ];

  function highlight(src, rules) {
    let out = '';
    let i = 0;
    let plain = '';
    while (i < src.length) {
      let matched = false;
      for (const [cls, re] of rules) {
        re.lastIndex = i;
        const m = re.exec(src);
        if (m && m[0].length) {
          if (plain) (out += esc(plain)), (plain = '');
          out += `<span class="hl-${cls}">${esc(m[0])}</span>`;
          i += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // skip a whole word at once so keywords are only matched at word starts
        const w = /[A-Za-z0-9_]+|[\s\S]/y;
        w.lastIndex = i;
        const m = w.exec(src);
        plain += m[0];
        i += m[0].length;
      }
    }
    return out + esc(plain);
  }
  GC.highlight = (src, lang) => highlight(src, lang === 'xml' ? XML_RULES : PS_RULES);

  GC.createEditor = function (host, opts) {
    opts = opts || {};
    host.classList.add('ed');
    host.innerHTML = '<div class="ed-gutter"><div class="ed-lines"></div></div><div class="ed-main"><pre class="ed-hl" aria-hidden="true"></pre><textarea class="ed-ta" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea></div>';
    const ta = host.querySelector('.ed-ta');
    const pre = host.querySelector('.ed-hl');
    const gut = host.querySelector('.ed-lines');
    if (opts.readOnly) ta.readOnly = true;
    let lastLines = 0;

    function render() {
      pre.innerHTML = GC.highlight(ta.value, opts.lang) + '\n';
      const n = ta.value.split('\n').length;
      if (n !== lastLines) {
        let s = '';
        for (let i = 1; i <= n; i++) s += i + '\n';
        gut.textContent = s;
        lastLines = n;
      }
      sync();
    }
    function sync() {
      pre.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
      gut.style.transform = `translateY(${-ta.scrollTop}px)`;
    }
    ta.addEventListener('scroll', () => (sync(), closeComplete()));
    ta.addEventListener('input', (e) => {
      render();
      opts.onChange && opts.onChange(ta.value);
      // open / refresh completion while typing identifiers, "$", "." or "-"
      if (opts.complete) {
        if (e.inputType === 'insertText' && /^[\w$.-]$/.test(e.data || '')) showComplete(false);
        else if (e.inputType === 'deleteContentBackward' && popup) showComplete(false);
        else closeComplete();
      }
    });
    ta.addEventListener('keyup', () => opts.onCursor && opts.onCursor(cursorPos()));
    ta.addEventListener('click', () => (closeComplete(), opts.onCursor && opts.onCursor(cursorPos())));
    ta.addEventListener('blur', () => setTimeout(closeComplete, 150));

    const insert = (text) => {
      // execCommand keeps the native undo stack intact
      if (!document.execCommand('insertText', false, text)) ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
    };

    // ------------------------------------------------------------ completion popup
    let popup = null; // { el, from, items, sel }
    let charWidth = 0;
    function caretXY(pos) {
      if (!charWidth) {
        const ctx = document.createElement('canvas').getContext('2d');
        const cs = getComputedStyle(ta);
        ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
        charWidth = ctx.measureText('MMMMMMMMMM').width / 10;
      }
      const before = ta.value.slice(0, pos).split('\n');
      const lh = parseFloat(getComputedStyle(ta).lineHeight) || 19;
      return { x: 12 + before[before.length - 1].length * charWidth - ta.scrollLeft, y: 8 + before.length * lh - ta.scrollTop };
    }
    function closeComplete() {
      if (popup) popup.el.remove();
      popup = null;
    }
    function showComplete(explicit) {
      const pos = ta.selectionStart;
      const res = opts.complete(ta.value, pos, explicit);
      if (!res || !res.items.length) return closeComplete();
      const typed = ta.value.slice(res.from, pos).toLowerCase();
      let items = res.items.filter((it) => it.label.toLowerCase().startsWith(typed));
      if (typed) items = items.concat(res.items.filter((it) => !it.label.toLowerCase().startsWith(typed) && it.label.toLowerCase().includes(typed)));
      // nothing useful to offer, or the word is already complete
      if (!items.length || (!explicit && items.length === 1 && items[0].label.toLowerCase() === typed)) return closeComplete();
      if (!popup) {
        popup = { el: document.createElement('div') };
        popup.el.className = 'ac';
        popup.el.addEventListener('mousedown', (e) => {
          e.preventDefault(); // keep focus in the editor
          const row = e.target.closest('.ac-it');
          if (row) acceptComplete(+row.dataset.i);
        });
        host.querySelector('.ed-main').append(popup.el);
      }
      Object.assign(popup, { from: res.from, items, sel: 0 });
      popup.el.innerHTML = items
        .slice(0, 200)
        .map((it, i) => `<div class="ac-it${i === 0 ? ' sel' : ''}" data-i="${i}"><span class="ac-k ac-${it.kind}">${it.kind[0].toUpperCase()}</span><span class="ac-l">${esc(it.label)}</span><span class="ac-d">${esc(it.detail || '')}</span></div>`)
        .join('');
      const xy = caretXY(res.from);
      const main = host.querySelector('.ed-main');
      popup.el.style.left = Math.max(0, Math.min(xy.x, main.clientWidth - 360)) + 'px';
      popup.el.style.top = (xy.y + 220 > main.clientHeight && xy.y > 240 ? xy.y - 19 - Math.min(220, items.length * 22 + 6) : xy.y + 2) + 'px';
    }
    function moveComplete(d) {
      const rows = popup.el.querySelectorAll('.ac-it');
      rows[popup.sel].classList.remove('sel');
      popup.sel = (popup.sel + d + rows.length) % rows.length;
      rows[popup.sel].classList.add('sel');
      rows[popup.sel].scrollIntoView({ block: 'nearest' });
    }
    function acceptComplete(i) {
      const it = popup.items[i];
      const from = popup.from;
      closeComplete();
      ta.focus();
      ta.setSelectionRange(from, ta.selectionStart);
      insert(it.insert != null ? it.insert : it.label);
      render();
      opts.onChange && opts.onChange(ta.value);
    }

    ta.addEventListener('keydown', (e) => {
      if (ta.readOnly) return;
      if (popup) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          return moveComplete(e.key === 'ArrowDown' ? 1 : -1);
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          return acceptComplete(popup.sel);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          return closeComplete();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') closeComplete();
      }
      if (opts.complete && e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        return showComplete(true);
      }
      const v = ta.value;
      const s = ta.selectionStart;
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          const m = v.slice(lineStart).match(/^ {1,4}/);
          if (m) {
            ta.setSelectionRange(lineStart, lineStart + m[0].length);
            insert('');
            ta.setSelectionRange(Math.max(lineStart, s - m[0].length), Math.max(lineStart, s - m[0].length));
          }
        } else insert('    ');
      } else if (e.key === 'Enter' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const line = v.slice(lineStart, s);
        let indent = line.match(/^\s*/)[0];
        if (/[{(]\s*$/.test(line)) indent += '    ';
        insert('\n' + indent);
      } else if (e.key === '}' ) {
        const line = v.slice(lineStart, s);
        if (/^ {4,}$/.test(line)) {
          e.preventDefault();
          ta.setSelectionRange(s - 4, s);
          insert('}');
        }
      }
    });

    function cursorPos() {
      const before = ta.value.slice(0, ta.selectionStart).split('\n');
      return { line: before.length, col: before[before.length - 1].length + 1 };
    }

    const api = {
      get value() {
        return ta.value;
      },
      set value(v) {
        if (ta.value !== v) {
          ta.value = v;
          render();
        }
      },
      textarea: ta,
      focus: () => ta.focus(),
      /** Insert text at the caret (on its own lines), keeping native undo. */
      insertBlock(text) {
        ta.focus();
        const v = ta.value;
        const s = ta.selectionStart;
        const lineStart = v.lastIndexOf('\n', s - 1) + 1;
        const atLineStart = v.slice(lineStart, s).trim() === '';
        const indent = v.slice(lineStart, s).match(/^[ \t]*/)[0];
        let block = text.replace(/\n/g, '\n' + indent);
        if (!atLineStart) block = '\n' + indent + block;
        ta.setSelectionRange(atLineStart ? lineStart + indent.length : s, ta.selectionEnd);
        insert(block + '\n' + indent);
        render();
        opts.onChange && opts.onChange(ta.value);
      },
      refresh: render,
      /** Select a range and scroll it into view. */
      select(start, end) {
        ta.focus();
        ta.setSelectionRange(start, end == null ? start : end);
        const line = ta.value.slice(0, start).split('\n').length;
        const lh = parseFloat(getComputedStyle(ta).lineHeight) || 19;
        ta.scrollTop = Math.max(0, (line - 5) * lh);
        sync();
      },
    };
    render();
    return api;
  };
})();
