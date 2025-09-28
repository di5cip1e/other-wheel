# Commit Progress Script
# Automatically commits project progress with task status information

param(
    [string]$TaskName = "",
    [string]$Message = ""
)

# Get current date and time
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Read the tasks file to get current status
$tasksFile = ".kiro/specs/wheel-within-wheel-game/tasks.md"
if (Test-Path $tasksFile) {
    $tasksContent = Get-Content $tasksFile -Raw
    
    # Count completed tasks
    $completedTasks = ($tasksContent | Select-String -Pattern "- \[x\]" -AllMatches).Matches.Count
    $totalTasks = ($tasksContent | Select-String -Pattern "- \[\s*[\sx]\s*\]" -AllMatches).Matches.Count
    
    $progress = if ($totalTasks -gt 0) { [math]::Round(($completedTasks / $totalTasks) * 100, 1) } else { 0 }
    
    Write-Host "Project Progress: $completedTasks/$totalTasks tasks completed ($progress%)"
}

# Generate commit message
$commitMessage = if ($TaskName -ne "") {
    if ($Message -ne "") {
        "Complete task: $TaskName`n`n$Message`n`nProgress: $completedTasks/$totalTasks tasks ($progress%)"
    } else {
        "Complete task: $TaskName`n`nProgress: $completedTasks/$totalTasks tasks ($progress%)"
    }
} else {
    if ($Message -ne "") {
        "Progress update: $Message`n`nProgress: $completedTasks/$totalTasks tasks ($progress%)"
    } else {
        "Progress update - $timestamp`n`nProgress: $completedTasks/$totalTasks tasks ($progress%)"
    }
}

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Staging changes..."
    git add .
    
    Write-Host "Creating commit..."
    git commit -m $commitMessage
    
    Write-Host "Commit created successfully!"
    Write-Host "Commit message:"
    Write-Host $commitMessage
} else {
    Write-Host "No changes to commit."
}

# Optional: Push to remote (uncomment if desired)
# Write-Host "Pushing to remote..."
# git push