@echo off
echo Installing MedAI - Smart Medicine Locator...
echo.

echo Step 1: Installing server dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing server dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Error installing client dependencies!
    pause
    exit /b 1
)

cd ..

echo.
echo Step 3: Setting up environment...
if not exist .env (
    copy .env.example .env
    echo Environment file created. Please edit .env with your configuration.
)

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo To start the application:
echo   npm run dev
echo.
echo The application will be available at:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
pause