import { Search } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--fg)]">Vademécum AI</h1>
        <p className="mt-2 text-[var(--fg-muted)]">
          Busca ingredientes, plantas medicinales, vitaminas y más
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input
            type="text"
            placeholder="Buscar ingredientes, principios activos, indicaciones..."
            className="h-14 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] pl-12 pr-4 text-lg shadow-sm transition-shadow focus:border-[var(--color-primary-300)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { category: 'Fitoterapia', count: 25, icon: '🌿' },
          { category: 'Homeopatía', count: 14, icon: '💊' },
          { category: 'Aceites Esenciales', count: 12, icon: '🫒' },
          { category: 'Vitaminas y Minerales', count: 31, icon: '💊' },
        ].map(({ category, count, icon }) => (
          <div
            key={category}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{icon}</span>
              <div>
                <h3 className="font-semibold">{category}</h3>
                <p className="text-sm text-[var(--fg-muted)]">{count} ingredientes</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
