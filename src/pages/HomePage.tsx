/**
 * HomePage - Página principal
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/db';
import { StatsCard } from '@/ui/StatsCard';
import { Card } from '@/ui/Card';
import { Search, BookOpen, Network, Sparkles, TrendingUp, Shield, Database } from 'lucide-react';

export function HomePage() {
  const [stats, setStats] = useState({
    ingredients: 0,
    synergies: 0,
    categories: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const [ingredients, synergies] = await Promise.all([
        db.ingredients.count(),
        db.synergies.count(),
      ]);
      
      setStats({
        ingredients,
        synergies,
        categories: 5, // fitoterapia, homeopatia, aceites, vitaminas, minerales
      });
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido</h1>
        <p className="text-muted-foreground mt-1">
          Tu base de conocimiento de complementos alimenticios
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Ingredientes"
          value={stats.ingredients}
          icon={<BookOpen className="w-5 h-5" />}
          change={12}
          changeLabel="este mes"
        />
        <StatsCard
          title="Sinergias"
          value={stats.synergies}
          icon={<Network className="w-5 h-5" />}
        />
        <StatsCard
          title="Categorías"
          value={stats.categories}
          icon={<Shield className="w-5 h-5" />}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/search">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Búsqueda inteligente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Encuentra ingredientes por nombre, síntomas o categorías
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/knowledge">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Database className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Base de conocimiento</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Explora todos los ingredientes disponibles
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/synergies">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-500/10 rounded-lg">
                <Network className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold">Red de sinergias</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Descubre combinaciones beneficiosas
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/analysis">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Motor de sugerencias</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  IA local para análisis de combinaciones
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent activity placeholder */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Actividad reciente
          </h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          No hay actividad reciente todavía. ¡Comienza buscando!
        </p>
      </Card>
    </div>
  );
}
