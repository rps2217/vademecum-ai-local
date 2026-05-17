import React from 'react';
import { Sparkles } from 'lucide-react';

interface SynergySuggestionProps {
  suggestion: string;
}

export const SynergySuggestion: React.FC<SynergySuggestionProps> = ({ suggestion }) => {
  return (
    <section className="bg-primary rounded-3xl p-6 border border-primary/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Sugerencia como Estrategia de Venta
      </h3>
      <p className="text-muted-foreground leading-relaxed text-sm italic">
        "{suggestion}"
      </p>
    </section>
  );
};
