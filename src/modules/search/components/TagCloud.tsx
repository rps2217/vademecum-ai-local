import React from 'react';
import { Pill, Activity, MoreHorizontal } from 'lucide-react';
import { CategorizedTags } from '../../../hooks/useProductSearch';

interface TagCloudProps {
  categorizedTags: CategorizedTags;
  query: string;
  onTagClick: (tag: string) => void;
}

export const TagCloud: React.FC<TagCloudProps> = ({ categorizedTags, query, onTagClick }) => {
  const renderTagRow = (
    title: string,
    icon: React.ReactNode,
    tags: {tag: string, count: number}[],
    colorClass: string,
    activeColorClass: string
  ) => {
    if (!tags || tags.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 text-slate-400 px-1">
          {icon}
          <h4 className="text-[10px] font-bold uppercase tracking-wider">{title}</h4>
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          {tags.map(({ tag, count }) => {
            const isActive = query.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className={`px-3 py-1.5 rounded-xl text-sm transition-all flex items-center gap-2 border ${
                  isActive ? activeColorClass : colorClass
                }`}
              >
                <span className="capitalize font-medium">{tag}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-black/20' : 'bg-black/20 opacity-70'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 mt-2 animate-in fade-in duration-500">
      {renderTagRow(
        'Clases y Tipos',
        <Pill className="w-4 h-4" />,
        categorizedTags.tipos,
        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40',
        'bg-emerald-500 text-brand-bg border-emerald-500 shadow-lg shadow-emerald-500/20'
      )}
      {renderTagRow(
        'Síntomas y Condiciones',
        <Activity className="w-4 h-4" />,
        categorizedTags.sintomas,
        'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40',
        'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
      )}
      {renderTagRow(
        'Otras Categorías',
        <MoreHorizontal className="w-4 h-4" />,
        categorizedTags.otros,
        'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white',
        'bg-brand-primary text-brand-bg border-brand-primary shadow-lg shadow-brand-primary/20'
      )}
    </div>
  );
};
