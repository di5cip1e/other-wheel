---
name: "Commit Task Progress"
description: "Commits current project state with task progress information to Git repository"
trigger: "manual"
enabled: true
---

# Commit Task Progress Hook

This hook commits the current project state to the Git repository with detailed information about completed tasks and progress.

## Hook Behavior

When triggered, this hook will:

1. **Stage all changes** in the working directory
2. **Generate a commit message** that includes:
   - Recently completed tasks
   - Current project status
   - Files modified since last commit
3. **Create a Git commit** with the generated message
4. **Optionally push** to remote repository (if configured)

## Commit Message Format

```
Progress update: [Task Name]

Completed tasks:
- Task X.Y: [Task Description]
- Task X.Z: [Task Description]

Modified files:
- [list of changed files]

Project status: [current phase/milestone]
```

## Usage

- **Manual trigger**: Click the "Run Hook" button in the Agent Hooks panel
- **Automatic trigger**: Can be configured to run after task completion
- **Keyboard shortcut**: Can be assigned via Kiro settings

## Configuration

The hook can be customized by modifying the trigger conditions and commit message template in this file.