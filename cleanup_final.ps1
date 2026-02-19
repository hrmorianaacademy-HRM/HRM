# Move attached_assets to a backup location
Move-Item attached_assets attached_assets_backup -ErrorAction SilentlyContinue

# Remove current git
Remove-Item -Recurse -Force .git

# Initialize fresh
git init

# Add all files (attached_assets is now gone)
git add .

# Commit
git commit -m "Initial commit - HRM application"

# Check size
git count-objects -vH

# Restore assets (but they won't be tracked)
Move-Item attached_assets_backup attached_assets -ErrorAction SilentlyContinue
