param(
    [string]$DbHost = $(if ($env:APP_DB_HOST) { $env:APP_DB_HOST } else { "localhost" }),
    [string]$DbName = $(if ($env:APP_DB_NAME) { $env:APP_DB_NAME } else { "opendocman" }),
    [string]$DbUser = $(if ($env:APP_DB_USER) { $env:APP_DB_USER } else { "odmuser" }),
    [string]$DbPass = $(if ($env:APP_DB_PASS) { $env:APP_DB_PASS } else { "odm123" }),
    [string]$StorageDir = $(if ($env:ODM_STORAGE_DIR) { $env:ODM_STORAGE_DIR } else { "" }),
    [switch]$Yes,
    [switch]$SkipFrontendInstall,
    [switch]$SkipBuild,
    [switch]$SkipDataDirUpdate,
    [switch]$RequireAdmin
)

$ErrorActionPreference = "Stop"

$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $AppRoot "frontend"
$BackendDir = Join-Path $AppRoot "backend"
$SchemaPath = Join-Path $AppRoot "database_schema.sql"
$InstallHelp = Join-Path $AppRoot "install.txt"

if ([string]::IsNullOrWhiteSpace($StorageDir)) {
    $StorageDir = Join-Path (Split-Path -Parent $AppRoot) "document-storage"
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Fail {
    param([string]$Message)
    Write-Host "Error: $Message" -ForegroundColor Red
    Write-Host "See install instructions: $InstallHelp" -ForegroundColor Yellow
    exit 1
}

function Confirm-Step {
    param([string]$Prompt)

    if ($Yes) {
        return $true
    }

    $answer = Read-Host "$Prompt [y/N]"
    return @("y", "Y", "yes", "YES") -contains $answer
}

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Ensure-Command {
    param([string]$CommandName)

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        return $false
    }

    return $true
}

