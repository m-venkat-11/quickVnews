@echo off
REM ============================================================
REM  PRISM CURRENT — Windows Task Scheduler Setup
REM  Creates a scheduled task that runs live ingestion every 6 hours.
REM  Run this script AS ADMINISTRATOR.
REM ============================================================

set PROJECT_DIR=%~dp0..
set NODE_PATH=node

echo.
echo  PRISM CURRENT — Scheduler Setup
echo  ================================
echo.
echo  This will create a Windows Scheduled Task named "PrismCurrentIngest"
echo  that runs every 6 hours (00:30, 06:30, 12:30, 18:30 IST).
echo.
echo  Project directory: %PROJECT_DIR%
echo.

REM Delete existing task if present
schtasks /Delete /TN "PrismCurrentIngest" /F >nul 2>&1

REM Create the task: runs every 6 hours starting at 00:30 (30 min buffer after slot)
REM The /RI 360 means repeat every 360 minutes (6 hours)
schtasks /Create ^
  /TN "PrismCurrentIngest" ^
  /TR "\"%NODE_PATH%\" \"%PROJECT_DIR%\scripts\ingest-once.mjs\" --live" ^
  /SC DAILY ^
  /ST 00:30 ^
  /RI 360 ^
  /DU 24:00 ^
  /F

if %ERRORLEVEL% EQU 0 (
  echo.
  echo  [OK] Scheduled task "PrismCurrentIngest" created successfully!
  echo  It will run at 00:30, 06:30, 12:30, 18:30 IST daily.
  echo.
  echo  To verify:  schtasks /Query /TN "PrismCurrentIngest"
  echo  To remove:  schtasks /Delete /TN "PrismCurrentIngest" /F
  echo  To run now: schtasks /Run /TN "PrismCurrentIngest"
) else (
  echo.
  echo  [ERROR] Failed to create scheduled task.
  echo  Make sure you're running this as Administrator.
)

pause
