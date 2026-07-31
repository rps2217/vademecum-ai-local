/**
 * DbProvider - Proveedor de base de datos
 * 
 * Inicializa Dexie y el seeder de KB.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/db';
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

    return () => {
      db.close();
    };
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
