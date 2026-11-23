# Show-MessageDialog - a modal message box for GliderUI (tested with GliderUI 0.5.0).
# Paste into the GUI Creator Script tab, then call it from an event handler:
#   $answer = Show-MessageDialog -Owner $formMain -Title 'Confirm' -Message 'Delete the files?' -Buttons 'Yes', 'No'
#   if ($answer -eq 'Yes') { ... }
# Returns the text of the button that was clicked, or $null if the dialog was closed with X.
# Uses fully qualified type names, so it works without extra using statements.

function Show-MessageDialog {
    param(
        [GliderUI.Avalonia.Controls.Window]$Owner,
        [string]$Message,
        [string]$Title = 'Message',
        [string[]]$Buttons = @('OK')
    )
    $state = @{ Result = $null }

    $dialog = [GliderUI.Avalonia.Controls.Window]::new()
    $dialog.Title = $Title
    $dialog.Width = 360
    $dialog.SizeToContent = 'Height'
    $dialog.CanResize = $false
    $dialog.CanMinimize = $false
    $dialog.CanMaximize = $false
    $dialog.Topmost = $true
    $dialog.WindowStartupLocation = 'CenterScreen'

    $text = [GliderUI.Avalonia.Controls.TextBlock]::new()
    $text.Text = $Message
    $text.TextWrapping = 'Wrap'

    $buttonPanel = [GliderUI.Avalonia.Controls.StackPanel]::new()
    $buttonPanel.Orientation = 'Horizontal'
    $buttonPanel.HorizontalAlignment = 'Right'
    $buttonPanel.Spacing = 8
    foreach ($label in $Buttons) {
        $b = [GliderUI.Avalonia.Controls.Button]::new()
        $b.Content = $label
        $b.MinWidth = 80
        $b.HorizontalContentAlignment = 'Center'
        if ($label -eq $Buttons[0]) { $b.Classes.Add('accent') }
        $b.AddClick({
                param ($argumentList, $s, $e)
                $state.Result = $s.Content
                $dialog.Close()
            })
        $buttonPanel.Children.Add($b)
    }

    $panel = [GliderUI.Avalonia.Controls.StackPanel]::new()
    $panel.Margin = 24
    $panel.Spacing = 24
    $panel.Children.Add($text)
    $panel.Children.Add($buttonPanel)
    $dialog.Content = $panel

    # Block the owner like a modal dialog; WaitForClosed keeps processing clicks meanwhile.
    if ($Owner) { $Owner.IsEnabled = $false }
    $dialog.Show()
    $dialog.WaitForClosed()
    if ($Owner) { $Owner.IsEnabled = $true }
    $state.Result
}
