Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Building Reviewly Android APK (.apk)    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\gsrik\AppData\Local\Android\Sdk"
$env:GRADLE_USER_HOME = "d:\.gradle"

Set-Location -Path "$PSScriptRoot\frontend"
Write-Host "`n1. Building Frontend Assets (npm run build)..." -ForegroundColor Yellow
if (-not $env:VITE_API_URL) {
    $env:VITE_API_URL = "https://productreview1-0.onrender.com/api/v1"
}
Write-Host "   Using Backend API URL: $env:VITE_API_URL" -ForegroundColor Cyan
npm run build

Write-Host "`n2. Syncing Capacitor Android Project..." -ForegroundColor Yellow
npx cap sync android

Set-Location -Path "$PSScriptRoot\frontend\android"
Write-Host "`n3. Compiling Android APK with Gradle..." -ForegroundColor Yellow
.\gradlew.bat assembleDebug --no-daemon

if (Test-Path "$PSScriptRoot\frontend\android\app\build\outputs\apk\debug\app-debug.apk") {
    Copy-Item "$PSScriptRoot\frontend\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "$PSScriptRoot\Reviewly.apk" -Force
    Write-Host "`n=========================================" -ForegroundColor Green
    Write-Host " SUCCESS! Android APK generated:         " -ForegroundColor Green
    Write-Host " -> $PSScriptRoot\Reviewly.apk           " -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host "`nBuild failed. Check Gradle output above." -ForegroundColor Red
}
