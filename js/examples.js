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

    // ------------------------------------------------------------------ GUI Creator showcase: Fluent2 dashboard
    // A complete app built only from toolbox controls and GliderUI 0.6 features checked in real windows:
    // Pages for the navigation, [DataSource] rows shared by several DataGrids, ListBox.Items, modal
    // dialogs (Show-<form>), the StorageProvider pickers, brushes from hex colours ([SolidColorBrush]::Parse)
    // and Segoe Fluent Icons through the FontFamily fallback "Segoe UI, Segoe Fluent Icons".
    ex('Project Dashboard (Fluent2)', 'ProjectDashboard', 'Fluent2 design', 'A complete Windows 11 style project app: navigation pages (home, projects, my tasks, calendar, team, reports), project tabs, task editing with dialogs, file links, notifications, CSV export and data saved between runs.', () => {
      const ICONS = 'Segoe UI, Segoe Fluent Icons';
      const grey = '#616161';
      const all = 'Top, Bottom, Left, Right';
      const none = { BorderBrush: '', BorderThickness: '' };
      const MEMBERS = 'Julien\nMax\nSteven\nNikita\nJumar';
      const STATUSES = 'Backlog\nIn progress\nIn review\nDone';
      const card = (name, x, y, w, h, children, extra) =>
        ctl('Border', name, x, y, w, h, Object.assign({ Background: '#FFFFFF', BorderBrush: '#E0E0E0', BorderThickness: '1', CornerRadius: '8' }, extra || {}), { children: children || [] });
      const text = (name, x, y, w, h, value, extra) => ctl('TextBlock', name, x, y, w, h, Object.assign({ Text: value }, extra || {}));
      const caption = (name, x, y, w, value, extra) => text(name, x, y, w, 18, value, Object.assign({ FontSize: 12, Foreground: grey }, extra || {}));
      const heading = (name, x, y, w, value, extra) => text(name, x, y, w, 24, value, Object.assign({ FontSize: 16, FontWeight: 'SemiBold' }, extra || {}));
      const pageTitle = (name, value, sub) => [text(name, 32, 24, 700, 40, value, { FontSize: 28, FontWeight: 'SemiBold' }), caption(name + 'Sub', 32, 66, 700, sub)];
      const button = (name, x, y, w, content, click, extra) => ctl('Button', name, x, y, w, 32, Object.assign({ Content: content }, extra || {}), click ? { events: { Click: click } } : undefined);
      const iconButton = (name, x, y, w, content, click, extra) => button(name, x, y, w, content, click, Object.assign({ FontFamily: ICONS }, extra || {}));
      const grid = (name, x, y, w, h, columns, extra, events) =>
        ctl('DataGrid', name, x, y, w, h, Object.assign({ Columns: columns, IsReadOnly: true, SelectionMode: 'Single', CanUserResizeColumns: true }, extra || {}), events ? { events } : undefined);
      const list = (name, x, y, w, h, extra, events) => ctl('ListBox', name, x, y, w, h, extra || {}, events ? { events } : undefined);
      const avatar = (name, x, y, size, letter, color, extra) =>
        ctl('Border', name, x, y, size, size, Object.assign({}, none, { Background: color, CornerRadius: String(size / 2) }, extra || {}), {
          children: [text(name + 'Letter', 0, Math.round(size / 2 - 9), size, 18, letter, Object.assign({ TextAlignment: 'Center', Foreground: '#FFFFFF', FontWeight: 'SemiBold', FontSize: size > 26 ? 13 : 10 }, letter.charCodeAt(0) >= 0xe000 ? { FontFamily: ICONS, FontWeight: 'Normal', FontSize: 12 } : {}))],
        });
      const stat = (name, x, y, w, title, sub, subColor) =>
        card(name, x, y, w, 100, [
          caption(name + 'Caption', 16, 14, w - 32, title),
          text(name + 'Value', 16, 32, w - 32, 36, '0', { FontSize: 28, FontWeight: 'SemiBold' }),
          caption(name + 'Sub', 16, 70, w - 20, sub, { Foreground: subColor || grey }),
        ]);
      const range = (n) => Array.from({ length: n }, (_, i) => i);

      // ---------------------------------------------------------------- page 0: Home
      const homePage = [
        caption('labelHomeDate', 32, 24, 400, ''),
        text('labelGreeting', 32, 42, 700, 40, 'Good day', { FontSize: 28, FontWeight: 'SemiBold' }),
        stat('cardHomeProjects', 32, 104, 226, 'Projects', 'pinned in the sidebar'),
        stat('cardHomeOpen', 276, 104, 226, 'Open tasks', 'across all projects'),
        stat('cardHomeWeek', 520, 104, 226, 'Due this week', 'not done yet'),
        stat('cardHomeOverdue', 764, 104, 226, 'Overdue', 'past their due date', '#C50F1F'),
        card('cardDueSoon', 32, 224, 600, 482, [
          heading('labelDueSoon', 16, 12, 400, 'Due in the next 7 days'),
          grid('gridDueSoon', 8, 48, 582, 424, 'Project | Project\nTask | Task\nDue | Due\nStatus | Status', { Anchor: all }, { DoubleTapped: 'openTask_DoubleTapped' }),
        ], { Anchor: all }),
        card('cardHomeActivity', 648, 224, 342, 482, [
          heading('labelHomeActivity', 16, 12, 300, 'Recent activity'),
          list('listHomeActivity', 4, 48, 332, 424, { FontSize: 13, Anchor: all }),
        ], { Anchor: 'Top, Bottom, Right' }),
      ];

      // ---------------------------------------------------------------- page 1: Projects (tabs)
      const overviewTab = [
        card('cardAbout', 0, 16, 658, 170, [
          heading('labelAbout', 16, 12, 400, 'About this project'),
          text('labelDescription', 16, 44, 624, 60, '', { TextWrapping: 'Wrap', Foreground: '#424242' }),
          caption('labelProjectStatusCaption', 16, 126, 50, 'Status'),
          ctl('ComboBox', 'comboProjectStatus', 70, 118, 150, 32, { Items: 'On track\nAt risk\nOff track' }, { events: { SelectionChanged: 'comboProjectStatus_SelectionChanged' } }),
          caption('labelProjectDue', 240, 126, 400, ''),
        ]),
        card('cardStatusBreakdown', 0, 202, 658, 196, [
          heading('labelBreakdown', 16, 12, 400, 'Tasks by status'),
          ...['Backlog', 'In progress', 'In review', 'Done'].flatMap((s, i) => [
            text('labelStatus' + i, 16, 50 + i * 34, 110, 20, s),
            ctl('ProgressBar', 'progressStatus' + i, 130, 52 + i * 34, 440, 16, {}),
            text('labelStatusCount' + i, 580, 50 + i * 34, 60, 20, '0', { TextAlignment: 'Right', FontWeight: 'SemiBold' }),
          ]),
        ]),
        card('cardUpcoming', 0, 414, 658, 171, [
          heading('labelUpcoming', 16, 12, 400, 'Next up'),
          list('listUpcoming', 4, 44, 648, 120, { FontSize: 13, Anchor: all }),
        ], { Anchor: 'Top, Bottom, Left' }),
        card('cardProjectTeam', 674, 16, 300, 569, [
          heading('labelProjectTeam', 16, 12, 260, 'Team'),
          list('listProjectTeam', 4, 44, 290, 516, { FontSize: 13, Anchor: all }),
        ], { Anchor: 'Top, Bottom, Right' }),
      ];
      const tasksTab = [
        stat('cardOpen', 0, 16, 156, 'Open tasks', ''),
        stat('cardDone', 168, 16, 156, 'Completed', '', '#0E700E'),
        stat('cardOverdue', 336, 16, 156, 'Overdue', '', '#C50F1F'),
        stat('cardHours', 504, 16, 156, 'Hours logged', ''),
        ctl('TextBox', 'textFilter', 0, 132, 240, 32, { Watermark: 'Filter tasks' }, { events: { TextChanged: 'filter_Changed' } }),
        ctl('CheckBox', 'checkShowCompleted', 256, 132, 176, 32, { Content: 'Show completed', IsChecked: true }, { events: { IsCheckedChanged: 'filter_Changed' } }),
        ctl('ComboBox', 'comboAssignee', 520, 132, 138, 32, { Items: 'All assignees\n' + MEMBERS, SelectedIndex: 0 }, { events: { SelectionChanged: 'filter_Changed' } }),
        grid('gridTasks', 0, 176, 658, 409, 'Task | Task\nAssignee | Assignee\nStatus | Status\nDue | Due\nProgress | Progress | {0:P0}', { Anchor: all }, { SelectionChanged: 'gridTasks_SelectionChanged' }),
        card('cardSprint', 674, 16, 300, 100, [
          heading('labelSprint', 16, 12, 150, 'Progress'),
          caption('labelSprintLeft', 166, 16, 116, '', { TextAlignment: 'Right' }),
          ctl('ProgressBar', 'progressSprint', 16, 44, 266, 16, { Value: 0 }),
          caption('labelSprintCount', 16, 68, 200, ''),
          text('labelSprintPercent', 222, 66, 60, 20, '0%', { TextAlignment: 'Right', FontWeight: 'SemiBold' }),
        ], { Anchor: 'Top, Right' }),
        ctl('GroupBox', 'groupDetails', 674, 132, 300, 453, { Header: 'Task details', Anchor: 'Top, Right' }, {
          children: [
            ctl('TextBox', 'textTaskName', 0, 0, 274, 32, { Watermark: 'Task name' }),
            ctl('ComboBox', 'comboStatus', 0, 44, 130, 32, { Items: STATUSES }),
            ctl('CalendarDatePicker', 'dateDue', 142, 44, 132, 32, {}),
            ctl('ComboBox', 'comboTaskAssignee', 0, 88, 274, 32, { Items: MEMBERS, PlaceholderText: 'Assignee' }),
            caption('labelPriority', 0, 132, 100, 'Priority'),
            ctl('RadioButton', 'radioLow', 0, 150, 70, 32, { Content: 'Low', GroupName: 'priority' }),
            ctl('RadioButton', 'radioMedium', 76, 150, 96, 32, { Content: 'Medium', GroupName: 'priority' }),
            ctl('RadioButton', 'radioHigh', 176, 150, 80, 32, { Content: 'High', GroupName: 'priority' }),
            caption('labelEstimate', 0, 194, 100, 'Estimate'),
            caption('labelEstimateValue', 194, 194, 80, '0 h', { TextAlignment: 'Right', Foreground: '#0F6CBD' }),
            ctl('Slider', 'sliderEstimate', 0, 210, 274, 32, { Minimum: 0, Maximum: 40, Value: 0, SmallChange: 1, LargeChange: 4, TickFrequency: 1, IsSnapToTickEnabled: true }, { events: { ValueChanged: 'sliderEstimate_ValueChanged' } }),
            caption('labelNotify', 0, 258, 200, 'Notify watchers on save'),
            ctl('ToggleSwitch', 'toggleNotify', 0, 276, 140, 32, { IsChecked: true }),
            button('buttonDelete', 0, 355, 80, 'Delete', 'buttonDelete_Click'),
            button('buttonCancel', 98, 355, 80, 'Cancel', 'buttonCancel_Click'),
            button('buttonSave', 186, 355, 88, 'Save', 'buttonSave_Click', { Classes: 'accent' }),
          ],
        }),
      ];
      const timelineTab = [
        ctl('CheckBox', 'checkTimelineHideDone', 0, 12, 180, 32, { Content: 'Hide completed' }, { events: { IsCheckedChanged: 'timeline_Changed' } }),
        caption('labelTimelineHint', 200, 19, 500, 'Sorted by due date. Double-click a task to edit it.'),
        grid('gridTimeline', 0, 56, 974, 529, 'Due | Due\nDays left | DaysLeft\nTask | Task\nAssignee | Assignee\nStatus | Status\nProgress | Progress | {0:P0}', { Anchor: all }, { DoubleTapped: 'openTask_DoubleTapped' }),
      ];
      const filesTab = [
        list('listFiles', 0, 16, 658, 569, { Anchor: all }, { DoubleTapped: 'buttonOpenFile_Click' }),
        iconButton('buttonAddFiles', 674, 16, 160, '\uE710  Add files...', 'buttonAddFiles_Click', { Anchor: 'Top, Right' }),
        iconButton('buttonOpenFile', 674, 56, 160, '\uE8E5  Open', 'buttonOpenFile_Click', { Anchor: 'Top, Right' }),
        iconButton('buttonRemoveFile', 674, 96, 160, '\uE74D  Remove', 'buttonRemoveFile_Click', { Anchor: 'Top, Right' }),
        caption('labelFilesHint', 674, 140, 300, 'Files are linked by their path, not copied.', { Anchor: 'Top, Right' }),
      ];
      const activityTab = [list('listActivity', 0, 16, 974, 569, { Anchor: all })];
      const tabs = ctl('TabControl', 'tabsProject', 24, 96, 974, 626, { Tabs: 'Overview\nTasks\nTimeline\nFiles\nActivity', SelectedIndex: 1, Anchor: all }, {
        // No SelectionChanged handler here: the DataGrid and ComboBoxes inside have one, and with handlers
        // on a container and on a control inside it, GliderUI 0.6 crashes (the event bubbles up).
        slots: [overviewTab, tasksTab, timelineTab, filesTab, activityTab],
      });
      tabs.activeSlot = 1;
      const projectsPage = [
        caption('labelBreadcrumb', 32, 24, 300, 'Projects'),
        text('labelTitle', 32, 42, 250, 40, 'Project', { FontSize: 28, FontWeight: 'SemiBold' }),
        ctl('Border', 'badgeStatus', 290, 54, 80, 22, Object.assign({}, none, { Background: '#DFF6DD', CornerRadius: '11' }), {
          children: [text('labelBadge', 0, 2, 80, 18, 'On track', { FontSize: 12, Foreground: '#0E700E', TextAlignment: 'Center' })],
        }),
        ...range(4).map((i) => avatar('avatarSlot' + i, 500 + i * 20, 52, 26, '?', '#0F6CBD', { BorderBrush: '#FBFBFB', BorderThickness: '2', Anchor: 'Top, Right' })),
        iconButton('buttonBell', 610, 49, 40, '\uEA8F', 'buttonBell_Click', { Anchor: 'Top, Right', ToolTip: 'Notifications' }),
        ctl('Border', 'badgeBell', 638, 42, 18, 18, Object.assign({}, none, { Background: '#C42B1C', CornerRadius: '9', Anchor: 'Top, Right' }), {
          children: [text('labelBellCount', 0, 1, 18, 16, '0', { FontSize: 10, Foreground: '#FFFFFF', TextAlignment: 'Center', FontWeight: 'SemiBold' })],
        }),
        iconButton('buttonExport', 658, 49, 104, '\uE896  Export', 'buttonExport_Click', { Anchor: 'Top, Right', ToolTip: 'Save the tasks as a CSV file' }),
        iconButton('buttonShare', 770, 49, 92, '\uE72D  Share', 'buttonShare_Click', { Anchor: 'Top, Right', ToolTip: 'Copy a summary to the clipboard' }),
        iconButton('buttonNewTask', 870, 49, 120, '\uE710  New task', 'buttonNewTask_Click', { Classes: 'accent', Anchor: 'Top, Right' }),
        tabs,
      ];

      // ---------------------------------------------------------------- page 2: My tasks
      const myTasksPage = [
        ...pageTitle('labelMyTasks', 'My tasks', ''),
        ctl('CheckBox', 'checkMyHideDone', 32, 96, 200, 32, { Content: 'Hide completed', IsChecked: true }, { events: { IsCheckedChanged: 'myTasks_Changed' } }),
        grid('gridMyTasks', 32, 136, 958, 522, 'Project | Project\nTask | Task\nStatus | Status\nDue | Due\nDays left | DaysLeft\nPriority | Priority', { Anchor: all }, { DoubleTapped: 'openTask_DoubleTapped' }),
        button('buttonMyOpen', 742, 674, 120, 'Open in project', 'buttonMyOpen_Click', { Anchor: 'Bottom, Right' }),
        button('buttonMyDone', 870, 674, 120, 'Mark as done', 'buttonMyDone_Click', { Classes: 'accent', Anchor: 'Bottom, Right' }),
      ];

      // ---------------------------------------------------------------- page 3: Calendar
      const calendarPage = [
        ...pageTitle('labelCalendar', 'Calendar', ''),
        iconButton('buttonPrevWeek', 32, 96, 40, '\uE76B', 'buttonPrevWeek_Click', { ToolTip: 'Previous week' }),
        button('buttonToday', 80, 96, 72, 'Today', 'buttonToday_Click'),
        iconButton('buttonNextWeek', 160, 96, 40, '\uE76C', 'buttonNextWeek_Click', { ToolTip: 'Next week' }),
        ctl('CalendarDatePicker', 'dateCalendar', 216, 96, 170, 32, {}, { events: { SelectedDateChanged: 'dateCalendar_SelectedDateChanged' } }),
        ...range(7).map((i) =>
          card('cardDay' + i, 32 + i * 138, 144, 130, 562, [
            text('labelDay' + i, 12, 10, 106, 20, '', { FontWeight: 'SemiBold' }),
            list('listDay' + i, 2, 40, 124, 516, { FontSize: 12, Anchor: all }),
          ], { Anchor: 'Top, Bottom, Left' })
        ),
      ];

      // ---------------------------------------------------------------- page 4: Team
      const teamPage = [
        ...pageTitle('labelTeam', 'Team', 'Workload across all projects'),
        grid('gridTeam', 32, 104, 620, 602, 'Name | Name\nRole | Role\nOpen | Open\nDone | Done\nHours logged | Hours | {0:N0}', { Anchor: all }, { SelectionChanged: 'gridTeam_SelectionChanged' }),
        card('cardMember', 668, 104, 322, 602, [
          avatar('avatarMember', 16, 16, 48, '?', '#0F6CBD'),
          text('labelMemberName', 76, 18, 230, 26, '', { FontSize: 20, FontWeight: 'SemiBold' }),
          caption('labelMemberRole', 76, 46, 230, ''),
          caption('labelMemberStats', 16, 80, 290, ''),
          heading('labelMemberTasks', 16, 112, 290, 'Open tasks'),
          list('listMemberTasks', 4, 144, 314, 448, { FontSize: 13, Anchor: all }),
        ], { Anchor: 'Top, Bottom, Right' }),
      ];

      // ---------------------------------------------------------------- page 5: Reports
      const reportsPage = [
        ...pageTitle('labelReports', 'Reports', 'All projects'),
        iconButton('buttonExportReport', 846, 32, 144, '\uE896  Export CSV...', 'buttonExportReport_Click', { Anchor: 'Top, Right' }),
        grid('gridReport', 32, 104, 958, 260, 'Project | Project\nStatus | Status\nTasks | Tasks\nDone | Done\nProgress | Progress | {0:P0}\nOverdue | Overdue\nHours | Hours | {0:N0}', { Anchor: 'Top, Left, Right' }),
        card('cardWorkload', 32, 380, 560, 326, [
          heading('labelWorkload', 16, 12, 400, 'Open tasks per person'),
          ...range(5).flatMap((i) => [
            text('labelLoad' + i, 16, 52 + i * 40, 160, 20, ''),
            ctl('ProgressBar', 'progressLoad' + i, 180, 54 + i * 40, 300, 16, {}),
            text('labelLoadCount' + i, 490, 52 + i * 40, 50, 20, '0', { TextAlignment: 'Right', FontWeight: 'SemiBold' }),
          ]),
        ], { Anchor: 'Top, Bottom, Left' }),
        card('cardHoursReport', 608, 380, 382, 326, [
          heading('labelHoursTitle', 16, 12, 300, 'Hours'),
          text('labelReportHours', 16, 48, 340, 44, '0 h', { FontSize: 36, FontWeight: 'SemiBold' }),
          caption('labelReportHoursSub', 16, 96, 340, ''),
          ctl('ProgressBar', 'progressHours', 16, 128, 346, 16, {}),
          caption('labelReportDone', 16, 160, 340, ''),
        ], { Anchor: 'Top, Bottom, Right' }),
      ];

      const pages = ctl('Pages', 'pagesMain', 0, 0, 1022, 738, { Pages: 'Home\nProjects\nMy tasks\nCalendar\nTeam\nReports', StartPage: 1, Anchor: all }, {
        slots: [homePage, projectsPage, myTasksPage, calendarPage, teamPage, reportsPage],
      });
      pages.activeSlot = 1;
      const pinned = ['#0F6CBD', '#C239B3', '#107C10', '#F7630C'];

      const main = project('formDashboard', { Title: 'Project Management', Width: 1280, Height: 780, MinWidth: 1180, MinHeight: 720, RequestedThemeVariant: 'Light', ExtendClientAreaToDecorationsHint: true }, [
        // title bar: with ExtendClientAreaToDecorationsHint Avalonia draws the Title (top left) and the caption buttons
        ctl('TextBox', 'textSearch', 440, 4, 400, 32, { Watermark: 'Search tasks', Anchor: 'Top' }, { events: { TextChanged: 'textSearch_TextChanged' } }),
        caption('labelStatus', 850, 11, 236, '', { Anchor: 'Top, Right' }),
        // navigation pane
        list('listNav', 8, 48, 240, 248, { Items: '\uE80F   Home\n\uE8B7   Projects\n\uE73A   My tasks\n\uE787   Calendar\n\uE716   Team\n\uE9D2   Reports', SelectedIndex: 1, FontFamily: ICONS }, { SelectionChanged: 'listNav_SelectionChanged' }),
        caption('labelPinned', 20, 312, 200, 'Pinned projects'),
        ...pinned.map((color, i) => ctl('Border', 'dotPinned' + (i + 1), 16, 350 + i * 40, 8, 8, Object.assign({}, none, { Background: color, CornerRadius: '4' }))),
        list('listProjects', 28, 334, 220, 168, { Items: 'Website Redesign\nMobile App 2.0\nBrand Guidelines\nQ1 Campaign', SelectedIndex: 0 }, { SelectionChanged: 'listProjects_SelectionChanged' }),
        avatar('avatarUser', 16, 728, 32, 'J', '#0F6CBD', { Anchor: 'Bottom, Left' }),
        text('labelUser', 58, 724, 140, 20, 'Julien', { FontWeight: 'SemiBold', Anchor: 'Bottom, Left' }),
        caption('labelUserRole', 58, 742, 140, 'Software Developer', { Anchor: 'Bottom, Left' }),
        iconButton('buttonSettings', 204, 728, 36, '\uE713', 'buttonSettings_Click', { Anchor: 'Bottom, Left', ToolTip: 'Settings' }),
        // content
        ctl('Border', 'panelContent', 256, 40, 1024, 740, { Background: '#FBFBFB', BorderBrush: '#E5E5E5', BorderThickness: '1', CornerRadius: '8,0,0,0', Anchor: all }, { children: [pages] }),
      ], String.raw`
# Project Dashboard: a complete app built from the toolbox. The look comes from the design
# (cards, type sizes, spacing, Segoe Fluent Icons); see the README for the rules.
# - Navigation: listNav switches the pages of pagesMain (Set-Page); listProjects switches the project.
# - Data: every task is a plain PowerShell object. Its Row ([DataSource]) is what the DataGrids show;
#   one Row can be in several grids at once. Reading a control or DataSource property is a call to
#   the GliderUI server, so filters and totals use the PowerShell objects, and only the visible
#   page is refreshed (the others when they are opened).
# - Dialogs: Show-formTask, Show-formSettings, Show-formNotifications and Show-formConfirm are the
#   other forms of this project (Project panel).
# - Data is saved to %LOCALAPPDATA%\GUI Creator\ProjectDashboard.json (Settings can turn it off).

$en = [cultureinfo]'en-US'
$today = (Get-Date).Date
$statuses = @('Backlog', 'In progress', 'In review', 'Done')
$projectStatuses = @('On track', 'At risk', 'Off track')
$members = @('Julien', 'Max', 'Steven', 'Nikita', 'Jumar')
$me = 'Julien'
$memberInfo = @{
    Julien = @{ Role = 'Software Developer'; Color = '#0F6CBD' }
    Max    = @{ Role = 'Designer'; Color = '#107C10' }
    Steven = @{ Role = 'Frontend Developer'; Color = '#CA5010' }
    Nikita = @{ Role = 'Content Writer'; Color = '#C239B3' }
    Jumar  = @{ Role = 'Data Engineer'; Color = '#5C2E91' }
}
$badgeColors = @{
    'On track'  = @('#DFF6DD', '#0E700E')
    'At risk'   = @('#FFF4CE', '#8A5300')
    'Off track' = @('#FDE7E9', '#C50F1F')
}
$dataFile = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'GUI Creator\ProjectDashboard.json'
$settings = [pscustomobject]@{ Name = 'Julien'; Role = 'Software Developer'; SaveData = $true }
$projects = [System.Collections.Generic.List[object]]::new()
$activity = [System.Collections.Generic.List[object]]::new()
$tasksById = @{}
$current = $null
$selectedMember = $me
$taskListKey = ''
$page = 1          # visible page of pagesMain
$stale = @{}       # views to refresh when their page is shown
$sortable = @{}    # grids whose columns already sort

#region Data
function Update-TaskText ($Task) {
    $due = [datetime]::new($Task.DueTicks)
    $Task.Due = $due.ToString('MMM d', $en)
    $days = ($due - $today).Days
    $Task.DaysLeft = if ($Task.Status -eq 'Done') { 'Done' } elseif ($days -lt -1) { "$(-$days) days late" } elseif ($days -eq -1) { '1 day late' } elseif ($days -eq 0) { 'Today' } elseif ($days -eq 1) { 'Tomorrow' } else { "$days days" }
}

function New-TaskItem ([string]$Project, [string]$Name, [string]$Assignee, [string]$Status, [long]$DueTicks, [double]$Progress, [string]$Priority, [int]$Estimate) {
    $t = [pscustomobject]@{
        Id = [guid]::NewGuid().ToString('n'); Project = $Project; Task = $Name; Assignee = $Assignee; Status = $Status
        DueTicks = $DueTicks; Progress = $Progress; Priority = $Priority; Estimate = $Estimate; Due = ''; DaysLeft = ''; Row = $null
    }
    Update-TaskText $t
    # The row the DataGrids show. Id leads from a selected row back to this task.
    $t.Row = [DataSource]@{
        Id = $t.Id; Project = $Project; Task = $Name; Assignee = $Assignee; Status = $Status
        Due = $t.Due; DueTicks = $DueTicks; DaysLeft = $t.DaysLeft; Progress = $Progress; Priority = $Priority
    }
    $tasksById[$t.Id] = $t
    $t
}

# Copies a changed task to its row (each assignment updates every grid that shows the row).
function Sync-Row ($Task) {
    Update-TaskText $Task
    $r = $Task.Row
    $r.Task = $Task.Task; $r.Assignee = $Task.Assignee; $r.Status = $Task.Status; $r.Due = $Task.Due
    $r.DueTicks = $Task.DueTicks; $r.DaysLeft = $Task.DaysLeft; $r.Progress = $Task.Progress; $r.Priority = $Task.Priority
}

function Get-SelectedTask ($Grid) {
    $row = $Grid.SelectedItem
    if ($null -eq $row) { return $null }
    $tasksById[[string]$row.Id]
}

function New-Project ([string]$Name, [string]$Status, [string]$Description, [long]$DueTicks) {
    [pscustomobject]@{
        Name = $Name; Status = $Status; Description = $Description; DueTicks = $DueTicks
        Tasks = [System.Collections.Generic.List[object]]::new()
        Files = [System.Collections.Generic.List[string]]::new()
    }
}

function Initialize-SampleData {
    $projects.Clear()
    $activity.Clear()
    $tasksById.Clear()
    $sample = [ordered]@{
        'Website Redesign' = @{ Status = 'On track'; Due = 30; Description = 'A new marketing site: a refreshed brand, faster pages and a CMS that the marketing team can edit themselves.'; Tasks = @(
            'Finalize hero illustrations|Max|In review|-2|0.9|High|12'
            'Responsive navigation menu|Steven|In progress|1|0.55|High|16'
            'Write copy for the pricing page|Nikita|In progress|3|0.3|Medium|6'
            'Set up analytics events|Jumar|Backlog|10|0|Low|8'
            'Accessibility audit|Julien|In review|-1|0.8|High|10'
            'Migrate blog to new CMS|Steven|Done|-6|1|Medium|20'
            'Optimize image loading|Jumar|In progress|4|0.35|Medium|8'
            'Customer testimonials carousel|Max|Backlog|12|0.05|Low|6'
            'Newsletter signup form|Nikita|Done|-8|1|Low|4'
            'Cross-browser QA pass|Julien|Backlog|14|0|Medium|12'
        ) }
        'Mobile App 2.0' = @{ Status = 'At risk'; Due = 45; Description = 'The native iOS and Android app with offline mode and push notifications.'; Tasks = @(
            'Offline sync engine|Jumar|In progress|2|0.4|High|24'
            'Push notification service|Steven|Backlog|9|0|Medium|12'
            'Onboarding screens|Max|In review|0|0.85|Medium|10'
            'App store listing copy|Nikita|Backlog|20|0|Low|4'
            'Crash reporting|Julien|In progress|-3|0.6|High|6'
            'Beta test with 50 users|Julien|Backlog|25|0|Medium|8'
        ) }
        'Brand Guidelines' = @{ Status = 'On track'; Due = 12; Description = 'One reference for logo use, colours, typography and tone of voice.'; Tasks = @(
            'Logo usage rules|Max|Done|-10|1|Medium|6'
            'Colour palette and contrast|Max|In review|1|0.9|High|5'
            'Typography scale|Julien|In progress|4|0.5|Medium|4'
            'Tone of voice guide|Nikita|In progress|6|0.4|Medium|8'
        ) }
        'Q1 Campaign' = @{ Status = 'Off track'; Due = 60; Description = 'The launch campaign for the new site: email, social media and paid search.'; Tasks = @(
            'Campaign brief|Nikita|Done|-14|1|High|4'
            'Audience segments|Jumar|In review|-4|0.8|High|6'
            'Landing page|Steven|Backlog|5|0|High|16'
            'Email sequence|Nikita|Backlog|8|0|Medium|10'
            'Paid search setup|Jumar|Backlog|11|0|Low|6'
        ) }
    }
    foreach ($name in $sample.Keys) {
        $d = $sample[$name]
        $p = New-Project $name $d.Status $d.Description $today.AddDays($d.Due).Ticks
        foreach ($line in $d.Tasks) {
            $f = $line.Split('|')
            $p.Tasks.Add((New-TaskItem $name $f[0] $f[1] $f[2] $today.AddDays([int]$f[3]).Ticks ([double]$f[4]) $f[5] ([int]$f[6])))
        }
        $projects.Add($p)
    }
    $sampleActivity = @(
        'Website Redesign|Max moved "Finalize hero illustrations" to In review|2'
        'Mobile App 2.0|Julien set the status to At risk|5'
        'Brand Guidelines|Max completed "Logo usage rules"|26'
        'Q1 Campaign|Nikita set the status to Off track|30'
        'Website Redesign|Steven completed "Migrate blog to new CMS"|50'
    )
    foreach ($line in $sampleActivity) {
        $f = $line.Split('|')
        $activity.Add([pscustomobject]@{ Ticks = (Get-Date).AddHours(-[int]$f[2]).Ticks; Project = $f[0]; Text = $f[1] })
    }
}

function Save-Data {
    $state = [ordered]@{
        Settings = [ordered]@{ Name = $settings.Name; Role = $settings.Role; SaveData = $settings.SaveData }
        Projects = $null
        Activity = $null
    }
    if ($settings.SaveData) {
        $state.Projects = @(foreach ($p in $projects) {
                [ordered]@{
                    Name = $p.Name; Status = $p.Status; Description = $p.Description; DueTicks = $p.DueTicks; Files = @($p.Files)
                    Tasks = @($p.Tasks | Select-Object Task, Assignee, Status, DueTicks, Progress, Priority, Estimate)
                }
            })
        $state.Activity = @($activity | Select-Object -First 100)
    }
    try {
        $null = New-Item -ItemType Directory -Force -Path (Split-Path $dataFile)
        $state | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $dataFile -Encoding utf8
    } catch {
        Show-Status "Could not save: $($_.Exception.Message)"
    }
}

function Import-Data {
    if (-not (Test-Path -LiteralPath $dataFile)) { return $false }
    try { $state = Get-Content -LiteralPath $dataFile -Raw | ConvertFrom-Json } catch { return $false }
    if ($state.Settings) {
        if ($state.Settings.Name) { $settings.Name = [string]$state.Settings.Name }
        $settings.Role = [string]$state.Settings.Role
        $settings.SaveData = [bool]$state.Settings.SaveData
    }
    if (-not $state.Projects) { return $false }
    $projects.Clear()
    $activity.Clear()
    $tasksById.Clear()
    foreach ($sp in $state.Projects) {
        $p = New-Project $sp.Name $sp.Status $sp.Description ([long]$sp.DueTicks)
        foreach ($f in @($sp.Files)) { if ($f) { $p.Files.Add([string]$f) } }
        foreach ($st in @($sp.Tasks)) {
            if (-not $st) { continue }
            $p.Tasks.Add((New-TaskItem $sp.Name $st.Task $st.Assignee $st.Status ([long]$st.DueTicks) ([double]$st.Progress) $st.Priority ([int]$st.Estimate)))
        }
        $projects.Add($p)
    }
    foreach ($a in @($state.Activity)) {
        if ($a) { $activity.Add([pscustomobject]@{ Ticks = [long]$a.Ticks; Project = [string]$a.Project; Text = [string]$a.Text }) }
    }
    $projects.Count -gt 0
}

function Get-AllTasks { foreach ($p in $projects) { $p.Tasks } }

function Get-NotificationTasks {
    Get-AllTasks | Where-Object { $_.Status -ne 'Done' -and $_.DueTicks -le $today.AddDays(2).Ticks } | Sort-Object DueTicks
}

function Get-WeekStart ([datetime]$Date) { $Date.Date.AddDays(-(([int]$Date.DayOfWeek + 6) % 7)) }
$weekStart = Get-WeekStart $today

function Get-Hours ($Tasks) { [double](($Tasks | ForEach-Object { $_.Estimate * $_.Progress } | Measure-Object -Sum).Sum) }
function Get-Estimate ($Tasks) { [double](($Tasks | Measure-Object Estimate -Sum).Sum) }

# Storage pickers return file URIs (AbsolutePath is "C:/folder/file%20name.csv").
function ConvertFrom-StorageUri ($Uri) { [uri]::UnescapeDataString($Uri.AbsolutePath) -replace '/', '\' }
#endregion

#region Helpers
function New-Brush ([string]$Color) { [SolidColorBrush]::Parse($Color) }

function Show-Status ([string]$Text) { $labelStatus.Text = $Text }

function Set-ListItems ($List, $Items) {
    $List.Items.Clear()
    foreach ($i in $Items) { $List.Items.Add([string]$i) | Out-Null }
}

# Shows these tasks' rows in a grid.
function Set-Rows ($Rows, $Tasks) {
    $Rows.Clear()
    foreach ($t in $Tasks) { $Rows.Add($t.Row) }
}

# DataSource rows sort with DataSourcePropertyComparer; a Due column sorts by the date, not the text.
function Enable-Sorting ($Grid) {
    if ($sortable[$Grid.Name]) { return }
    $sortable[$Grid.Name] = $true
    foreach ($col in $Grid.Columns) {
        $path = $col.SortMemberPath
        if ($path -eq 'Due') { $path = 'DueTicks' }
        if ($path) { $col.CustomSortComparer = [DataSourcePropertyComparer]::new($path) }
    }
}

function Format-Activity ($Entry) {
    $when = [datetime]::new($Entry.Ticks)
    $time = if ($when.Date -eq $today) { $when.ToString('HH:mm') } else { $when.ToString('MMM d', $en) }
    "$time    $($Entry.Text)"
}

function Add-Activity ([string]$Text, [string]$Project = $current.Name) {
    $activity.Insert(0, [pscustomobject]@{ Ticks = (Get-Date).Ticks; Project = $Project; Text = "$($settings.Name) $Text" })
    Save-Data
}

function Show-Page ([int]$Index) {
    if ($script:page -ne $Index) {
        $script:page = $Index
        Set-Page $pagesMain -Index $Index
    }
    if ($listNav.SelectedIndex -ne $Index) { $listNav.SelectedIndex = $Index }
    Update-Visible
}

# Data changed: every view is stale; refresh the visible one now.
function Update-Views {
    foreach ($view in 'Project', 'Overview', 'Timeline', 'Files', 'Activity', 'Home', 'MyTasks', 'Calendar', 'Team', 'Reports') { $stale[$view] = $true }
    Update-TaskList -Force
    Update-Bell
    Update-Visible
}

function Update-Visible {
    $views = switch ($page) {
        0 { 'Home' }
        # All tabs of the project: a SelectionChanged handler on tabsProject would crash GliderUI 0.6,
        # because the DataGrid and ComboBoxes inside it have one too (the event bubbles up).
        1 { 'Project', 'Overview', 'Timeline', 'Files', 'Activity' }
        2 { 'MyTasks' }
        3 { 'Calendar' }
        4 { 'Team' }
        5 { 'Reports' }
    }
    foreach ($view in $views) {
        if ($view -and $stale[$view]) {
            $stale[$view] = $false
            & "Update-$view"
        }
    }
}
#endregion

#region Views
function Update-User {
    $labelUser.Text = $settings.Name
    $labelUserRole.Text = $settings.Role
    $avatarUserLetter.Text = $settings.Name.Substring(0, 1).ToUpper()
}

function Update-TaskList ([switch]$Force) {
    $filter = "$($textFilter.Text)".Trim()
    $who = $comboAssignee.SelectedItem.Content
    $showDone = $checkShowCompleted.IsChecked -eq $true
    # Changing a control from code raises its event later too; skip the rebuild if nothing changed.
    $key = "$($current.Name)|$filter|$who|$showDone"
    if (-not $Force -and $key -eq $script:taskListKey) { return }
    $script:taskListKey = $key
    Set-Rows $taskRows @($current.Tasks | Where-Object {
            ($showDone -or $_.Status -ne 'Done') -and
            (-not $who -or $who -eq 'All assignees' -or $_.Assignee -eq $who) -and
            (-not $filter -or $_.Task -like "*$filter*")
        })
}

# Header, avatars and the cards of the Tasks tab.
function Update-Project {
    $p = $current
    $tasks = @($p.Tasks)
    $open = @($tasks | Where-Object Status -NE 'Done')
    $done = $tasks.Count - $open.Count
    $overdue = @($open | Where-Object DueTicks -LT $today.Ticks)
    $labelBreadcrumb.Text = 'Projects  /  ' + $p.Name
    $labelTitle.Text = $p.Name
    $labelBadge.Text = $p.Status
    $badgeStatus.Background = New-Brush $badgeColors[$p.Status][0]
    $labelBadge.Foreground = New-Brush $badgeColors[$p.Status][1]

    $cardOpenValue.Text = "$($open.Count)"
    $cardOpenSub.Text = "$(@($open | Where-Object DueTicks -LT $today.AddDays(7).Ticks).Count) due this week"
    $cardDoneValue.Text = "$done"
    $cardDoneSub.Text = "of $($tasks.Count) tasks"
    $cardOverdueValue.Text = "$($overdue.Count)"
    $cardOverdueSub.Text = "$(@($overdue | Where-Object Priority -EQ 'High').Count) high priority"
    $cardHoursValue.Text = '{0:N0}h' -f (Get-Hours $tasks)
    $cardHoursSub.Text = 'of {0:N0}h estimated' -f (Get-Estimate $tasks)
    $percent = if ($tasks.Count) { $done / $tasks.Count } else { 0 }
    $progressSprint.Value = $percent * 100
    $labelSprintCount.Text = "$done of $($tasks.Count) tasks completed"
    $labelSprintPercent.Text = '{0:P0}' -f $percent
    $daysLeft = ([datetime]::new($p.DueTicks) - $today).Days
    $labelSprintLeft.Text = if ($daysLeft -ge 0) { "$daysLeft days left" } else { "$(-$daysLeft) days over" }

    # Avatars of the project team (right-aligned, up to four)
    $shown = @($tasks.Assignee | Sort-Object -Unique | Select-Object -First 4)
    for ($i = 0; $i -lt 4; $i++) {
        $slot = Get-Variable "avatarSlot$i" -ValueOnly
        $k = $i - (4 - $shown.Count)
        $slot.IsVisible = $k -ge 0
        if ($k -ge 0) {
            $slot.Background = New-Brush $memberInfo[$shown[$k]].Color
            (Get-Variable "avatarSlot$($i)Letter" -ValueOnly).Text = $shown[$k].Substring(0, 1)
        }
    }
}

function Update-Overview {
    $tasks = @($current.Tasks)
    $open = @($tasks | Where-Object Status -NE 'Done')
    $labelDescription.Text = $current.Description
    $comboProjectStatus.SelectedIndex = [array]::IndexOf($projectStatuses, $current.Status)
    $labelProjectDue.Text = 'Due ' + [datetime]::new($current.DueTicks).ToString('MMMM d, yyyy', $en)
    for ($i = 0; $i -lt 4; $i++) {
        $n = @($tasks | Where-Object Status -EQ $statuses[$i]).Count
        (Get-Variable "progressStatus$i" -ValueOnly).Value = if ($tasks.Count) { 100 * $n / $tasks.Count } else { 0 }
        (Get-Variable "labelStatusCount$i" -ValueOnly).Text = "$n"
    }
    Set-ListItems $listUpcoming @($open | Sort-Object DueTicks | Select-Object -First 3 | ForEach-Object { "$($_.Due)    $($_.Task)  ($($_.Assignee))" })
    Set-ListItems $listProjectTeam @(foreach ($m in @($tasks.Assignee | Sort-Object -Unique)) { "$m  -  $($memberInfo[$m].Role)  -  $(@($open | Where-Object Assignee -EQ $m).Count) open" })
}

function Update-Timeline {
    Enable-Sorting $gridTimeline
    $hideDone = $checkTimelineHideDone.IsChecked -eq $true
    Set-Rows $timelineRows @($current.Tasks | Where-Object { -not $hideDone -or $_.Status -ne 'Done' } | Sort-Object DueTicks)
}

function Update-Files {
    Set-ListItems $listFiles @(foreach ($f in $current.Files) { "$(Split-Path $f -Leaf)    ($(Split-Path $f -Parent))" })
}

function Update-Activity {
    Set-ListItems $listActivity @($activity | Where-Object Project -EQ $current.Name | Select-Object -First 25 | ForEach-Object { Format-Activity $_ })
}

function Update-Home {
    Enable-Sorting $gridDueSoon
    $hour = (Get-Date).Hour
    $part = if ($hour -lt 12) { 'morning' } elseif ($hour -lt 18) { 'afternoon' } else { 'evening' }
    $labelGreeting.Text = "Good $part, $($settings.Name)"
    $labelHomeDate.Text = $today.ToString('dddd, MMMM d', $en)
    $open = @(Get-AllTasks | Where-Object Status -NE 'Done')
    $soon = @($open | Where-Object { $_.DueTicks -ge $today.Ticks -and $_.DueTicks -lt $today.AddDays(7).Ticks } | Sort-Object DueTicks)
    $cardHomeProjectsValue.Text = "$($projects.Count)"
    $cardHomeOpenValue.Text = "$($open.Count)"
    $cardHomeWeekValue.Text = "$($soon.Count)"
    $cardHomeOverdueValue.Text = "$(@($open | Where-Object DueTicks -LT $today.Ticks).Count)"
    Set-Rows $dueSoonRows $soon
    Set-ListItems $listHomeActivity @($activity | Select-Object -First 15 | ForEach-Object { "$(Format-Activity $_)  ($($_.Project))" })
}

function Update-MyTasks {
    Enable-Sorting $gridMyTasks
    $hideDone = $checkMyHideDone.IsChecked -eq $true
    $labelMyTasksSub.Text = "Tasks assigned to $me in all projects"
    Set-Rows $myRows @(Get-AllTasks | Where-Object { $_.Assignee -eq $me -and (-not $hideDone -or $_.Status -ne 'Done') } | Sort-Object DueTicks)
}

function Update-Calendar {
    $labelCalendarSub.Text = 'Week of ' + $weekStart.ToString('MMMM d, yyyy', $en)
    $tasks = @(Get-AllTasks)
    for ($i = 0; $i -lt 7; $i++) {
        $day = $weekStart.AddDays($i)
        $isToday = $day -eq $today
        (Get-Variable "labelDay$i" -ValueOnly).Text = $day.ToString('ddd d', $en) + $(if ($isToday) { '  (today)' } else { '' })
        (Get-Variable "cardDay$i" -ValueOnly).BorderBrush = New-Brush $(if ($isToday) { '#0F6CBD' } else { '#E0E0E0' })
        Set-ListItems (Get-Variable "listDay$i" -ValueOnly) @($tasks | Where-Object DueTicks -EQ $day.Ticks | ForEach-Object {
                $(if ($_.Status -eq 'Done') { '[done] ' } else { '' }) + $_.Task
            })
    }
}

function Update-Team {
    Enable-Sorting $gridTeam
    $tasks = @(Get-AllTasks)
    $teamRows.Clear()
    foreach ($m in $members) {
        $mine = @($tasks | Where-Object Assignee -EQ $m)
        $open = @($mine | Where-Object Status -NE 'Done').Count
        $teamRows.Add([DataSource]@{ Name = $m; Role = $memberInfo[$m].Role; Open = $open; Done = $mine.Count - $open; Hours = Get-Hours $mine })
    }
    $gridTeam.SelectedIndex = [array]::IndexOf($members, $selectedMember)
    Update-Member
}

function Update-Member {
    $m = $selectedMember
    $mine = @(Get-AllTasks | Where-Object Assignee -EQ $m)
    $open = @($mine | Where-Object Status -NE 'Done' | Sort-Object DueTicks)
    $labelMemberName.Text = $m
    $labelMemberRole.Text = $memberInfo[$m].Role
    $avatarMember.Background = New-Brush $memberInfo[$m].Color
    $avatarMemberLetter.Text = $m.Substring(0, 1)
    $labelMemberStats.Text = "$($open.Count) open, $($mine.Count - $open.Count) done, in $(@($mine.Project | Sort-Object -Unique).Count) projects"
    Set-ListItems $listMemberTasks @($open | ForEach-Object { "$($_.Due)    $($_.Task)  ($($_.Project))" })
}

function Update-Reports {
    Enable-Sorting $gridReport
    $reportRows.Clear()
    foreach ($p in $projects) {
        $tasks = @($p.Tasks)
        $done = @($tasks | Where-Object Status -EQ 'Done').Count
        $reportRows.Add([DataSource]@{
                Project  = $p.Name
                Status   = $p.Status
                Tasks    = $tasks.Count
                Done     = $done
                Progress = $(if ($tasks.Count) { $done / $tasks.Count } else { 0 })
                Overdue  = @($tasks | Where-Object { $_.Status -ne 'Done' -and $_.DueTicks -lt $today.Ticks }).Count
                Hours    = Get-Hours $tasks
            })
    }
    $tasks = @(Get-AllTasks)
    $counts = @(foreach ($m in $members) { @($tasks | Where-Object { $_.Assignee -eq $m -and $_.Status -ne 'Done' }).Count })
    $max = [math]::Max(1, ($counts | Measure-Object -Maximum).Maximum)
    for ($i = 0; $i -lt $members.Count; $i++) {
        (Get-Variable "labelLoad$i" -ValueOnly).Text = $members[$i]
        (Get-Variable "progressLoad$i" -ValueOnly).Value = 100 * $counts[$i] / $max
        (Get-Variable "labelLoadCount$i" -ValueOnly).Text = "$($counts[$i])"
    }
    $hours = Get-Hours $tasks
    $estimate = Get-Estimate $tasks
    $labelReportHours.Text = '{0:N0} h' -f $hours
    $labelReportHoursSub.Text = 'logged of {0:N0} h estimated in all projects' -f $estimate
    $progressHours.Value = if ($estimate) { 100 * $hours / $estimate } else { 0 }
    $labelReportDone.Text = "$(@($tasks | Where-Object Status -EQ 'Done').Count) of $($tasks.Count) tasks done"
}

function Update-Bell {
    $n = @(Get-NotificationTasks).Count
    $badgeBell.IsVisible = $n -gt 0
    $labelBellCount.Text = "$n"
}

function Select-Project ([int]$Index) {
    if ($Index -lt 0 -or $Index -ge $projects.Count) { return }
    $script:current = $projects[$Index]
    foreach ($view in 'Project', 'Overview', 'Timeline', 'Files', 'Activity') { $stale[$view] = $true }
    if ($textFilter.Text) { $textFilter.Text = '' }
    Update-TaskList -Force
    Update-Visible
    if ($taskRows.Count) { $gridTasks.SelectedIndex = 0 }
    Show-TaskDetails
}

function Show-TaskDetails {
    $t = Get-SelectedTask $gridTasks
    $groupDetails.IsEnabled = $null -ne $t
    if ($null -eq $t) { return }
    $textTaskName.Text = $t.Task
    $comboStatus.SelectedIndex = [array]::IndexOf($statuses, $t.Status)
    $comboTaskAssignee.SelectedIndex = [array]::IndexOf($members, $t.Assignee)
    $dateDue.SelectedDate = [GliderUI.System.DateTime]::new($t.DueTicks)
    $radioLow.IsChecked = $t.Priority -eq 'Low'
    $radioMedium.IsChecked = $t.Priority -eq 'Medium'
    $radioHigh.IsChecked = $t.Priority -eq 'High'
    $sliderEstimate.Value = $t.Estimate
    # Set here as well: events raised while the script starts arrive before the handlers are wired.
    $labelEstimateValue.Text = "$($t.Estimate) h"
}

# Opens a task (from Home, My tasks or the timeline) in its project's Tasks tab.
function Open-Task ($Task) {
    if ($null -eq $Task) { return }
    $index = -1
    for ($i = 0; $i -lt $projects.Count; $i++) { if ($projects[$i].Name -eq $Task.Project) { $index = $i } }
    if ($index -lt 0) { return }
    if ($projects[$index] -ne $current) { Select-Project $index }
    if ($listProjects.SelectedIndex -ne $index) { $listProjects.SelectedIndex = $index }
    if ($checkShowCompleted.IsChecked -ne $true) { $checkShowCompleted.IsChecked = $true }
    if ($comboAssignee.SelectedIndex -ne 0) { $comboAssignee.SelectedIndex = 0 }
    Update-TaskList
    if ($tabsProject.SelectedIndex -ne 1) { $tabsProject.SelectedIndex = 1 }
    Show-Page 1
    $gridTasks.SelectedIndex = $taskRows.IndexOf($Task.Row)
    Show-TaskDetails
}

function Export-TaskCsv ($Tasks, [string]$Path) {
    $Tasks | Select-Object Project, Task, Assignee, Status, @{ n = 'Due'; e = { [datetime]::new($_.DueTicks).ToString('yyyy-MM-dd') } }, Priority, Estimate, Progress |
        Export-Csv -LiteralPath $Path -NoTypeInformation -Encoding utf8
}

function Save-CsvAs ([string]$Title, [string]$FileName) {
    $options = [GliderUI.Avalonia.Platform.Storage.FilePickerSaveOptions]::new()
    $options.Title = $Title
    $options.SuggestedFileName = $FileName
    $options.DefaultExtension = '.csv'
    $file = $formDashboard.StorageProvider.SaveFilePickerAsync($options).WaitForCompleted()
    if ($file) { ConvertFrom-StorageUri $file.Path }
}
#endregion

#region Event handlers
$listNav_SelectionChanged = {
    param ($argumentList, $s, $e)
    $i = $listNav.SelectedIndex
    if ($i -ge 0 -and $i -ne $page) { Show-Page $i }
}

$listProjects_SelectionChanged = {
    param ($argumentList, $s, $e)
    $i = $listProjects.SelectedIndex
    if ($i -lt 0) { return }
    if ($projects[$i] -ne $current) { Select-Project $i }
    Show-Page 1
}

$textSearch_TextChanged = {
    param ($argumentList, $s, $e)
    $q = "$($textSearch.Text)".Trim()
    if ($q) {
        if ($tabsProject.SelectedIndex -ne 1) { $tabsProject.SelectedIndex = 1 }
        Show-Page 1
    }
    if ("$($textFilter.Text)" -ne $q) { $textFilter.Text = $q }
    Update-TaskList
    $others = if ($q) { @(Get-AllTasks | Where-Object { $_.Project -ne $current.Name -and $_.Task -like "*$q*" }).Count } else { 0 }
    Show-Status $(if ($others) { "$others more matches in other projects" } else { '' })
}

$filter_Changed = {
    param ($argumentList, $s, $e)
    Update-TaskList
}

$gridTasks_SelectionChanged = {
    param ($argumentList, $s, $e)
    Show-TaskDetails
}

$sliderEstimate_ValueChanged = {
    param ($argumentList, $s, $e)
    $labelEstimateValue.Text = "$([int]$sliderEstimate.Value) h"
}

$buttonCancel_Click = {
    param ($argumentList, $s, $e)
    Show-TaskDetails
}

$buttonSave_Click = {
    param ($argumentList, $s, $e)
    $t = Get-SelectedTask $gridTasks
    if ($null -eq $t) { return }
    $name = "$($textTaskName.Text)".Trim()
    if (-not $name) { Show-Status 'Enter a task name.'; return }
    $t.Task = $name
    if ($comboStatus.SelectedIndex -ge 0) { $t.Status = $statuses[$comboStatus.SelectedIndex] }
    if ($comboTaskAssignee.SelectedIndex -ge 0) { $t.Assignee = $members[$comboTaskAssignee.SelectedIndex] }
    if ($t.Status -eq 'Done') { $t.Progress = 1 } elseif ($t.Progress -ge 1) { $t.Progress = 0.9 }
    $d = $dateDue.SelectedDate
    if ($d) { $t.DueTicks = [datetime]::new($d.Ticks).Date.Ticks }
    $t.Priority = if ($radioHigh.IsChecked) { 'High' } elseif ($radioMedium.IsChecked) { 'Medium' } else { 'Low' }
    $t.Estimate = [int]$sliderEstimate.Value
    Sync-Row $t
    $note = if ($toggleNotify.IsChecked) { ' and notified the watchers' } else { '' }
    Add-Activity "updated '$name'$note"
    Update-Views
    $gridTasks.SelectedIndex = $taskRows.IndexOf($t.Row)
    Show-Status "Saved '$name'"
}

$buttonDelete_Click = {
    param ($argumentList, $s, $e)
    $t = Get-SelectedTask $gridTasks
    if ($null -eq $t) { return }
    $result = Show-formConfirm -Owner $formDashboard -Values @{ labelConfirm = "Delete '$($t.Task)' from $($current.Name)? This cannot be undone." }
    if ($result.DialogResult -ne 'Delete') { return }
    $null = $current.Tasks.Remove($t)
    $tasksById.Remove($t.Id)
    Add-Activity "deleted '$($t.Task)'"
    Update-Views
    if ($taskRows.Count) { $gridTasks.SelectedIndex = 0 }
    Show-TaskDetails
    Show-Status "Deleted '$($t.Task)'"
}

$buttonNewTask_Click = {
    param ($argumentList, $s, $e)
    $result = Show-formTask -Owner $formDashboard -Values @{
        comboNewAssignee   = [array]::IndexOf($members, $me)
        comboNewStatus     = 0
        dateNewDue         = [GliderUI.System.DateTime]::new($today.AddDays(7).Ticks)
        radioNewMedium     = $true
        numericNewEstimate = 4
    }
    if ($result.DialogResult -ne 'OK') { return }
    $name = "$($result.textNewName)".Trim()
    $due = if ($result.dateNewDue) { [datetime]::new($result.dateNewDue.Ticks).Date } else { $today.AddDays(7) }
    $status = $statuses[[math]::Max(0, $result.comboNewStatus)]
    $assignee = $members[[math]::Max(0, $result.comboNewAssignee)]
    $priority = if ($result.radioNewHigh) { 'High' } elseif ($result.radioNewLow) { 'Low' } else { 'Medium' }
    $progress = if ($status -eq 'Done') { 1 } else { 0 }
    $t = New-TaskItem $current.Name $name $assignee $status $due.Ticks $progress $priority ([int]$result.numericNewEstimate)
    $current.Tasks.Add($t)
    Add-Activity "added '$name'"
    if ($checkShowCompleted.IsChecked -ne $true) { $checkShowCompleted.IsChecked = $true }
    if ($comboAssignee.SelectedIndex -ne 0) { $comboAssignee.SelectedIndex = 0 }
    if ($textFilter.Text) { $textFilter.Text = '' }
    if ($tabsProject.SelectedIndex -ne 1) { $tabsProject.SelectedIndex = 1 }
    Show-Page 1
    Update-Views
    $gridTasks.SelectedIndex = $taskRows.IndexOf($t.Row)
    Show-TaskDetails
    Show-Status "Added '$name'"
}

$comboProjectStatus_SelectionChanged = {
    param ($argumentList, $s, $e)
    $i = $comboProjectStatus.SelectedIndex
    if ($i -lt 0 -or $projectStatuses[$i] -eq $current.Status) { return }
    $current.Status = $projectStatuses[$i]
    Add-Activity "set the status to $($current.Status)"
    Update-Views
}

$timeline_Changed = {
    param ($argumentList, $s, $e)
    Update-Timeline
}

$myTasks_Changed = {
    param ($argumentList, $s, $e)
    Update-MyTasks
}

# Double-click in Home, My tasks or the timeline: $s is the DataGrid that was clicked.
$openTask_DoubleTapped = {
    param ($argumentList, $s, $e)
    Open-Task (Get-SelectedTask $s)
}

$buttonMyOpen_Click = {
    param ($argumentList, $s, $e)
    Open-Task (Get-SelectedTask $gridMyTasks)
}

$buttonMyDone_Click = {
    param ($argumentList, $s, $e)
    $t = Get-SelectedTask $gridMyTasks
    if ($null -eq $t -or $t.Status -eq 'Done') { return }
    $t.Status = 'Done'
    $t.Progress = 1
    Sync-Row $t
    Add-Activity "completed '$($t.Task)'" $t.Project
    Update-Views
    Show-Status "Completed '$($t.Task)'"
}

$buttonPrevWeek_Click = {
    param ($argumentList, $s, $e)
    $script:weekStart = $weekStart.AddDays(-7)
    Update-Calendar
}

$buttonNextWeek_Click = {
    param ($argumentList, $s, $e)
    $script:weekStart = $weekStart.AddDays(7)
    Update-Calendar
}

$buttonToday_Click = {
    param ($argumentList, $s, $e)
    $script:weekStart = Get-WeekStart $today
    Update-Calendar
}

$dateCalendar_SelectedDateChanged = {
    param ($argumentList, $s, $e)
    $d = $dateCalendar.SelectedDate
    if (-not $d) { return }
    $start = Get-WeekStart ([datetime]::new($d.Ticks))
    if ($start -ne $weekStart) {
        $script:weekStart = $start
        Update-Calendar
    }
}

$gridTeam_SelectionChanged = {
    param ($argumentList, $s, $e)
    $row = $gridTeam.SelectedItem
    if ($null -eq $row) { return }
    $name = [string]$row.Name
    if ($name -ne $selectedMember) {
        $script:selectedMember = $name
        Update-Member
    }
}

$buttonAddFiles_Click = {
    param ($argumentList, $s, $e)
    $options = [GliderUI.Avalonia.Platform.Storage.FilePickerOpenOptions]::new()
    $options.Title = "Add files to $($current.Name)"
    $options.AllowMultiple = $true
    $files = $formDashboard.StorageProvider.OpenFilePickerAsync($options).WaitForCompleted()
    $added = 0
    foreach ($f in @($files)) {
        $path = ConvertFrom-StorageUri $f.Path
        if ($path -and -not $current.Files.Contains($path)) {
            $current.Files.Add($path)
            $added++
        }
    }
    if ($added) {
        Add-Activity "linked $added file(s)"
        Update-Views
    }
}

$buttonOpenFile_Click = {
    param ($argumentList, $s, $e)
    $i = $listFiles.SelectedIndex
    if ($i -lt 0) { return }
    $path = $current.Files[$i]
    if (Test-Path -LiteralPath $path) { Invoke-Item -LiteralPath $path } else { Show-Status "File not found: $path" }
}

$buttonRemoveFile_Click = {
    param ($argumentList, $s, $e)
    $i = $listFiles.SelectedIndex
    if ($i -lt 0) { return }
    $name = Split-Path $current.Files[$i] -Leaf
    $current.Files.RemoveAt($i)
    Add-Activity "removed the link to $name"
    Update-Views
}

$buttonExport_Click = {
    param ($argumentList, $s, $e)
    $path = Save-CsvAs 'Export tasks' "$($current.Name) tasks.csv"
    if (-not $path) { return }
    Export-TaskCsv @($current.Tasks) $path
    Show-Status "Exported $($current.Tasks.Count) tasks to $(Split-Path $path -Leaf)"
    Add-Activity "exported the tasks to $(Split-Path $path -Leaf)"
    Update-Views
}

$buttonExportReport_Click = {
    param ($argumentList, $s, $e)
    $path = Save-CsvAs 'Export all tasks' 'All projects.csv'
    if (-not $path) { return }
    Export-TaskCsv @(Get-AllTasks) $path
    Show-Status "Exported all tasks to $(Split-Path $path -Leaf)"
}

$buttonShare_Click = {
    param ($argumentList, $s, $e)
    $tasks = @($current.Tasks)
    $open = @($tasks | Where-Object Status -NE 'Done' | Sort-Object DueTicks)
    $lines = @("$($current.Name): $($current.Status)", "$($tasks.Count - $open.Count) of $($tasks.Count) tasks done", '', 'Open tasks:') +
        @($open | ForEach-Object { "- $($_.Task) ($($_.Assignee), due $($_.Due))" })
    $lines -join [Environment]::NewLine | Set-Clipboard
    Show-Status 'Copied a summary to the clipboard'
    Add-Activity 'shared a project summary'
    Update-Views
}

$buttonBell_Click = {
    param ($argumentList, $s, $e)
    $null = Show-formNotifications -Owner $formDashboard
}

$buttonSettings_Click = {
    param ($argumentList, $s, $e)
    $result = Show-formSettings -Owner $formDashboard -Values @{
        textSettingsName   = $settings.Name
        textSettingsRole   = $settings.Role
        toggleSettingsSave = $settings.SaveData
        labelSettingsFile  = "Saved in $dataFile"
    }
    if ($result.DialogResult -ne 'OK') { return }
    $name = "$($result.textSettingsName)".Trim()
    if ($name) { $settings.Name = $name }
    $settings.Role = "$($result.textSettingsRole)".Trim()
    $settings.SaveData = $result.toggleSettingsSave -eq $true
    if ($result.checkSettingsReset -eq $true) {
        Initialize-SampleData
        $script:current = $null
        Select-Project ([math]::Max(0, $listProjects.SelectedIndex))
    }
    Save-Data
    Update-User
    Update-Views
    Show-Status 'Settings saved'
}
#endregion

#region Start
$taskRows = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
$timelineRows = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
$myRows = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
$dueSoonRows = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
$teamRows = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
$reportRows = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
$gridTasks.ItemsSource = $taskRows
$gridTimeline.ItemsSource = $timelineRows
$gridMyTasks.ItemsSource = $myRows
$gridDueSoon.ItemsSource = $dueSoonRows
$gridTeam.ItemsSource = $teamRows
$gridReport.ItemsSource = $reportRows
Enable-Sorting $gridTasks

if (-not (Import-Data)) { Initialize-SampleData }
foreach ($view in 'Project', 'Overview', 'Timeline', 'Files', 'Activity', 'Home', 'MyTasks', 'Calendar', 'Team', 'Reports') { $stale[$view] = $true }
Update-User
Select-Project 0
Update-Bell
#endregion
`);

      // ---------------------------------------------------------------- dialogs
      const dialog = (name, title, w, h, children, script) =>
        project(name, { Title: title, Width: w, Height: h, CanResize: false, CanMinimize: false, CanMaximize: false, ShowInTaskbar: false, RequestedThemeVariant: 'Light' }, children, script);
      /** A click handler that closes the dialog with this DialogResult. */
      const closeWith = (handler, result) => ['', '$' + handler + ' = {', '    param ($argumentList, $s, $e)', `    Close-Dialog '${result}'`, '}', ''].join('\n');

      const taskDialog = dialog('formTask', 'New task', 440, 380, [
        caption('labelNewName', 24, 20, 200, 'Task name'),
        ctl('TextBox', 'textNewName', 24, 40, 392, 32, { Watermark: 'What needs to be done?' }),
        caption('labelNewAssignee', 24, 84, 180, 'Assignee'),
        ctl('ComboBox', 'comboNewAssignee', 24, 104, 190, 32, { Items: MEMBERS }),
        caption('labelNewStatus', 226, 84, 180, 'Status'),
        ctl('ComboBox', 'comboNewStatus', 226, 104, 190, 32, { Items: STATUSES }),
        caption('labelNewDue', 24, 148, 180, 'Due date'),
        ctl('CalendarDatePicker', 'dateNewDue', 24, 168, 190, 32, {}),
        caption('labelNewEstimate', 226, 148, 180, 'Estimate (hours)'),
        ctl('NumericUpDown', 'numericNewEstimate', 226, 168, 190, 32, { Value: 4, Minimum: 0, Maximum: 200 }),
        caption('labelNewPriority', 24, 212, 180, 'Priority'),
        ctl('RadioButton', 'radioNewLow', 24, 232, 80, 32, { Content: 'Low', GroupName: 'newPriority' }),
        ctl('RadioButton', 'radioNewMedium', 110, 232, 100, 32, { Content: 'Medium', GroupName: 'newPriority' }),
        ctl('RadioButton', 'radioNewHigh', 220, 232, 80, 32, { Content: 'High', GroupName: 'newPriority' }),
        caption('labelNewError', 24, 282, 392, '', { Foreground: '#C50F1F' }),
        button('buttonNewOK', 216, 320, 112, 'Add task', 'buttonNewOK_Click', { Classes: 'accent', IsDefault: true }),
        button('buttonNewCancel', 336, 320, 80, 'Cancel', 'buttonNewCancel_Click', { IsCancel: true }),
      ], String.raw`# New task dialog: the dashboard opens it with Show-formTask and reads the values after it closes.

$buttonNewOK_Click = {
    param ($argumentList, $s, $e)
    if (-not "$($textNewName.Text)".Trim()) {
        $labelNewError.Text = 'Enter a task name.'
        return
    }
    Close-Dialog 'OK'
}
` + closeWith('buttonNewCancel_Click', 'Cancel'));

      const settingsDialog = dialog('formSettings', 'Settings', 440, 360, [
        caption('labelSettingsName', 24, 20, 200, 'Display name'),
        ctl('TextBox', 'textSettingsName', 24, 40, 392, 32, {}),
        caption('labelSettingsRole', 24, 84, 200, 'Role'),
        ctl('TextBox', 'textSettingsRole', 24, 104, 392, 32, {}),
        caption('labelSettingsSave', 24, 148, 300, 'Save data between runs'),
        ctl('ToggleSwitch', 'toggleSettingsSave', 24, 166, 160, 32, {}),
        text('labelSettingsFile', 24, 204, 392, 34, '', { FontSize: 11, Foreground: grey, TextWrapping: 'Wrap' }),
        ctl('CheckBox', 'checkSettingsReset', 24, 244, 392, 32, { Content: 'Reset to the sample data' }),
        button('buttonSettingsOK', 232, 300, 96, 'Save', 'buttonSettingsOK_Click', { Classes: 'accent', IsDefault: true }),
        button('buttonSettingsCancel', 336, 300, 80, 'Cancel', 'buttonSettingsCancel_Click', { IsCancel: true }),
      ], '# Settings dialog: opened with Show-formSettings from the dashboard.\n' + closeWith('buttonSettingsOK_Click', 'OK') + closeWith('buttonSettingsCancel_Click', 'Cancel'));

      const notificationsDialog = dialog('formNotifications', 'Notifications', 560, 400, [
        heading('labelNotifyTitle', 24, 16, 512, ''),
        grid('gridNotifications', 24, 52, 512, 272, 'Project | Project\nTask | Task\nDue | Due\nWhen | DaysLeft'),
        button('buttonNotifyClose', 456, 340, 80, 'Close', 'buttonNotifyClose_Click', { Classes: 'accent', IsDefault: true, IsCancel: true }),
      ], String.raw`# Notifications dialog: lists open tasks that are overdue or due within two days.
# It runs inside Show-formNotifications, so it can use the dashboard's functions and data.
$notifyRows = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
foreach ($t in @(Get-NotificationTasks)) { $notifyRows.Add($t.Row) }
$gridNotifications.ItemsSource = $notifyRows
$labelNotifyTitle.Text = if ($notifyRows.Count) { "$($notifyRows.Count) tasks are overdue or due within 2 days" } else { 'Nothing is due in the next 2 days' }
` + closeWith('buttonNotifyClose_Click', 'Close'));

      const confirmDialog = dialog('formConfirm', 'Delete task', 420, 180, [
        text('labelConfirm', 24, 24, 372, 48, '', { TextWrapping: 'Wrap' }),
        button('buttonConfirmDelete', 208, 116, 100, 'Delete', 'buttonConfirmDelete_Click'),
        button('buttonConfirmCancel', 316, 116, 80, 'Cancel', 'buttonConfirmCancel_Click', { Classes: 'accent', IsDefault: true, IsCancel: true }),
      ], '# Confirmation dialog: Show-formConfirm -Values @{ labelConfirm = "..." } returns DialogResult Delete or Cancel.\n' +
        closeWith('buttonConfirmDelete_Click', 'Delete') + closeWith('buttonConfirmCancel_Click', 'Cancel'));

      const p = multi(main, taskDialog, settingsDialog, notificationsDialog, confirmDialog);
      p.layout = 2; // laid out with the Fluent2 container sizes
      return p;
    }),

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

  // The examples were laid out with the Fluent (GliderUI 0.5) container sizes; upgradeLayout keeps
  // their generated margins with the Fluent2 sizes. Applied to every entry, however it is declared.
  GC.EXAMPLES.forEach((e) => {
    const build = e.build;
    e.build = () => GC.upgradeLayout(build());
  });
})();
