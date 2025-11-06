# Avalon

Avalon est un système de collecte et de surveillance d'erreurs puissant et léger, construit avec TypeScript, Express, Prisma et PostgreSQL.

## Structure du projet

```txt
collector/
├── src/
│   ├── config/
│   │   └── env.ts              # Configuration de l'environnement
│   ├── routes/
│   │   └── error.routes.ts     # Routes API
│   ├── services/
│   │   ├── database.service.ts # Service de base de données (Prisma)
│   │   ├── discord.service.ts  # Service de notification Discord
│   │   ├── logger.service.ts   # Service de logging dans fichier
│   │   └── websocket.service.ts # Service WebSocket (Socket.IO)
│   ├── types/
│   │   └── index.ts            # Interfaces TypeScript
│   ├── app.ts                  # Configuration Express
│   └── index.ts                # Point d'entrée de l'application
├── prisma/
│   └── schema.prisma           # Schéma de base de données
├── docs/
│   ├── WEBSOCKET.md            # Documentation WebSocket
│   ├── websocket-client.ts     # Client TypeScript
│   ├── websocket-client-example.html # Client HTML de démonstration
│   ├── react-example.tsx       # Exemple d'intégration React
│   ├── test-websocket.ps1      # Script de test PowerShell
│   └── test-websocket.sh       # Script de test Bash
├── tsconfig.json               # Configuration TypeScript
├── package.json
└── .env                        # Variables d'environnement
```

## Installation

1.Installer les dépendances :

```bash
npm install
```

2.Créer un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

3.Configurer les variables d'environnement dans `.env` :

```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/avalon
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook/url
DISCORD_ENABLED=true  # Active/désactive les notifications Discord
```

4.Générer le client Prisma :

```bash
npm run prisma:generate
```

5.Exécuter les migrations de base de données :

```bash
npm run prisma:migrate
```

## Scripts disponibles

