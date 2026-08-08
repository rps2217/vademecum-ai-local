/**
 * HomePage - Pagina principal rediseñada
 *
 * Layout limpio: encabezado con jerarquía profesional, sugerencias rápidas,
 * KPI cards en una fila y accesos directos. La búsqueda vive en la barra
 * superior (header) para evitar inputs duplicados.
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '@/db';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { useAsync } from '@/hooks/useAsync';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Network,
  Sparkles,
  Database,
  Leaf,
  Shield,
  Clock,
  CheckCircle2,
  DatabaseZap,
  Tag,
} from 'lucide-react';

const QUICK_SUGGESTIONS = [
  { label: 'Valeriana', icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' },
  { label: 'Equinacea', icon: Shield, color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
  { label: 'Magnesio', icon: Sparkles, color: 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20' },
  { label: 'Vitamina D', icon: Sparkles, color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
  { label: 'Sinergias', icon: Network, color: 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20' },
  { label: 'Pasiflora', icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' },
  { label: 'Omega-3', icon: Sparkles, color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
  { label: 'Ashwagandha', icon: Shield, color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
];

type StatsData = { ingredients: number; synergies: number; categories: number };

const KPI_META = [
  { key: 'ingredients' as const, label: 'Ingredientes', icon: BookOpen, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-500/10' },
  { key: 'synergies' as const, label: 'Sinergias', icon: Network, iconClass: 'text-violet-600', bgClass: 'bg-violet-500/10' },
  { key: 'categories' as const, label: 'Categorías', icon: Tag, iconClass: 'text-amber-600', bgClass: 'bg-amber-500/10' },
];

export function HomePage() {
  const navigate = useNavigate();
  const asyncState = useAsync<StatsData>();

  const loadStats = async (): Promise<StatsData> => {
    const [ingredients, synergies, allIngredients] = await Promise.all([
      db.ingredients.count(),
      db.synergies.count(),
      db.ingredients.toArray(),
    ]);
    const categories = new Set(allIngredients.map((i) => i.categoria));
    return { ingredients, synergies, categories: categories.size };
  };

  useEffect(() => {
    asyncState.execute(loadStats());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuggestionClick = (label: string) => {
    navigate(`/search?q=${encodeURIComponent(label)}`);
  };

  const stats =
    asyncState.status === 'success'
      ? asyncState.data
      : { ingredients: 0, synergies: 0, categories: 0 };
  const isLoading = asyncState.status === 'loading' || asyncState.status === 'idle';
  const isDatabaseEmpty = stats.ingredients === 0 && asyncState.status === 'success';

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      {/* Header / Hero */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
          ¿Qué buscás?
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Buscá cualquier producto, ingrediente o síntoma desde la barra superior.
        </p>
      </header>

      {/* Quick Suggestions */}
      <section className="flex flex-col gap-3" aria-labelledby="suggestions-title">
        <h2 id="suggestions-title" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sugerencias rápidas
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={suggestion.label}
                onClick={() => handleSuggestionClick(suggestion.label)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  suggestion.color
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {suggestion.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* KPI Cards */}
      <section aria-label="Estadísticas de la base de conocimiento">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {KPI_META.map(({ key, label, icon: Icon, iconClass, bgClass }) => (
            <Card key={key} className="flex items-center gap-4 p-5">
              <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg', bgClass)}>
                <Icon className={cn('h-5 w-5', iconClass)} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                {isLoading ? (
                  <span className="mt-1 block h-7 w-12 animate-pulse rounded bg-muted" aria-hidden="true" />
                ) : (
                  <p className="text-2xl font-bold leading-none text-foreground">{stats[key]}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Database Empty State */}
      {isDatabaseEmpty && (
        <Card className="border-dashed p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <DatabaseZap className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Base de conocimiento vacía</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Inicializa la base para cargar los ingredientes disponibles
              </p>
            </div>
            <Button onClick={() => navigate('/admin')} leftIcon={<DatabaseZap className="h-4 w-4" aria-hidden="true" />}>
              Inicializar base de conocimiento
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Access Cards */}
      <section aria-label="Accesos directos">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link to="/knowledge" className="group focus-visible:outline-none">
            <Card className="p-5 transition-colors hover:border-primary group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-500/10 p-3 transition-colors group-hover:bg-emerald-500/20">
                  <Database className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-foreground">
                    Base de Conocimiento
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.ingredients} ingredientes disponibles
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/synergies" className="group focus-visible:outline-none">
            <Card className="p-5 transition-colors hover:border-primary group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-violet-500/10 p-3 transition-colors group-hover:bg-violet-500/20">
                  <Network className="h-6 w-6 text-violet-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-foreground">
                    Sinergias
                    <CheckCircle2 className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.synergies} combinaciones disponibles
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="flex flex-col items-center gap-2 border-t border-border pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          <span>Todos los datos en tu dispositivo</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>Actualizado {new Date().toLocaleDateString('es-ES')}</span>
        </div>
      </footer>
    </div>
  );
}