function Check-RequiredCommands {
    $missing = @()

    foreach ($commandName in @("php", "node", "npm", "mysql")) {
        if (-not (Ensure-Command $commandName)) {
            $missing += $commandName
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host "Error: Missing required command(s): $($missing -join ', ')" -ForegroundColor Red
        Write-Host "Install the missing software and ensure it is available in PATH." -ForegroundColor Yellow
        Write-Host "See install instructions: $InstallHelp" -ForegroundColor Yellow
        exit 1
    }
}

function Invoke-MySql {
    param(
        [string[]]$Arguments,
        [string]$InputFile = ""
    )

    $mysqlArgs = @("-h", $DbHost, "-u", $DbUser)

    if (-not [string]::IsNullOrEmpty($DbPass)) {
        $mysqlArgs += "-p$DbPass"
    }

    $mysqlArgs += $Arguments

    if ([string]::IsNullOrEmpty($InputFile)) {
        & mysql @mysqlArgs
    }
    else {
        Get-Content -Raw $InputFile | & mysql @mysqlArgs
    }

    if ($LASTEXITCODE -ne 0) {
        Fail "mysql command failed."
    }
}

function Invoke-MySqlScalar {
    param([string]$Query)

    $mysqlArgs = @("-h", $DbHost, "-u", $DbUser)

    if (-not [string]::IsNullOrEmpty($DbPass)) {
        $mysqlArgs += "-p$DbPass"
    }

    $mysqlArgs += @("-N", "-B", "-e", $Query)
    $result = & mysql @mysqlArgs

    if ($LASTEXITCODE -ne 0) {
        Fail "mysql command failed."
    }

    return $result
}

function Sql-Quote {
    param([string]$Value)
    return "'" + $Value.Replace("\", "\\").Replace("'", "\'") + "'"
}

Write-Step "Checking project structure"
if (-not (Test-Path $FrontendDir -PathType Container)) {
    Fail "frontend directory not found at $FrontendDir"
}
if (-not (Test-Path $BackendDir -PathType Container)) {
    Fail "backend directory not found at $BackendDir"
}
if (-not (Test-Path $SchemaPath -PathType Leaf)) {
    Fail "database_schema.sql not found at $SchemaPath"
}

Write-Step "Checking administrator privileges"
$isAdmin = Test-Admin
if ($RequireAdmin -and -not $isAdmin) {
    if (Confirm-Step "This setup was run without Administrator privileges. Relaunch as Administrator now?") {
        $script = $MyInvocation.MyCommand.Path
        $argList = @("-ExecutionPolicy", "Bypass", "-File", "`"$script`"", "-DbHost", $DbHost, "-DbName", $DbName, "-DbUser", $DbUser, "-DbPass", $DbPass, "-StorageDir", "`"$StorageDir`"", "-RequireAdmin")
        if ($Yes) { $argList += "-Yes" }
        if ($SkipFrontendInstall) { $argList += "-SkipFrontendInstall" }
        if ($SkipBuild) { $argList += "-SkipBuild" }
        if ($SkipDataDirUpdate) { $argList += "-SkipDataDirUpdate" }
        Start-Process powershell.exe -Verb RunAs -ArgumentList $argList
        exit 0
    }
    else {
        Fail "Administrator privileges were requested but not granted."
    }
}
elseif (-not $isAdmin) {
    Write-Host "Not running as Administrator. That is usually fine if MySQL access and storage permissions are already configured." -ForegroundColor Yellow
}
else {
    Write-Host "Running with Administrator privileges."
}

Write-Step "Checking required tools"
Check-RequiredCommands

& php -v | Select-Object -First 1
& node -v
& npm -v
& mysql --version

Write-Step "Preparing document storage"
New-Item -ItemType Directory -Force -Path $StorageDir | Out-Null
if (-not (Test-Path $StorageDir -PathType Container)) {
    Fail "Storage directory could not be created: $StorageDir"
}

$testFile = Join-Path $StorageDir ".write-test"
try {
    Set-Content -Path $testFile -Value "ok" -NoNewline
    Remove-Item $testFile -Force
}
catch {
    Fail "Storage directory is not writable: $StorageDir. Rerun PowerShell as Administrator or choose a writable path."
}

Write-Host "Storage directory: $StorageDir"

Write-Step "Checking MySQL connection"
Invoke-MySql -Arguments @("-e", "SELECT 1;") | Out-Null

Write-Step "Preparing fresh database"
$existingDb = Invoke-MySqlScalar "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DbName';"

if ($existingDb -eq $DbName) {
    if (-not (Confirm-Step "Database '$DbName' already exists. Drop and recreate it as a fresh database? This deletes existing data.")) {
        Fail "Fresh database setup cancelled."
    }

    Invoke-MySql -Arguments @("-e", "DROP DATABASE ``$DbName``;")
}

Invoke-MySql -Arguments @("-e", "CREATE DATABASE ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")

Write-Step "Importing fresh schema"
Invoke-MySql -Arguments @($DbName) -InputFile $SchemaPath

Write-Step "Verifying required tables"
$requiredTables = @("app_documents", "odm_data", "odm_settings")
foreach ($table in $requiredTables) {
    $found = Invoke-MySqlScalar "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '$DbName' AND TABLE_NAME = '$table';"
    if ($found -ne $table) {
        Write-Host "Warning: required table '$table' was not found." -ForegroundColor Yellow
    }
}

if (-not $SkipDataDirUpdate) {
    Write-Step "Updating OpenDocMan dataDir setting if present"
    $storageForSql = (Resolve-Path $StorageDir).Path + "\"
    $storageForSql = $storageForSql.Replace("\", "/")
    $quotedStorage = Sql-Quote $storageForSql
    Invoke-MySql -Arguments @($DbName, "-e", "UPDATE odm_settings SET value = $quotedStorage WHERE name = 'dataDir';")
}

if (-not $SkipFrontendInstall) {
    Write-Step "Installing frontend dependencies"
    Push-Location $FrontendDir
    try {
        if (Test-Path "package-lock.json" -PathType Leaf) {
            & npm ci
        }
        else {
            & npm install
        }
        if ($LASTEXITCODE -ne 0) {
            Fail "npm install failed."
        }

        if (-not $SkipBuild) {
            Write-Step "Building frontend"
            & npm run build
            if ($LASTEXITCODE -ne 0) {
                Fail "npm run build failed."
            }
        }
    }
    finally {
        Pop-Location
    }
}

Write-Step "Setup complete"
Write-Host ""
Write-Host "Run the PHP API in one PowerShell window:"
Write-Host ""
Write-Host "  cd `"$AppRoot`""
Write-Host "  `$env:APP_DB_HOST=`"$DbHost`"; `$env:APP_DB_NAME=`"$DbName`"; `$env:APP_DB_USER=`"$DbUser`"; `$env:APP_DB_PASS=`"$DbPass`"; `$env:ODM_STORAGE_DIR=`"$StorageDir`"; php -S localhost:8000 -t backend"
Write-Host ""
Write-Host "Run the React app in another PowerShell window:"
Write-Host ""
Write-Host "  cd `"$FrontendDir`""
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Open:"
Write-Host ""
Write-Host "  http://127.0.0.1:5173/"
Write-Host ""
Write-Host "Fresh database note:"
Write-Host "  This script imports database_schema.sql only. It does not import opendocman_backup.sql or copied machine data."
