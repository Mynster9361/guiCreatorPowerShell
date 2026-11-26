---
name: verify-gui-runtime
description: Run GUI Creator generated scripts against real GliderUI on Windows and drive the window like a user (UI Automation) - show/close smoke tests, clicking buttons, typing, toggling, combo boxes, dialogs, mocked external cmdlets. Use whenever a change to code generation, examples, snippets or the launcher must be proven to work at run time (CI only parses scripts).
---

# Verify generated scripts at run time

CI checks syntax only. Anything that touches `js/codegen.js`, `js/controls.js`, `js/examples.js`, `js/snippets.js` or `Start-GuiCreator.ps1` should be run for real on Windows with GliderUI installed. Windows will briefly appear on the developer's screen; that is expected.

## Smoke test: show, check every control, close

```powershell
node tests/build-test-scripts.mjs "$env:TEMP\gc-out"          # or export a design from the designer
./tests/tools/Test-GeneratedScript.ps1 -Path "$env:TEMP\gc-out\examples\BasicInput.ps1"
# -> OK: window shown, 11 controls found   (exit code = the script's)
```

- Run it for every example and `all-controls.ps1` after generator changes (a loop over `*.ps1`).
- `-Prepend (Get-Content mocks.ps1 -Raw)` injects mock functions at the start of the startup form's script. Use this for every external dependency (`Connect-ExchangeOnline`, `Get-EXO*`, `Connect-MgGraph`, AD, …). Mocks should use `[CmdletBinding()]` with the real parameter names (plus `SupportsShouldProcess` when the script passes `-Confirm`), keep in-memory state, and `Write-Host "MOCK ..."` their calls so you can assert them.

## Drive the window like a user

Start the script with `-KeepOpen` as a separate process, then drive it from **Windows PowerShell 5.1**, which has the UI Automation assemblies. With `-KeepOpen` nothing closes the window except the driver, so the driver closes it in `finally`. If the run is still alive after that, kill its whole process tree. That tree is the test `pwsh`, the generated script's `pwsh` and the GliderUI server it started. Killing by this PID never touches the developer's own GliderUI windows.

```powershell
$out = Join-Path $env:TEMP "gc-ui-$PID.log"
$run = Start-Process pwsh -PassThru -RedirectStandardOutput $out -ArgumentList '-NoProfile', '-File',
    "$PWD\tests\tools\Test-GeneratedScript.ps1", '-Path', $script, '-KeepOpen'
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command @'
Import-Module ./tests/tools/UIAutomation.psm1
$w = $null
try {
    $w = Get-UIWindow 'Window Title'
    Set-UIText $w 0 'shared@contoso.com'          # Nth TextBox
    Switch-UIToggle $w 'Full Access'              # CheckBox / ToggleSwitch by its text
    Select-UIComboItem $w 0 'Editor'
    Invoke-UIButton $w 'Give Access'
    $d = Get-UIWindow 'Please confirm'; Invoke-UIButton $d 'Continue'   # dialogs are separate windows
    Get-UILabels $w; Get-UIText $w 2
} finally {
    if ($w) { Close-UIWindow $w }
}
'@
if (-not $run.WaitForExit(30000)) { $run.Kill($true); 'TIMEOUT: killed the test process tree' }
Get-Content $out; Remove-Item $out
```

- If the run had to be killed, `Test-GeneratedScript`'s `finally` did not run, so its copy `%TEMP%\gc-test-<id>.ps1` is left behind. Remove `gc-test-*.ps1` files that no running process uses.
- If the startup window never appeared (`Get-UIWindow` threw), `$w` is `$null`, so the kill above is what ends the run.

## Rules learned the hard way

- **Main-runspace callbacks only run inside `WaitForClosed()`.** A harness that sleeps before it reaches `WaitForClosed()` makes handlers look broken. `Test-GeneratedScript` handles this; with `-KeepOpen` the real loop runs.
- **Don't raise events from PowerShell.** Raising Avalonia events with `RaiseEvent` and client-made event args crashes the GliderUI server. Use UI Automation.
- **The first GliderUI start can take more than 10 seconds.** `Get-UIWindow` waits 30 s.
- Simulating "GliderUI / server not installed":
  - **Never uninstall.** Move `Documents\PowerShell\Modules\<module>` aside into a temp folder and move it back afterwards, checking the result with `Get-Module -ListAvailable`.
  - Or start the process with a `PSModulePath` that links (junction) only some modules. Note that a new `pwsh` re-adds the user module path itself.
- **Sign-in (WAM)** needs a console window. Test processes started with `CreateNoWindow` have none, so start them from a real console when that matters: `Start-Process pwsh -WindowStyle Minimized`.
- **Clean up only what you started.** Check `Get-Process GliderUI*` and each process's parent. The developer may have GliderUI windows open from VS Code; leave those alone.
- **Never sign in to a real Microsoft 365 tenant, AD or another service.** Ask the user to do the final real sign-in.

## Report

Say what ran (each scenario), how (mocks, real console or not), the results, and what was not tested in real life, such as real sign-in or the file pickers.
