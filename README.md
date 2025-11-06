# 🛡️ Avalon Error Manager

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.2-00DC82.svg)](https://nuxt.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101.svg)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

**Système centralisé de gestion et monitoring d'erreurs en temps réel avec API Keys**

Avalon est une solution complète pour collecter, visualiser et monitorer les erreurs de vos applications en temps réel via WebSocket. Idéal pour les architectures microservices et les équipes DevOps.

---

## ✨ Fonctionnalités principales

### 🔐 Sécurité avec API Keys
- 🔑 **Gestion des API Keys** : Créez des clés pour chaque application
- 🛡️ **Protection du collector** : Seules les requêtes avec API Key valide sont acceptées
- 📊 **Segmentation par service** : Chaque clé est liée à un service spécifique
- 🔍 **Traçabilité** : Suivi de la dernière utilisation de chaque clé
- ⚙️ **Activation/Désactivation** : Contrôlez l'accès en temps réel

### 🌐 Temps réel avec WebSocket
- ⚡ **Mise à jour instantanée** : Les erreurs apparaissent sur le dashboard **sans refresh**
- 🔌 **Connexion automatique** : Le WebSocket se connecte dès le chargement de l'application
- 📡 **Broadcast intelligent** : Diffusion globale + abonnements par service/niveau
- 💚 **Indicateur de connexion** : Badge "Live" avec animation de pulsation

### 🔐 Authentification JWT
- 👤 **Compte administrateur** : Système de connexion sécurisé
- 🔒 **Protection des routes** : Toutes les pages nécessitent une authentification
- 👥 **Gestion de profil** : Modification du username et mot de passe
- 🔄 **Token persistant** : Session conservée 24h

### 📊 Dashboard moderne
- 📈 **Statistiques en temps réel** : Métriques, graphiques, tendances
- 🎨 **Interface intuitive** : Design moderne avec Nuxt 4 + TailwindCSS
- 🔍 **Filtrage avancé** : Par service, niveau, date, recherche textuelle
- 📱 **Responsive** : Fonctionne sur desktop, tablette et mobile
- 🎯 **Service Manager** : Visualisation de tous les services configurés

### 🛠️ Collector robuste
- 🚀 **API REST** : Endpoint `/report` protégé par API Key
- 💾 **PostgreSQL** : Stockage fiable avec indexation optimisée
- 📝 **Logging fichier** : Sauvegarde locale dans `logs/errors.log`
- 🔔 **Notifications Discord** : Alertes pour les erreurs critiques/fatales
- 🔒 **Sécurisé** : Helmet, CORS, validation des données, API Keys

---

## 🚀 Démarrage rapide avec Docker

### Prérequis

- Docker 20.10+
- Docker Compose 2.0+

### Installation en une commande

```bash
# Cloner le projet
git clone https://github.com/votre-username/avalon.git
cd avalon

# Copier et configurer les variables d'environnement
cp .env.example .env

# Démarrer tous les services
docker-compose up -d
```

### Accès

- **Dashboard** : http://localhost:3000
- **API Collector** : http://localhost:4000
- **PostgreSQL** : localhost:5432

### Connexion par défaut

- **Username** : `admin`
- **Password** : `passwordAdmin`

---

## 🔑 Configuration des API Keys

### 1. Se connecter au dashboard
1. Ouvrir http://localhost:3000/login
2. Se connecter avec `admin` / `passwordAdmin`

### 2. Créer une API Key
1. Aller dans **Settings > API Keys**
2. Cliquer sur **Create API Key**
3. Renseigner :
   - **Name** : Nom descriptif (ex: "Frontend Production")
   - **Service** : Identifiant du service (ex: "frontend-prod")
4. **⚠️ Copier la clé immédiatement** (format: `avl_xxxxxxxx...`)

### 3. Utiliser l'API Key

```bash
curl -X POST http://localhost:4000/report \
  -H "Content-Type: application/json" \
  -H "X-API-Key: avl_your_api_key_here" \
  -d '{
    "error": {
      "message": "Something went wrong",
      "stack": "Error: Something went wrong\n    at ...",
      "path": "/api/users",
      "method": "GET"
    },
    "level": "error",
    "metadata": {
      "userId": "123"
    }
  }'
```

**Note** : Le service est automatiquement défini par l'API Key (impossible à falsifier).

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Vos APIs/Apps  │
└────────┬────────┘
         │ POST /report (avec X-API-Key)
         ▼
┌─────────────────┐      WebSocket      ┌──────────────┐
│    Collector    │◄────────────────────►│   Frontend   │
│   (Express.js)  │                      │   (Nuxt 4)   │
│   + API Keys    │                      │ + Auth JWT   │
└────────┬────────┘                      └──────────────┘
         │
         ├─► PostgreSQL (Stockage + Users + API Keys)
         ├─► logs/errors.log (Logging)
         └─► Discord (Notifications)
```

---

## 📡 Intégration dans vos applications

### JavaScript/TypeScript

```typescript
const AVALON_API_KEY = process.env.AVALON_API_KEY; // avl_xxxxxxxx...
const AVALON_URL = 'http://localhost:4000/report';

async function reportError(error: Error, metadata?: object) {
  try {
    await fetch(AVALON_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AVALON_API_KEY,
      },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          path: window.location.pathname,
        },
        level: 'error',
        metadata,
      }),
    });
  } catch (e) {
    console.error('Failed to report error:', e);
  }
}
```

### Python

```python
import os
import requests

