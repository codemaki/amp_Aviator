import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface WeaviateConnection {
  id: string;
  name: string;
  url: string;
  apiKey: string;
}

interface WeaviateStore {
  url: string;
  apiKey: string;
  isConnected: boolean;
  connections: WeaviateConnection[];
  setUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addConnection: (conn: Omit<WeaviateConnection, 'id'>) => void;
  updateConnection: (id: string, conn: Omit<WeaviateConnection, 'id'>) => void;
  removeConnection: (id: string) => void;
}

export const useWeaviateStore = create<WeaviateStore>()(
  persist(
    (set, get) => ({
      url: '',
      apiKey: '',
      isConnected: false,
      connections: [],
      
      setUrl: (url) => set({ url }),
      setApiKey: (apiKey) => set({ apiKey }),
      
      connect: async () => {
        const { url, apiKey } = get();
        if (!url) return false;
        
        // Test connection via our Next.js API proxy
        try {
            const response = await fetch('/api/weaviate/meta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, apiKey })
            });
            
            if (response.ok) {
                set({ isConnected: true });
                return true;
            }
            return false;
        } catch (error) {
            console.error("Connection failed", error);
            return false;
        }
      },
      
      disconnect: () => set({ isConnected: false }),
      
      addConnection: (conn) => set((state) => ({
        connections: [...state.connections, { ...conn, id: uuidv4() }]
      })),
      
      updateConnection: (id, conn) => set((state) => ({
        connections: state.connections.map(c => c.id === id ? { ...c, ...conn } : c)
      })),
      
      removeConnection: (id) => set((state) => ({
        connections: state.connections.filter(c => c.id !== id)
      }))
    }),
    {
      name: 'weaviate-connections-storage',
      // only persist connections array
      partialize: (state) => ({ connections: state.connections }),
    }
  )
);