- `npm run dev` - Démarrer en mode développement avec ts-node
- `npm run build` - Compiler TypeScript en JavaScript
- `npm start` - Démarrer l'application compilée
- `npm run watch` - Compiler TypeScript en mode watch
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:migrate` - Exécuter les migrations de base de données
- `npm run prisma:studio` - Ouvrir Prisma Studio

## API Endpoints

### POST /report

Signaler une erreur.

**Payload :**

```json
{
  "service": "nom-du-service",
  "error": {
    "message": "Message d'erreur",
    "stack": "Stack trace",
    "path": "/api/endpoint",
    "method": "GET"
  },
  "metadata": {
    "userId": "123",
    "custom": "data"
  },
  "level": "error",
  "timestamp": "2025-10-31T12:00:00Z"
}
```

**Réponse :**

```json
{
  "status": "ok",
  "id": "clxxx..."
}
```

### GET /errors

Récupérer la liste des erreurs.

**Paramètres de requête :**

- `take` (optionnel) - Nombre d'erreurs à récupérer (max 100, défaut 50)
- `skip` (optionnel) - Nombre d'erreurs à ignorer (défaut 0)

**Exemple :**

```bash
GET /errors?take=20&skip=0
```

**Réponse :**

```json
{
  "status": "ok",
  "items": [
    {
      "id": "clxxx...",
      "service": "nom-du-service",
      "message": "Message d'erreur",
      "stack": "Stack trace",
      "path": "/api/endpoint",
      "method": "GET",
      "level": "error",
      "metadata": {},
      "createdAt": "2025-10-31T12:00:00Z"
    }
  ]
}
```

### GET /test-all-levels

Envoie des exemples d'erreurs pour tous les niveaux (critical, fatal, error, warning, info, debug). Utile pour tester les notifications Discord et visualiser les différentes couleurs d'embeds.

**Exemple :**

```http
GET /test-all-levels
```

**Réponse :**

```json
{
  "status": "ok",
  "message": "All test errors have been sent",
  "results": [
    {
      "level": "critical",
      "id": "clxxx...",
      "message": "Critical system failure - Database unavailable"
    }
  ]
}
```

### GET /

Vérifier l'état du serveur.

**Réponse :**

```txt
Avalon - Error Collector is running.
```

## Fonctionnalités

- ✅ Collecte d'erreurs via API REST
- ✅ Stockage dans PostgreSQL avec Prisma
- ✅ **Notifications Discord avec embeds riches**
  - Système de couleurs par niveau (rouge = error, orange = warning, etc.)
  - Emojis dynamiques selon la gravité
  - Affichage structuré avec service, path, stack trace
  - Activation/désactivation via variable d'environnement
- ✅ **Notifications en temps réel via WebSocket**
  - Diffusion instantanée des erreurs vers les clients connectés
  - Système d'abonnement par service ou niveau de log
  - Reconnexion automatique
  - Exemples d'intégration HTML, TypeScript et React
- ✅ Logging dans fichier `errors.log`
- ✅ Pagination des erreurs
- ✅ TypeScript strict mode
- ✅ Architecture modulaire et maintenable
- ✅ Middleware de sécurité (Helmet)
- ✅ Logging HTTP (Morgan)

## Architecture

Le projet est organisé en modules séparés :

- **config/** : Configuration centralisée de l'application
- **types/** : Interfaces TypeScript pour le typage fort
- **services/** : Logique métier (database, discord, logger)
- **routes/** : Définition des endpoints API
- **app.ts** : Configuration du serveur Express
- **index.ts** : Point d'entrée avec gestion du lifecycle

## Notifications Discord

Avalon envoie des notifications Discord enrichies avec des embeds colorés selon le niveau d'erreur :

| Niveau    | Couleur      | Emoji | Hex Code |
|-----------|--------------|-------|----------|
| `error`   | 🔴 Rouge     | 🔴    | #FF0000  |
| `warning` | 🟠 Orange    | 🟠    | #FFA500  |
| `info`    | 🔵 Bleu      | 🔵    | #00BFFF  |
| `debug`   | ⚪ Gris      | ⚪    | #808080  |
| `fatal`   | 🔴 Rouge foncé | 💀   | #8B0000  |
| `critical`| 🚨 Cramoisi  | 🚨    | #DC143C  |

Pour activer Discord, configurez dans `.env` :

```env
DISCORD_ENABLED=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook
```

## WebSocket - Notifications en temps réel

Avalon supporte les notifications en temps réel via WebSocket grâce à Socket.IO. Les clients peuvent se connecter et recevoir instantanément les erreurs dès qu'elles sont collectées.

### Démarrage rapide

1. **Démarrez le serveur Avalon** :
```bash
npm run dev
```

2. **Ouvrez le client de test** :
Ouvrez `docs/websocket-client-example.html` dans votre navigateur.

3. **Testez avec le script PowerShell** :
```powershell
.\docs\test-websocket.ps1 10
```

### Événements WebSocket

**Événements émis par le serveur :**
- `error:new` - Nouvelle erreur (diffusée à tous les clients)
- `error:service` - Erreur d'un service spécifique (clients abonnés)
- `error:level` - Erreur d'un niveau spécifique (clients abonnés)

**Événements reçus par le serveur :**
- `subscribe:service` - S'abonner à un service spécifique
- `unsubscribe:service` - Se désabonner d'un service
- `subscribe:level` - S'abonner à un niveau de log
- `unsubscribe:level` - Se désabonner d'un niveau

### Exemples d'intégration

**HTML/JavaScript simple :**
```javascript
const socket = io('http://localhost:3000');
socket.on('error:new', (error) => {
  console.log('New error:', error);
});
```

**TypeScript/React :**
```typescript
import { AvalonWebSocketClient } from './websocket-client';

const client = new AvalonWebSocketClient('http://localhost:3000');
client.on('error', (error) => {
  console.log('New error:', error);
});
client.connect();
```

📖 **Documentation complète** : [docs/WEBSOCKET.md](docs/WEBSOCKET.md)

## Technologies utilisées

- **TypeScript** - Langage de programmation
- **Express** - Framework web
- **Prisma** - ORM pour PostgreSQL
- **PostgreSQL** - Base de données
- **Socket.IO** - WebSocket pour notifications temps réel
- **Axios** - Client HTTP pour Discord
- **Helmet** - Middleware de sécurité
- **Morgan** - Logger HTTP
- **dotenv** - Gestion des variables d'environnement
