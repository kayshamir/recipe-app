# Run from an Administrator PowerShell. Only permits Expo on a private local LAN.
# Undo: Remove-NetFirewallRule -Name 'RecipeApp-ExpoGo-8082-Private'
$ErrorActionPreference = 'Stop'
$ruleName = 'RecipeApp-ExpoGo-8082-Private'
$nodeExecutable = (Get-Command node -ErrorAction Stop).Source
if (-not (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -Name $ruleName `
        -DisplayName 'Recipe App Expo Go (TCP 8082, private LAN)' `
        -Direction Inbound -Action Allow -Program $nodeExecutable `
        -Protocol TCP -LocalPort 8082 -Profile Private -RemoteAddress LocalSubnet | Out-Null
}
Get-NetFirewallRule -Name $ruleName | Format-Table Name, Enabled, Profile, Action
