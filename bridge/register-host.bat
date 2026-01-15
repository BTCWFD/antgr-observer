@echo off
SETLOCAL
set HOST_NAME=com.antigravity.observer.bridge
set SCRIPT_DIR=%~dp0
set MANIFEST_PATH=%SCRIPT_DIR%host-manifest.json

echo [ANTGR] Registering Native Messaging Host...
echo [ANTGR] Host Name: %HOST_NAME%
echo [ANTGR] Manifest: %MANIFEST_PATH%

REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\%HOST_NAME%" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Bridge registered. Restart Chrome to apply changes.
) else (
    echo [ERROR] Failed to register. Try running as Administrator.
)
pause
