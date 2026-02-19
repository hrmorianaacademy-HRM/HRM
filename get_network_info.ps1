$interfaces = Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress, InterfaceAlias
foreach ($iface in $interfaces) {
    Write-Output "$($iface.IPAddress) - $($iface.InterfaceAlias)"
}
