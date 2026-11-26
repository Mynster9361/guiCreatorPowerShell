---
name: publish-change
description: Finish a GUI Creator change properly - run all checks, regenerate the exported example, write meaningful commits (split by topic), push to main, watch CI and the GitHub Pages deploy, and confirm the live site at guicreator.mynster-it.dk serves the change. Use when the user asks to commit, push, publish or ship work in this repo.
---

# Check, commit, push and confirm the live site

Commit and push only when the user asks for it, or has asked for it in this line of work (they usually want changes published).

## 1. Checks (all must pass)

```bash
failed=; for f in js/*.js tests/*.mjs tests/tools/*.mjs; do node --check "$f" || failed="$failed $f"; done; [ -z "$failed" ] || { echo "SYNTAX ERRORS:$failed"; false; }
node tests/build-test-scripts.mjs "$TEMP/gc-out"
```
```powershell
$r = Invoke-Pester ./tests -PassThru -Output None; "$($r.PassedCount) passed, $($r.FailedCount) failed"
foreach ($p in './Start-GuiCreator.ps1', './snippets') { Invoke-ScriptAnalyzer -Path $p -Recurse -Severity Error }   # must be empty (same as CI)
```

- If `js/codegen.js`, `js/controls.js` or the Exchange example changed, run `node tests/tools/export-example.mjs` and include `examples/ExchangeOnlineAccessControl.ps1`.
- Runtime and UI changes also need the `verify-gui-runtime` / `test-designer-ui` evidence. CI cannot provide it.

## 2. Review what goes in

- `git status --short` and `git diff`. Commit only intended files. Look at the diff of files changed outside this session (the user edits too), so you don't sweep in surprises.
- Never commit secrets, the scratchpad or test output.

## 3. Commits

- One topic per commit. If one file mixes topics, stage exactly the right content, for example by writing the intended file content with `git hash-object -w --stdin` and `git update-index --cacheinfo`. Don't rely on hunk splitting when the changes are adjacent.
- Message format: an imperative subject of 72 characters or fewer; a body that explains **why**, **what** changed (bullets) and **how it was verified**; end with the `Co-Authored-By` attribution line from the harness.
- Pass the message with `git commit -F - <<'EOF' ... EOF` (quoted heredoc, so `$` and backticks stay literal).

## 4. Push and watch

Every push to `main` starts two workflows: `ci.yml` and `pages.yml`. Watch the runs **for the pushed commit**. Right after `git push`, GitHub may not have registered them yet, and `--limit 1` without `--commit` returns the previous commit's run, which has already succeeded.

```bash
git push
R=Mynster9361/guiCreatorPowerShell
SHA=$(git rev-parse HEAD)
run_id() {   # the run of workflow $1 for $SHA; waits up to 2 minutes for it to appear
  for i in $(seq 24); do
    id=$(gh run list --repo $R --workflow "$1" --commit "$SHA" --limit 1 --json databaseId --jq '.[0].databaseId')
    [ -n "$id" ] && { echo "$id"; return 0; }
    sleep 5
  done
  echo "no $1 run found for $SHA" >&2; return 1
}
CI=$(run_id ci.yml) && gh run watch "$CI" --repo $R --exit-status --interval 10; echo "CI exit: $?"
PAGES=$(run_id pages.yml) && gh run watch "$PAGES" --repo $R --exit-status --interval 10; echo "Pages exit: $?"
```

Both must end with exit 0. If one fails, read the log (`gh run view <id> --repo $R --log-failed`), fix the problem, and make a new commit. Never force-push `main`.

## 5. Confirm the live site

Even after the deploy job succeeds, the CDN can serve the old files for a minute or two. Fetch **a file the change touched** (for example `css/app.css`, `index.html` or `js/codegen.js`) and look for a string that only exists after the change. Retry for a bounded time:

```bash
FILE=js/app.js; NEEDLE='<string unique to the change>'
for i in $(seq 18); do
  curl -s "https://guicreator.mynster-it.dk/$FILE?nocache=$RANDOM" | grep -qF -- "$NEEDLE" && { echo "live (attempt $i)"; break; }
  [ "$i" = 18 ] && echo "NOT LIVE after 3 minutes"
  sleep 10
done
```

If a change only removes text, look for text that the change added nearby, or check that the removed string is gone.

## 6. Tell the user

Give the commit hash or hashes, what changed for them, how it was verified (with numbers: tests passed, scenarios), whether CI and Pages succeeded, and anything not verified.
