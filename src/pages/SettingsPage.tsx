/**
 * SettingsPage - Configuración
 */

import { useState } from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { useTheme } from '@/app/ThemeProvider';
import { Sun, Moon, Monitor, Database, Cloud, Key, User } from 'lucide-react';
import { cn } from '@/lib/utils';

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

          {activeTab === 'sync' && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Sincronización en la nube</h2>
              <p className="text-muted-foreground mb-4">
                Sincroniza tus datos de forma segura con Supabase.
              </p>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Estado</p>
                  <p className="text-sm text-muted-foreground">Deshabilitado</p>
                </div>
                <Button variant="outline">Configurar</Button>
              </div>
            </Card>
          )}

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
