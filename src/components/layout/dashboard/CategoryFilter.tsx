/**
 * CategoryFilter - Filtro de categorías
 * Selector horizontal de categorías
 */

import React from 'react';
import { cn } from '../../../lib/utils';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect('todas')}
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
          selected === 'todas'
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        Todas
      </button>
      
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors capitalize",
            selected === cat
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
