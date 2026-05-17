import React from 'react';
import { Sparkles } from 'lucide-react';

interface SynergySuggestionProps {
  suggestion: string;
}

export const SynergySuggestion: React.FC<SynergySuggestionProps> = ({ suggestion }) => {
  return (
    <section className="bg-primary/5 rounded-3xl p-6 border border-primary/20 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Sugerencia Estratégica
      </h3>
      <p className="text-foreground font-medium leading-relaxed text-sm">
        "{suggestion}"
      </p>
    </section>
  );
};
