import { Network } from 'lucide-react';

export default function SynergiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="h-8 w-8 text-[var(--color-primary-500)]" />
        <h1 className="text-3xl font-bold text-[var(--fg)]">Sinergias</h1>
      </div>
      <p className="text-[var(--fg-muted)]">
        Visualiza las relaciones entre ingredientes y descubre combinaciones beneficiosas.
      </p>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
        <p className="text-[var(--fg-muted)]">Grafo de sinergias próximamente...</p>
      </div>
    </div>
  );
}
