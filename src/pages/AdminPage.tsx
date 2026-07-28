/**
 * AdminPage - Gestión de base de conocimiento
 */

import { useState, useEffect } from 'react';
import { db } from '@/db';
import { Card } from '@/ui/Card';
import { StatsCard } from '@/ui/StatsCard';
import { Button } from '@/ui/Button';
import { Database, RefreshCw, Upload, Download, Trash2, Shield } from 'lucide-react';

export function AdminPage() {
  const [stats, setStats] = useState({
    ingredients: 0,
    synergies: 0,
    size: '0 KB',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ingredients, synergies] = await Promise.all([
        db.ingredients.count(),
        db.synergies.count(),
      ]);
      setStats({
        ingredients,
        synergies,
        size: '~2 MB',
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleReindex = async () => {
    setIsLoading(true);
    try {
      // TODO: Reindex embeddings
      await loadStats();
    } catch (error) {
      console.error('Error reindexing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la base de conocimiento
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Ingredientes"
          value={stats.ingredients}
          icon={<Database className="w-5 h-5" />}
        />
        <StatsCard
          title="Sinergias"
          value={stats.synergies}
          icon={<Shield className="w-5 h-5" />}
        />
        <StatsCard
          title="Tamaño"
          value={stats.size}
          icon={<Database className="w-5 h-5" />}
        />
      </div>

      {/* Actions */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Acciones de administración</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="justify-start"
            onClick={handleReindex}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Reindexar búsqueda
          </Button>
          <Button variant="outline" className="justify-start">
            <Upload className="w-4 h-4 mr-2" />
            Importar datos
          </Button>
          <Button variant="outline" className="justify-start">
            <Download className="w-4 h-4 mr-2" />
            Exportar datos
          </Button>
          <Button variant="destructive" className="justify-start">
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar caché
          </Button>
        </div>
      </Card>

      {/* Sync status placeholder */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Estado de sincronización</h2>
        <p className="text-muted-foreground">
          La sincronización con Supabase está deshabilitada. Habilítala en Ajustes.
        </p>
      </Card>
    </div>
  );
}
