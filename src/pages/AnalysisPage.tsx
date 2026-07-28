/**
 * AnalysisPage - Motor de sugerencias IA
 */

import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Sparkles, Cpu, Brain, Zap } from 'lucide-react';

export function AnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Motor de sugerencias</h1>
        <p className="text-muted-foreground mt-1">
          Análisis inteligente de combinaciones
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Análisis semántico</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Utiliza embeddings locales para entender el contexto de tus consultas
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Cpu className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Procesamiento 100% local</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Todos los análisis se realizan en tu dispositivo sin enviar datos
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold">Sugerencias personalizadas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Recomendaciones basadas en tu historial de consultas
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-500/10 rounded-lg">
              <Zap className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold">Respuestas rápidas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Optimizado para obtener resultados en milisegundos
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Coming soon */}
      <Card className="p-6">
        <div className="text-center py-8">
          <Badge variant="secondary" className="mb-4">Próximamente</Badge>
          <h2 className="text-xl font-semibold mb-2">
            Análisis avanzado de combinaciones
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Ingresa hasta 5 ingredientes y obtén un análisis detallado de sus posibles 
            interacciones, sinergias y contraindicaciones basado en evidencia científica.
          </p>
        </div>
      </Card>
    </div>
  );
}
