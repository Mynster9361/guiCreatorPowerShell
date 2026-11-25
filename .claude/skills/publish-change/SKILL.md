---
name: publish-change
description: Finish a GUI Creator change properly - run all checks, regenerate the exported example, write meaningful commits (split by topic), push to main, watch CI and the GitHub Pages deploy, and confirm the live site at guicreator.mynster-it.dk serves the change. Use when the user asks to commit, push, publish or ship work in this repo.
---

# Check, commit, push and confirm the live site

Commit and push only when the user asks for it, or has asked for it in this line of work (they usually want changes published).

## 1. Checks (all must pass)

```bash
for f in js/*.js tests/*.mjs tests/tools/*.mjs; do node --check "$f" || exit 1; done
node tests/build-test-scripts.mjs "$TEMP/gc-out"
```
```powershell
$r = Invoke-Pester ./tests -PassThru -Output None; "$($r.PassedCount) passed, $($r.FailedCount) failed"
Invoke-ScriptAnalyzer -Path ./Start-GuiCreator.ps1 -Severity Error      # must be empty
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

```bash
git push
RID=$(gh run list --repo Mynster9361/guiCreatorPowerShell --workflow ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $RID --repo Mynster9361/guiCreatorPowerShell --exit-status --interval 10
gh run list --repo Mynster9361/guiCreatorPowerShell --workflow pages.yml --limit 1
```

If CI fails, read the log (`gh run view <id> --log-failed`), fix the problem, and make a new commit. Never force-push `main`.

## 5. Confirm the live site

Pages takes 1–2 minutes after the deploy job. Check that a string unique to the change is served:

```bash
curl -s "https://guicreator.mynster-it.dk/js/app.js?nocache=$RANDOM" | grep -c "<unique string>"
```

## 6. Tell the user

Give the commit hash or hashes, what changed for them, how it was verified (with numbers: tests passed, scenarios), whether CI and Pages succeeded, and anything not verified.
