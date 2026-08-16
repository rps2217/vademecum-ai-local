/**
 * SettingsPage - Configuración
 */

import { useState } from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { useTheme } from '@/app/ThemeProvider';
import { Sun, Moon, Monitor, Database, Cloud, Key, User, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2, Download, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSync } from '@/hooks/useSync';
import { isSupabaseConfigured, testConnection } from '@/lib/supabase';
import { forceReplicateProducts } from '@/core/sync';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAppAuth } from '@/app/AppAuthProvider';
import { Input } from '@/ui/Input';
import { toast } from 'sonner';

type Tab = 'appearance' | 'sync' | 'ai' | 'data' | 'account';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const { theme, setTheme } = useTheme();

  const tabs = [
    { id: 'appearance' as const, label: 'Apariencia', icon: Sun },
    { id: 'sync' as const, label: 'Sincronización', icon: Cloud },
    { id: 'ai' as const, label: 'IA Local', icon: Database },
    { id: 'data' as const, label: 'Datos', icon: Key },
    { id: 'account' as const, label: 'Cuenta', icon: User },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Personaliza tu experiencia
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <tab.icon className="w-4 h-4" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Tema</h2>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'auto', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    aria-label={`Tema ${t === 'light' ? 'claro' : t === 'auto' ? 'automático' : 'oscuro'}`}
                    aria-pressed={theme === t}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:opacity-80',
                      theme === t
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {t === 'light' ? (
                      <Sun className="w-6 h-6" aria-hidden="true" />
                    ) : t === 'auto' ? (
                      <Monitor className="w-6 h-6" aria-hidden="true" />
                    ) : (
                      <Moon className="w-6 h-6" aria-hidden="true" />
                    )}
                    <span className="text-sm">
                      {t === 'light' ? 'Claro' : t === 'auto' ? 'Automático' : 'Oscuro'}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'sync' && <SyncTab />}

          {activeTab === 'ai' && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">IA Local</h2>
              <p className="text-muted-foreground mb-4">
                Configuración del motor de IA local.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Modelo de embeddings</p>
                    <p className="text-sm text-muted-foreground">Xenova/transformers</p>
                  </div>
                  <span className="text-sm text-muted-foreground">v2.17.2</span>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Gestión de datos</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Exportar datos</p>
                    <p className="text-sm text-muted-foreground">Descarga una copia de tus datos</p>
                  </div>
                  <Button variant="outline">Exportar</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Importar datos</p>
                    <p className="text-sm text-muted-foreground">Restaura desde un archivo</p>
                  </div>
                  <Button variant="outline">Importar</Button>
                </div>

                {/* Logs técnicos para soporte */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Exportar logs técnicos</p>
                    <p className="text-sm text-muted-foreground">Descarga el registro de errores para soporte</p>
                  </div>
                  <Button variant="outline" onClick={async () => {
                    const { exportErrorLogs } = await import('@/lib/errorLog');
                    const logs = await exportErrorLogs();
                    const blob = new Blob([logs || 'Sin errores registrados.'], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vademecum-logs-${new Date().toISOString().slice(0,10)}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Logs exportados');
                  }}>
                    <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                    Descargar logs
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                  <div>
                    <p className="font-medium text-destructive">Borrar todo</p>
                    <p className="text-sm text-muted-foreground">Elimina todos los datos locales</p>
                  </div>
                  <Button variant="destructive">Borrar</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <AppPinSection />
              <AdminPinSection />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente SyncTab
function SyncTab() {
  const { isOnline, syncState, progress, sync, lastSyncAt, errorCount } = useSync();
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const configured = isSupabaseConfigured();
  const isSyncing = syncState === 'syncing';

  async function handleSync() {
    setSyncResult(null);
    const loadingToast = toast.loading('Sincronizando...');
    try {
      const result = await sync();
      // También re-replicar productos comerciales (ignora el contador de fallos
      // para que el botón "Sincronizar ahora" siempre reintente).
      const replResult = await forceReplicateProducts();
      toast.dismiss(loadingToast);
      const replMsg = replResult.skipped
        ? ''
        : ` + ${replResult.products} productos`;
      if (result.state === 'idle' && result.errors.length === 0) {
        toast.success(`Sincronizado: ${result.completed} registros${replMsg}`);
      } else {
        toast.error(result.errors[0] || 'Error en sincronización');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  async function handleTestConnection() {
    setTestResult(null);
    const loadingToast = toast.loading('Probando conexión...');
    const result = await testConnection();
    toast.dismiss(loadingToast);
    if (result.success) {
      toast.success('Conexión exitosa');
    } else {
      toast.error(result.error || 'Error en la conexión');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Sincronización en la nube</h2>
        <p className="text-sm text-muted-foreground">
          Sincroniza tus datos de forma segura con Supabase.
        </p>
      </div>

      {/* Estado de conexión */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {configured ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
            )}
            <div>
              <p className="font-medium">
                {configured ? 'Supabase configurado' : 'Supabase no configurado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {configured ? 'Listo para sincronizar' : 'Configura las variables de entorno'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleTestConnection}>
            Probar conexión
          </Button>
        </div>
      </Card>

      {/* Resultado de prueba */}
      {testResult && (
        <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
            )}
            <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
              {testResult.message}
            </span>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold">{progress.completed}</p>
          <p className="text-sm text-muted-foreground">Registros sync</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">
            {lastSyncAt
              ? new Date(lastSyncAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
              : 'Nunca'}
          </p>
          <p className="text-sm text-muted-foreground">Última sync</p>
        </Card>
        <Card className="p-4">
          <Badge variant={isSyncing ? 'default' : 'secondary'}>
            {isSyncing ? 'Sincronizando...' : 'Listo'}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">Estado</p>
        </Card>
        <Card className="p-4">
          <Badge variant={isOnline ? 'success' : 'danger'}>
            {isOnline ? 'En línea' : 'Offline'}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">Conexión</p>
        </Card>
      </div>

      {/* Resultado de sincronización */}
      {syncResult && (
        <Card className={`p-4 ${syncResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-2">
            {syncResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
            )}
            <p className={syncResult.success ? 'text-green-800' : 'text-red-800'}>
              {syncResult.message}
            </p>
          </div>
        </Card>
      )}

      {/* Errores */}
      {errorCount > 0 && !syncResult && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
            <p className="text-red-800">{errorCount} error(es) en sincronización</p>
          </div>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex gap-3">
        <Button onClick={handleSync} disabled={isSyncing || !configured} className="flex items-center gap-2" isLoading={isSyncing}>
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-4 h-4" aria-hidden="true" />}
          {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </Button>
      </div>

      {/* Instrucciones */}
      {!configured && (
        <Card className="p-4 bg-muted/50">
          <h3 className="font-medium mb-2">Para configurar Supabase:</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Crea una cuenta en <a href="https://supabase.com" className="text-primary hover:underline" target="_blank">supabase.com</a></li>
            <li>Crea un nuevo proyecto</li>
            <li>Copia las credenciales de Settings {'>'} API</li>
            <li>Crea un archivo <code className="bg-muted px-1 rounded">.env</code> con <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code></li>
            <li>Ejecuta el SQL de <code>supabase-schema.sql</code> en el SQL Editor de Supabase</li>
            <li>Reinicia la aplicación</li>
          </ol>
        </Card>
      )}
    </div>
  );
}


function AppPinSection() {
  const { changePin, resetAccount } = useAppAuth();
  const [mode, setMode] = useState<'idle' | 'change'>('idle');
  const [oldPin, setOldPin] = useState('');
  const [newPin1, setNewPin1] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = async () => {
    if (newPin1.length < 4) { toast.error('El PIN nuevo debe tener 4 dígitos'); return; }
    if (newPin1 !== newPin2) { toast.error('Los PINs no coinciden'); return; }
    setBusy(true);
    try {
      const ok = await changePin(oldPin, newPin1);
      if (ok) { toast.success('PIN actualizado'); setMode('idle'); setOldPin(''); setNewPin1(''); setNewPin2(''); }
      else { toast.error('PIN actual incorrecto'); }
    } catch {
      toast.error('Error al cambiar el PIN');
    } finally { setBusy(false); }
  };

  const handleReset = () => {
    resetAccount();
    toast.success('Cuenta eliminada. La app pedirá crear un PIN nuevo.');
    setMode('idle'); setOldPin(''); setNewPin1(''); setNewPin2('');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold">PIN de acceso</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        PIN de 4 dígitos para entrar a la aplicación.
      </p>

      {mode === 'idle' && (
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={() => setMode('change')}>Cambiar PIN</Button>
          <Button variant="outline" onClick={handleReset}>Eliminar cuenta</Button>
        </div>
      )}

      {mode === 'change' && (
        <div className="space-y-3 max-w-xs">
          <Input type="password" inputMode="numeric" placeholder="PIN actual" maxLength={4} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} aria-label="PIN actual" />
          <Input type="password" inputMode="numeric" placeholder="Nuevo PIN (4 dígitos)" maxLength={4} value={newPin1} onChange={(e) => setNewPin1(e.target.value.replace(/\D/g, ''))} aria-label="Nuevo PIN" />
          <Input type="password" inputMode="numeric" placeholder="Repetir nuevo PIN" maxLength={4} value={newPin2} onChange={(e) => setNewPin2(e.target.value.replace(/\D/g, ''))} aria-label="Repetir nuevo PIN" />
          <div className="flex gap-3">
            <Button onClick={handleChange} disabled={busy}>Actualizar</Button>
            <Button variant="outline" onClick={() => { setMode('idle'); setOldPin(''); setNewPin1(''); setNewPin2(''); }}>Cancelar</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function AdminPinSection() {
  const { hasAdminPin, setAdminPin, changeAdminPin, clearAdminPin } = useAdminAuth();
  const [mode, setMode] = useState<'idle' | 'set' | 'change'>('idle');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSet = async () => {
    if (pin1.length < 4) { toast.error('El PIN debe tener al menos 4 dígitos'); return; }
    if (pin1 !== pin2) { toast.error('Los PINs no coinciden'); return; }
    setBusy(true);
    try {
      await setAdminPin(pin1);
      toast.success('PIN de admin configurado');
      setMode('idle'); setPin1(''); setPin2('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally { setBusy(false); }
  };

  const handleChange = async () => {
    if (pin1.length < 4) { toast.error('El PIN nuevo debe tener al menos 4 dígitos'); return; }
    if (pin1 !== pin2) { toast.error('Los PINs no coinciden'); return; }
    setBusy(true);
    try {
      const ok = await changeAdminPin(oldPin, pin1);
      if (ok) { toast.success('PIN de admin actualizado'); setMode('idle'); setPin1(''); setPin2(''); setOldPin(''); }
      else { toast.error('PIN actual incorrecto'); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally { setBusy(false); }
  };

  const handleClear = () => {
    clearAdminPin();
    toast.success('PIN de admin eliminado');
    setMode('idle');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold">Acceso de administrador</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Protege la edición de la base de conocimiento con un PIN adicional.
        {!hasAdminPin && ' Actualmente /admin es accesible sin PIN.'}
        {hasAdminPin && ' El PIN se exige cada vez que se entra a /admin.'}
      </p>

      {mode === 'idle' && (
        <div className="flex gap-3 flex-wrap">
          {!hasAdminPin && (
            <Button variant="outline" onClick={() => setMode('set')}>
              Configurar PIN
            </Button>
          )}
          {hasAdminPin && (
            <>
              <Button variant="outline" onClick={() => setMode('change')}>Cambiar PIN</Button>
              <Button variant="outline" onClick={handleClear}>Eliminar PIN</Button>
            </>
          )}
        </div>
      )}

      {mode === 'set' && (
        <div className="space-y-3 max-w-xs">
          <Input type="password" inputMode="numeric" placeholder="Nuevo PIN (mín. 4)" value={pin1} onChange={(e) => setPin1(e.target.value)} aria-label="Nuevo PIN" />
          <Input type="password" inputMode="numeric" placeholder="Repetir PIN" value={pin2} onChange={(e) => setPin2(e.target.value)} aria-label="Repetir PIN" />
          <div className="flex gap-3">
            <Button onClick={handleSet} disabled={busy}>Guardar</Button>
            <Button variant="outline" onClick={() => { setMode('idle'); setPin1(''); setPin2(''); }}>Cancelar</Button>
          </div>
        </div>
      )}

      {mode === 'change' && (
        <div className="space-y-3 max-w-xs">
          <Input type="password" inputMode="numeric" placeholder="PIN actual" value={oldPin} onChange={(e) => setOldPin(e.target.value)} aria-label="PIN actual" />
          <Input type="password" inputMode="numeric" placeholder="Nuevo PIN" value={pin1} onChange={(e) => setPin1(e.target.value)} aria-label="Nuevo PIN" />
          <Input type="password" inputMode="numeric" placeholder="Repetir nuevo PIN" value={pin2} onChange={(e) => setPin2(e.target.value)} aria-label="Repetir nuevo PIN" />
          <div className="flex gap-3">
            <Button onClick={handleChange} disabled={busy}>Actualizar</Button>
            <Button variant="outline" onClick={() => { setMode('idle'); setPin1(''); setPin2(''); setOldPin(''); }}>Cancelar</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
