@echo off
title HEAL LINK - Local Runner
cd /d "%~dp0"
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
pause
