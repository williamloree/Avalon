# Intégration Avalon avec Python

Guide d'intégration d'Avalon pour vos applications Python.

## Installation

```bash
pip install requests
```

## Configuration

Créez un fichier `avalon_client.py` :

```python
import requests
import traceback
import sys
from typing import Optional, Dict, Any

class AvalonClient:
    def __init__(self, collector_url: str, service_name: str):
        self.collector_url = collector_url.rstrip('/')
        self.service_name = service_name

    def report_error(
        self,
        error: Exception,
        level: str = 'error',
        path: Optional[str] = None,
        method: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Envoie une erreur à Avalon

        Args:
            error: L'exception Python
            level: Niveau d'erreur (critical, fatal, error, warning, info, debug)
            path: Chemin de l'endpoint (optionnel)
            method: Méthode HTTP (optionnel)
            metadata: Données additionnelles (optionnel)

        Returns:
            L'ID de l'erreur si succès, None sinon
        """
        payload = {
            'service': self.service_name,
            'error': {
                'message': str(error),
                'stack': ''.join(traceback.format_exception(
                    type(error), error, error.__traceback__
                )),
                'path': path,
                'method': method
            },
            'level': level,
            'metadata': metadata or {}
        }

        try:
            response = requests.post(
                f'{self.collector_url}/report',
                json=payload,
                timeout=5
            )
            response.raise_for_status()
            return response.json().get('id')
        except Exception as e:
            print(f'Failed to report error to Avalon: {e}', file=sys.stderr)
            return None
```

## Utilisation

### Exemple basique

```python
from avalon_client import AvalonClient

# Initialiser le client
avalon = AvalonClient(
    collector_url='http://localhost:4000',
    service_name='my-python-app'
)

# Capturer une erreur
try:
    result = 1 / 0
except Exception as e:
    error_id = avalon.report_error(e, level='error')
    print(f'Error reported with ID: {error_id}')
```

### Avec Flask

```python
from flask import Flask, request
from avalon_client import AvalonClient

app = Flask(__name__)
avalon = AvalonClient(
    collector_url='http://localhost:4000',
    service_name='flask-api'
)

@app.errorhandler(Exception)
def handle_exception(e):
    # Capturer toutes les exceptions non gérées
    avalon.report_error(
        e,
        level='error',
        path=request.path,
        method=request.method,
        metadata={
            'user_agent': request.headers.get('User-Agent'),
            'remote_addr': request.remote_addr,
            'args': dict(request.args)
        }
    )
    return {'error': 'Internal server error'}, 500

@app.route('/api/users')
def get_users():
    try:
        # Votre logique métier
        raise ValueError('User not found')
    except Exception as e:
        avalon.report_error(e, path='/api/users', method='GET')
        return {'error': str(e)}, 404
```

### Avec FastAPI

```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from avalon_client import AvalonClient

app = FastAPI()
avalon = AvalonClient(
    collector_url='http://localhost:4000',
    service_name='fastapi-service'
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    avalon.report_error(
        exc,
        level='error',
        path=str(request.url.path),
        method=request.method,
        metadata={
            'client_host': request.client.host,
            'headers': dict(request.headers)
        }
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={'detail': 'Internal server error'}
    )

@app.get('/api/items/{item_id}')
async def read_item(item_id: int):
    try:
        if item_id < 0:
            raise ValueError('Invalid item ID')
        return {'item_id': item_id}
    except Exception as e:
        avalon.report_error(
            e,
            level='warning',
            path=f'/api/items/{item_id}',
            method='GET'
        )
        raise
```

### Avec Django

```python
# middleware.py
from avalon_client import AvalonClient
import sys

class AvalonMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.avalon = AvalonClient(
            collector_url='http://localhost:4000',
            service_name='django-app'
        )

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        self.avalon.report_error(
            exception,
            level='error',
            path=request.path,
            method=request.method,
            metadata={
                'user': str(request.user),
                'session_key': request.session.session_key,
                'ip': request.META.get('REMOTE_ADDR')
            }
        )
        return None

# settings.py
MIDDLEWARE = [
    # ... autres middlewares
    'myapp.middleware.AvalonMiddleware',
]
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

```python
metadata = {
    'user_id': '12345',
    'environment': 'production',
    'version': '1.2.3',
    'request_id': 'req_abc123',
    'ip_address': '192.168.1.1',
    'custom_data': {...}
}
```

## Logging avancé

```python
import logging
from avalon_client import AvalonClient

class AvalonHandler(logging.Handler):
    def __init__(self, collector_url: str, service_name: str):
        super().__init__()
        self.avalon = AvalonClient(collector_url, service_name)

    def emit(self, record):
        if record.levelno >= logging.ERROR:
            level = 'error' if record.levelno == logging.ERROR else 'critical'
            # Créer une exception factice pour avoir un stack trace
            try:
                raise Exception(record.getMessage())
            except Exception as e:
                self.avalon.report_error(
                    e,
                    level=level,
                    metadata={
                        'logger': record.name,
                        'module': record.module,
                        'function': record.funcName,
                        'line': record.lineno
                    }
                )

# Configuration du logger
logger = logging.getLogger(__name__)
logger.addHandler(AvalonHandler(
    collector_url='http://localhost:4000',
    service_name='my-python-app'
))
```

## Bonnes pratiques

1. Ne bloquez jamais votre application si Avalon est indisponible
2. Utilisez un timeout court (5 secondes max)
3. Ajoutez des métadonnées pertinentes pour faciliter le debug
4. Utilisez les bons niveaux d'erreur
5. Évitez d'envoyer des informations sensibles (mots de passe, tokens)
