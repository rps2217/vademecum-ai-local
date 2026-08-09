/**
 * DbProvider - Proveedor de base de datos
 * 
 * Inicializa Dexie y el seeder de KB.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { db, initLamportFromDb } from '@/db';
import { seedKnowledgeBase, isKnowledgeBaseSeeded } from '@/db/seeders';
import { logger } from '@/lib/logger';

interface DbContextValue {
  isReady: boolean;
  error: Error | null;
  stats?: { ingredients: number; synergies: number };
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<{ ingredients: number; synergies: number }>();

  useEffect(() => {
    async function initDb() {
      try {
        // Open database
        await db.open();
        // Hidratar Lamport clock desde la DB (para sync correcto entre recargas)
        await initLamportFromDb();
        
        // Check if we need to seed
        const seeded = await isKnowledgeBaseSeeded();
        if (!seeded) {
          const result = await seedKnowledgeBase();
          setStats(result);
        } else {
          // Get existing stats
          const ingredients = await db.ingredients.count();
          const synergies = await db.synergies.count();
          setStats({ ingredients, synergies });
        }
        
        setIsReady(true);
      } catch (err) {
        logger.error('Database initialization failed:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    }

    initDb();

    // NOTE: Do NOT close the database on cleanup. `db` is an app-global Dexie
    // singleton meant to live for the entire app lifetime. Closing it here
    // breaks React 19 StrictMode's mount → unmount → remount cycle in dev,
    // where the cleanup closes the DB while init is still in flight, causing
    // a "DatabaseClosedError: Database has been closed".
  }, []);

  return (
    <DbContext.Provider value={{ isReady, error, stats }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const context = useContext(DbContext);
  if (!context) {
    throw new Error('useDb must be used within DbProvider');
  }
  return context;
}
