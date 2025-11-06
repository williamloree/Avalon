/**
 * Exemple d'intégration React avec le client WebSocket Avalon
 *
 * Installation des dépendances:
 * npm install socket.io-client react
 *
 * Ce composant peut être adapté pour Vue, Angular ou d'autres frameworks
 */

import React, { useEffect, useState, useCallback } from 'react';
import { AvalonWebSocketClient, ErrorEventRecord } from './websocket-client';

// Hook personnalisé pour gérer la connexion WebSocket
export function useAvalonWebSocket(url: string) {
  const [client] = useState(() => new AvalonWebSocketClient(url));
  const [isConnected, setIsConnected] = useState(false);
  const [errors, setErrors] = useState<ErrorEventRecord[]>([]);

  useEffect(() => {
    // Callback de connexion
    const onConnect = () => {
      console.log('Connected to Avalon');
      setIsConnected(true);
    };

    // Callback de déconnexion
    const onDisconnect = () => {
      console.log('Disconnected from Avalon');
      setIsConnected(false);
    };

    // Callback d'erreur
    const onError = (error: ErrorEventRecord) => {
      console.log('New error received:', error);
      setErrors(prev => [error, ...prev].slice(0, 100)); // Garder les 100 dernières erreurs
    };

    // Enregistrer les callbacks
    client.on('connect', onConnect);
    client.on('disconnect', onDisconnect);
    client.on('error', onError);

    // Se connecter
    client.connect();

    // Cleanup
    return () => {
      client.off('connect', onConnect);
      client.off('disconnect', onDisconnect);
      client.off('error', onError);
      client.disconnect();
    };
  }, [client]);

  const subscribeToService = useCallback((serviceName: string) => {
    client.subscribeToService(serviceName);
  }, [client]);

  const unsubscribeFromService = useCallback((serviceName: string) => {
    client.unsubscribeFromService(serviceName);
  }, [client]);

  const subscribeToLevel = useCallback((level: string) => {
    client.subscribeToLevel(level);
  }, [client]);

  const unsubscribeFromLevel = useCallback((level: string) => {
    client.unsubscribeFromLevel(level);
  }, [client]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    isConnected,
    errors,
    subscribeToService,
    unsubscribeFromService,
    subscribeToLevel,
    unsubscribeFromLevel,
    clearErrors,
  };
}

// Composant d'affichage d'une notification d'erreur
interface ErrorNotificationProps {
  error: ErrorEventRecord;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ error }) => {
  const levelColors: Record<string, string> = {
    error: '#FF0000',
    warning: '#FFA500',
    warn: '#FFA500',
    info: '#00BFFF',
    debug: '#808080',
    fatal: '#8B0000',
    critical: '#DC143C',
  };

  const levelEmojis: Record<string, string> = {
    error: '🔴',
    warning: '🟠',
    warn: '🟠',
    info: '🔵',
    debug: '⚪',
    fatal: '💀',
    critical: '🚨',
  };

  const color = levelColors[error.level.toLowerCase()] || '#808080';
  const emoji = levelEmojis[error.level.toLowerCase()] || '⚠️';

  return (
    <div
      style={{
        background: '#2a2a2a',
        borderLeft: `4px solid ${color}`,
        padding: '15px',
        marginBottom: '10px',
        borderRadius: '5px',
        color: '#e0e0e0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
          {emoji} {error.level.toUpperCase()} - {error.service}
        </div>
        <div style={{ color: '#888', fontSize: '12px' }}>
          {new Date(error.createdAt).toLocaleString('fr-FR')}
        </div>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Message:</strong> {error.message || 'No message'}
        {error.path && (
          <>
            <br />
            <strong>Path:</strong> {error.method || 'GET'} {error.path}
          </>
        )}
        <br />
        <strong>ID:</strong> {error.id}
      </div>
      {error.stack && (
        <div
          style={{
            background: '#1a1a1a',
            padding: '10px',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '12px',
            overflowX: 'auto',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {error.stack}
        </div>
      )}
    </div>
  );
};

// Composant principal de monitoring
export const AvalonMonitor: React.FC = () => {
  const {
    isConnected,
    errors,
    subscribeToService,
    unsubscribeFromService,
    subscribeToLevel,
    unsubscribeFromLevel,
    clearErrors,
  } = useAvalonWebSocket('http://localhost:3000');

  const [serviceName, setServiceName] = useState('my-app');
  const [selectedLevel, setSelectedLevel] = useState('error');

  // Calculer les statistiques
  const stats = {
    total: errors.length,
    error: errors.filter(e => ['error', 'fatal', 'critical'].includes(e.level.toLowerCase())).length,
    warning: errors.filter(e => ['warning', 'warn'].includes(e.level.toLowerCase())).length,
    info: errors.filter(e => e.level.toLowerCase() === 'info').length,
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px', background: '#1a1a1a', color: '#e0e0e0', minHeight: '100vh' }}>
      <h1 style={{ color: '#4CAF50' }}>Avalon - Monitor</h1>

      {/* Statut de connexion */}
      <div
        style={{
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          fontWeight: 'bold',
          background: isConnected ? '#4CAF50' : '#f44336',
          color: 'white',
        }}
      >
        {isConnected ? '✓ Connecté' : '✗ Déconnecté'}
      </div>

      {/* Statistiques */}
      <div style={{ background: '#2a2a2a', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2>Statistiques</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <div style={{ textAlign: 'center', padding: '10px', background: '#333', borderRadius: '5px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', background: '#333', borderRadius: '5px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF0000' }}>{stats.error}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Erreurs</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', background: '#333', borderRadius: '5px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFA500' }}>{stats.warning}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Avertissements</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', background: '#333', borderRadius: '5px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00BFFF' }}>{stats.info}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Infos</div>
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div style={{ background: '#2a2a2a', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2>Contrôles</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="Nom du service"
            style={{ padding: '8px', margin: '5px', borderRadius: '5px', border: '1px solid #444', background: '#333', color: '#e0e0e0' }}
          />
          <button
            onClick={() => subscribeToService(serviceName)}
            style={{ padding: '10px 20px', margin: '5px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: '#4CAF50', color: 'white' }}
          >
            S'abonner au service
          </button>
          <button
            onClick={() => unsubscribeFromService(serviceName)}
            style={{ padding: '10px 20px', margin: '5px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: '#f44336', color: 'white' }}
          >
            Se désabonner
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{ padding: '8px', margin: '5px', borderRadius: '5px', border: '1px solid #444', background: '#333', color: '#e0e0e0' }}
          >
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <button
            onClick={() => subscribeToLevel(selectedLevel)}
            style={{ padding: '10px 20px', margin: '5px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: '#4CAF50', color: 'white' }}
          >
            S'abonner au niveau
          </button>
          <button
            onClick={() => unsubscribeFromLevel(selectedLevel)}
            style={{ padding: '10px 20px', margin: '5px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: '#f44336', color: 'white' }}
          >
            Se désabonner
          </button>
        </div>
        <div>
          <button
            onClick={clearErrors}
            style={{ padding: '10px 20px', margin: '5px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: '#666', color: 'white' }}
          >
            Effacer les notifications
          </button>
        </div>
      </div>

      {/* Notifications */}
      <h2>Notifications en temps réel ({errors.length})</h2>
      <div>
        {errors.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
            Aucune notification pour le moment
          </p>
        ) : (
          errors.map((error, index) => (
            <ErrorNotification key={`${error.id}-${index}`} error={error} />
          ))
        )}
      </div>
    </div>
  );
};

export default AvalonMonitor;
