@echo off
echo ====================================
echo  Honeypot Management Dashboard
echo ====================================
echo.
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting the dashboard...
echo Dashboard will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

python run.py

pause
