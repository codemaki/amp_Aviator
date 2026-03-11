import { useState, useEffect } from 'react';
import { useWeaviateStore, WeaviateConnection } from '../store/useWeaviateStore';
import { Database, Key, Server, Loader2, Plus, Edit2, Trash2, Plug } from 'lucide-react';
import styles from './Connection.module.css';

export default function ConnectionScreen() {
  const {
    connect, setUrl, setApiKey, setInferenceApiKey, connections,
    addConnection, updateConnection, removeConnection
  } = useWeaviateStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [localUrl, setLocalUrl] = useState('');
  const [localApiKey, setLocalApiKey] = useState('');
  const [localInferenceApiKey, setLocalInferenceApiKey] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial load: select first connection if available
  useEffect(() => {
    if (connections.length > 0 && selectedId === null) {
      handleSelectConnection(connections[0]);
    }
  }, [connections]);

  const handleSelectConnection = (conn: WeaviateConnection) => {
    setSelectedId(conn.id);
    setFormName(conn.name);
    setLocalUrl(conn.url);
    setLocalApiKey(conn.apiKey);
    setLocalInferenceApiKey(conn.inferenceApiKey || '');
    setError('');
  };

  const handleNewConnection = () => {
    setSelectedId(null);
    setFormName('New Connection');
    setLocalUrl('');
    setLocalApiKey('');
    setLocalInferenceApiKey('');
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !localUrl.trim()) return;
    
    if (selectedId) {
      updateConnection(selectedId, { name: formName, url: localUrl, apiKey: localApiKey, inferenceApiKey: localInferenceApiKey });
    } else {
      addConnection({ name: formName, url: localUrl, apiKey: localApiKey, inferenceApiKey: localInferenceApiKey });
      // The newest connection will be at the end. We might want to select it, 
      // but without its ID it's tricky. Zustand's return could provide it, or we rely on the user to click it.
      // For now, we just let it add, and maybe reset form.
      handleNewConnection();
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent select
    if (window.confirm("Delete this connection profile?")) {
      removeConnection(id);
      if (selectedId === id) {
        handleNewConnection();
      }
    }
  };

  const handleConnect = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Update store immediately for the connection attempt
    setUrl(localUrl);
    setApiKey(localApiKey);
    setInferenceApiKey(localInferenceApiKey);
    
    const success = await connect();
    if (!success) {
      setError('Could not connect to Weaviate. Check URL & API Key.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.managerCard}`}>
        
        {/* SIDEBAR: List of Connections */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Saved Connections</h3>
            <button className={styles.addNavBtn} onClick={handleNewConnection} title="New Connection">
              <Plus size={16} />
            </button>
          </div>
          
          <div className={styles.connectionList}>
            {connections.length === 0 ? (
              <div className={styles.noConnections}>No saved profiles</div>
            ) : (
              connections.map(conn => (
                <div 
                  key={conn.id} 
                  className={`${styles.connectionItem} ${selectedId === conn.id ? styles.selected : ''}`}
                  onClick={() => handleSelectConnection(conn)}
                >
                  <div className={styles.connItemInfo}>
                    <Database size={16} className={styles.connItemIcon} />
                    <div className={styles.connItemText}>
                      <span className={styles.connName}>{conn.name}</span>
                      <span className={styles.connUrl}>{conn.url.replace(/^https?:\/\//, '')}</span>
                    </div>
                  </div>
                  <button className={styles.delBtn} onClick={(e) => handleDelete(conn.id, e)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN AREA: Form & Connect */}
        <div className={styles.mainArea}>
          <div className={styles.header}>
            <div className={styles.iconContainer}>
              <Server className={styles.icon} size={32} />
            </div>
            <h1 className="gradient-text">{selectedId ? 'Edit Connection' : 'New Connection'}</h1>
            <p>Configure and connect to your instance</p>
          </div>

          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Profile Name</label>
              <div className={styles.inputWrapper}>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Local Weaviate, Production"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="url">Weaviate URL</label>
              <div className={styles.inputWrapper}>
                <Server className={styles.inputIcon} size={18} />
                <input
                  id="url"
                  type="url"
                  placeholder="https://my-weaviate.example.com"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="apiKey">API Key (Optional)</label>
              <div className={styles.inputWrapper}>
                <Key className={styles.inputIcon} size={18} />
                <input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API Key"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="inferenceApiKey">Inference API Key (Optional)</label>
              <div className={styles.inputWrapper}>
                <Key className={styles.inputIcon} size={18} />
                <input
                  id="inferenceApiKey"
                  type="password"
                  placeholder="Azure / OpenAI API Key for vectorization"
                  value={localInferenceApiKey}
                  onChange={(e) => setLocalInferenceApiKey(e.target.value)}
                />
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actionButtons}>
              <button 
                type="submit" 
                className={styles.saveButton}
              >
                <Database size={16} /> Save Profile
              </button>
              
              <button 
                type="button" 
                className={styles.connectButton}
                onClick={handleConnect}
                disabled={isLoading || !localUrl}
              >
                {isLoading ? (
                  <>
                    <Loader2 className={styles.spinner} size={18} /> Connecting...
                  </>
                ) : (
                  <>
                    <Plug size={18} /> Connect
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Dynamic background element */}
      <div className={styles.glowBlob}></div>
    </div>
  );
}