AVALON_API_KEY = os.getenv('AVALON_API_KEY')
AVALON_URL = 'http://localhost:4000/report'

def report_error(error: Exception, metadata: dict = None):
    try:
        requests.post(
            AVALON_URL,
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': AVALON_API_KEY,
            },
            json={
                'error': {
                    'message': str(error),
                    'stack': traceback.format_exc(),
                },
                'level': 'error',
                'metadata': metadata or {},
            }
        )
    except Exception as e:
        print(f'Failed to report error: {e}')
```

---

## 🛠️ Stack technique

### Backend (Collector)
- **Framework** : Express.js 4.18
- **Language** : TypeScript 5.2
- **Database** : PostgreSQL 15 (Alpine)
- **ORM** : Prisma 5.0
- **WebSocket** : Socket.io 4.8.1
- **Security** : Helmet 6.0 + API Keys + JWT
- **Logging** : Morgan 1.10

### Frontend (Dashboard)
- **Framework** : Nuxt 4.2
- **Language** : TypeScript
- **UI** : @nuxt/ui 4.1
- **Styling** : TailwindCSS 4.1
- **Charts** : Chart.js 4.5 + vue-chartjs 5.3
- **WebSocket** : Socket.io-client 4.8.1
- **Auth** : JWT avec cookies
- **Icons** : Heroicons

---

## 🐳 Commandes Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart collector
docker-compose restart frontend

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime la BDD)
docker-compose down -v

# Rebuild après modifications du code
docker-compose up -d --build
```

---

## 📊 Schéma de données

```prisma
model ErrorEvent {
  id        String   @id @default(cuid())
  service   String
  message   String?
  stack     String?
  path      String?
  method    String?
  level     String   @default("error")
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([service])
  @@index([createdAt])
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  apiKeys   ApiKey[]
}

model ApiKey {
  id          String    @id @default(cuid())
  name        String
  key         String    @unique
  service     String
  isActive    Boolean   @default(true)
  lastUsedAt  DateTime?
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([key])
  @@index([service])
}
```

---

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# PostgreSQL
POSTGRES_USER=avalon
POSTGRES_PASSWORD=avalon_password
POSTGRES_DB=avalon

# Collector
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Database URL
DATABASE_URL=postgresql://avalon:avalon_password@postgres:5432/avalon

# Frontend
NUXT_PUBLIC_API_BASE=http://localhost:4000
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Changez le JWT_SECRET** en production
2. **Changez les credentials PostgreSQL**
3. **Utilisez HTTPS** en production
4. **Stockez les API Keys** dans des variables d'environnement
5. **Régénérez les clés** régulièrement
6. **Désactivez plutôt que supprimer** les clés en cas de doute
7. **Utilisez des clés différentes** par environnement (dev/staging/prod)

---

## 📝 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails

---

## 📧 Support

Pour toute question ou problème :

- 🐛 Ouvrez une [issue](https://github.com/votre-username/avalon/issues)
- 💬 Contactez l'équipe

---

**Développé avec ❤️ pour simplifier le monitoring d'erreurs**
