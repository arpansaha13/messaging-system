# Script to run database migrations for messaging-system backend
# Usage: .\migrate.ps1 -Command [up|down|status]

param (
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("up", "down", "status")]
    $Command
)

$ErrorActionPreference = "Stop"
$MigrationsDir = "apps/backend-go/migrations"

# Check if migrations directory exists
if (-not (Test-Path -Path $MigrationsDir)) {
    Write-Error "Error: migrations directory not found at $MigrationsDir"
    exit 1
}

# Load environment variables from .env
if (Test-Path -Path ".env") {
    Get-Content .env | Where-Object { $_ -and -not $_.StartsWith("#") } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
    }
}

# Use DATABASE_URL from environment or default
$DbUrl = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
if (-not $DbUrl) {
    $DbUrl = "postgres://user:password@localhost:5432/messaging"
}

switch ($Command) {
    "up" {
        Write-Host "Applying migrations..." -ForegroundColor Cyan
        $files = Get-ChildItem -Path "$MigrationsDir\*.up.sql" | Sort-Object Name
        foreach ($file in $files) {
            Write-Host "Running: $($file.Name)"
            psql $DbUrl -f $file.FullName
        }
        Write-Host "Migrations applied successfully!" -ForegroundColor Green
    }
    "down" {
        Write-Host "Rolling back migrations..." -ForegroundColor Yellow
        # Apply down migrations in reverse order (Descending)
        $files = Get-ChildItem -Path "$MigrationsDir\*.down.sql" | Sort-Object Name -Descending
        foreach ($file in $files) {
            Write-Host "Rolling back: $($file.Name)"
            psql $DbUrl -f $file.FullName
        }
        Write-Host "Migrations rolled back successfully!" -ForegroundColor Green
    }
    "status" {
        Write-Host "Checking migration status..." -ForegroundColor Cyan
        $query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
        psql $DbUrl -c $query
        Write-Host "Status check completed!" -ForegroundColor Green
    }
}
