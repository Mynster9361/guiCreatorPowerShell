/* GUI Creator - code snippets for the Script tab ("Insert snippet").
 * Every snippet is a pattern that is known to work with GliderUI (taken from the GliderUI
 * examples or tested while building GUI Creator). They are filled in with the names of
 * the controls in the current form where possible.
 * ctx = { form, owner, first(type, fallback), dialogs: [names], hasPages, isDialog } */
(function () {
  'use strict';
  const GC = (window.GC = window.GC || {});

  GC.SNIPPETS = [
    {
      group: 'Basics',
      name: 'Event handler (script block)',
      description: 'A handler you can wire to any event in the Events tab.',
      code: (c) => `$${c.first('Button', 'button1')}_Click = {
    param ($argumentList, $s, $e)
    # $s is the control that raised the event

}`,
    },
    {
      group: 'Basics',
      name: 'Read and validate input',
      description: 'Trim a TextBox value and show a message in a label when it is empty.',
      code: (c) => `$value = $${c.first('TextBox', 'textbox1')}.Text.Trim()
if (-not $value) {
    $${c.first('TextBlock', 'label1')}.Text = 'Please enter a value first.'
    return
}`,
    },
    {
      group: 'Basics',
      name: 'Change a color',
      description: 'Set Foreground/Background with a SolidColorBrush (any [Colors] name).',
      code: (c) => `$${c.first('TextBlock', 'label1')}.Foreground = [SolidColorBrush]::new([Colors]::IndianRed, 1)`,
    },
    {
      group: 'Lists and data',
      name: 'Fill a ComboBox / ListBox',
      description: 'Replace the items of a ComboBox or ListBox from code.',
      code: (c) => {
        const n = c.first('ComboBox', '') || c.first('ListBox', 'combobox1');
        return `$${n}.Items.Clear()
foreach ($item in 'Apple', 'Banana', 'Orange') {
    $${n}.Items.Add($item) | Out-Null
}
$${n}.SelectedIndex = 0`;
      },
    },
    {
      group: 'Lists and data',
      name: 'Fill a DataGrid with objects',
      description: 'Bind objects to a DataGrid. Property names must match the Columns of the DataGrid.',
      code: (c) => `# DataSource is the type GliderUI can bind; ObservableCollection updates the grid on Add/Remove.
$rows = [GliderUI.System.Collections.ObjectModel.ObservableCollection[DataSource]]::new()
Get-Service | Select-Object -First 50 | ForEach-Object {
    $rows.Add([DataSource]@{ Name = $_.Name; Value = [string]$_.Status })
}
$${c.first('DataGrid', 'datagrid1')}.ItemsSource = $rows`,
    },
    {
      group: 'Lists and data',
      name: 'Selected DataGrid rows',
      description: 'Loop over the rows the user selected.',
      code: (c) => `foreach ($row in @($${c.first('DataGrid', 'datagrid1')}.SelectedItems)) {
    Write-Host $row.Name
}`,
    },
    {
      group: 'Long-running work',
      name: 'Disable buttons while a handler runs',
      description: 'An [EventCallback] that disables controls until the handler has finished.',
      code: (c) => {
        const b = c.first('Button', 'button1');
        return `$${b}_Click = [EventCallback]@{
    DisabledControlsWhileProcessing = @($${b})
    ScriptBlock = {
        param ($argumentList, $s, $e)
        Start-Sleep -Seconds 2   # long work here
    }
}`;
      },
    },
    {
      group: 'Long-running work',
      name: 'Progress bar loop',
      description: 'Update a ProgressBar and a status label while working.',
      code: (c) => `$items = 1..20
$i = 0
foreach ($item in $items) {
    $i++
    $${c.first('TextBlock', 'label1')}.Text = "Working on $item ($i of $($items.Count))..."
    $${c.first('ProgressBar', 'progressbar1')}.Value = $i / $items.Count * 100
    Start-Sleep -Milliseconds 100   # work here
}
$${c.first('TextBlock', 'label1')}.Text = 'Done'`,
    },
    {
      group: 'Long-running work',
      name: 'Background work with cancel',
      description: 'Run work on a background runspace so other buttons (e.g. Cancel) keep working.',
      code: (c) => {
        const b = c.first('Button', 'button1');
        return `# Objects used from the background runspace go into a synchronized hashtable.
$sync = [Hashtable]::Synchronized(@{ Cancel = $false })
$sync.ProgressBar = $${c.first('ProgressBar', 'progressbar1')}

$${b}_Click = [EventCallback]@{
    RunspaceMode = 'RunspacePoolAsyncUI'          # runs on a background thread
    DisabledControlsWhileProcessing = @($${b})
    ArgumentList = $sync
    ScriptBlock = {
        param ($sync)
        $sync.Cancel = $false
        foreach ($i in 1..100) {
            if ($sync.Cancel) { break }
            $sync.ProgressBar.Value = $i         # GliderUI properties are thread-safe
            Start-Sleep -Milliseconds 30
        }
    }
}
# In a Cancel button's Click handler:  $sync.Cancel = $true`;
      },
    },
    {
      group: 'Dialogs',
      name: 'Confirmation box (Yes / No)',
      description: 'A ready-made modal message box. Paste the function once, then call it from any handler.',
      code: (c) => `function Show-MessageDialog {
    param ($Owner, [string]$Message, [string]$Title = 'Message', [string[]]$Buttons = @('OK'))
    $state = @{ Result = $null }
    $dialog = [Window]::new()
    $dialog.Title = $Title
    $dialog.Width = 360
    $dialog.SizeToContent = 'Height'
    $dialog.CanResize = $false
    $dialog.Topmost = $true
    $dialog.WindowStartupLocation = 'CenterScreen'
    $text = [TextBlock]::new()
    $text.Text = $Message
    $text.TextWrapping = 'Wrap'
    $buttonPanel = [StackPanel]::new()
    $buttonPanel.Orientation = 'Horizontal'
    $buttonPanel.HorizontalAlignment = 'Right'
    $buttonPanel.Spacing = 8
    foreach ($label in $Buttons) {
        $b = [Button]::new()
        $b.Content = $label
        $b.MinWidth = 80
        $b.HorizontalContentAlignment = 'Center'
        if ($label -eq $Buttons[0]) { $b.Classes.Add('accent') }
        $b.AddClick({ param ($argumentList, $s, $e) $state.Result = $s.Content; $dialog.Close() })
        $buttonPanel.Children.Add($b)
    }
    $panel = [StackPanel]::new()
    $panel.Margin = 24
    $panel.Spacing = 24
    $panel.Children.Add($text)
    $panel.Children.Add($buttonPanel)
    $dialog.Content = $panel
    if ($Owner) { $Owner.IsEnabled = $false }
    $dialog.Show()
    $dialog.WaitForClosed()
    if ($Owner) { $Owner.IsEnabled = $true }
    $state.Result
}

# Usage (in a handler):
# $answer = Show-MessageDialog -Owner $${c.owner} -Title 'Confirm' -Message 'Continue?' -Buttons 'Yes', 'No'
# if ($answer -eq 'Yes') { ... }`,
    },
    {
      group: 'Dialogs',
      name: 'Show a dialog form and use the result',
      description: 'Open one of the dialog forms of this project (add one with + Dialog).',
      available: (c) => c.dialogs.length > 0,
      code: (c) => `$result = Show-${c.dialogs[0]} -Owner $${c.owner}
if ($result.DialogResult -eq 'OK') {
    # $result also has the value of every input control of the dialog
    $result | Format-List | Out-String | Write-Host
}`,
    },
    {
      group: 'Dialogs',
      name: 'Close this dialog with a result',
      description: 'Inside a dialog form: close it and set DialogResult.',
      available: (c) => c.isDialog,
      code: () => `Close-Dialog 'OK'`,
    },
    {
      group: 'Dialogs',
      name: 'Open file picker',
      description: "Let the user pick a file with the window's StorageProvider.",
      code: (c) => `$options = [GliderUI.Avalonia.Platform.Storage.FilePickerOpenOptions]::new()
$options.Title = 'Pick a file'
$files = $${c.form}.StorageProvider.OpenFilePickerAsync($options).WaitForCompleted()
if ($files) {
    $${c.first('TextBox', 'textbox1')}.Text = $files.Path.LocalPath
}`,
    },
    {
      group: 'Dialogs',
      name: 'Save file picker',
      description: 'Ask where to save, then write a text file.',
      code: (c) => `$options = [GliderUI.Avalonia.Platform.Storage.FilePickerSaveOptions]::new()
$options.Title = 'Save as'
$options.SuggestedFileName = 'report'
$options.DefaultExtension = '.txt'
$file = $${c.form}.StorageProvider.SaveFilePickerAsync($options).WaitForCompleted()
if ($file) {
    Set-Content -LiteralPath $file.Path.LocalPath -Value $${c.first('TextBox', 'textbox1')}.Text -Encoding utf8
}`,
    },
    {
      group: 'Dialogs',
      name: 'Folder picker',
      description: 'Let the user pick a folder.',
      code: (c) => `$options = [GliderUI.Avalonia.Platform.Storage.FolderPickerOpenOptions]::new()
$options.Title = 'Pick a folder'
$folder = $${c.form}.StorageProvider.OpenFolderPickerAsync($options).WaitForCompleted()
if ($folder) {
    $${c.first('TextBox', 'textbox1')}.Text = $folder.Path.LocalPath
}`,
    },
    {
      group: 'Window',
      name: 'Wizard Next / Back',
      description: 'Move between pages of a Pages container and update the buttons.',
      available: (c) => c.hasPages,
      code: (c) => {
        const p = c.first('Pages', 'pages1');
        return `# Wire these to the Click events of your Next and Back buttons.
$buttonNext_Click = {
    param ($argumentList, $s, $e)
    Set-Page $${p} -Next
    $page = Get-Page $${p}          # 0-based index of the visible page
}

$buttonBack_Click = {
    param ($argumentList, $s, $e)
    Set-Page $${p} -Previous
}`;
      },
    },
    {
      group: 'Window',
      name: 'Remember settings between runs',
      description: 'Load values when the window opens and save them when it closes (JSON next to the script).',
      code: (c) => {
        const t = c.first('TextBox', 'textbox1');
        return `$settingsFile = Join-Path $PSScriptRoot 'settings.json'

$${c.form}_Opened = {
    param ($argumentList, $s, $e)
    if (Test-Path $settingsFile) {
        $settings = Get-Content $settingsFile -Raw | ConvertFrom-Json
        $${t}.Text = $settings.${t}
    }
}

$${c.form}_Closing = {
    param ($argumentList, $s, $e)
    @{ ${t} = $${t}.Text } | ConvertTo-Json | Set-Content $settingsFile
}
# Wire ${c.form}_Opened / _Closing in the form's Events tab.`;
      },
    },
    {
      group: 'Window',
      name: 'Close the window',
      description: 'Close this window (ends the script for the startup form).',
      code: (c) => `$${c.form}.Close()`,
    },
  ];
})();
