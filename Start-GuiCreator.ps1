<#
.SYNOPSIS
    Starts GUI Creator on http://localhost and lets it run your designs with pwsh (F5).

.DESCRIPTION
    Serves the GUI Creator web page from this folder and adds a small local API so the
    designer can run the generated script, stream its output and stop it.

    Security:
      * Listens on localhost only.
      * Every API call must carry a random token that is generated at start-up and only
        embedded in the page this server serves (other web sites cannot read it).
      * Requests whose Host header is not localhost are rejected (DNS rebinding protection).
    Anyone who can run code as you on this machine could still call it, as with any local tool.

.PARAMETER Port
    First port to try (default 8765). The next free port is used if it is taken.

.PARAMETER NoBrowser
    Do not open the default browser.

.EXAMPLE
    pwsh -File .\Start-GuiCreator.ps1
#>
#Requires -Version 7.4
[CmdletBinding()]
param (
    [int]$Port = 8765,
    [switch]$NoBrowser
)

# Everything runs in its own scope: dot-sourcing the script (". .\Start-GuiCreator.ps1", which is
# how the VS Code PowerShell extension runs a file with F5) must not leave $ErrorActionPreference,
# the helper functions or the security token behind in the caller's session.
& {
    $ErrorActionPreference = 'Stop'
    $root = [IO.Path]::GetFullPath($PSScriptRoot)
    $token = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).ToLowerInvariant()
    $runDir = Join-Path ([IO.Path]::GetTempPath()) "GuiCreatorRuns-$PID"
    $pwshPath = (Get-Process -Id $PID).Path
    $maxBody = 10MB
    $state = @{ run = $null } # current script run (shared by the functions below)

    # Can designs run here? GliderUI starts its own server process for every script it runs, so the
    # server is never running beforehand; what matters is that the GliderUI module and the server
    # package of the *same version* (Install-GLIServer) are installed. Checked on every request
    # (~25 ms), so installing them while GUI Creator is open is picked up without a restart.
    function Get-RunnerInfo {
        $module = Get-Module -ListAvailable -Name GliderUI | Sort-Object Version -Descending | Select-Object -First 1
        $server = if ($module) {
            Get-Module -ListAvailable -Name 'GliderUI.Server.*' | Where-Object Version -EQ $module.Version | Select-Object -First 1
        }
        $problem = if (-not $module) {
            'GliderUI is not installed. Run: Install-PSResource -Name GliderUI; Install-GLIServer'
        } elseif (-not $server) {
            "The GliderUI server for GliderUI $($module.Version) is not installed. Run: Install-GLIServer"
        }
        [ordered]@{
            ok       = $true
            pwsh     = $PSVersionTable.PSVersion.ToString()
            gliderui = if ($module) { $module.Version.ToString() } else { $null }
            server   = if ($server) { $server.Name + ' ' + $server.Version } else { $null }
            ready    = -not $problem
            problem  = $problem
        }
    }

    $contentTypes = @{
        '.html' = 'text/html; charset=utf-8'
        '.css'  = 'text/css; charset=utf-8'
        '.js'   = 'text/javascript; charset=utf-8'
        '.json' = 'application/json; charset=utf-8'
        '.svg'  = 'image/svg+xml'
        '.png'  = 'image/png'
        '.ico'  = 'image/x-icon'
    }

    #region HTTP helpers
    function Send-Bytes($Context, [byte[]]$Bytes, [string]$ContentType, [int]$Status = 200) {
        $res = $Context.Response
        $res.StatusCode = $Status
        $res.ContentType = $ContentType
        $res.Headers['Cache-Control'] = 'no-store'
        $res.Headers['X-Content-Type-Options'] = 'nosniff'
        $res.ContentLength64 = $Bytes.Length
        $res.OutputStream.Write($Bytes, 0, $Bytes.Length)
        $res.Close()
    }
    function Send-Json($Context, $Object, [int]$Status = 200) {
        $json = ConvertTo-Json -InputObject $Object -Depth 5 -Compress
        Send-Bytes $Context ([Text.Encoding]::UTF8.GetBytes($json)) 'application/json; charset=utf-8' $Status
    }
    function Read-Body($Request) {
        if ($Request.ContentLength64 -gt $maxBody) { throw [InvalidOperationException]::new('Request too large') }
        $reader = [IO.StreamReader]::new($Request.InputStream, [Text.Encoding]::UTF8)
        try { $reader.ReadToEnd() } finally { $reader.Dispose() }
    }
    #endregion

    #region Script runs
    function Update-RunOutput {
        # Collects finished line reads without blocking (no threads or events needed).
        $r = $state.run
        if (-not $r) { return }
        foreach ($stream in 'out', 'err') {
            $reader = if ($stream -eq 'out') { $r.Process.StandardOutput } else { $r.Process.StandardError }
            while ($r[$stream] -and $r[$stream].IsCompleted) {
                $line = $null
                try { $line = $r[$stream].Result } catch { }
                if ($null -eq $line) { $r[$stream] = $null; break } # end of stream
                $r.Lines.Add(@{ s = $stream; t = $line })
                $r[$stream] = $reader.ReadLineAsync()
            }
        }
    }

    function Stop-Run {
        $r = $state.run
        if ($r -and -not $r.Process.HasExited) {
            try { $r.Process.Kill($true) } catch { }  # whole tree, including the GliderUI server
            $r.Process.WaitForExit(3000) | Out-Null
            Update-RunOutput
            $r.Lines.Add(@{ s = 'sys'; t = 'Stopped.' })
        }
    }

    function Start-Run([string]$Script) {
        Stop-Run
        $id = [guid]::NewGuid().ToString('n').Substring(0, 8)
        $file = Join-Path $runDir "run-$id.ps1"
        [IO.File]::WriteAllText($file, $Script, [Text.UTF8Encoding]::new($true))
        $command = "`$PSStyle.OutputRendering = 'PlainText'; [Console]::OutputEncoding = [Text.Encoding]::UTF8; & '$($file.Replace("'", "''"))'; exit (`$LASTEXITCODE ?? 0)"
        $psi = [Diagnostics.ProcessStartInfo]::new($pwshPath)
        foreach ($a in '-NoProfile', '-NoLogo', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', $command) { $psi.ArgumentList.Add($a) }
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.StandardOutputEncoding = [Text.Encoding]::UTF8
        $psi.StandardErrorEncoding = [Text.Encoding]::UTF8
        $psi.WorkingDirectory = $runDir
        $proc = [Diagnostics.Process]::Start($psi)
        $state.run = @{
            Id      = $id
            File    = $file
            Process = $proc
            Lines   = [Collections.Generic.List[object]]::new()
            out     = $proc.StandardOutput.ReadLineAsync()
            err     = $proc.StandardError.ReadLineAsync()
        }
        Write-Host "  run $id started (pid $($proc.Id))"
        $id
    }
    #endregion

    function Invoke-Request($Context) {
        $req = $Context.Request
        # DNS rebinding protection: only accept our own host name.
        if ($req.Headers['Host'] -notin @("localhost:$Port", "127.0.0.1:$Port")) {
            return Send-Json $Context @{ error = 'Forbidden host' } 403
        }
        $path = $req.Url.AbsolutePath

        if ($path.StartsWith('/api/')) {
            if ($req.Headers['X-GuiCreator-Token'] -ne $token) { return Send-Json $Context @{ error = 'Missing or wrong token' } 403 }
            switch ($path) {
                '/api/ping' { return Send-Json $Context (Get-RunnerInfo) }
                '/api/run' {
                    if ($req.HttpMethod -ne 'POST') { return Send-Json $Context @{ error = 'POST required' } 405 }
                    $body = Read-Body $req | ConvertFrom-Json
                    # Scripts generated with GliderUISetup = InstallIfMissing install GliderUI and its
                    # server themselves on first run, so only refuse scripts that cannot.
                    $runner = Get-RunnerInfo
                    if (-not $runner.ready -and -not $body.installsGliderUI) { return Send-Json $Context @{ error = $runner.problem } 409 }
                    if (-not $body.script) { return Send-Json $Context @{ error = 'No script' } 400 }
                    return Send-Json $Context @{ id = (Start-Run $body.script) }
                }
                '/api/output' {
                    Update-RunOutput
                    $r = $state.run
                    if (-not $r -or $r.Id -ne $req.QueryString['id']) { return Send-Json $Context @{ error = 'Unknown run' } 404 }
                    $from = [int]($req.QueryString['from'] ?? 0)
                    $exited = $r.Process.HasExited -and -not $r.out -and -not $r.err
                    $lines = @(if ($from -lt $r.Lines.Count) { $r.Lines.GetRange($from, $r.Lines.Count - $from) })
                    return Send-Json $Context ([ordered]@{
                            id       = $r.Id
                            running  = -not $exited
                            exitCode = if ($exited) { $r.Process.ExitCode } else { $null }
                            next     = $r.Lines.Count
                            lines    = $lines
                        })
                }
                '/api/stop' {
                    if ($req.HttpMethod -ne 'POST') { return Send-Json $Context @{ error = 'POST required' } 405 }
                    Stop-Run
                    return Send-Json $Context @{ ok = $true }
                }
                default { return Send-Json $Context @{ error = 'Not found' } 404 }
            }
        }

        # Static files from this folder only.
        $rel = [Uri]::UnescapeDataString($path.TrimStart('/'))
        if (-not $rel) { $rel = 'index.html' }
        $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
        $ext = [IO.Path]::GetExtension($full).ToLowerInvariant()
        if (-not $full.StartsWith($root + [IO.Path]::DirectorySeparatorChar) -or -not $contentTypes.ContainsKey($ext) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
            return Send-Bytes $Context ([Text.Encoding]::UTF8.GetBytes('Not found')) 'text/plain' 404
        }
        if ($rel -eq 'index.html') {
            $html = [IO.File]::ReadAllText($full).Replace('</head>', "  <meta name=`"gc-token`" content=`"$token`">`n</head>")
            return Send-Bytes $Context ([Text.Encoding]::UTF8.GetBytes($html)) $contentTypes[$ext]
        }
        Send-Bytes $Context ([IO.File]::ReadAllBytes($full)) $contentTypes[$ext]
    }

    # ---------------------------------------------------------------- start
    New-Item -ItemType Directory -Force -Path $runDir | Out-Null
    $listener = $null
    for ($p = $Port; $p -lt $Port + 20; $p++) {
        $candidate = [Net.HttpListener]::new()
        $candidate.Prefixes.Add("http://localhost:$p/")
        try {
            $candidate.Start()
            $listener = $candidate
            $Port = $p
            break
        } catch {
            $candidate.Close()
        }
    }
    if (-not $listener) { throw "No free port found between $Port and $($Port + 19)." }

    $url = "http://localhost:$Port/"
    Write-Host ''
    Write-Host "  GUI Creator is running at $url" -ForegroundColor Green
    $runnerInfo = Get-RunnerInfo
    Write-Host "  PowerShell $($runnerInfo.pwsh), GliderUI $(if ($runnerInfo.gliderui) { $runnerInfo.gliderui } else { 'not installed' }), server $(if ($runnerInfo.server) { $runnerInfo.server } else { 'not installed' })"
    if (-not $runnerInfo.ready) {
        Write-Host "  $($runnerInfo.problem)" -ForegroundColor Yellow
        Write-Host '  Designs with the default GliderUISetup (InstallIfMissing) install it on their first run; other designs cannot run until it is installed.' -ForegroundColor Yellow
    }
    Write-Host '  Press Ctrl+C to stop.'
    Write-Host ''
    if (-not $NoBrowser) {
        try { Start-Process $url } catch { Write-Host "  Open $url in your browser." }
    }

    $stopReason = 'stopped (Ctrl+C, or the terminal / editor stopped the script)'
    try {
        while ($listener.IsListening) {
            $pending = $listener.GetContextAsync()
            # Short waits keep Ctrl+C responsive and collect run output in the background.
            while (-not $pending.AsyncWaitHandle.WaitOne(200)) { Update-RunOutput }
            $context = $pending.GetAwaiter().GetResult()
            try {
                Invoke-Request $context
            } catch {
                Write-Host "  request failed: $_" -ForegroundColor Yellow
                try { Send-Json $context @{ error = "$_" } 500 } catch { }
            }
        }
    } catch {
        $stopReason = "stopped because of an error: $_"
        throw
    } finally {
        Stop-Run
        $listener.Close()
        Remove-Item -LiteralPath $runDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  GUI Creator $stopReason" -ForegroundColor $(if ($stopReason -like '*error*') { 'Red' } else { 'Gray' })
    }
}
