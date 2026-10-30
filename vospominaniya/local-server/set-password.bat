@echo off
chcp 65001 >nul
set PYTHONUTF8=1
"%LOCALAPPDATA%\VospominaniyaLocal\.venv\Scripts\python.exe" "%LOCALAPPDATA%\VospominaniyaLocal\server.py" --set-password
pause
