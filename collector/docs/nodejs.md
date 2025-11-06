# Int

égration Avalon avec Node.js / JavaScript

Guide d'intégration d'Avalon pour vos applications Node.js et JavaScript.

## Installation

```bash
npm install axios
# ou
yarn add axios
```

## Configuration

Créez un fichier `avalon-client.js` :

```javascript
const axios = require('axios');

class AvalonClient {
  constructor(collectorUrl, serviceName) {
    this.collectorUrl = collectorUrl.replace(/\/$/, '');
    this.serviceName = serviceName;
  }

  async reportError(error, options = {}) {
    const {
      level = 'error',
      path = null,
      method = null,
      metadata = {}
    } = options;

    const payload = {
      service: this.serviceName,
      error: {
        message: error.message || String(error),
        stack: error.stack || new Error().stack,
        path,
        method
      },
      level,
      metadata
    };

    try {
      const response = await axios.post(
        `${this.collectorUrl}/report`,
        payload,
        { timeout: 5000 }
      );
      return response.data.id;
    } catch (err) {
      console.error('Failed to report error to Avalon:', err.message);
      return null;
    }
  }
}

module.exports = AvalonClient;
```

## Utilisation

### Exemple basique

```javascript
const AvalonClient = require('./avalon-client');

const avalon = new AvalonClient(
  'http://localhost:4000',
  'my-nodejs-app'
);

// Capturer une erreur
try {
  throw new Error('Something went wrong');
} catch (error) {
  avalon.reportError(error, { level: 'error' })
    .then(id => console.log('Error reported:', id));
}
```

### Avec Express

```javascript
const express = require('express');
const AvalonClient = require('./avalon-client');

const app = express();
const avalon = new AvalonClient(
  'http://localhost:4000',
  'express-api'
);

// Middleware pour capturer les erreurs
app.use((err, req, res, next) => {
  avalon.reportError(err, {
    level: 'error',
    path: req.path,
    method: req.method,
    metadata: {
      userAgent: req.get('user-agent'),
      ip: req.ip,
      query: req.query,
      body: req.body
    }
  });

  res.status(500).json({ error: 'Internal server error' });
});

// Exemple de route
app.get('/api/users/:id', async (req, res, next) => {
  try {
    // Votre logique métier
    if (!req.params.id) {
      throw new Error('User ID is required');
    }
    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
});

app.listen(3000);
```

### Middleware Express dédié

```javascript
// avalon-middleware.js
const AvalonClient = require('./avalon-client');

function createAvalonMiddleware(collectorUrl, serviceName) {
  const avalon = new AvalonClient(collectorUrl, serviceName);

  return (err, req, res, next) => {
    avalon.reportError(err, {
      level: err.level || 'error',
      path: req.path,
      method: req.method,
      metadata: {
        userAgent: req.get('user-agent'),
        ip: req.ip,
        query: req.query,
        body: req.body,
        params: req.params,
        statusCode: res.statusCode
      }
    });

    next(err);
  };
}

module.exports = createAvalonMiddleware;

// app.js
const createAvalonMiddleware = require('./avalon-middleware');

app.use(createAvalonMiddleware(
  'http://localhost:4000',
  'my-express-app'
));
```

### Process uncaught exceptions

```javascript
const AvalonClient = require('./avalon-client');

const avalon = new AvalonClient(
  'http://localhost:4000',
  'my-nodejs-app'
);

// Capturer les exceptions non gérées
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await avalon.reportError(error, {
    level: 'fatal',
    metadata: {
      type: 'uncaughtException',
      pid: process.pid,
      memory: process.memoryUsage()
    }
  });
  process.exit(1);
});

// Capturer les promesses rejetées non gérées
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await avalon.reportError(new Error(String(reason)), {
    level: 'error',
    metadata: {
      type: 'unhandledRejection',
      pid: process.pid
    }
  });
});
```

### Avec des Promises

```javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    await avalon.reportError(error, {
      level: 'error',
      path: '/api/data',
      method: 'GET',
      metadata: {
        external_api: 'example.com'
      }
    });
    throw error;
  }
}
```

### Avec Koa

```javascript
const Koa = require('koa');
const AvalonClient = require('./avalon-client');

const app = new Koa();
const avalon = new AvalonClient(
  'http://localhost:4000',
  'koa-api'
);

// Error handler middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: 'Internal server error' };

    await avalon.reportError(err, {
      level: 'error',
      path: ctx.path,
      method: ctx.method,
      metadata: {
        userAgent: ctx.get('user-agent'),
        ip: ctx.ip,
        query: ctx.query,
        statusCode: ctx.status
      }
    });
  }
});

app.use(async ctx => {
  throw new Error('Oops!');
});

app.listen(3000);
```

## Client version ES6+

```javascript
// avalon-client.mjs
import axios from 'axios';

export class AvalonClient {
  constructor(collectorUrl, serviceName) {
    this.collectorUrl = collectorUrl.replace(/\/$/, '');
    this.serviceName = serviceName;
  }

  async reportError(error, {
    level = 'error',
    path = null,
    method = null,
    metadata = {}
  } = {}) {
    const payload = {
      service: this.serviceName,
      error: {
        message: error?.message || String(error),
        stack: error?.stack || new Error().stack,
        path,
        method
      },
      level,
      metadata
    };

    try {
      const { data } = await axios.post(
        `${this.collectorUrl}/report`,
        payload,
        { timeout: 5000 }
      );
      return data.id;
    } catch (err) {
      console.error('Failed to report error to Avalon:', err.message);
      return null;
    }
  }
}
```

## Wrapper pour async/await

```javascript
const asyncErrorHandler = (avalon) => (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    await avalon.reportError(error, {
      path: req.path,
      method: req.method,
      metadata: {
        userAgent: req.get('user-agent'),
        ip: req.ip
      }
    });
    next(error);
  }
};

// Utilisation
const handler = asyncErrorHandler(avalon);

app.get('/api/users', handler(async (req, res) => {
  const users = await User.findAll();
  res.json(users);
}));
```

## Niveaux d'erreur

| Niveau     | Usage                                      |
|------------|-------------------------------------------|
| `critical` | Erreur critique nécessitant une action    |
| `fatal`    | Erreur fatale, application inutilisable   |
| `error`    | Erreur standard                           |
| `warning`  | Avertissement                             |
| `info`     | Information                               |
| `debug`    | Debug                                     |

## Métadonnées recommandées

```javascript
const metadata = {
  userId: '12345',
  environment: process.env.NODE_ENV,
  version: require('./package.json').version,
  requestId: req.id,
  ipAddress: req.ip,
  customData: {...}
};
```

## Bonnes pratiques

1. Ne bloquez jamais votre application si Avalon est indisponible
2. Utilisez un timeout court (5 secondes max)
3. Ajoutez des métadonnées pertinentes pour faciliter le debug
4. Utilisez `async/await` pour ne pas bloquer l'event loop
5. Évitez d'envoyer des informations sensibles (mots de passe, tokens)
6. Capturez les `uncaughtException` et `unhandledRejection`
