#!/bin/bash

# Script de test pour envoyer des erreurs de test via l'API Avalon
# Usage: ./test-websocket.sh [nombre_d_erreurs]

AVALON_URL="http://localhost:3000"
NUM_ERRORS=${1:-5}

echo "🚀 Envoi de $NUM_ERRORS erreurs de test à Avalon..."
echo ""

for i in $(seq 1 $NUM_ERRORS); do
  # Sélection aléatoire du niveau d'erreur
  LEVELS=("error" "warning" "info" "fatal")
  LEVEL=${LEVELS[$RANDOM % ${#LEVELS[@]}]}

  # Services de test
  SERVICES=("frontend-app" "backend-api" "worker-service" "auth-service")
  SERVICE=${SERVICES[$RANDOM % ${#SERVICES[@]}]}

  # Messages de test
  MESSAGES=(
    "Database connection timeout"
    "Invalid user credentials"
    "Payment processing failed"
    "Cache server unreachable"
    "File upload error"
    "API rate limit exceeded"
  )
  MESSAGE=${MESSAGES[$RANDOM % ${#MESSAGES[@]}]}

  echo "📤 Envoi erreur $i/$NUM_ERRORS - [$LEVEL] $SERVICE: $MESSAGE"

  curl -X POST "$AVALON_URL/report" \
    -H "Content-Type: application/json" \
    -s \
    -d "{
      \"service\": \"$SERVICE\",
      \"error\": {
        \"message\": \"$MESSAGE\",
        \"stack\": \"Error: $MESSAGE\\n    at Object.<anonymous> (/app/index.js:$((RANDOM % 100 + 1)):$((RANDOM % 50 + 1)))\\n    at Module._compile (internal/modules/cjs/loader.js:999:30)\\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)\",
        \"path\": \"/api/v1/test\",
        \"method\": \"POST\"
      },
      \"level\": \"$LEVEL\",
      \"metadata\": {
        \"userId\": \"user-$((RANDOM % 100 + 1))\",
        \"sessionId\": \"session-$(date +%s)\",
        \"environment\": \"test\"
      }
    }" > /dev/null

  if [ $? -eq 0 ]; then
    echo "✅ Erreur $i envoyée avec succès"
  else
    echo "❌ Échec de l'envoi de l'erreur $i"
  fi

  # Délai entre les envois (optionnel)
  sleep 0.5
  echo ""
done

echo ""
echo "✨ Test terminé ! $NUM_ERRORS erreurs ont été envoyées."
echo "💡 Ouvrez le client WebSocket (docs/websocket-client-example.html) pour voir les notifications en temps réel."
