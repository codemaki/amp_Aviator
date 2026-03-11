'use client';

import { useWeaviateStore } from '../store/useWeaviateStore';
import ConnectionScreen from '../components/ConnectionScreen';
import DashboardScreen from '../components/DashboardScreen';

export default function Home() {
  const { isConnected } = useWeaviateStore();

  return (
    <main>
      {isConnected ? <DashboardScreen /> : <ConnectionScreen />}
    </main>
  );
}
