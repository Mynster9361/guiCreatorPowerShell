<#
.SYNOPSIS
    Runs a GUI Creator script against real GliderUI: shows the window, checks every control, closes it.
.DESCRIPTION
    Copies the script, replaces the final "$form.WaitForClosed()" with a check that every variable
    created with FindControl() exists, then closes the window. Needs Windows (or a desktop session),
    PowerShell 7.4+ and GliderUI installed. A window appears for about -Seconds seconds.

    Use -KeepOpen to leave the window open (with the normal WaitForClosed) so another process can
    drive it with tests/tools/UIAutomation.psm1; the call then returns when the window is closed.
.PARAMETER Path
    The generated .ps1 (exported from GUI Creator or written by tests/build-test-scripts.mjs).
.PARAMETER Seconds
    How long the window stays open before it is checked and closed.
.PARAMETER Prepend
    PowerShell code inserted at the start of the startup form's Script region, e.g. mock functions
    for external cmdlets (Connect-ExchangeOnline, ...) so tests never touch real services.
.EXAMPLE
    ./tests/tools/Test-GeneratedScript.ps1 -Path ./examples/ExchangeOnlineAccessControl.ps1 -Prepend (Get-Content ./mocks.ps1 -Raw)
.OUTPUTS
    One line "OK: window shown, N controls found" or "MISSING CONTROLS: ...", plus any errors; exit code of the script.
#>
#Requires -Version 7.4
[CmdletBinding()]
param (
    [Parameter(Mandatory)][string]$Path,
    [double]$Seconds = 1.5,
    [string]$Prepend,
    [switch]$KeepOpen
)
$ErrorActionPreference = 'Stop'
$text = Get-Content -LiteralPath $Path -Raw
$form = [regex]::Match($text, '(?m)^\$(\w+) = \[AvaloniaRuntimeXamlLoader\]').Groups[1].Value
if (-not $form) { throw "No startup form found in $Path (is it a GUI Creator script?)" }
$names = [regex]::Matches($text, '(?m)^\$(\w+)\s*= \$' + $form + '\.FindControl') | ForEach-Object { $_.Groups[1].Value }

if ($Prepend) {
    $marker = "#region Script - $form"
    $at = $text.IndexOf($marker)
    if ($at -lt 0) { throw "No '$marker' region found" }
    $lineEnd = $text.IndexOf("`n", $at)
    $text = $text.Substring(0, $lineEnd + 1) + $Prepend + "`n" + $text.Substring($lineEnd + 1)
}

if (-not $KeepOpen) {
    # Plain string building: in a -replace replacement "$_" would mean "the whole input".
    $check = @(
        "Start-Sleep -Milliseconds $([int]($Seconds * 1000))"
        '$__missing = @(foreach ($__n in @(' + (($names | ForEach-Object { "'$_'" }) -join ',') + ')) { if ($null -eq (Get-Variable $__n -ValueOnly -ErrorAction SilentlyContinue)) { $__n } })'
        'if ($__missing) { Write-Host "MISSING CONTROLS: $($__missing -join '', '')" } else { Write-Host "OK: window shown, ' + $names.Count + ' controls found" }'
        "`$$form.Close()"
        "`$$form.WaitForClosed()"
    ) -join "`n"
    $text = $text.Replace("`$$form.WaitForClosed()", $check)
}

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("gc-test-" + [guid]::NewGuid().ToString('n').Substring(0, 8) + '.ps1')
Set-Content -LiteralPath $tmp -Value $text -Encoding utf8
try {
    & (Get-Process -Id $PID).Path -NoProfile -NonInteractive -File $tmp
    $code = $LASTEXITCODE
} finally {
    Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
}
exit $code
