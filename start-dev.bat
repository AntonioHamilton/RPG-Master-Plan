@echo off
cd /d "%~dp0"
echo Iniciando RPG Master Plan (modo dev)...
call npm run dev
if errorlevel 1 pause
