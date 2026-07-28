/**
 * SynergiesPage - Red de sinergias
 */

import { useState, useEffect } from 'react';
import { db } from '@/db';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { SearchInput } from '@/ui/SearchInput';
import { Network, ArrowRight, TrendingUp } from 'lucide-react';
import type { Synergy } from '@/db/schema';

export function SynergiesPage() {
  const [synergies, setSynergies] = useState<Synergy[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSynergies() {
      setIsLoading(true);
      try {
        const results = await db.synergies.toArray();
        setSynergies(results);
      } catch (error) {
        console.error('Error loading synergies:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSynergies();
  }, []);

  const filteredSynergies = synergies.filter(
    (s) =>
      s.ingredienteA.toLowerCase().includes(query.toLowerCase()) ||
      s.ingredienteB.toLowerCase().includes(query.toLowerCase()) ||
      s.tipo.toLowerCase().includes(query.toLowerCase())
  );

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'sinergia':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'complemento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'interaccion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getLevelColor = (nivel: string) => {
    switch (nivel) {
      case 'alto':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'bajo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Red de sinergias</h1>
        <p className="text-muted-foreground mt-1">
          {synergies.length} combinaciones sinérgicas
        </p>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por ingrediente o tipo..."
      />

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : filteredSynergies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSynergies.map((synergy) => (
            <Card key={synergy.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Network className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{synergy.ingredienteA}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{synergy.ingredienteB}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getTypeColor(synergy.tipo)}>
                      {synergy.tipo}
                    </Badge>
                    <Badge className={getLevelColor(synergy.nivel)}>
                      {synergy.nivel}
                    </Badge>
                  </div>
                </div>
              </div>
              {synergy.mecanismo && (
                <p className="text-sm text-muted-foreground mt-3">
                  {synergy.mecanismo}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron sinergias</p>
        </div>
      )}
    </div>
  );
}
