# Documentation d'intégration Avalon

Bienvenue dans la documentation d'intégration d'**Avalon**, votre système de collecte et de surveillance d'erreurs.

## Guides d'intégration disponibles

Avalon peut être intégré avec de nombreux langages et frameworks. Choisissez le guide correspondant à votre stack technique :

### Langages

- [Python](./python.md) - Flask, FastAPI, Django
- [JavaScript / Node.js](./nodejs.md) - Express, Koa
- [TypeScript](./typescript.md) - Configuration avancée avec types

### Frameworks Frontend

- [React](./react.md) - Error Boundaries, Hooks, Context
- [Next.js](./nextjs.md) - App Router, Pages Router, API Routes
- [Vue.js](./vue.md) - Error Handler, Composables (à venir)
- [Nuxt.js](./nuxt.md) - Plugins, Middleware, Server Routes

## Quick Start

Peu importe votre stack, l'intégration suit toujours le même schéma :

### 1. Installation du client HTTP

```bash
# Python
pip install requests

# JavaScript/TypeScript
npm install axios
```

### 2. Configuration du client Avalon

Créez un client qui envoie les erreurs à votre serveur Avalon :

```typescript
// Exemple TypeScript
class AvalonClient {
  constructor(
    private collectorUrl: string,
    private serviceName: string
  ) {}

  async reportError(error: Error, options?: {
    level?: 'critical' | 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    path?: string;
    method?: string;
    metadata?: Record<string, any>;
  }): Promise<string | null> {
    const payload = {
      service: this.serviceName,
      error: {
        message: error.message,
        stack: error.stack,
        path: options?.path,
        method: options?.method,
      },
      level: options?.level || 'error',
      metadata: options?.metadata || {},
    };

    const response = await fetch(`${this.collectorUrl}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.id;
  }
}
```

### 3. Utilisation

```typescript
const avalon = new AvalonClient('http://localhost:4000', 'my-app');

try {
  // Votre code
  throw new Error('Something went wrong');
} catch (error) {
  await avalon.reportError(error, {
    level: 'error',
    path: '/api/users',
    method: 'GET',
    metadata: { userId: '123' },
  });
}
```

## API Avalon

### Endpoint : POST /report

Envoyez vos erreurs à cet endpoint :

```http
POST http://localhost:4000/report
Content-Type: application/json

{
  "service": "my-app",
  "error": {
    "message": "Error message",
    "stack": "Error: ...\n  at ...",
    "path": "/api/endpoint",
    "method": "GET"
  },
  "level": "error",
  "metadata": {
    "userId": "123",
    "custom": "data"
  }
}
```

### Réponse

```json
{
  "status": "ok",
  "id": "clxxx..."
}
```

## Niveaux d'erreur

| Niveau     | Couleur Discord | Emoji | Usage                                      |
|-----------|----------------|-------|-------------------------------------------|
| `critical` | Cramoisi       | 🚨    | Erreur critique nécessitant action immédiate |
| `fatal`    | Rouge foncé    | 💀    | Erreur fatale, application inutilisable   |
| `error`    | Rouge          | 🔴    | Erreur standard                           |
| `warning`  | Orange         | 🟠    | Avertissement                             |
| `info`     | Bleu           | 🔵    | Information                               |
| `debug`    | Gris           | ⚪    | Debug                                     |

## Structure de métadonnées recommandée

Les métadonnées permettent d'ajouter du contexte à vos erreurs. Voici les champs recommandés :

```typescript
{
  // Identification
  "userId": "user_123",
  "sessionId": "sess_abc",
  "requestId": "req_xyz",

  // Environnement
  "environment": "production",
  "version": "1.2.3",
  "region": "eu-west-1",

  // Contexte technique
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "platform": "web",

  // Données métier
  "orderId": "ORD-001",
  "amount": 99.99,
  "action": "checkout",

  // Performance
  "executionTime": 2345,
  "memoryUsage": 512000000
}
```

## Bonnes pratiques

### 1. Ne bloquez jamais votre application

```typescript
try {
  await avalon.reportError(error);
} catch (reportError) {
  // Ne pas re-throw, juste logger
  console.error('Failed to report error:', reportError);
}
```

### 2. Utilisez des timeouts courts

```typescript
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000), // 5 secondes max
});
```

### 3. Ajoutez des métadonnées pertinentes

```typescript
await avalon.reportError(error, {
  metadata: {
    userId: getCurrentUserId(),
    action: 'payment',
    amount: orderAmount,
    // Évitez les données sensibles !
  },
});
```

### 4. Choisissez le bon niveau

- **critical/fatal** : Nécessite une action immédiate
- **error** : Erreur fonctionnelle à corriger
- **warning** : Anomalie non bloquante
- **info/debug** : Traçabilité et debug

### 5. Protégez les données sensibles

```typescript
// ❌ MAU VAIS
await avalon.reportError(error, {
  metadata: {
    password: user.password,  // NON !
    creditCard: card.number,  // NON !
    token: auth.token,        // NON !
  },
});

// ✅ BON
await avalon.reportError(error, {
  metadata: {
    userId: user.id,
    email: user.email.replace(/@.*/, '@***'),  // Masqué
    lastFourDigits: card.number.slice(-4),     // Partiel
  },
});
```

### 6. Utilisez des Error Boundaries / Global Handlers

Capturez les erreurs non gérées au niveau global :

```typescript
// Frontend
window.addEventListener('error', (event) => {
  avalon.reportError(event.error);
});

// Backend
process.on('uncaughtException', (error) => {
  avalon.reportError(error, { level: 'fatal' });
  process.exit(1);
});
```

## Routes de test

Avalon fournit des routes de test pour vérifier votre intégration :

```bash
# Tester un niveau spécifique
curl http://localhost:4000/test/error
curl http://localhost:4000/test/warning
curl http://localhost:4000/test/critical

# Tester tous les niveaux
curl http://localhost:4000/test/all
```

## Variables d'environnement

Configurez Avalon via des variables d'environnement :

```env
# URL du collecteur
AVALON_COLLECTOR_URL=http://localhost:4000

# Nom de votre service
AVALON_SERVICE_NAME=my-app

# Activer/désactiver les notifications Discord
DISCORD_ENABLED=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## Endpoints disponibles

### GET /
Vérifier que le serveur fonctionne

### POST /report
Envoyer une erreur

### GET /errors?take=50&skip=0
Récupérer la liste des erreurs

### GET /test/all
Envoyer des erreurs de test pour tous les niveaux

### GET /test/{level}
Envoyer une erreur de test pour un niveau spécifique
- `/test/critical`
- `/test/fatal`
- `/test/error`
- `/test/warning`
- `/test/info`
- `/test/debug`

## Architecture recommandée

```
votre-app/
├── lib/
│   └── avalon-client.ts      # Client Avalon réutilisable
├── config/
│   └── avalon.config.ts      # Configuration centralisée
├── types/
│   └── avalon.types.ts       # Types TypeScript
└── middleware/
    └── error-handler.ts      # Middleware global
```

## Support et contributions

- **Issues** : [GitHub Issues](https://github.com/votre-org/avalon/issues)
- **Documentation** : [Documentation complète](../README.md)
- **Exemples** : Consultez les guides spécifiques à chaque framework

## Prochains guides

D'autres guides d'intégration arrivent bientôt :

- Vue.js 3 avec Composition API
- Angular
- Svelte / SvelteKit
- PHP / Laravel
- Ruby / Rails
- Go
- Rust
- Java / Spring Boot

---

**Besoin d'aide ?** Consultez les guides spécifiques à votre framework ou ouvrez une issue sur GitHub.
