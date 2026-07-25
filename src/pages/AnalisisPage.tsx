/**
 * Pagina de Analisis - Sistema Basado en Conocimiento
 */

import React, { useState } from 'react';
import { KnowledgeAnalysisDemo } from '../components/KnowledgeAnalysis/KnowledgeAnalysisDemo';
import { SynergyGraphView } from '../components/SynergyGraph/SynergyGraphView';
import { Button } from '../components/ui/button';

type TabView = 'knowledge' | 'graph';

export function AnalisisPage() {
  const [activeView, setActiveView] = useState<TabView>('knowledge');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Sistema de Analisis KB</h1>
              <p className="text-sm text-muted-foreground">
                Analisis sin IA usando base de conocimiento pre-estructurada
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeView === 'knowledge' ? 'default' : 'outline'}
                onClick={() => setActiveView('knowledge')}
              >
                Base de Conocimiento
              </Button>
              <Button
                variant={activeView === 'graph' ? 'default' : 'outline'}
                onClick={() => setActiveView('graph')}
              >
                Grafo de Sinergias
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="container mx-auto px-4 py-8">
        {activeView === 'knowledge' && <KnowledgeAnalysisDemo />}
        {activeView === 'graph' && <SynergyGraphView />}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Sistema de Analisis Basado en Conocimiento - Vademecum AI</p>
          <p className="mt-1">
            100% offline - No requiere conexion a IA externa
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AnalisisPage;
