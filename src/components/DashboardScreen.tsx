import { useEffect, useState } from 'react';
import { useWeaviateStore } from '../store/useWeaviateStore';
import { Database, LogOut, Layers, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import styles from './Dashboard.module.css';
import DataBrowser from './DataBrowser';

interface WeaviateClass {
  class: string;
  description: string;
  vectorizer: string;
  properties?: any[];
}

export default function DashboardScreen() {
  const { url, apiKey, disconnect } = useWeaviateStore();
  const [classes, setClasses] = useState<WeaviateClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState<WeaviateClass | null>(null);

  useEffect(() => {
    async function fetchSchema() {
      try {
        const res = await fetch('/api/weaviate/schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, apiKey })
        });
        
        if (!res.ok) throw new Error('Failed to fetch schema');
        
        const data = await res.json();
        setClasses(data.classes || []);
      } catch (err: any) {
        setError(err.message || 'Error loading schema');
      } finally {
        setLoading(false);
      }
    }

    if (url) {
      fetchSchema();
    }
  }, [url, apiKey]);

  return (
    <div className={styles.container}>
      <header className={`glass-panel ${styles.header}`}>
        <div className={styles.logoInfo}>
          <div className={styles.iconContainer}>
            <Database size={24} />
          </div>
          <div>
            <h2 className="gradient-text">Aviator</h2>
            <div className={styles.connectionStatus}>
              <span className={styles.statusDot}></span> Connected to {new URL(url).hostname}
            </div>
          </div>
        </div>
        
        <button className={styles.disconnectBtn} onClick={disconnect}>
          <LogOut size={16} /> Disconnect
        </button>
      </header>

      <main className={styles.mainContent}>
        {selectedClass ? (
          <DataBrowser 
            className={selectedClass.class} 
            properties={selectedClass.properties || []}
            onBack={() => setSelectedClass(null)} 
          />
        ) : (
          <>
            <div className={styles.topSection}>
              <h1>Your Collections</h1>
              <p className={styles.subtitle}>Explore classes and schemas in your Weaviate instance.</p>
            </div>

            {loading ? (
              <div className={styles.centeredState}>
                <Loader2 className={styles.spinner} size={48} />
                <p>Loading schema...</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <AlertCircle size={48} />
                <h2>Connection Error</h2>
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={disconnect}>Go Back</button>
              </div>
            ) : classes.length === 0 ? (
              <div className={styles.emptyState}>
                <Layers size={48} />
                <h2>No Collections Found</h2>
                <p>This Weaviate instance currently has no classes configured.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {classes.map((cls) => (
                  <div key={cls.class} className={`glass-panel ${styles.classCard}`}>
                    <div className={styles.cardHeader}>
                      <div className={styles.classIcon}>
                        <Layers size={20} />
                      </div>
                      <h3>{cls.class}</h3>
                    </div>
                    
                    <p className={styles.description}>
                      {cls.description || 'No description provided for this collection.'}
                    </p>
                    
                    <div className={styles.metadata}>
                      <div className={styles.metaItem}>
                        <span>Properties</span>
                        <strong>{cls.properties?.length || 0}</strong>
                      </div>
                      <div className={styles.metaItem}>
                        <span>Vectorizer</span>
                        <strong>{cls.vectorizer}</strong>
                      </div>
                    </div>
                    
                    <button 
                      className={styles.viewDataBtn}
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Data <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
