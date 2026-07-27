import { Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-[var(--color-primary-500)]" />
        <h1 className="text-3xl font-bold text-[var(--fg)]">Administración</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Ingredientes', desc: 'Gestiona la base de conocimiento', count: 217 },
          { title: 'Sinergias', desc: 'Relaciones entre ingredientes', count: 40 },
          { title: 'Antagonismos', desc: 'Combinaciones a evitar', count: 40 },
        ].map(({ title, desc, count }) => (
          <div key={title} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">{desc}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-primary-500)]">{count}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
        <h2 className="text-lg font-semibold">Acciones</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm hover:bg-[var(--color-neutral-100)]">
            Añadir ingrediente
          </button>
          <button className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm hover:bg-[var(--color-neutral-100)]">
            Importar datos
          </button>
          <button className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm hover:bg-[var(--color-neutral-100)]">
            Exportar datos
          </button>
        </div>
      </div>
    </div>
  );
}
