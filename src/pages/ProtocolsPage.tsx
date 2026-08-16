/**
 * ProtocolsPage - Gestión de protocolos de suplementación
 *
 * Permite al farmacéutico ver, crear, editar y eliminar protocolos
 * personalizados. Cada protocolo tiene ingredientes, dosis, momento
 * del día, duración y advertencias.
 */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId, now, getDeviceId, nextLamport } from '@/db';
import type { DbProtocol, ProtocolIngredient, DbIngredient } from '@/db/schema';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { Modal } from '@/ui/Modal';
import { Skeleton } from '@/ui/Skeleton';
import {
  Plus, Trash2, AlertTriangle, FileText, Search, X,
  Pill, CalendarDays, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

export function ProtocolsPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<DbProtocol | null>(null);

  const protocols = useLiveQuery(
    () => db.protocols.where('tombstone').equals(0).reverse().sortBy('updatedAt'),
    [],
  );

  const handleNew = () => {
    setEditingProtocol(null);
    setShowEditor(true);
  };

  const handleEdit = (protocol: DbProtocol) => {
    setEditingProtocol(protocol);
    setShowEditor(true);
  };

  const handleDelete = async (protocol: DbProtocol) => {
    await db.protocols.put({
      ...protocol,
      tombstone: 1,
      updatedAt: now(),
    });
    toast.success('Protocolo eliminado');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Protocolos</h1>
          <p className="text-muted-foreground mt-1">
            Protocolos de suplementación personalizados
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Nuevo protocolo
        </Button>
      </div>

      {protocols === undefined ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 space-y-3 border rounded-lg">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : protocols.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-medium mb-1">Sin protocolos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea tu primer protocolo de suplementación
          </p>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Crear protocolo
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {protocols.map((p) => (
            <ProtocolCard
              key={p.id}
              protocol={p}
              onEdit={() => handleEdit(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <ProtocolEditor
          protocol={editingProtocol}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

function ProtocolCard({ protocol, onEdit, onDelete }: {
  protocol: DbProtocol;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold">{protocol.nombre}</h3>
          <p className="text-sm text-muted-foreground">{protocol.objetivo}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            aria-label="Editar protocolo"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            aria-label="Eliminar protocolo"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {protocol.ingredientes.map((ing) => (
          <Badge key={ing.id} variant="secondary" className="text-xs">
            <Pill className="w-3 h-3 mr-1" aria-hidden="true" />
            {ing.id} {ing.cantidad}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" aria-hidden="true" />
          {protocol.duracionDias} días
        </span>
        {protocol.advertencias.length > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            {protocol.advertencias.length} advertencia(s)
          </span>
        )}
      </div>
    </Card>
  );
}

function ProtocolEditor({ protocol, onClose }: {
  protocol: DbProtocol | null;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(protocol?.nombre ?? '');
  const [objetivo, setObjetivo] = useState(protocol?.objetivo ?? '');
  const [duracionDias, setDuracionDias] = useState(protocol?.duracionDias ?? 30);
  const [ingredientes, setIngredientes] = useState<ProtocolIngredient[]>(protocol?.ingredientes ?? []);
  const [advertencias, setAdvertencias] = useState<string[]>(protocol?.advertencias ?? []);
  const [notas, setNotas] = useState(protocol?.notas ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [newWarning, setNewWarning] = useState('');

  const searchResults = useLiveQuery<DbIngredient[]>(
    () => {
      if (!searchQuery.trim()) return Promise.resolve([]);
      const q = searchQuery.toLowerCase();
      return db.ingredients
        .filter((ing) => {
          if (ing.tombstone === 1) return false;
          if (ingredientes.some((i) => i.id === ing.id)) return false;
          return ing.nombre.toLowerCase().includes(q)
            || ing.sinonimos.some((s) => s.toLowerCase().includes(q));
        })
        .limit(6)
        .toArray();
    },
    [searchQuery, ingredientes],
  );

  // Ingredient data for display
  const ingredientNames = useLiveQuery(
    () => ingredientes.length > 0
      ? db.ingredients.bulkGet(ingredientes.map((i) => i.id)) as Promise<(DbIngredient | undefined)[]>
      : Promise.resolve([]),
    [ingredientes],
  );

  const handleAddIngredient = (ing: DbIngredient) => {
    setIngredientes((prev) => [...prev, {
      id: ing.id,
      cantidad: '',
      momento: '',
    }]);
    setSearchQuery('');
  };

  const handleUpdateIngredient = (index: number, field: keyof ProtocolIngredient, value: string) => {
    setIngredientes((prev) => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredientes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddWarning = () => {
    if (!newWarning.trim()) return;
    setAdvertencias((prev) => [...prev, newWarning.trim()]);
    setNewWarning('');
  };

  const handleRemoveWarning = (index: number) => {
    setAdvertencias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (ingredientes.length === 0) {
      toast.error('Añade al menos 1 ingrediente');
      return;
    }

    const existing = protocol;
    const lamport = nextLamport();
    const ts = now();

    const newProtocol: DbProtocol = {
      id: existing?.id ?? generateId(),
      nombre: nombre.trim(),
      objetivo: objetivo.trim(),
      ingredientes,
      duracionDias,
      advertencias,
      notas: notas.trim() || undefined,
      lamport,
      deviceId: getDeviceId(),
      updatedAt: ts,
      createdAt: existing?.createdAt ?? ts,
      tombstone: 0,
    };

    await db.protocols.put(newProtocol);
    toast.success(existing ? 'Protocolo actualizado' : 'Protocolo creado');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={protocol ? 'Editar protocolo' : 'Nuevo protocolo'}>
      <div className="space-y-4">
        {/* Nombre y objetivo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej: Protocolo descanso nocturno"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Duración (días)</label>
            <input
              type="number"
              value={duracionDias}
              onChange={(e) => setDuracionDias(Number(e.target.value))}
              min={1}
              max={365}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Objetivo</label>
          <input
            type="text"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="ej: Mejorar calidad del sueño"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Ingredientes */}
        <div>
          <label className="text-sm font-medium mb-1 block">Ingredientes</label>
          <div className="space-y-2">
            {ingredientes.map((ing, i) => {
              const name = ingredientNames?.find((n) => n?.id === ing.id)?.nombre ?? ing.id;
              return (
                <div key={ing.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                  <span className="text-sm font-medium flex-1">{name}</span>
                  <input
                    type="text"
                    value={ing.cantidad}
                    onChange={(e) => handleUpdateIngredient(i, 'cantidad', e.target.value)}
                    placeholder="Dosis"
                    className="w-20 px-2 py-1 rounded border border-border bg-background text-xs focus:border-ring focus:outline-none"
                  />
                  <select
                    value={ing.momento}
                    onChange={(e) => handleUpdateIngredient(i, 'momento', e.target.value)}
                    className="px-2 py-1 rounded border border-border bg-background text-xs focus:border-ring focus:outline-none"
                  >
                    <option value="">Momento</option>
                    <option value="mañana">Mañana</option>
                    <option value="mediodía">Mediodía</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                    <option value="ayunas">Ayunas</option>
                    <option value="comidas">Con comidas</option>
                  </select>
                  <button
                    onClick={() => handleRemoveIngredient(i)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    aria-label="Quitar ingrediente"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Buscador de ingredientes */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ingrediente..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((ing) => (
                  <button
                    key={ing.id}
                    onClick={() => handleAddIngredient(ing)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted text-left"
                  >
                    <span className="text-sm">{ing.nombre}</span>
                    <Plus className="w-4 h-4 text-primary" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Advertencias */}
        <div>
          <label className="text-sm font-medium mb-1 block">Advertencias</label>
          <div className="space-y-1.5">
            {advertencias.map((w, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                <span className="text-sm flex-1">{w}</span>
                <button
                  onClick={() => handleRemoveWarning(i)}
                  className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/20"
                  aria-label="Quitar advertencia"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-1.5">
            <input
              type="text"
              value={newWarning}
              onChange={(e) => setNewWarning(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWarning())}
              placeholder="Añadir advertencia..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button variant="outline" size="sm" onClick={handleAddWarning}>
              <Plus className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="text-sm font-medium mb-1 block">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas adicionales..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>
            {protocol ? 'Guardar cambios' : 'Crear protocolo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
