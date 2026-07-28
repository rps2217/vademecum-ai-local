/**
 * DbProvider - Proveedor de base de datos
 * 
 * Inicializa Dexie y el seeder.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { db, seedDatabase } from '@/db';

interface DbContextValue {
  isReady: boolean;
  error: Error | null;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initDb() {
      try {
        // Open database
        await db.open();
        
        // Check if we need to seed
        const count = await db.ingredients.count();
        if (count === 0) {
          await seedDatabase();
        }
        
        setIsReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    }

    initDb();

    return () => {
      db.close();
    };
  }, []);

  return (
    <DbContext.Provider value={{ isReady, error }}>
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
