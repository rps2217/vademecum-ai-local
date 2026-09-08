/**
 * HomePage - Dashboard del mostrador de farmacia
 *
 * Punto de partida al desbloquear la app.
 * Diseño optimizado para baja densidad de texto, estética de búsqueda local y consulta rápida en mostrador.
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
  Search,
  BarChart3,
  ClipboardList,
  Database,
  Package,
  Link2,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Star,
  Command,
  Activity,
  BookOpen,
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

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    navigate('/search');
  };

  const quickSymptoms = [
    { label: 'Insomnio', query: 'insomnio', icon: '💤' },
    { label: 'Estrés', query: 'ansiedad', icon: '🧠' },
    { label: 'Digestión', query: 'digestivo', icon: '🩺' },
    { label: 'Inmunidad', query: 'inmune', icon: '🛡️' },
    { label: 'Articulaciones', query: 'articulaciones', icon: '🦴' },
    { label: 'Fatiga', query: 'fatiga', icon: '⚡' },
    { label: 'Circulación', query: 'circulacion', icon: '🫀' },
  ];

  const mainModules = [
    {
      id: 'analysis-module',
      title: 'Interacciones y Sinergias',
      subtitle: 'Comprobador de compatibilidad y alertas',
      badge: stats ? `${stats.synergies.toLocaleString('es-ES')} relaciones` : 'Verificar',
      icon: BarChart3,
      href: '/analysis',
      accentColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-200/60 dark:border-blue-900/50',
    },
    {
      id: 'knowledge-module',
      title: 'Base de Conocimiento',
      subtitle: 'Fitoterapia, aceites, vitaminas y homeopatía',
      badge: stats ? `${stats.ingredients.toLocaleString('es-ES')} ingredientes` : 'Explorar',
      icon: Database,
      href: '/knowledge',
      accentColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-200/60 dark:border-purple-900/50',
    },
    {
      id: 'products-module',
      title: 'Catálogo de Productos',
      subtitle: 'Fórmulas comerciales y composiciones',
      badge: stats ? `${stats.products.toLocaleString('es-ES')} productos` : 'Catálogo',
      icon: Package,
      href: '/products',
      accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200/60 dark:border-amber-900/50',
    },
    {
      id: 'protocols-module',
      title: 'Protocolos Clínicos',
      subtitle: 'Guías estructuradas de dispensación',
      badge: protocols ? `${protocols.length} activos` : 'Guías',
      icon: ClipboardList,
      href: '/protocols',
      accentColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-900/50',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-8" id="dashboard-root">
      {/* Search & Hero Card */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/60 p-6 sm:p-8 shadow-xs" aria-label="Búsqueda central">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Vademecum AI · Mostrador local offline
          </div>

          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Búsqueda y consulta de mostrador
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Localiza ingredientes, patologías, productos comerciales e interacciones en tiempo real.
            </p>
          </div>

          {/* Omnibox Search */}
          <form onSubmit={handleSearch} className="pt-2" role="search">
            <div className="relative group">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" aria-hidden="true" />
              <input
                id="dashboard-search-input"
                type="search"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Busca por síntoma, ingrediente, marca o patología..."
                autoFocus
                aria-label="Buscar en la base de datos local"
                className="h-13 w-full rounded-xl border-2 border-border/80 bg-background/90 pl-11 pr-28 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-xs"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  <Command className="h-3 w-3" aria-hidden="true" /> K
                </span>
                <button
                  type="submit"
                  id="dashboard-search-submit"
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Buscar
                </button>
              </div>
            </div>
          </form>

          {/* Quick Symptoms Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">Consultas frecuentes:</span>
            {quickSymptoms.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleQuickSearch(s.query)}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all cursor-pointer"
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Feature Cards (2x2 Grid) */}
      <section aria-label="Módulos de consulta">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {mainModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                id={mod.id}
                to={mod.href}
                className="group relative flex items-start gap-4 rounded-xl border border-border bg-card p-4.5 transition-all hover:border-primary/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className={`shrink-0 rounded-xl p-3 border ${mod.accentColor} transition-transform group-hover:scale-105`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {mod.title}
                    </h2>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {mod.subtitle}
                  </p>
                  <div className="mt-2.5">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {mod.badge}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Secondary Cards: Favorites, Recent & Protocols */}
      <section className="grid gap-4 md:grid-cols-2" aria-label="Accesos rápidos y protocolos">
        {/* Recent Searches / Favorites Card */}
        <Card className="flex flex-col justify-between p-4.5 border-border">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Búsquedas recientes
                </h3>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  Ver todas
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {history.slice(0, 7).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleQuickSearch(entry.query)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                  >
                    <span>{entry.query}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground">No hay búsquedas recientes en esta sesión.</p>
              </div>
            )}
          </div>

          {/* Favorites snippet if available */}
          {favoriteIngredients.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
                <span className="text-xs font-medium text-foreground">Ingredientes guardados</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {favoriteIngredients.slice(0, 5).map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handleQuickSearch(ing.nombre)}
                    className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    {ing.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Featured Protocols Card */}
        <Card className="flex flex-col justify-between p-4.5 border-border">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Protocolos destacados
                </h3>
              </div>
              <Link
                to="/protocols"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver catálogo
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="space-y-2">
              {protocols && protocols.length > 0 ? (
                protocols.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    to="/protocols"
                    className="flex items-center justify-between rounded-lg border border-border/80 bg-background p-2.5 transition-all hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-xs font-semibold text-foreground">{p.nombre}</p>
                      <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                        {p.ingredientes.length} activos · {p.duracionDias} días de pauta
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Guía
                    </span>
                  </Link>
                ))
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">Cargando protocolos clínicos...</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Pautas clínicas estructuradas</span>
            <span className="font-medium text-foreground">100% offline</span>
          </div>
        </Card>
      </section>

      {/* Database Metrics Bar */}
      {stats && (
        <section aria-label="Métricas de la base de datos">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatCard icon={BookOpen} label="Ingredientes KB" value={stats.ingredients} />
            <StatCard icon={Link2} label="Sinergias y alertas" value={stats.synergies} />
            <StatCard icon={Package} label="Productos indexados" value={stats.products} />
            <StatCard icon={Activity} label="Patologías clínicas" value={stats.pathologies} />
          </div>
        </section>
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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-border/80">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold tracking-tight text-foreground">{value.toLocaleString('es-ES')}</p>
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

