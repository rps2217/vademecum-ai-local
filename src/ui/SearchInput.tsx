/**
 * SearchInput - Campo de búsqueda especializado
 * 
 * Input con icono de búsqueda y sugerencias.
 * OPTIMIZADO: Funciones memorizadas para evitar re-renders
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Clock, ArrowRight } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  suggestions = [],
  recentSearches = [],
  onSelectSuggestion,
  className,
  autoFocus = false,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSelect = useCallback((suggestion: string) => {
    onChange(suggestion);
    onSelectSuggestion?.(suggestion);
    setIsFocused(false);
    setSelectedIndex(-1);
  }, [onChange, onSelectSuggestion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const allSuggestions = isFocused ? [...recentSearches, ...suggestions] : [];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleSelect(allSuggestions[selectedIndex]);
        } else if (value.trim()) {
          onSearch?.(value);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  }, [isFocused, recentSearches, suggestions, selectedIndex, value, onSearch, handleSelect]);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const showDropdown = useMemo(() => {
    return isFocused && (recentSearches.length > 0 || suggestions.length > 0);
  }, [isFocused, recentSearches.length, suggestions.length]);

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'relative flex items-center',
          'bg-muted rounded-lg border transition-colors duration-150',
          isFocused ? 'border-ring ring-2 ring-ring/20' : 'border-transparent'
        )}
      >
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent py-2.5 pl-10 pr-10',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none'
          )}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-label={placeholder}
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-0.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground active:bg-accent"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        <kbd className="absolute right-3 hidden sm:flex items-center gap-0.5">
          {!value && (
            <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-border/50 rounded">
              <span className="text-xs">⌘</span>K
            </span>
          )}
        </kbd>
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div
          id="search-suggestions"
          className={cn(
            'absolute top-full left-0 right-0 mt-2',
            'bg-popover rounded-lg border shadow-lg',
            'max-h-80 overflow-y-auto',
            'animate-fade-in z-50'
          )}
        >
          {recentSearches.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Búsquedas recientes
              </p>
              {recentSearches.slice(0, 5).map((search, idx) => (
                <button
                  key={search}
                  type="button"
                  onClick={() => handleSelect(search)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm',
                    'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent text-left',
                    selectedIndex === idx && 'bg-accent'
                  )}
                >
                  <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Sugerencias
              </p>
              {suggestions.map((suggestion, idx) => {
                const globalIdx = recentSearches.length + idx;
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className={cn(
                      'flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm',
                      'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent text-left',
                      selectedIndex === globalIdx && 'bg-accent'
                    )}
                  >
                    <Search className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="flex-1">{suggestion}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
