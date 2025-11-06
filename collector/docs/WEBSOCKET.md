# Avalon WebSocket - Documentation

## Introduction

Le système WebSocket d'Avalon permet de recevoir des notifications d'erreurs en temps réel sur votre frontend. Dès qu'une erreur est collectée par le système, elle est automatiquement diffusée à tous les clients connectés via WebSocket.

## Architecture

### Backend

Le backend utilise **Socket.IO** pour gérer les connexions WebSocket. Le serveur est initialisé automatiquement au démarrage de l'application Avalon.

#### Événements émis par le serveur

| Événement | Description | Données |
|-----------|-------------|---------|
| `error:new` | Nouvelle erreur collectée | `ErrorEventRecord` |
| `error:service` | Erreur d'un service spécifique | `ErrorEventRecord` |
| `error:level` | Erreur d'un niveau spécifique | `ErrorEventRecord` |

#### Événements reçus par le serveur

| Événement | Description | Paramètre |
|-----------|-------------|-----------|
| `subscribe:service` | S'abonner aux erreurs d'un service | `serviceName: string` |
| `unsubscribe:service` | Se désabonner d'un service | `serviceName: string` |
| `subscribe:level` | S'abonner à un niveau de log | `level: string` |
| `unsubscribe:level` | Se désabonner d'un niveau de log | `level: string` |

### Type de données ErrorEventRecord

```typescript
interface ErrorEventRecord {
  id: string;
  service: string;
  message: string | null;
  stack: string | null;
  path: string | null;
  method: string | null;
  level: string;
  metadata: any;
  createdAt: Date;
}
```

## Installation

### Backend (déjà fait)

Le backend est déjà configuré avec Socket.IO. Assurez-vous que le serveur est démarré :

```bash
npm run dev
```

### Frontend

Pour utiliser le WebSocket côté frontend, vous avez plusieurs options :

#### Option 1 : HTML/JavaScript simple

Ouvrez le fichier `docs/websocket-client-example.html` dans votre navigateur. Modifiez l'URL du WebSocket si nécessaire :

```javascript
const WEBSOCKET_URL = 'http://localhost:3000';
```

#### Option 2 : Client TypeScript

1. Installez Socket.IO Client dans votre projet :

```bash
npm install socket.io-client
```

2. Copiez le fichier `docs/websocket-client.ts` dans votre projet

3. Utilisez le client :

```typescript
import { AvalonWebSocketClient } from './websocket-client';

const client = new AvalonWebSocketClient('http://localhost:3000');

client.on('error', (error) => {
  console.log('New error:', error);
});

client.connect();
```

#### Option 3 : Intégration React

1. Installez les dépendances :

```bash
npm install socket.io-client react
```

2. Copiez les fichiers `docs/websocket-client.ts` et `docs/react-example.tsx` dans votre projet

3. Utilisez le composant dans votre application :

```tsx
import { AvalonMonitor } from './react-example';

function App() {
  return (
    <div>
      <AvalonMonitor />
    </div>
  );
}
```

## Utilisation avancée

### S'abonner à un service spécifique

Vous pouvez filtrer les notifications pour ne recevoir que celles d'un service particulier :

```typescript
client.subscribeToService('my-app');
```

Vous recevrez alors les notifications via l'événement `error:service`.

### S'abonner à un niveau de log spécifique

Vous pouvez filtrer les notifications par niveau de sévérité :

```typescript
client.subscribeToLevel('error');
```

Vous recevrez alors les notifications via l'événement `error:level`.

### Gestion de la reconnexion

Le client se reconnecte automatiquement en cas de déconnexion. Vous pouvez configurer ce comportement :

```typescript
const client = new AvalonWebSocketClient('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

## Configuration CORS

Par défaut, le serveur WebSocket accepte toutes les origines (`origin: '*'`). Pour une utilisation en production, il est recommandé de restreindre les origines autorisées.

Modifiez le fichier `src/services/websocket.service.ts` :

```typescript
this.io = new SocketIOServer(server, {
  cors: {
    origin: ['https://monapp.com', 'https://www.monapp.com'],
    methods: ['GET', 'POST'],
  },
});
```

## Exemples d'utilisation

### Exemple 1 : Console simple

```javascript
const socket = io('http://localhost:3000');

socket.on('error:new', (error) => {
  console.log(`[${error.level}] ${error.service}: ${error.message}`);
});
```

### Exemple 2 : Notification toast

```javascript
import { toast } from 'react-toastify';

client.on('error', (error) => {
  if (error.level === 'error' || error.level === 'fatal') {
    toast.error(`${error.service}: ${error.message}`);
  } else if (error.level === 'warning') {
    toast.warning(`${error.service}: ${error.message}`);
  }
});
```

### Exemple 3 : Dashboard en temps réel

```typescript
const [errors, setErrors] = useState<ErrorEventRecord[]>([]);

client.on('error', (error) => {
  setErrors(prev => [error, ...prev].slice(0, 100)); // Garder les 100 dernières
});
```

## Tests

Pour tester le WebSocket, vous pouvez envoyer une erreur de test via l'API :

```bash
curl -X POST http://localhost:3000/report \
  -H "Content-Type: application/json" \
  -d '{
    "service": "test-app",
    "error": {
      "message": "Test WebSocket notification",
      "stack": "Error: Test\n    at main.js:10:5"
    },
    "level": "error"
  }'
```

Vous devriez voir la notification apparaître immédiatement dans votre client WebSocket.

## Dépannage

### Le client ne se connecte pas

1. Vérifiez que le serveur Avalon est démarré
2. Vérifiez l'URL de connexion (port correct)
3. Vérifiez la console pour les erreurs CORS
4. Assurez-vous que Socket.IO est bien installé

### Les notifications ne s'affichent pas

1. Vérifiez que vous écoutez bien l'événement `error:new`
2. Vérifiez dans la console serveur que les notifications sont bien envoyées
3. Testez avec l'exemple HTML simple pour isoler le problème

### Problèmes de performance

Si vous recevez beaucoup d'erreurs :

1. Limitez le nombre de notifications affichées
2. Utilisez les abonnements par service ou niveau
3. Implémentez un système de pagination ou de défilement virtuel

## Sécurité

### Recommandations pour la production

1. **CORS** : Restreignez les origines autorisées
2. **Authentification** : Ajoutez un système d'authentification pour les connexions WebSocket
3. **Rate limiting** : Limitez le nombre de connexions par IP
4. **HTTPS** : Utilisez WSS (WebSocket Secure) en production

### Exemple d'authentification

```typescript
// Backend
this.io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

// Frontend
const client = new AvalonWebSocketClient('http://localhost:3000', {
  auth: {
    token: 'your-auth-token'
  }
});
```

## Ressources

- [Documentation Socket.IO](https://socket.io/docs/v4/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [Avalon Error Collector](../README.md)
