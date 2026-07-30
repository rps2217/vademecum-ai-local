/**
 * SettingsPage - Configuración
 */

import { useState } from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { useTheme } from '@/app/ThemeProvider';
import { Sun, Moon, Monitor, Database, Cloud, Key, User, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSync } from '@/hooks/useSync';
import { isSupabaseConfigured, testConnection } from '@/lib/supabase';

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
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <tab.icon className="w-4 h-4" />
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
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                      theme === t
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {t === 'light' ? (
                      <Sun className="w-6 h-6" />
                    ) : t === 'auto' ? (
                      <Monitor className="w-6 h-6" />
                    ) : (
                      <Moon className="w-6 h-6" />
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
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Cuenta</h2>
              <p className="text-muted-foreground mb-4">
                Gestiona tu clave de cifrado y recuperación.
              </p>
              <Button variant="outline">Cambiar contraseña</Button>
            </Card>
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
    try {
      const result = await sync();
      setSyncResult({
        success: result.state === 'idle' && result.errors.length === 0,
        message: result.state === 'idle' 
          ? `Sincronizado: ${result.completed} registros`
          : result.errors[0] || 'Error',
      });
    } catch (err) {
      setSyncResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  async function handleTestConnection() {
    setTestResult(null);
    const result = await testConnection();
    setTestResult({ success: result.success, message: result.message || result.error || 'Error' });
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
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
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
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
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
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
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
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-red-800">{errorCount} error(es) en sincronización</p>
          </div>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex gap-3">
        <Button onClick={handleSync} disabled={isSyncing || !configured} className="flex items-center gap-2">
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
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
