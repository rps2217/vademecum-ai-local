/**
 * CommandPalette - Navegación y búsqueda rápida con ⌘K.
 *
 * Abre con Cmd/Ctrl+K. Permite navegar a secciones y buscar
 * ingredientes/patologías al instante usando el índice invertido.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ingredientSearchService, useSearchIndex } from '@/core/search';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { normalize, humanize } from '@/lib/text';
import {
  Search, Home, Database, Link2, BarChart3, Shield, Settings,
  CornerDownLeft, Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  action: () => void;
  group: 'Navegación' | 'Ingredientes' | 'Patologías';
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Inicio / Búsqueda', href: '/', icon: Home },
  { label: 'Base de Conocimiento', href: '/knowledge', icon: Database },
  { label: 'Sinergias', href: '/synergies', icon: Link2 },
  { label: 'Análisis', href: '/analysis', icon: BarChart3 },
  { label: 'Admin', href: '/admin', icon: Shield },
  { label: 'Configuración', href: '/settings', icon: Settings },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { ready } = useSearchIndex();
  const pathologies = useLiveQuery(() => db.pathologies.toArray(), []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const navItems: PaletteItem[] = NAV_ITEMS.map((n) => ({
      id: `nav-${n.href}`,
      label: n.label,
      icon: n.icon,
      group: 'Navegación',
      action: () => { navigate(n.href); onClose(); },
    }));

    if (!query.trim()) return navItems;
    const nq = normalize(query);

    const ingItems: PaletteItem[] = [];
    if (ready) {
      const results = ingredientSearchService.searchSync({ query }).slice(0, 8);
      for (const r of results) {
        ingItems.push({
          id: `ing-${r.ingredient.id}`,
          label: r.ingredient.nombre,
          hint: humanize(r.ingredient.categoria),
          icon: Search,
          group: 'Ingredientes',
          action: () => { navigate(`/?q=${encodeURIComponent(r.ingredient.nombre)}`); onClose(); },
        });
      }
    }

    const pathItems: PaletteItem[] = [];
    if (pathologies) {
      for (const p of pathologies) {
        if (normalize(p.nombre).includes(nq) || p.sintomas.some(s => normalize(s).includes(nq))) {
          pathItems.push({
            id: `path-${p.id}`,
            label: p.nombre,
            hint: 'Patología',
            icon: Stethoscope,
            group: 'Patologías',
            action: () => { navigate(`/?q=${encodeURIComponent(p.nombre)}`); onClose(); },
          });
        }
        if (pathItems.length >= 5) break;
      }
    }

    return [...navItems, ...ingItems, ...pathItems];
  }, [query, ready, pathologies, navigate, onClose]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        items[activeIndex]?.action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, items, activeIndex, onClose]);

  // Scroll del item activo a la vista
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  // Agrupar items
  const groups = useMemo(() => {
    const g: Record<string, PaletteItem[]> = {};
    items.forEach((it, idx) => {
      (g[it.group] ??= []).push({ ...it, _idx: idx } as PaletteItem);
    });
    return g;
  }, [items]);

  let runningIdx = 0;

  return (
    <div className="fixed inset-0 z-[1400] flex items-start justify-center p-4 pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-scale-in">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar secciones, ingredientes o patologías…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
          />
          <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Resultados */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {ready ? 'Sin resultados' : 'Cargando índice…'}
            </div>
          ) : (
            Object.entries(groups).map(([group, groupItems]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                {groupItems.map((item) => {
                  const idx = runningIdx++;
                  const Icon = item.icon;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onMouseMove={() => setActiveIndex(idx)}
                      onClick={item.action}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                        isActive ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span className="text-xs text-muted-foreground">{item.hint}</span>
                      )}
                      {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">↑↓</kbd> navegar</span>
            <span className="flex items-center gap-1"><kbd className="border border-border rounded px-1">↵</kbd> seleccionar</span>
          </div>
          <span>{items.length} resultados</span>
        </div>
      </div>
    </div>
  );
}
