<#
    UI Automation helpers for driving a running GliderUI (Avalonia) window like a user would.
    Load in **Windows PowerShell 5.1** (powershell.exe), which ships the UIAutomationClient assemblies:

        powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Import-Module ./tests/tools/UIAutomation.psm1; `$w = Get-UIWindow 'My Title'; Invoke-UIButton `$w 'OK'"

    Why UI Automation: raising Avalonia events from PowerShell with client-created RoutedEventArgs
    crashes the GliderUI server, and main-runspace callbacks only run while the script is inside
    WaitForClosed(). Driving the real window exercises the real event path.
#>
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$script:AE = [System.Windows.Automation.AutomationElement]
$script:TS = [System.Windows.Automation.TreeScope]
$script:CT = [System.Windows.Automation.ControlType]

function New-Condition($Property, $Value) { New-Object System.Windows.Automation.PropertyCondition($Property, $Value) }

function Get-UIWindow {
    <# Waits (up to -TimeoutSeconds, default 30 - the first GliderUI start can be slow) for a top-level window with this title. #>
    param ([Parameter(Mandatory)][string]$Title, [int]$TimeoutSeconds = 30)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $w = $script:AE::RootElement.FindFirst($script:TS::Children, (New-Condition $script:AE::NameProperty $Title))
        if ($w) { return $w }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)
    throw "Window '$Title' not found within $TimeoutSeconds s"
}

function Find-UIElement {
    <# First descendant by name (button text, label text, checkbox content ...). #>
    param ([Parameter(Mandatory)]$Window, [Parameter(Mandatory)][string]$Name)
    $Window.FindFirst($script:TS::Descendants, (New-Condition $script:AE::NameProperty $Name))
}

function Find-UIElementsByType {
    <# All descendants of a control type: Edit, Text, Button, CheckBox, ComboBox, ProgressBar, ListItem ... #>
    param ([Parameter(Mandatory)]$Window, [Parameter(Mandatory)][string]$Type)
    @($Window.FindAll($script:TS::Descendants, (New-Condition $script:AE::ControlTypeProperty ($script:CT::$Type))))
}

function Invoke-UIButton {
    param ([Parameter(Mandatory)]$Window, [Parameter(Mandatory)][string]$Name, [int]$WaitMs = 800)
    $el = Find-UIElement $Window $Name
    if (-not $el) { throw "Element '$Name' not found" }
    $el.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    Start-Sleep -Milliseconds $WaitMs
}

function Set-UIText {
    <# Sets the text of the Nth Edit (TextBox) in document order. #>
    param ([Parameter(Mandatory)]$Window, [Parameter(Mandatory)][int]$Index, [Parameter(Mandatory)][AllowEmptyString()][string]$Text)
    (Find-UIElementsByType $Window Edit)[$Index].GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).SetValue($Text)
}

function Get-UIText {
    <# Value of the Nth Edit (TextBox). #>
    param ([Parameter(Mandatory)]$Window, [Parameter(Mandatory)][int]$Index)
    (Find-UIElementsByType $Window Edit)[$Index].GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value
}

function Get-UILabels {
    <# Texts of all TextBlocks (labels) in the window. #>
    param ([Parameter(Mandatory)]$Window)
    Find-UIElementsByType $Window Text | ForEach-Object { $_.Current.Name }
}

function Switch-UIToggle {
    <# Toggles a CheckBox / ToggleSwitch / RadioButton by its content text. #>
    param ([Parameter(Mandatory)]$Window, [Parameter(Mandatory)][string]$Name)
    (Find-UIElement $Window $Name).GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern).Toggle()
}

function Select-UIComboItem {
    <# Opens the Nth ComboBox and selects the item with this text (the popup is a separate root element). #>
    param ([Parameter(Mandatory)]$Window, [int]$Index = 0, [Parameter(Mandatory)][string]$Item)
    (Find-UIElementsByType $Window ComboBox)[$Index].GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern).Expand()
    Start-Sleep -Milliseconds 400
    $cond = New-Object System.Windows.Automation.AndCondition((New-Condition $script:AE::NameProperty $Item), (New-Condition $script:AE::ControlTypeProperty $script:CT::ListItem))
    $el = $script:AE::RootElement.FindFirst($script:TS::Descendants, $cond)
    if (-not $el) { throw "Combo item '$Item' not found" }
    $el.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern).Select()
    Start-Sleep -Milliseconds 300
}

function Close-UIWindow {
    param ([Parameter(Mandatory)]$Window)
    $Window.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern).Close()
}

Export-ModuleMember -Function Get-UIWindow, Find-UIElement, Find-UIElementsByType, Invoke-UIButton, Set-UIText, Get-UIText, Get-UILabels, Switch-UIToggle, Select-UIComboItem, Close-UIWindow
