/* GUI Creator - GliderUI examples rebuilt as designer projects.
 * Ported from https://github.com/mdgrs-mei/GliderUI/tree/main/examples
 * (MIT License, Copyright (c) 2026 mdgrs-mei). The original scripts build the
 * window in code with StackPanels/Grids; here the same layouts are placed on the
 * designer canvas and the logic lives in the Script tab. */
(function () {
  'use strict';
  const GC = (window.GC = window.GC || {});
  let nid = 1;

  /** Create a control with all property defaults filled in. */
  function ctl(type, name, x, y, w, h, props, opts) {
    const t = GC.TYPES[type];
    const n = { id: 'c' + nid++, type, name, x, y, w, h, props: {}, events: {} };
    GC.propsFor(type).forEach((p) => (n.props[p.key] = p.def));
    Object.assign(n.props, t.preset || {}, props || {});
    opts = opts || {};
    if (opts.events) n.events = opts.events;
    if (t.container) {
      n.slots = opts.slots || [opts.children || []];
      n.activeSlot = 0;
    }
    return n;
  }

  function project(formName, formProps, children, script, formEvents) {
    const p = { version: 1, nextId: 0, form: { id: 'form', type: 'Window', name: formName, x: 0, y: 0, props: {}, events: formEvents || {}, slots: [children] }, menu: null, script };
    GC.FORM_PROPS.forEach((x) => (p.form.props[x.key] = x.def));
    Object.assign(p.form.props, formProps);
    p.nextId = nid;
    return p;
  }

  const credit = (file) =>
    `# Based on GliderUI's examples/${file}.ps1 (MIT License, Copyright (c) 2026 mdgrs-mei)\n# https://github.com/mdgrs-mei/GliderUI/blob/main/examples/${file}.ps1\n`;

  /** Wrap a builder so every example starts numbering ids from 1. */
  const ex = (name, file, tag, description, build) => ({
    name, file, tag, description,
    build: () => {
      nid = 1;
      return build();
    },
  });

  /** Combine single-form projects into one multi-form project (first = startup form). */
  const multi = (...forms) => ({
    version: 2,
    nextId: nid,
    active: 0,
    forms: forms.map((p, i) => ({ uid: 'f' + (i + 1), form: p.form, menu: p.menu, script: p.script })),
  });

  GC.EXAMPLES = [
    // ------------------------------------------------------------------ QuickStart
    ex('Quick Start', 'QuickStart', 'Click', 'A single button that changes its text when clicked.', () =>
      project('formHello', { Title: 'Hello from PowerShell!', Width: 400, Height: 200 }, [
        ctl('Button', 'button', 150, 84, 100, 32, { Content: 'Click Me' }, { events: { Click: 'button_Click' } }),
      ], credit('QuickStart') + String.raw`
$button_Click = {
    param ($argumentList, $s, $e)
    $button.Content = 'Clicked!'
}
`)
    ),

    // ------------------------------------------------------------------ BasicInput
    ex('Basic Input', 'BasicInput', 'Input controls', 'Toggle buttons, a check box, combo box, radio buttons, sliders and a NumericUpDown. Events are written to the console.', () =>
      project('formBasicInput', { Title: 'Basic Input', Width: 420, Height: 400 }, [
        ctl('ToggleButton', 'toggleButton', 32, 32, 140, 32, { Content: 'ToggleButton' }, { events: { IsCheckedChanged: 'toggleButton_IsCheckedChanged' } }),
        ctl('ToggleSwitch', 'toggleSwitch', 32, 80, 140, 32, {}, { events: { IsCheckedChanged: 'toggleSwitch_IsCheckedChanged' } }),
        ctl('CheckBox', 'checkBox', 32, 128, 140, 32, { Content: 'CheckBox' }, { events: { IsCheckedChanged: 'checkBox_IsCheckedChanged' } }),
        ctl('ComboBox', 'comboBox', 32, 176, 140, 32, { PlaceholderText: 'Placeholder', Items: 'Apple\nBanana\nOrange' }, { events: { SelectionChanged: 'comboBox_SelectionChanged' } }),
        ctl('GroupBox', 'radioButtonGroup', 32, 224, 140, 160, { Header: 'RadioButton' }, {
          children: [
            ctl('RadioButton', 'radioButton1', 0, 0, 110, 32, { Content: 'Option1', GroupName: 'Group', IsChecked: true }, { events: { IsCheckedChanged: 'radioButton_IsCheckedChanged' } }),
            ctl('RadioButton', 'radioButton2', 0, 40, 110, 32, { Content: 'Option2', GroupName: 'Group' }, { events: { IsCheckedChanged: 'radioButton_IsCheckedChanged' } }),
            ctl('RadioButton', 'radioButton3', 0, 80, 110, 32, { Content: 'Option3', GroupName: 'Group' }, { events: { IsCheckedChanged: 'radioButton_IsCheckedChanged' } }),
          ],
        }),
        ctl('Slider', 'horizontalSlider', 204, 32, 200, 32, {}, { events: { ValueChanged: 'horizontalSlider_ValueChanged' } }),
        ctl('Slider', 'verticalSlider', 204, 80, 40, 200, { Orientation: 'Vertical', TickPlacement: 'Outside', TickFrequency: 20 }, { events: { ValueChanged: 'verticalSlider_ValueChanged' } }),
        ctl('NumericUpDown', 'numericUpDown', 204, 296, 140, 32, { Value: 0 }, { events: { ValueChanged: 'numericUpDown_ValueChanged' } }),
      ], credit('BasicInput') + String.raw`
$toggleSwitch_IsCheckedChanged = {
    param ($argumentList, $s, $e)
    Write-Host "Toggled [$($toggleSwitch.IsChecked)]"
}

$toggleButton_IsCheckedChanged = {
    param ($argumentList, $s, $e)
    Write-Host "Toggled [$($toggleButton.IsChecked)]"
}

$checkBox_IsCheckedChanged = {
    param ($argumentList, $s, $e)
    Write-Host "Checked [$($checkBox.IsChecked)]"
}

$comboBox_SelectionChanged = {
    param ($argumentList, $s, $e)
    Write-Host "Selection changed to [$($comboBox.SelectedItem.Content)]"
}

# One handler shared by all three radio buttons; $s is the button that raised the event.
$radioButton_IsCheckedChanged = {
    param ($argumentList, $s, $e)
    if ($s.IsChecked) {
        Write-Host "Selection changed to [$($s.Content)]"
    }
}

$horizontalSlider_ValueChanged = {
    param ($argumentList, $s, $e)
    Write-Host "Slider value changed to [$($horizontalSlider.Value)]"
}

$verticalSlider_ValueChanged = {
    param ($argumentList, $s, $e)
    Write-Host "Slider value changed to [$($verticalSlider.Value)]"
}

$numericUpDown_ValueChanged = {
    param ($argumentList, $s, $e)
    Write-Host "NumericUpDown value changed to [$($numericUpDown.Value)]"
}
`)
    ),

    // ------------------------------------------------------------------ InstallDialog
    ex('Install Dialog', 'InstallDialog', 'Progress', 'A borderless upgrade dialog that fakes a download/install with a progress bar, including an indeterminate "restoring" phase.', () =>
      project('formInstall', { Title: '', Width: 420, Height: 300, CanMinimize: false, CanMaximize: false, Topmost: true, ExtendClientAreaToDecorationsHint: true }, [
        ctl('TextBlock', 'icon', 32, 60, 44, 44, { Text: '\u{1F4AB}', FontSize: 32 }),
        ctl('TextBlock', 'title', 84, 64, 300, 40, { Text: 'Upgrade PowerShell', FontSize: 28 }),
        ctl('TextBlock', 'bodyText', 32, 124, 356, 20, { Text: 'powershell 7.5.4 - macOS Tahoe Version 26.3.1' }),
        ctl('TextBlock', 'status', 32, 156, 356, 20, { Text: 'Ready to upgrade' }),
        ctl('ProgressBar', 'pb', 32, 196, 356, 8, {}),
        ctl('Button', 'button', 268, 236, 120, 32, { Content: 'Upgrade', Classes: 'accent' }, { events: { Click: 'button_Click' } }),
      ], credit('InstallDialog') + String.raw`
$script:pressToClose = $false

$button_Click = {
    param ($argumentList, $s, $e)
    if ($script:pressToClose) {
        $formInstall.Close()
        return
    }
    $button.IsEnabled = $false
    $status.Text = 'Downloading...'
    1..20 | ForEach-Object {
        $pb.Value = $_
        Start-Sleep -Milliseconds 100
    }

    $status.Text = 'Installing...'
    21..40 | ForEach-Object {
        $pb.Value = $_
        Start-Sleep -Milliseconds 100
    }

    $status.Text = 'Error!'
    Start-Sleep -Milliseconds 2000

    $status.Text = 'Restoring...'
    $pb.IsIndeterminate = $true
    Start-Sleep -Milliseconds 2000

    $status.Text = 'Installing...'
    $pb.IsIndeterminate = $false
    41..100 | ForEach-Object {
        $pb.Value = $_
        Start-Sleep -Milliseconds 50
    }

    $status.Text = '` + '\u{1F389}' + String.raw`Done!'

    $button.Content = 'Close'
    $script:pressToClose = $true
    $button.IsEnabled = $true
}
`)
    ),

    // ------------------------------------------------------------------ SignInForm
    ex('Sign-In Form', 'SignInForm', 'EventCallback', 'A login form. The Login handler is an [EventCallback] that disables the inputs while it runs.', () =>
      project('formSignIn', { Title: 'Hello from PowerShell!', Width: 420, Height: 420 }, [
        ctl('TextBlock', 'icon', 32, 32, 44, 44, { Text: '\u{1F30F}', FontSize: 32 }),
        ctl('TextBlock', 'title', 84, 38, 200, 32, { Text: 'Sign In', FontSize: 24 }),
        ctl('TextBlock', 'nameHeader', 32, 100, 356, 20, { Text: 'Account Name' }),
        ctl('TextBox', 'name', 32, 124, 356, 32, { Watermark: 'Your account name' }),
        ctl('TextBlock', 'passwordHeader', 32, 180, 356, 20, { Text: 'Password' }),
        ctl('TextBox', 'password', 32, 204, 356, 32, { Watermark: 'Your fake password', PasswordChar: '*' }),
        ctl('HyperlinkButton', 'forgotPassword', 32, 244, 170, 32, { Content: 'Forgot your password?', NavigateUri: 'https://github.com/' }),
        ctl('TextBlock', 'status', 32, 340, 220, 20, { Text: '' }),
        ctl('Button', 'button', 268, 334, 120, 32, { Content: 'Login', Classes: 'accent' }, { events: { Click: 'button_Click' } }),
      ], credit('SignInForm') + String.raw`
# An [EventCallback] instead of a plain script block lets you disable controls while the handler runs.
$button_Click = [EventCallback]@{
    ScriptBlock = {
        param ($argumentList, $s, $e)
        $status.Text = '{0} - Logging in...' -f $name.Text
        Start-Sleep -Milliseconds 3000
        $status.Text = 'Success!'
    }
    DisabledControlsWhileProcessing = @($button, $name, $password, $forgotPassword)
}
`)
    ),

    // ------------------------------------------------------------------ CancelLongRunningEventCallback
    ex('Cancel Long-Running Callback', 'CancelLongRunningEventCallback', 'Runspace pool', 'Start runs on a background runspace (RunspacePoolAsyncUI) so Cancel stays responsive.', () =>
      project('formCancel', { Title: 'Cancel Long-Running EventCallback', Width: 420, Height: 160 }, [
        ctl('ProgressBar', 'progressBar', 32, 28, 356, 8, {}),
        ctl('Button', 'startButton', 16, 60, 388, 32, { Content: 'Start', Classes: 'accent' }, { events: { Click: 'startButton_Click' } }),
        ctl('Button', 'cancelButton', 16, 108, 388, 32, { Content: 'Cancel', Classes: 'accent', IsEnabled: false }, { events: { Click: 'cancelButton_Click' } }),
      ], credit('CancelLongRunningEventCallback') + String.raw`
# Use a synchronized hashtable to store objects that are accessed from multiple runspaces.
$syncHash = [Hashtable]::Synchronized(@{})
$syncHash.progressBar = $progressBar
$syncHash.cancelButton = $cancelButton
$syncHash.isCancel = $false

# Runs in the main runspace ([GliderUI.EventCallbackRunspaceMode]::MainRunspaceAsyncUI is the default mode).
$cancelButton_Click = {
    param ($argumentList, $s, $e)
    $syncHash.isCancel = $true
}

# RunspacePoolAsyncUI runs the callback on a background thread, allowing the cancel button's callback to run in parallel.
$startButton_Click = [EventCallback]@{
    RunspaceMode = 'RunspacePoolAsyncUI'
    # Since runspace pool callbacks can run in parallel, disable the button to avoid being clicked multiple times.
    DisabledControlsWhileProcessing = $startButton
    # Pass objects via ArgumentList as runspace pool callbacks run in separate runspaces like ThreadJobs.
    ArgumentList = $syncHash
    ScriptBlock = {
        param ($syncHash)
        $syncHash.isCancel = $false
        $syncHash.cancelButton.IsEnabled = $true

        1..100 | ForEach-Object {
            if ($syncHash.isCancel) {
                $syncHash.progressBar.Value = 0
                return
            }
            # Properties of GliderUI objects are thread-safe and can be updated from any thread.
            $syncHash.progressBar.Value = $_
            # Do some long-running work.
            Start-Sleep -Milliseconds 20
        }

        $syncHash.cancelButton.IsEnabled = $false
    }
}
`)
    ),

    // ------------------------------------------------------------------ MultipleProgressBars
    ex('Multiple Progress Bars', 'MultipleProgressBars', 'Runspace pool', 'Three progress bars that run in parallel on a runspace pool, each with its own Pause/Resume button.', () => {
      const rows = [1, 2, 3].flatMap((i) => {
        const y = 16 + (i - 1) * 48;
        return [
          ctl('ProgressBar', 'progressBar' + i, 16, y + 12, 200, 8, {}),
          ctl('Button', 'startButton' + i, 232, y, 64, 32, { Content: 'Start' }, { events: { Click: 'startButton' + i + '_Click' } }),
          ctl('Button', 'pauseButton' + i, 312, y, 72, 32, { Content: 'Pause', IsEnabled: false }, { events: { Click: 'pauseButton' + i + '_Click' } }),
        ];
      });
      return project('formProgressBars', { Title: 'Multiple ProgressBars', Width: 400, Height: 160 }, rows, credit('MultipleProgressBars') + String.raw`
# This script runs in the global scope of each runspace in the runspace pool.
# Functions defined here become available in each runspace.
$runspaceInitializationScript = {
    function SetPause($SyncHash, $IsPaused) {
        $SyncHash.isPaused = $IsPaused
        if ($IsPaused) {
            $SyncHash.pauseButton.Content = 'Resume'
        } else {
            $SyncHash.pauseButton.Content = 'Pause'
        }
    }
}

# RunspaceCount defines the number of event callbacks that can run in parallel at a time.
Set-GLIRunspacePoolOption -RunspaceCount 3 -InitializationScript $runspaceInitializationScript

# Dot source the initialization script to make the functions available in the main runspace too.
. $runspaceInitializationScript

function New-ProgressSet($ProgressBar, $PauseButton) {
    $syncHash = [Hashtable]::Synchronized(@{})
    $syncHash.progressBar = $ProgressBar
    $syncHash.pauseButton = $PauseButton
    $syncHash.isPaused = $false
    $syncHash
}

function New-StartCallback($SyncHash, $StartButton) {
    [EventCallback]@{
        RunspaceMode = 'RunspacePoolAsyncUI'
        DisabledControlsWhileProcessing = $StartButton
        ArgumentList = $SyncHash
        ScriptBlock = {
            # This runs in the runspace pool.
            param ($SyncHash)
            SetPause $SyncHash $false
            $SyncHash.pauseButton.IsEnabled = $true

            1..100 | ForEach-Object {
                while ($SyncHash.isPaused) {
                    Start-Sleep -Milliseconds 20
                }
                $SyncHash.progressBar.Value = $_
                Start-Sleep -Milliseconds 20
            }

            $SyncHash.pauseButton.IsEnabled = $false
        }
    }
}

function New-PauseCallback($SyncHash) {
    [EventCallback]@{
        # This runs in the main runspace.
        ArgumentList = $SyncHash
        ScriptBlock = {
            param ($SyncHash)
            SetPause $SyncHash (-not $SyncHash.isPaused)
        }
    }
}

$syncHash1 = New-ProgressSet $progressBar1 $pauseButton1
$syncHash2 = New-ProgressSet $progressBar2 $pauseButton2
$syncHash3 = New-ProgressSet $progressBar3 $pauseButton3
$syncHashList = @($syncHash1, $syncHash2, $syncHash3)

$startButton1_Click = New-StartCallback $syncHash1 $startButton1
$startButton2_Click = New-StartCallback $syncHash2 $startButton2
$startButton3_Click = New-StartCallback $syncHash3 $startButton3
$pauseButton1_Click = New-PauseCallback $syncHash1
$pauseButton2_Click = New-PauseCallback $syncHash2
$pauseButton3_Click = New-PauseCallback $syncHash3

# WaitForClosed() waits until all the event callbacks associated with the window finish,
# so clear the pause state to let paused callbacks complete.
$formProgressBars_Closed = {
    param ($argumentList, $s, $e)
    foreach ($syncHash in $script:syncHashList) {
        SetPause $syncHash $false
    }
}
`, { Closed: 'formProgressBars_Closed' });
    }),

    // ------------------------------------------------------------------ StorageProvider
    ex('Storage Provider (file pickers)', 'StorageProvider', 'Dialogs', 'Open-file, multi-file, save-file and folder pickers through the window\'s StorageProvider.', () => {
      const rows = [
        ['textBox0', 'button0', 'Pick Single File'],
        ['textBox1', 'button1', 'Pick Multiple Files'],
        ['textBox2', 'button2', 'Save File'],
        ['textBox3', 'button3', 'Pick Folder'],
      ].flatMap(([tb, b, label], i) => [
        ctl('TextBox', tb, 16, 16 + i * 48, 414, 32, { IsReadOnly: true }),
        ctl('Button', b, 434, 16 + i * 48, 150, 32, { Content: label }, { events: { Click: b + '_Click' } }),
      ]);
      return project('formStorage', { Title: 'Storage Provider', Width: 600, Height: 240 }, rows, credit('StorageProvider') + String.raw`
# Picker option types live in GliderUI.Avalonia.Platform.Storage.

# OpenFilePicker
$button0_Click = {
    param ($argumentList, $s, $e)
    $options = [GliderUI.Avalonia.Platform.Storage.FilePickerOpenOptions]::new()
    $options.Title = 'Pick Single File'

    $files = $formStorage.StorageProvider.OpenFilePickerAsync($options).WaitForCompleted()
    $textBox0.Text = $files.Path.AbsolutePath
}

$button1_Click = {
    param ($argumentList, $s, $e)
    $options = [GliderUI.Avalonia.Platform.Storage.FilePickerOpenOptions]::new()
    $options.Title = 'Pick Multiple Files'
    $options.AllowMultiple = $true

    $files = $formStorage.StorageProvider.OpenFilePickerAsync($options).WaitForCompleted()
    $textBox1.Text = $files.Path.AbsolutePath -join ';'
}

# SaveFilePicker
$button2_Click = {
    param ($argumentList, $s, $e)
    $options = [GliderUI.Avalonia.Platform.Storage.FilePickerSaveOptions]::new()
    $options.Title = 'Save File'
    $options.SuggestedFileName = 'DefaultFileName'
    $options.DefaultExtension = '.ps1'

    $file = $formStorage.StorageProvider.SaveFilePickerAsync($options).WaitForCompleted()
    $textBox2.Text = $file.Path.AbsolutePath
}

# FolderPicker
$button3_Click = {
    param ($argumentList, $s, $e)
    $options = [GliderUI.Avalonia.Platform.Storage.FolderPickerOpenOptions]::new()
    $options.Title = 'Pick Folder'

    $folder = $formStorage.StorageProvider.OpenFolderPickerAsync($options).WaitForCompleted()
    $textBox3.Text = $folder.Path.AbsolutePath
}
`);
    }),

    // ------------------------------------------------------------------ DataGrid
    ex('DataGrid (processes)', 'DataGrid', 'Data binding', 'Lists running processes in a sortable DataGrid bound to [DataSource] objects. Remove deletes the selected rows.', () =>
      project('formDataGrid', { Title: 'DataGrid', Width: 900, Height: 560 }, [
        ctl('DataGrid', 'dataGrid', 0, 0, 900, 516, {
          Columns: 'NPM(KB) | NPM | {0:F2}\nPM(MB) | PM | {0:F2}\nWS(MB) | WS | {0:F2}\nId | Id\nStartTime | StartTime\nProcessName | ProcessName',
          CanUserReorderColumns: true,
          CanUserResizeColumns: true,
          CanUserSortColumns: true,
        }),
        ctl('Button', 'button', 4, 524, 892, 32, { Content: 'Remove', Classes: 'accent' }, { events: { Click: 'button_Click' } }),
      ], credit('DataGrid') + String.raw`
# DataGrid does not support column sorting for DataSource types by default.
# You need to add DataSourcePropertyComparer for the sorting to work.
foreach ($col in $dataGrid.Columns) {
    $sortMemberPath = $col.SortMemberPath
    if ($sortMemberPath) {
        $col.CustomSortComparer = [DataSourcePropertyComparer]::new($sortMemberPath)
    }
}

# DataSource is the only type that supports data binding.
# Use ObservableCollection to reflect the item removal or addition to the UI (Two-way binding).
$sources = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
Get-Process | ForEach-Object {
    # DataSource supports dynamic property generation similar to PSCustomObject.
    $data = [DataSource]@{
        NPM = ($_.NPM / 1KB)
        PM = ($_.PM / 1MB)
        WS = ($_.WS / 1MB)
        Id = $_.Id
        SI = $_.SessionId.ToString()
        ProcessName = $_.ProcessName
        StartTime = if ($_.StartTime) { [GliderUI.System.DateTime]::new($_.StartTime.Ticks) } else { $null }
    }
    $sources.Add($data)
}
$dataGrid.ItemsSource = $sources

$button_Click = [EventCallback]@{
    # Disable double click to avoid confusion.
    DisabledControlsWhileProcessing = $button

    ScriptBlock = {
        $removedItems = [System.Collections.Generic.List[DataSource]]::new()
        foreach ($item in $dataGrid.SelectedItems) {
            $removedItems.Add($item)
        }

        foreach ($item in $removedItems) {
            $sources.Remove($item) | Out-Null
        }
    }
}
`)
    ),

    // ------------------------------------------------------------------ GUI Creator showcase: pages + dialog
    {
      name: 'Setup Wizard (pages + dialog)',
      file: 'GUI Creator',
      tag: 'Multi-form',
      description: 'A three-page wizard (Pages container, Set-Page / Get-Page) whose Advanced... button opens a second form as a modal dialog. See the Project panel.',
      build: () => {
        nid = 1;
        const wizard = project('formWizard', { Title: 'Setup Wizard', Width: 520, Height: 360, CanResize: false, CanMaximize: false }, [
          ctl('Pages', 'pagesWizard', 0, 0, 520, 296, { Pages: 'Welcome\nOptions\nSummary' }, {
            slots: [
              [
                ctl('TextBlock', 'labelWelcomeTitle', 24, 24, 472, 32, { Text: 'Welcome to the Setup Wizard', FontSize: 22, FontWeight: 'SemiBold' }),
                ctl('TextBlock', 'labelWelcomeText', 24, 72, 472, 120, {
                  Text: 'This example shows a multi-page window and a dialog form.\n\nUse Next and Back to move between pages. On the Options page, Advanced... opens a second form (formAdvanced) as a modal dialog and reads its values back.',
                  TextWrapping: 'Wrap',
                }),
              ],
              [
                ctl('TextBlock', 'labelFolder', 24, 24, 300, 20, { Text: 'Install folder' }),
                ctl('TextBox', 'textboxFolder', 24, 48, 472, 32, { Text: 'C:\\Tools\\MyApp' }),
                ctl('CheckBox', 'checkboxShortcut', 24, 96, 320, 32, { Content: 'Create a desktop shortcut', IsChecked: true }),
                ctl('CheckBox', 'checkboxUpdates', 24, 136, 320, 32, { Content: 'Check for updates automatically' }),
                ctl('Button', 'buttonAdvanced', 24, 192, 140, 32, { Content: 'Advanced...' }, { events: { Click: 'buttonAdvanced_Click' } }),
                ctl('TextBlock', 'labelAdvanced', 176, 198, 320, 20, { Text: '4 parallel downloads, Stable channel' }),
              ],
              [
                ctl('TextBlock', 'labelSummaryTitle', 24, 24, 472, 28, { Text: 'Ready to install', FontSize: 18, FontWeight: 'SemiBold' }),
                ctl('TextBlock', 'labelSummary', 24, 64, 472, 200, { Text: '', TextWrapping: 'Wrap' }),
              ],
            ],
          }),
          ctl('Button', 'buttonBack', 232, 312, 88, 32, { Content: 'Back', IsEnabled: false }, { events: { Click: 'buttonBack_Click' } }),
          ctl('Button', 'buttonNext', 328, 312, 88, 32, { Content: 'Next', Classes: 'accent' }, { events: { Click: 'buttonNext_Click' } }),
          ctl('Button', 'buttonCancel', 424, 312, 80, 32, { Content: 'Cancel' }, { events: { Click: 'buttonCancel_Click' } }),
        ], String.raw`# Settings returned by the Advanced dialog (formAdvanced in the Project panel)
$script:advanced = @{ Threads = 4; Channel = 0 }
$channels = @('Stable', 'Preview')

function Update-Wizard {
    $page = Get-Page $pagesWizard
    $buttonBack.IsEnabled = $page -gt 0
    $buttonNext.Content = if ($page -eq 2) { 'Install' } else { 'Next' }
    $labelAdvanced.Text = '{0} parallel downloads, {1} channel' -f $script:advanced.Threads, $channels[$script:advanced.Channel]
    if ($page -eq 2) {
        $labelSummary.Text = @(
            "Install folder:  $($textboxFolder.Text)"
            "Desktop shortcut:  $(if ($checkboxShortcut.IsChecked) { 'yes' } else { 'no' })"
            "Automatic updates:  $(if ($checkboxUpdates.IsChecked) { 'yes' } else { 'no' })"
            "Downloads:  $($labelAdvanced.Text)"
        ) -join [Environment]::NewLine
    }
}

$buttonNext_Click = {
    param ($argumentList, $s, $e)
    if ((Get-Page $pagesWizard) -eq 2) {
        $labelSummaryTitle.Text = 'Done! (nothing was really installed)'
        $buttonNext.IsEnabled = $false
        $buttonBack.IsEnabled = $false
        $buttonCancel.Content = 'Close'
        return
    }
    Set-Page $pagesWizard -Next
    Update-Wizard
}

$buttonBack_Click = {
    param ($argumentList, $s, $e)
    Set-Page $pagesWizard -Previous
    Update-Wizard
}

$buttonCancel_Click = {
    param ($argumentList, $s, $e)
    $formWizard.Close()
}

$buttonAdvanced_Click = {
    param ($argumentList, $s, $e)
    # Show the second form as a modal dialog, pre-filled with the current settings.
    $result = Show-formAdvanced -Owner $formWizard -Values @{
        numericThreads  = $script:advanced.Threads
        comboboxChannel = $script:advanced.Channel
    }
    if ($result.DialogResult -eq 'OK') {
        $script:advanced.Threads = [int]$result.numericThreads
        $script:advanced.Channel = $result.comboboxChannel
        Update-Wizard
    }
}
`);
        const advanced = project('formAdvanced', { Title: 'Advanced Options', Width: 360, Height: 230, CanResize: false, CanMinimize: false, CanMaximize: false, ShowInTaskbar: false }, [
          ctl('TextBlock', 'labelThreads', 16, 16, 200, 20, { Text: 'Parallel downloads' }),
          ctl('NumericUpDown', 'numericThreads', 16, 40, 140, 32, { Value: 4, Minimum: 1, Maximum: 16 }),
          ctl('TextBlock', 'labelChannel', 16, 88, 200, 20, { Text: 'Update channel' }),
          ctl('ComboBox', 'comboboxChannel', 16, 112, 200, 32, { Items: 'Stable\nPreview', SelectedIndex: 0 }),
          ctl('Button', 'buttonOK', 152, 182, 96, 32, { Content: 'OK', Classes: 'accent', IsDefault: true }, { events: { Click: 'buttonOK_Click' } }),
          ctl('Button', 'buttonCancel', 256, 182, 88, 32, { Content: 'Cancel', IsCancel: true }, { events: { Click: 'buttonCancel_Click' } }),
        ], String.raw`# This form is a dialog: formWizard opens it with Show-formAdvanced and reads
# numericThreads / comboboxChannel from the result after it closes.

$buttonOK_Click = {
    param ($argumentList, $s, $e)
    Close-Dialog 'OK'
}

$buttonCancel_Click = {
    param ($argumentList, $s, $e)
    Close-Dialog 'Cancel'
}
`);
        return multi(wizard, advanced);
      },
    },

    // ------------------------------------------------------------------ Exchange Online access control (real-world tool)
    {
      name: 'Exchange Online Access Control',
      file: 'ExchangeOnlineAccessRights',
      tag: 'Real-world',
      description: 'Check, give and remove Full Access, Send As, Send On Behalf and calendar permissions on Exchange Online mailboxes. Rebuilt from a WinForms tool.',
      build: () => {
        nid = 1;
        const RIGHTS = 'Reviewer\nEditor\nOwner\nAvailabilityOnly\nLimitedDetails\nAuthor\nContributor\nNonEditingAuthor\nPublishingEditor\nPublishingAuthor\nNone';
        const main = project('formExchangeAccess', { Title: 'Exchange Online Access Control', Width: 780, Height: 600, MinWidth: 700, MinHeight: 520 }, [
          ctl('TextBlock', 'labelTitle', 20, 16, 420, 32, { Text: 'Exchange Online Access Control', FontSize: 22, FontWeight: 'SemiBold' }),
          ctl('TextBlock', 'labelConnection', 20, 54, 560, 20, { Text: 'Not connected to Exchange Online', Anchor: 'Top, Left, Right' }),
          ctl('Button', 'buttonConnect', 640, 20, 120, 32, { Content: 'Connect', Classes: 'accent', Anchor: 'Top, Right' }, { events: { Click: 'buttonConnect_Click' } }),
          ctl('GroupBox', 'groupWho', 20, 84, 360, 200, { Header: 'Mailbox and person' }, {
            children: [
              ctl('TextBlock', 'labelMailbox', 0, 0, 330, 20, { Text: 'Mailbox whose permissions you change' }),
              ctl('TextBox', 'textboxMailbox', 0, 24, 330, 32, { Watermark: 'shared.mailbox@contoso.com' }),
              ctl('TextBlock', 'labelUser', 0, 72, 330, 20, { Text: 'Person to give or remove access for' }),
              ctl('TextBox', 'textboxUser', 0, 96, 330, 32, { Watermark: 'jane.doe@contoso.com' }),
            ],
          }),
          ctl('GroupBox', 'groupPermissions', 400, 84, 360, 200, { Header: 'Permissions', Anchor: 'Top, Left, Right' }, {
            children: [
              ctl('CheckBox', 'checkboxFullAccess', 0, 0, 150, 32, { Content: 'Full Access' }),
              ctl('CheckBox', 'checkboxAutoMap', 160, 0, 180, 32, { Content: 'Auto-map in Outlook', IsChecked: true }),
              ctl('CheckBox', 'checkboxSendAs', 0, 36, 150, 32, { Content: 'Send As' }),
              ctl('CheckBox', 'checkboxSendOnBehalf', 0, 72, 200, 32, { Content: 'Send On Behalf' }),
              ctl('CheckBox', 'checkboxCalendar', 0, 108, 140, 32, { Content: 'Calendar:' }),
              ctl('ComboBox', 'comboboxCalendarRights', 144, 108, 196, 32, { Items: RIGHTS, SelectedIndex: 0, Anchor: 'Top, Left, Right' }),
            ],
          }),
          ctl('Button', 'buttonCheck', 20, 296, 130, 32, { Content: 'Check Access', IsDefault: true }, { events: { Click: 'buttonCheck_Click' } }),
          ctl('Button', 'buttonGive', 158, 296, 130, 32, { Content: 'Give Access', Classes: 'accent' }, { events: { Click: 'buttonGive_Click' } }),
          ctl('Button', 'buttonRemove', 296, 296, 130, 32, { Content: 'Remove Access' }, { events: { Click: 'buttonRemove_Click' } }),
          ctl('HyperlinkButton', 'linkPermissionHelp', 520, 296, 240, 32, {
            Content: 'About calendar permission levels',
            NavigateUri: 'https://learn.microsoft.com/powershell/module/exchange/add-mailboxfolderpermission#-accessrights',
            Anchor: 'Top, Right',
          }),
          ctl('TextBlock', 'labelResults', 20, 344, 200, 20, { Text: 'Results', FontWeight: 'SemiBold' }),
          ctl('Button', 'buttonSaveReport', 568, 338, 96, 28, { Content: 'Save...', Anchor: 'Top, Right' }, { events: { Click: 'buttonSaveReport_Click' } }),
          ctl('Button', 'buttonClear', 672, 338, 88, 28, { Content: 'Clear', Anchor: 'Top, Right' }, { events: { Click: 'buttonClear_Click' } }),
          ctl('TextBox', 'textboxResults', 20, 372, 740, 164, {
            IsReadOnly: true, AcceptsReturn: true, FontFamily: 'Cascadia Mono, Consolas, monospace', FontSize: 12,
            Watermark: 'Check, give or remove access to see the permissions and the commands that were used.',
            Anchor: 'Top, Bottom, Left, Right',
          }),
          ctl('TextBlock', 'labelStatus', 20, 554, 600, 20, { Text: 'Ready', Anchor: 'Bottom, Left, Right' }),
          ctl('Button', 'buttonExit', 680, 548, 80, 32, { Content: 'Exit', Anchor: 'Bottom, Right' }, { events: { Click: 'buttonExit_Click' } }),
        ], String.raw`# Exchange Online Access Control
# Rebuilt for GliderUI from https://github.com/Mynster9361/PowerShell/tree/main/GUI/Set%20calendar%20and%20mailbox%20permissions
# Requires the ExchangeOnlineManagement module (v3); the Connect button offers to install it.

$nl = [Environment]::NewLine
$script:calendarRights = @('Reviewer', 'Editor', 'Owner', 'AvailabilityOnly', 'LimitedDetails', 'Author', 'Contributor',
    'NonEditingAuthor', 'PublishingEditor', 'PublishingAuthor', 'None')
$script:busyControls = @($buttonConnect, $buttonCheck, $buttonGive, $buttonRemove)

#region Helpers
function Set-Status([string]$Text, [ValidateSet('Info', 'Ok', 'Error')][string]$Kind = 'Info') {
    $labelStatus.Text = $Text
    $color = switch ($Kind) { 'Ok' { [Colors]::SeaGreen } 'Error' { [Colors]::IndianRed } default { [Colors]::Gray } }
    $labelStatus.Foreground = [SolidColorBrush]::new($color, 1)
}

function Get-CleanText([string]$Text) { ($Text -replace '\s+', ' ').Trim() }

# Does this PowerShell have a console window? (WAM sign-in needs one as parent window.)
function Test-ConsoleWindow {
    if (-not $IsWindows) { return $true }
    if (-not ('GuiCreator.ConsoleWindow' -as [type])) {
        Add-Type -Namespace GuiCreator -Name ConsoleWindow -MemberDefinition '[DllImport("kernel32.dll")] public static extern System.IntPtr GetConsoleWindow();'
    }
    [GuiCreator.ConsoleWindow]::GetConsoleWindow() -ne [IntPtr]::Zero
}

function Test-ExoConnection {
    if (-not (Get-Command Get-ConnectionInformation -ErrorAction SilentlyContinue)) { return $false }
    [bool](Get-ConnectionInformation -ErrorAction SilentlyContinue | Where-Object State -EQ 'Connected')
}

function Update-ConnectionStatus {
    $info = if (Test-ExoConnection) { Get-ConnectionInformation | Where-Object State -EQ 'Connected' | Select-Object -First 1 }
    if ($info) {
        $labelConnection.Text = 'Connected as {0} (tenant {1})' -f $info.UserPrincipalName, $info.TenantID
        $buttonConnect.Content = 'Reconnect'
    } else {
        $labelConnection.Text = 'Not connected to Exchange Online'
        $buttonConnect.Content = 'Connect'
    }
}

# Reads and validates the two text boxes.
function Get-Input([switch]$NeedUser) {
    $mailbox = Get-CleanText $textboxMailbox.Text
    $user = Get-CleanText $textboxUser.Text
    if (-not $mailbox) { throw 'Enter the mailbox first.' }
    if ($NeedUser -and -not $user) { throw 'Enter the person who should get or lose access.' }
    if (-not (Test-ExoConnection)) { throw 'Not connected to Exchange Online. Click Connect first.' }
    [pscustomobject]@{ Mailbox = $mailbox; User = $user }
}

# "mailbox:\Calendar" - the folder name depends on the mailbox language, so look it up.
function Get-CalendarIdentity([string]$Mailbox) {
    $folder = Get-EXOMailboxFolderStatistics -Identity $Mailbox -FolderScope Calendar -ErrorAction Stop |
        Where-Object FolderType -EQ 'Calendar' | Select-Object -First 1
    if (-not $folder) { throw "No calendar folder found for $Mailbox." }
    '{0}:\{1}' -f $Mailbox, $folder.Name
}

function Format-Section([string]$Title, $Rows) {
    $body = if ($Rows) { ($Rows | Format-Table -AutoSize | Out-String -Width 200).Trim() } else { '(none)' }
    $Title + $nl + $body + $nl
}

function Get-AccessReport([string]$Mailbox) {
    $calendar = Get-CalendarIdentity $Mailbox
    $sendOnBehalf = (Get-EXOMailbox -Identity $Mailbox -Properties GrantSendOnBehalfTo -ErrorAction Stop).GrantSendOnBehalfTo |
        ForEach-Object { [pscustomobject]@{ User = $_ } }
    @(
        Format-Section 'Full Access:' (Get-EXOMailboxPermission -Identity $Mailbox -ErrorAction Stop |
                Where-Object User -NE 'NT AUTHORITY\SELF' | Select-Object User, AccessRights)
        Format-Section 'Send As:' (Get-EXORecipientPermission -Identity $Mailbox -ErrorAction Stop |
                Where-Object Trustee -NE 'NT AUTHORITY\SELF' | Select-Object Trustee, AccessRights)
        Format-Section 'Send On Behalf:' $sendOnBehalf
        Format-Section "Calendar ($calendar):" (Get-EXOMailboxFolderPermission -Identity $calendar -ErrorAction Stop | Select-Object User, AccessRights)
    ) -join $nl
}

# Runs an Exchange cmdlet with splatted parameters (user input is never run as code)
# and records a readable version of the command for the report.
function Invoke-Logged([string]$Command, [hashtable]$Parameters) {
    $shown = foreach ($p in $Parameters.GetEnumerator() | Sort-Object Key) {
        $v = $p.Value
        if ($v -is [bool]) { ('-{0}:' -f $p.Key) + '$' + "$v".ToLower() }
        elseif ($v -is [hashtable]) { '-{0} @{{{1}}}' -f $p.Key, (($v.GetEnumerator() | ForEach-Object { "$($_.Key)='$($_.Value)'" }) -join '; ') }
        else { "-{0} '{1}'" -f $p.Key, ("$v" -replace "'", "''") }
    }
    $script:commandsRun.Add(($Command + ' ' + ($shown -join ' ')))
    & $Command @Parameters -ErrorAction Stop
}

function Show-Report([string]$Heading, [string[]]$Parts) {
    $textboxResults.Text = (@("=== $Heading  ($(Get-Date -Format 'yyyy-MM-dd HH:mm')) ===", '') + $Parts) -join $nl
}
#endregion

#region Actions
function Invoke-AccessChange([ValidateSet('Give', 'Remove')][string]$Mode) {
    $script:commandsRun = [System.Collections.Generic.List[string]]::new()
    try {
        $in = Get-Input -NeedUser
        $m = $in.Mailbox
        $u = $in.User
        $wanted = @(
            if ($checkboxFullAccess.IsChecked) { 'Full Access' }
            if ($checkboxSendAs.IsChecked) { 'Send As' }
            if ($checkboxSendOnBehalf.IsChecked) { 'Send On Behalf' }
            if ($checkboxCalendar.IsChecked) { 'Calendar' }
        )
        if (-not $wanted) { throw 'Tick at least one permission (Full Access, Send As, Send On Behalf or Calendar).' }
        $rights = $script:calendarRights[[Math]::Max(0, [int]$comboboxCalendarRights.SelectedIndex)]

        $what = $wanted -join ', '
        if ($Mode -eq 'Remove') {
            $question = "Remove $what for $u on $($m)?"
        } else {
            $question = "Give $u $what on $($m)?"
            if ($checkboxCalendar.IsChecked) { $question += "$($nl)Calendar permission: $rights" }
        }
        $answer = Show-formConfirm -Owner $formExchangeAccess -Values @{ labelMessage = $question }
        if ($answer.DialogResult -ne 'OK') { return Set-Status 'Cancelled.' }

        Set-Status "$Mode access: working..."
        $before = Get-AccessReport $m
        $calendar = if ($checkboxCalendar.IsChecked) { Get-CalendarIdentity $m }

        if ($Mode -eq 'Give') {
            if ($checkboxFullAccess.IsChecked) {
                Invoke-Logged 'Add-MailboxPermission' @{ Identity = $m; User = $u; AccessRights = 'FullAccess'; InheritanceType = 'All'; AutoMapping = [bool]$checkboxAutoMap.IsChecked; Confirm = $false } | Out-Null
            }
            if ($checkboxSendAs.IsChecked) {
                Invoke-Logged 'Add-RecipientPermission' @{ Identity = $m; Trustee = $u; AccessRights = 'SendAs'; Confirm = $false } | Out-Null
            }
            if ($checkboxSendOnBehalf.IsChecked) {
                Invoke-Logged 'Set-Mailbox' @{ Identity = $m; GrantSendOnBehalfTo = @{ Add = $u }; Confirm = $false } | Out-Null
            }
            if ($checkboxCalendar.IsChecked) {
                $existing = Get-EXOMailboxFolderPermission -Identity $calendar -User $u -ErrorAction SilentlyContinue
                $cmd = if ($existing) { 'Set-MailboxFolderPermission' } else { 'Add-MailboxFolderPermission' }
                Invoke-Logged $cmd @{ Identity = $calendar; User = $u; AccessRights = $rights; Confirm = $false } | Out-Null
            }
        } else {
            if ($checkboxFullAccess.IsChecked) {
                Invoke-Logged 'Remove-MailboxPermission' @{ Identity = $m; User = $u; AccessRights = 'FullAccess'; InheritanceType = 'All'; Confirm = $false } | Out-Null
            }
            if ($checkboxSendAs.IsChecked) {
                Invoke-Logged 'Remove-RecipientPermission' @{ Identity = $m; Trustee = $u; AccessRights = 'SendAs'; Confirm = $false } | Out-Null
            }
            if ($checkboxSendOnBehalf.IsChecked) {
                Invoke-Logged 'Set-Mailbox' @{ Identity = $m; GrantSendOnBehalfTo = @{ Remove = $u }; Confirm = $false } | Out-Null
            }
            if ($checkboxCalendar.IsChecked) {
                Invoke-Logged 'Remove-MailboxFolderPermission' @{ Identity = $calendar; User = $u; Confirm = $false } | Out-Null
            }
        }

        Show-Report "$Mode access: $u on $m" (@(
                'PERMISSIONS NOW', '---------------', (Get-AccessReport $m),
                'BEFORE THE CHANGE', '-----------------', $before,
                'COMMANDS USED', '-------------', 'Connect-ExchangeOnline') + $script:commandsRun)
        Set-Status "$Mode access: done ($what)." 'Ok'
    } catch {
        Set-Status $_.Exception.Message 'Error'
        if ($script:commandsRun.Count) {
            Show-Report "$Mode access FAILED" (@('Error: ' + $_.Exception.Message, '', 'Commands that ran before the error:') + $script:commandsRun)
        }
    }
}
#endregion

#region Event handlers
$buttonConnect_Click = [EventCallback]@{
    DisabledControlsWhileProcessing = $script:busyControls
    ScriptBlock = {
        param ($argumentList, $s, $e)
        try {
            if (-not (Get-Command Connect-ExchangeOnline -ErrorAction SilentlyContinue)) {
                if (-not (Get-Module -ListAvailable ExchangeOnlineManagement)) {
                    $answer = Show-formConfirm -Owner $formExchangeAccess -Values @{
                        labelMessage = "The ExchangeOnlineManagement module is not installed.$($nl)$($nl)Install it for your user account now?$($nl)(Install-Module ExchangeOnlineManagement -Scope CurrentUser)"
                    }
                    if ($answer.DialogResult -ne 'OK') { return Set-Status 'ExchangeOnlineManagement is required to continue.' 'Error' }
                    Set-Status 'Installing ExchangeOnlineManagement...'
                    Install-Module ExchangeOnlineManagement -Scope CurrentUser -Force -ErrorAction Stop
                }
                Import-Module ExchangeOnlineManagement -ErrorAction Stop
            }
            Set-Status 'Connecting... sign in with the window that opens.'
            # On Windows, sign-in uses WAM (the Windows account broker), which needs a console window
            # as its parent. Started without one (e.g. from a hidden shortcut), sign in through the
            # browser instead (-DisableWAM), and retry that way if WAM still asks for a window handle.
            $connectArgs = @{ ShowBanner = $false; ErrorAction = 'Stop' }
            $canDisableWam = (Get-Command Connect-ExchangeOnline).Parameters.ContainsKey('DisableWAM')
            if ($canDisableWam -and -not (Test-ConsoleWindow)) { $connectArgs.DisableWAM = $true }
            try {
                Connect-ExchangeOnline @connectArgs
            } catch {
                if (-not $canDisableWam -or $connectArgs.DisableWAM -or $_.Exception.Message -notmatch 'window handle') { throw }
                Set-Status 'Connecting... sign in with your browser.'
                Connect-ExchangeOnline @connectArgs -DisableWAM
            }
            Update-ConnectionStatus
            Set-Status 'Connected.' 'Ok'
        } catch {
            Update-ConnectionStatus
            Set-Status ('Connect failed: ' + $_.Exception.Message) 'Error'
        }
    }
}

$buttonCheck_Click = [EventCallback]@{
    DisabledControlsWhileProcessing = $script:busyControls
    ScriptBlock = {
        param ($argumentList, $s, $e)
        try {
            $in = Get-Input
            Set-Status "Reading permissions of $($in.Mailbox)..."
            Show-Report "Access on $($in.Mailbox)" @(Get-AccessReport $in.Mailbox)
            Set-Status 'Permissions loaded.' 'Ok'
        } catch {
            Set-Status $_.Exception.Message 'Error'
        }
    }
}

$buttonGive_Click = [EventCallback]@{
    DisabledControlsWhileProcessing = $script:busyControls
    ScriptBlock = { param ($argumentList, $s, $e) Invoke-AccessChange -Mode Give }
}

$buttonRemove_Click = [EventCallback]@{
    DisabledControlsWhileProcessing = $script:busyControls
    ScriptBlock = { param ($argumentList, $s, $e) Invoke-AccessChange -Mode Remove }
}

$buttonSaveReport_Click = {
    param ($argumentList, $s, $e)
    if (-not $textboxResults.Text) { return Set-Status 'Nothing to save yet.' 'Error' }
    $options = [GliderUI.Avalonia.Platform.Storage.FilePickerSaveOptions]::new()
    $options.Title = 'Save report'
    $options.SuggestedFileName = 'AccessRights {0}' -f (Get-Date -Format 'yyyy-MM-dd HHmm')
    $options.DefaultExtension = '.txt'
    $file = $formExchangeAccess.StorageProvider.SaveFilePickerAsync($options).WaitForCompleted()
    if ($file) {
        Set-Content -LiteralPath $file.Path.LocalPath -Value $textboxResults.Text -Encoding utf8
        Set-Status "Report saved to $($file.Path.LocalPath)" 'Ok'
    }
}

$buttonClear_Click = {
    param ($argumentList, $s, $e)
    $textboxResults.Text = ''
    Set-Status 'Ready'
}

$buttonExit_Click = {
    param ($argumentList, $s, $e)
    $formExchangeAccess.Close()
}

# Disconnect when the window closes (also when it is closed with X).
$formExchangeAccess_Closed = {
    param ($argumentList, $s, $e)
    if (Test-ExoConnection) { Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue }
}

$formExchangeAccess_Opened = {
    param ($argumentList, $s, $e)
    Update-ConnectionStatus
}
#endregion
`, { Closed: 'formExchangeAccess_Closed', Opened: 'formExchangeAccess_Opened' });

        const confirm = project('formConfirm', { Title: 'Please confirm', Width: 440, Height: 210, CanResize: false, CanMinimize: false, CanMaximize: false, ShowInTaskbar: false }, [
          ctl('TextBlock', 'labelMessage', 20, 20, 400, 110, { Text: 'Are you sure?', TextWrapping: 'Wrap' }),
          ctl('Button', 'buttonOK', 228, 158, 104, 32, { Content: 'Continue', Classes: 'accent', IsDefault: true }, { events: { Click: 'buttonOK_Click' } }),
          ctl('Button', 'buttonCancel', 340, 158, 80, 32, { Content: 'Cancel', IsCancel: true }, { events: { Click: 'buttonCancel_Click' } }),
        ], String.raw`# Confirmation dialog used by formExchangeAccess:
#     $answer = Show-formConfirm -Owner $formExchangeAccess -Values @{ labelMessage = 'Remove ...?' }
#     if ($answer.DialogResult -eq 'OK') { ... }

$buttonOK_Click = {
    param ($argumentList, $s, $e)
    Close-Dialog 'OK'
}

$buttonCancel_Click = {
    param ($argumentList, $s, $e)
    Close-Dialog 'Cancel'
}
`);
        return multi(main, confirm);
      },
    },
  ];
})();
