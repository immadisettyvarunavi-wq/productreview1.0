Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Building Reviewly Android APK (.apk)    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Locate Java
if (Test-Path "C:\Program Files\Java\jdk-21") {
    $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
} elseif (Test-Path "C:\Program Files\Android\Android Studio\jbr") {
    $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
}

if (-not $env:ANDROID_HOME) {
    if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
        $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
    } elseif (Test-Path "C:\Users\gsrik\AppData\Local\Android\Sdk") {
        $env:ANDROID_HOME = "C:\Users\gsrik\AppData\Local\Android\Sdk"
    }
}
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

# Update backend dist as well
Write-Host "`n3. Syncing Assets to Backend..." -ForegroundColor Yellow
Copy-Item -Path "$PSScriptRoot\frontend\dist\*" -Destination "$PSScriptRoot\backend\dist\" -Recurse -Force

Write-Host "`n4. Packaging Android APK..." -ForegroundColor Yellow
$hasGradleSdk = $env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)

if ($hasGradleSdk) {
    Set-Location -Path "$PSScriptRoot\frontend\android"
    .\gradlew.bat assembleDebug --no-daemon
    if (Test-Path "$PSScriptRoot\frontend\android\app\build\outputs\apk\debug\app-debug.apk") {
        Copy-Item "$PSScriptRoot\frontend\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "$PSScriptRoot\Reviewly.apk" -Force
    }
} else {
    Write-Host "   Fast-packaging web assets into APK and re-signing with jarsigner..." -ForegroundColor Cyan
    python -c "
import zipfile, shutil
from pathlib import Path

apk = Path(r'$PSScriptRoot/Reviewly.apk')
temp_apk = Path(r'$PSScriptRoot/Reviewly_temp.apk')
web_dir = Path(r'$PSScriptRoot/frontend/android/app/src/main/assets/public')
cap_cfg = Path(r'$PSScriptRoot/frontend/android/app/src/main/assets/capacitor.config.json')

with zipfile.ZipFile(apk, 'r') as zin, zipfile.ZipFile(temp_apk, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        if item.filename.startswith('META-INF/') or item.filename.startswith('assets/public/') or item.filename == 'assets/capacitor.config.json':
            continue
        zout.writestr(item, zin.read(item.filename))
    if cap_cfg.exists():
        zout.writestr('assets/capacitor.config.json', cap_cfg.read_bytes())
    for f in web_dir.rglob('*'):
        if f.is_file():
            zout.writestr('assets/public/' + f.relative_to(web_dir).as_posix(), f.read_bytes())

temp_apk.replace(apk)
"
    # Sign with jarsigner
    $jarsigner = "$env:JAVA_HOME\bin\jarsigner.exe"
    $keystore = "$env:USERPROFILE\.android\debug.keystore"
    if ((Test-Path $jarsigner) -and (Test-Path $keystore)) {
        & $jarsigner -keystore $keystore -storepass android -keypass android -sigalg SHA256withRSA -digestalg SHA-256 "$PSScriptRoot\Reviewly.apk" androiddebugkey
    }
}

if (Test-Path "$PSScriptRoot\Reviewly.apk") {
    Write-Host "`n=========================================" -ForegroundColor Green
    Write-Host " SUCCESS! Android APK generated:         " -ForegroundColor Green
    Write-Host " -> $PSScriptRoot\Reviewly.apk           " -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host "`nBuild failed." -ForegroundColor Red
}
