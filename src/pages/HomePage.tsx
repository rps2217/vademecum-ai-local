/**
 * HomePage - Dashboard del mostrador de farmacia
 *
 * Punto de partida al desbloquear la app. Ofrece:
 * - Búsqueda rápida (navega a /search con el query)
 * - Accesos directos a las herramientas principales
 * - Búsquedas recientes (sessionStorage, sin datos personales)
 * - Protocolos destacados
 * - Stats de la base de conocimiento
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { useSearch } from '@/contexts/SearchContext';
import { useConsultationHistory } from '@/hooks/useConsultationHistory';
import { useFavorites } from '@/hooks/useFavorites';
import { Card } from '@/ui/Card';
import {
  Search, BarChart3, ClipboardList, Database, Package, Link2,
  Pill, Clock, ArrowRight, Sparkles, TrendingUp, Star,
} from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const { setQuery } = useSearch();
  const { history } = useConsultationHistory();
  const { favoriteIngredients } = useFavorites();
  const [localQuery, setLocalQuery] = useState('');

  const protocols = useLiveQuery(
    () => db.protocols.where('tombstone').equals(0).limit(4).toArray(),
    [],
  );

  const stats = useLiveQuery(async () => {
    const [ingredients, synergies, products, pathologies] = await Promise.all([
      db.ingredients.where('tombstone').equals(0).count(),
      db.synergies.where('tombstone').equals(0).count(),
      db.products.count(),
      db.pathologies.count(),
    ]);
    return { ingredients, synergies, products, pathologies };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setQuery(localQuery.trim());
      navigate('/search');
    }
  };

  const handleRecentClick = (query: string) => {
    setQuery(query);
    navigate('/search');
  };

  const quickActions = [
    { label: 'Análisis de interacciones', description: 'Verificar sinergias y riesgos', icon: BarChart3, href: '/analysis', color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Protocolos', description: 'Protocolos de suplementación', icon: ClipboardList, href: '/protocols', color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Base de conocimiento', description: 'Explorar ingredientes', icon: Database, href: '/knowledge', color: 'text-purple-600 bg-purple-500/10' },
    { label: 'Productos', description: 'Catálogo de productos', icon: Package, href: '/products', color: 'text-amber-600 bg-amber-500/10' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero */}
      <div className="space-y-6 pt-4 text-center sm:pt-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Vademecum AI
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Consulta inteligente del mostrador
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Busca ingredientes, síntomas o patologías. 100% offline, al instante.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mx-auto max-w-2xl" role="search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Buscar ingredientes, síntomas o patologías..."
              autoFocus
              aria-label="Buscar"
              className="h-14 w-full rounded-2xl border border-border bg-muted pl-12 pr-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              to={action.href}
              className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Favorites */}
      {favoriteIngredients.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Favoritos</h2>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {favoriteIngredients.slice(0, 8).map((ing) => (
              <button
                key={ing.id}
                onClick={() => {
                  setQuery(ing.nombre);
                  navigate('/search');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" aria-hidden="true" />
                {ing.nombre}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Recent searches + Protocols */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent searches */}
        {history.length > 0 && (
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Búsquedas recientes</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 8).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleRecentClick(entry.query)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {entry.query}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Featured protocols */}
        {protocols && protocols.length > 0 && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Protocolos destacados</h2>
              </div>
              <Link
                to="/protocols"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver todos
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-2">
              {protocols.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to="/protocols"
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.ingredientes.length} ingredientes · {p.duracionDias} días
                    </p>
                  </div>
                  <Pill className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* KB Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Database} label="Ingredientes" value={stats.ingredients} />
          <StatCard icon={Link2} label="Sinergias" value={stats.synergies} />
          <StatCard icon={Package} label="Productos" value={stats.products} />
          <StatCard icon={TrendingUp} label="Patologías" value={stats.pathologies} />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: {
  icon: typeof Database;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold">{value.toLocaleString('es-ES')}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
