/**
 * HomePage - Pagina principal rediseñada
 * 
 * Hero search con sugerencias rapidas y stats reales.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '@/db';
import { SearchInput } from '@/ui/SearchInput';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { useAsync } from '@/hooks/useAsync';
import { ListSkeleton } from '@/ui/Skeleton';
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

export function HomePage() {
  const navigate = useNavigate();
  const { status, data, execute } = useAsync<StatsData>();
  const [query, setQuery] = useState('');

  useEffect(() => {
    execute(loadStats());
  }, [execute]);

  const loadStats = async (): Promise<StatsData> => {
    const [ingredients, synergies, allIngredients] = await Promise.all([
      db.ingredients.count(),
      db.synergies.count(),
      db.ingredients.toArray(),
    ]);
    const categories = new Set(allIngredients.map(i => i.categoria));
    return { ingredients, synergies, categories: categories.size };
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  const handleSuggestionClick = (label: string) => {
    navigate(`/search?q=${encodeURIComponent(label)}`);
  };

  const stats = data || { ingredients: 0, synergies: 0, categories: 0 };
  const isDatabaseEmpty = stats.ingredients === 0 && status === 'success';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Que buscás?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Buscá cualquier producto, ingrediente o sintoma
        </p>
      </div>

      {/* Hero Search */}
      <div className="relative max-w-2xl mx-auto">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="valeriana, pasiflora, ansiedad..."
          onSearch={handleSearch}
         
        />
        <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground">
          <span>⌘</span>K
        </kbd>
      </div>

      {/* Quick Suggestions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground text-center">
          Sugerencias rapidas
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {QUICK_SUGGESTIONS.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={suggestion.label}
                onClick={() => handleSuggestionClick(suggestion.label)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${suggestion.color}`}
              >
                <Icon className="w-4 h-4" />
                {suggestion.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Stats */}
      {status === 'loading' ? (
        <ListSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Ingredientes</span>
            </div>
            <p className="text-3xl font-bold">{stats.ingredients}</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Network className="w-5 h-5 text-violet-500" />
              <span className="text-sm text-muted-foreground">Sinergias</span>
            </div>
            <p className="text-3xl font-bold">{stats.synergies}</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">Categorias</span>
            </div>
            <p className="text-3xl font-bold">{stats.categories}</p>
          </Card>
        </div>
      )}

      {/* Database Empty State */}
      {isDatabaseEmpty && (
        <Card className="p-6 border-dashed">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              <DatabaseZap className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Base de conocimiento vacia</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Inicializa la base para cargar los ingredientes disponibles
              </p>
            </div>
            <Button onClick={() => navigate('/admin')} className="mx-auto">
              <DatabaseZap className="w-4 h-4 mr-2" />
              Inicializar base de conocimiento
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/knowledge">
          <Card className="p-5 hover:border-primary transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <Database className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Base de Conocimiento
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats.ingredients} ingredientes disponibles
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/synergies">
          <Card className="p-5 hover:border-primary transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                <Network className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Sinergias
                  <CheckCircle2 className="w-4 h-4 text-violet-500" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats.synergies} combinaciones disponibles
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Footer Info */}
      <div className="text-center space-y-2 pt-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Todos los datos en tu dispositivo</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Actualizado {new Date().toLocaleDateString('es-ES')}</span>
        </div>
      </div>
    </div>
  );
}
