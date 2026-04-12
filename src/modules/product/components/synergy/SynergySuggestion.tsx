import React from 'react';
import { Sparkles } from 'lucide-react';

interface SynergySuggestionProps {
  suggestion: string;
}

export const SynergySuggestion: React.FC<SynergySuggestionProps> = ({ suggestion }) => {
  return (
    <section className="bg-brand-primary/5 rounded-3xl p-6 border border-brand-primary/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-12 h-12 text-brand-primary" />
      </div>
      <h3 className="text-xs font-bold text-brand-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Inteligencia de Sinergia
      </h3>
      <p className="text-slate-300 leading-relaxed text-sm italic">
        "{suggestion}"
      </p>
    </section>
  );
};
