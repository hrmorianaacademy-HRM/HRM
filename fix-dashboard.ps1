$content = Get-Content 'client\src\pages\dashboard.tsx' -Raw
$content = $content -replace 'user\?\.role', '(user as any)?.role'
$content = $content -replace 'user\?\.id', '(user as any)?.id'
$content = $content -replace '\(total, lead\)', '(total: any, lead: any)'
$content = $content -replace 'notificationsData\?\.data', '(notificationsData as any)?.data'  
$content = $content -replace 'recentNotifications\.length', '(recentNotifications as any[])?.length'
$content = $content -replace 'recentNotifications\.slice', '(recentNotifications as any[])?.slice'
$content | Set-Content 'client\src\pages\dashboard.tsx' -NoNewline
Write-Host "Replacement complete"
