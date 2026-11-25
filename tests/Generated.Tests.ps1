#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }
<#
.SYNOPSIS
    Checks the PowerShell and XAML that GUI Creator generates.
.DESCRIPTION
    Runs tests/build-test-scripts.mjs (Node.js) to generate every example, a form with every
    control type and every Script-tab snippet, then verifies with the PowerShell parser that the
    scripts have no syntax errors and that the XAML is well-formed. GliderUI itself is not
    needed: the scripts are parsed, not run.
.EXAMPLE
    Invoke-Pester ./tests -Output Detailed
#>

BeforeDiscovery {
    $script:outDir = Join-Path ([IO.Path]::GetTempPath()) "GuiCreatorTests-$PID"
    $builder = Join-Path $PSScriptRoot 'build-test-scripts.mjs'
    $output = & node $builder $script:outDir 2>&1
    $script:buildExitCode = $LASTEXITCODE
    $script:buildOutput = $output -join [Environment]::NewLine
    $script:scripts = @(Get-ChildItem -Path $script:outDir -Filter *.ps1 -Recurse -ErrorAction SilentlyContinue |
            ForEach-Object { @{ Name = $_.FullName.Substring($script:outDir.Length + 1); Path = $_.FullName } })
    $script:xamlFiles = @(Get-ChildItem -Path $script:outDir -Filter *.xaml -Recurse -ErrorAction SilentlyContinue |
            ForEach-Object { @{ Name = $_.FullName.Substring($script:outDir.Length + 1); Path = $_.FullName } })
}

Describe 'Code generator' {
    It 'generates all test scripts without consistency errors' -TestCases @{ Code = $script:buildExitCode; Out = $script:buildOutput } {
        param ($Code, $Out)
        $Code | Should -Be 0 -Because $Out
    }
    It 'produced scripts to check' -TestCases @{ Count = $script:scripts.Count } {
        param ($Count)
        $Count | Should -BeGreaterThan 10
    }
}

Describe 'Generated script <Name>' -ForEach $script:scripts {
    It 'parses without errors' {
        $errors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile($Path, [ref]$null, [ref]$errors)
        ($errors | ForEach-Object { "line $($_.Extent.StartLineNumber): $($_.Message)" }) -join '; ' | Should -BeNullOrEmpty
    }
    It 'makes sure GliderUI and its server are installed before importing (default GliderUISetup)' {
        $text = Get-Content -LiteralPath $Path -Raw
        $text | Should -Match '(?m)^Initialize-GliderUI -Install\s*$'
        # the server must be installed before GliderUI is imported in this session
        $text.IndexOf('Install-GLIServer -Scope CurrentUser') | Should -BeLessThan $text.IndexOf('Import-Module $module.Path -ErrorAction Stop')
    }
    It 'loads the XAML and shows the window' {
        $text = Get-Content -LiteralPath $Path -Raw
        $text | Should -Match '\[AvaloniaRuntimeXamlLoader\]::Parse\('
        $text | Should -Match '\.WaitForClosed\(\)'
    }
}

Describe 'Generated XAML <Name>' -ForEach $script:xamlFiles {
    It 'is well-formed XML with a Window root' {
        $xml = [xml](Get-Content -LiteralPath $Path -Raw)
        $xml.DocumentElement.LocalName | Should -Be 'Window'
    }
    It 'gives every x:Name a unique value' {
        $xml = [xml](Get-Content -LiteralPath $Path -Raw)
        $names = @($xml.SelectNodes('//*[@*[local-name()="Name"]]') | ForEach-Object { $_.GetAttribute('Name', 'http://schemas.microsoft.com/winfx/2006/xaml') })
        ($names | Group-Object | Where-Object Count -GT 1).Name | Should -BeNullOrEmpty
    }
}

Describe 'Launcher script' {
    It 'Start-GuiCreator.ps1 parses without errors' {
        $errors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot '..' 'Start-GuiCreator.ps1'), [ref]$null, [ref]$errors)
        $errors | Should -BeNullOrEmpty
    }
    It 'the PowerShell test tools in tests/tools parse without errors' {
        foreach ($file in Get-ChildItem (Join-Path $PSScriptRoot 'tools') -Include *.ps1, *.psm1 -Recurse) {
            $errors = $null
            [void][System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$null, [ref]$errors)
            $errors | Should -BeNullOrEmpty -Because $file.Name
        }
    }
    It 'the exported example in examples/ parses and contains its design' {
        $file = Join-Path $PSScriptRoot '..' 'examples' 'ExchangeOnlineAccessControl.ps1'
        $errors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile($file, [ref]$null, [ref]$errors)
        $errors | Should -BeNullOrEmpty
        Get-Content -LiteralPath $file -Raw | Should -Match 'GUICREATOR-PROJECT'
    }
}

AfterAll {
    Remove-Item -LiteralPath (Join-Path ([IO.Path]::GetTempPath()) "GuiCreatorTests-$PID") -Recurse -Force -ErrorAction SilentlyContinue
}
