@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-mobile.ps1" %*
exit /b %ERRORLEVEL%
