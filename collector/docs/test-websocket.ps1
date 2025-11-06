# Script PowerShell de test pour envoyer des erreurs de test via l'API Avalon
# Usage: .\test-websocket.ps1 [nombre_d_erreurs]

param(
    [int]$NumErrors = 5
)

$AVALON_URL = "http://localhost:3000"

Write-Host "🚀 Envoi de $NumErrors erreurs de test à Avalon..." -ForegroundColor Green
Write-Host ""

$LEVELS = @("error", "warning", "info", "fatal")
$SERVICES = @("frontend-app", "backend-api", "worker-service", "auth-service")
$MESSAGES = @(
    "Database connection timeout",
    "Invalid user credentials",
    "Payment processing failed",
    "Cache server unreachable",
    "File upload error",
    "API rate limit exceeded"
)

for ($i = 1; $i -le $NumErrors; $i++) {
    # Sélection aléatoire
    $level = $LEVELS | Get-Random
    $service = $SERVICES | Get-Random
    $message = $MESSAGES | Get-Random
    $lineNumber = Get-Random -Minimum 1 -Maximum 100
    $columnNumber = Get-Random -Minimum 1 -Maximum 50
    $userId = Get-Random -Minimum 1 -Maximum 100
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

    Write-Host "📤 Envoi erreur $i/$NumErrors - [$level] $service : $message" -ForegroundColor Yellow

    $body = @{
        service = $service
        error = @{
            message = $message
            stack = "Error: $message`n    at Object.<anonymous> (/app/index.js:${lineNumber}:${columnNumber})`n    at Module._compile (internal/modules/cjs/loader.js:999:30)`n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)"
            path = "/api/v1/test"
            method = "POST"
        }
        level = $level
        metadata = @{
            userId = "user-$userId"
            sessionId = "session-$timestamp"
            environment = "test"
        }
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$AVALON_URL/report" -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ Erreur $i envoyée avec succès (ID: $($response.id))" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Échec de l'envoi de l'erreur $i : $_" -ForegroundColor Red
    }

    # Délai entre les envois
    Start-Sleep -Milliseconds 500
    Write-Host ""
}

Write-Host ""
Write-Host "✨ Test terminé ! $NumErrors erreurs ont été envoyées." -ForegroundColor Green
Write-Host "💡 Ouvrez le client WebSocket (docs/websocket-client-example.html) pour voir les notifications en temps réel." -ForegroundColor Cyan
