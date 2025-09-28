@echo off
REM Quick commit script for task progress
REM Usage: commit-progress.bat [task-name] [message]

if "%~1"=="" (
    powershell -ExecutionPolicy Bypass -File "scripts/commit-progress.ps1"
) else if "%~2"=="" (
    powershell -ExecutionPolicy Bypass -File "scripts/commit-progress.ps1" -TaskName "%~1"
) else (
    powershell -ExecutionPolicy Bypass -File "scripts/commit-progress.ps1" -TaskName "%~1" -Message "%~2"
)

pause