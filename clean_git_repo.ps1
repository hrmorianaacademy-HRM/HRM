# Clean Git Repository Script - Simple Version
# Removes large files from Git history

Write-Host "Git Repository Cleanup Tool" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Check if in git repo
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: Not in a Git repository!" -ForegroundColor Red
    exit 1
}

# Show current size
Write-Host "Current Git Size:" -ForegroundColor Yellow
git count-objects -vH
Write-Host ""

# Confirm
Write-Host "This will create a fresh Git repository with clean history." -ForegroundColor Yellow
Write-Host "Your old .git will be backed up to .git-backup`n" -ForegroundColor Yellow
$confirm = Read-Host "Continue? (Y/N)"

if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled" -ForegroundColor Red
    exit 0
}

# Backup
Write-Host "`nBacking up .git folder..." -ForegroundColor Cyan
if (Test-Path ".git-backup") {
    Remove-Item -Recurse -Force ".git-backup"
}
Rename-Item ".git" ".git-backup"
Write-Host "Done: Backup created" -ForegroundColor Green

# Initialize fresh repo
Write-Host "`nCreating fresh repository..." -ForegroundColor Cyan
git init
Write-Host "Done: Repository initialized" -ForegroundColor Green

# Add files
Write-Host "`nAdding files..." -ForegroundColor Cyan
git add .
Write-Host "Done: Files staged" -ForegroundColor Green

# Commit
Write-Host "`nCreating commit..." -ForegroundColor Cyan
git commit -m "Initial commit - HRM application"
Write-Host "Done: Commit created" -ForegroundColor Green

# Show new size
Write-Host "`nNew Git Size:" -ForegroundColor Green
git count-objects -vH

Write-Host "`n=== Cleanup Complete ===" -ForegroundColor Green
Write-Host "`nNext: Push to GitHub with:" -ForegroundColor Cyan
Write-Host "  git remote add origin https://github.com/Vcodez1/HRM_TEST.git" -ForegroundColor White
Write-Host "  git push -f origin main`n" -ForegroundColor White
