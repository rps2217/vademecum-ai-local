import { FileText } from 'lucide-react';

export default function ProtocolsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-[var(--color-primary-500)]" />
        <h1 className="text-3xl font-bold text-[var(--fg)]">Protocolos</h1>
      </div>
      <p className="text-[var(--fg-muted)]">
        Protocolos de suplementación personalizados.
      </p>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
        <p className="text-[var(--fg-muted)]">Próximamente...</p>
      </div>
    </div>
  );
}
