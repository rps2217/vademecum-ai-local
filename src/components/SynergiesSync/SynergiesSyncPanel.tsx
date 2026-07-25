/**
 * Panel de Sincronizacion de Sinergias
 */

import React, { useState, useEffect } from 'react';
import { supabaseSynergiesService } from '../../services/SupabaseSynergiesService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function SynergiesSyncPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statsData = await supabaseSynergiesService.getSyncStats();
    setStats(statsData);
  };

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await supabaseSynergiesService.syncKnowledgeBase();
      setMessage(result.message);
      await loadStats();
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = supabaseSynergiesService.isConfigured();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sincronizacion con Supabase</CardTitle>
          <CardDescription>
            Gestiona la sincronizacion de la base de conocimiento y sinergias con la nube
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium">Estado de Supabase</h4>
              <p className="text-sm text-muted-foreground">
                {isConfigured 
                  ? 'Conectado y listo para sincronizar' 
                  : 'No configurado. Agrega las variables de entorno.'}
              </p>
            </div>
            <Badge variant={isConfigured ? 'success' : 'danger'}>
              {isConfigured ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">{stats.localIngredients}</div>
                <p className="text-sm text-muted-foreground">Ingredientes Locales</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-success">{stats.cloudIngredients}</div>
                <p className="text-sm text-muted-foreground">Ingredientes en Nube</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-warning">{stats.localSynergies}</div>
                <p className="text-sm text-muted-foreground">Sinergias Locales</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-info">{stats.cloudSynergies}</div>
                <p className="text-sm text-muted-foreground">Sinergias en Nube</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleSync} 
              disabled={loading || !isConfigured}
            >
              {loading ? 'Sincronizando...' : 'Sincronizar Knowledge Base'}
            </Button>
            <Button 
              variant="outline"
              onClick={loadStats}
              disabled={loading}
            >
              Actualizar Estadisticas
            </Button>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sobre la Sincronizacion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">Base de Conocimiento Local</h4>
            <p className="text-sm text-muted-foreground">
              La Knowledge Base con 50+ ingredientes esta almacenada localmente en el navegador. 
              Esto permite analisis instantaneo sin necesidad de conexion.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Sincronizacion con Supabase</h4>
            <p className="text-sm text-muted-foreground">
              Los analisis de productos y sinergias calculadas se guardan en Supabase 
              para backup y compartir entre dispositivos.
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Script SQL</h4>
            <p className="text-sm text-muted-foreground">
              Ejecuta el script en el SQL Editor de Supabase para crear las tablas.
              Ubicacion: <code className="bg-background px-1 py-0.5 rounded text-xs">scripts/supabase_synergies_schema.sql</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SynergiesSyncPanel;
