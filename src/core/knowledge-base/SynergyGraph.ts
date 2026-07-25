/**
 * Grafo de Sinergias - Base de Datos de Relaciones
 * 
 * Implementa un sistema de grafo para manejar relaciones entre
 * ingredientes, productos y categorías de forma eficiente.
 */

import { KNOWLEDGE_BASE, type IngredientInfo, type SynergyRelation } from './ingredients';

// Tipos del grafo
export interface SynergyNode {
  id: string;
  tipo: 'ingrediente' | 'producto' | 'categoria';
  nombre: string;
  datos: IngredientInfo | any;
  conexiones: string[];
  peso_total: number;
}

export interface SynergyEdge {
  id: string;
  desde: string;
  hacia: string;
  peso: number;
  tipo: 'sinergia' | 'antagonismo' | 'complemento';
  nivel: 'alto' | 'medio' | 'bajo';
  descripcion: string;
}

export interface SynergyGraph {
  nodos: Map<string, SynergyNode>;
  aristas: Map<string, SynergyEdge>;
}

export interface PathResult {
  path: string[];
  totalWeight: number;
  descriptions: string[];
}

/**
 * Implementación del grafo de sinergias
 */
class SynergyGraphService {
  private grafo: SynergyGraph = {
    nodos: new Map(),
    aristas: new Map()
  };
  
  constructor() {
    this.construirGrafo();
  }
  
  /**
   * Construye el grafo desde la base de conocimiento
   */
  private construirGrafo(): void {
    // Limpiar grafo existente
    this.grafo = {
      nodos: new Map(),
      aristas: new Map()
    };
    
    // Agregar nodos de ingredientes
    for (const [id, info] of Object.entries(KNOWLEDGE_BASE)) {
      this.agregarNodo({
        id,
        tipo: 'ingrediente',
        nombre: info.nombre,
        datos: info,
        conexiones: [],
        peso_total: 0
      });
      
      // Agregar aristas de sinergias
      for (const sinergia of info.sinergias) {
        const edgeId = `${id}_${sinergia.ingrediente_id}`;
        const peso = sinergia.nivel === 'alto' ? 3 : sinergia.nivel === 'medio' ? 2 : 1;
        
        this.agregarArista({
          id: edgeId,
          desde: id,
          hacia: sinergia.ingrediente_id,
          peso,
          tipo: 'sinergia',
          nivel: sinergia.nivel,
          descripcion: sinergia.descripcion
        });
      }
      
      // Agregar aristas de antagonismos
      if (info.antagonismos) {
        for (const antagonismo of info.antagonismos) {
          const edgeId = `${id}_${antagonismo.ingrediente_id}`;
          const peso = antagonismo.nivel === 'alto' ? -3 : antagonismo.nivel === 'medio' ? -2 : -1;
          
          this.agregarArista({
            id: edgeId,
            desde: id,
            hacia: antagonismo.ingrediente_id,
            peso,
            tipo: 'antagonismo',
            nivel: antagonismo.nivel,
            descripcion: antagonismo.descripcion
          });
        }
      }
    }
    
    // Agregar nodos de categorías
    const categorias = new Set(Object.values(KNOWLEDGE_BASE).map(i => i.categoria));
    for (const cat of categorias) {
      this.agregarNodo({
        id: `cat_${cat}`,
        tipo: 'categoria',
        nombre: this.formatearCategoria(cat),
        datos: null,
        conexiones: [],
        peso_total: 0
      });
      
      // Conectar ingredientes a sus categorías
      const ingredientesCat = Object.values(KNOWLEDGE_BASE).filter(i => i.categoria === cat);
      for (const ing of ingredientesCat) {
        this.agregarArista({
          id: `${ing.id}_cat_${cat}`,
          desde: ing.id,
          hacia: `cat_${cat}`,
          peso: 0,
          tipo: 'complemento',
          nivel: 'bajo',
          descripcion: `Pertenece a ${this.formatearCategoria(cat)}`
        });
      }
    }
  }
  
  /**
   * Agrega un nodo al grafo
   */
  private agregarNodo(nodo: SynergyNode): void {
    this.grafo.nodos.set(nodo.id, nodo);
  }
  
  /**
   * Agrega una arista al grafo
   */
  private agregarArista(arista: SynergyEdge): void {
    this.grafo.aristas.set(arista.id, arista);
    
    // Actualizar conexiones de nodos
    const desde = this.grafo.nodos.get(arista.desde);
    const hacia = this.grafo.nodos.get(arista.hacia);
    
    if (desde && !desde.conexiones.includes(arista.hacia)) {
      desde.conexiones.push(arista.hacia);
      desde.peso_total += arista.peso;
    }
    
    if (hacia && !hacia.conexiones.includes(arista.desde)) {
      hacia.conexiones.push(arista.desde);
    }
  }
  
  /**
   * Obtiene un nodo por ID
   */
  obtenerNodo(id: string): SynergyNode | undefined {
    return this.grafo.nodos.get(id);
  }
  
  /**
   * Obtiene todos los nodos de un tipo
   */
  obtenerNodosPorTipo(tipo: 'ingrediente' | 'producto' | 'categoria'): SynergyNode[] {
    return Array.from(this.grafo.nodos.values()).filter(n => n.tipo === tipo);
  }
  
  /**
   * Obtiene las aristas de un nodo
   */
  obtenerAristasDe(nodoId: string): SynergyEdge[] {
    return Array.from(this.grafo.aristas.values()).filter(
      a => a.desde === nodoId || a.hacia === nodoId
    );
  }
  
  /**
   * Obtiene sinergias de un ingrediente
   */
  obtenerSinergiasDe(ingredienteId: string): SynergyEdge[] {
    return Array.from(this.grafo.aristas.values()).filter(
      a => a.desde === ingredienteId && a.peso > 0
    );
  }
  
  /**
   * Obtiene antagonismos de un ingrediente
   */
  obtenerAntagonismosDe(ingredienteId: string): SynergyEdge[] {
    return Array.from(this.grafo.aristas.values()).filter(
      a => a.desde === ingredienteId && a.peso < 0
    );
  }
  
  /**
   * Encuentra el camino más corto entre dos ingredientes
   * usando BFS ponderado
   */
  encontrarCaminoMasCorto(desdeId: string, hastaId: string): PathResult | null {
    const queue: { id: string; path: string[]; weight: number; descriptions: string[] }[] = [
      { id: desdeId, path: [desdeId], weight: 0, descriptions: [] }
    ];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      // Ordenar por peso (preferir caminos con mayor sinergia)
      queue.sort((a, b) => b.weight - a.weight);
      const current = queue.shift()!;
      
      if (current.id === hastaId) {
        return {
          path: current.path,
          totalWeight: current.weight,
          descriptions: current.descriptions
        };
      }
      
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      
      const nodo = this.grafo.nodos.get(current.id);
      if (!nodo) continue;
      
      for (const conexionId of nodo.conexiones) {
        if (visited.has(conexionId)) continue;
        
        const arista = Array.from(this.grafo.aristas.values()).find(
          a => (a.desde === current.id && a.hacia === conexionId) ||
               (a.hacia === current.id && a.desde === conexionId)
        );
        
        if (arista) {
          const peso = arista.desde === current.id ? arista.peso : arista.peso * -1;
          queue.push({
            id: conexionId,
            path: [...current.path, conexionId],
            weight: current.weight + peso,
            descriptions: [...current.descriptions, arista.descripcion]
          });
        }
      }
    }
    
    return null;
  }
  
  /**
   * Encuentra el grupo más synergico de ingredientes
   */
  encontrarGrupoSynergico(ingredientes: string[]): {
    grupo: string[];
    sinergiasTotal: number;
    promedio: number;
  } {
    let sinergiasTotales = 0;
    let conteo = 0;
    
    for (let i = 0; i < ingredientes.length; i++) {
      for (let j = i + 1; j < ingredientes.length; j++) {
        const sinergia = Array.from(this.grafo.aristas.values()).find(
          a => (a.desde === ingredientes[i] && a.hacia === ingredientes[j]) ||
               (a.desde === ingredientes[j] && a.hacia === ingredientes[i])
        );
        if (sinergia && sinergia.peso > 0) {
          sinergiasTotales += sinergia.peso;
          conteo++;
        }
      }
    }
    
    return {
      grupo: ingredientes,
      sinergiasTotal: sinergiasTotales,
      promedio: conteo > 0 ? sinergiasTotales / conteo : 0
    };
  }
  
  /**
   * Obtiene los ingredientes más conectados (hubs)
   */
  obtenerHubSinergicos(limite: number = 10): SynergyNode[] {
    return Array.from(this.grafo.nodos.values())
      .filter(n => n.tipo === 'ingrediente')
      .sort((a, b) => b.peso_total - a.peso_total)
      .slice(0, limite);
  }
  
  /**
   * Recomienda suplementos basándose en un objetivo
   */
  recomendarPorObjetivo(
    objetivo: string,
    excludeIds: string[] = []
  ): { id: string; nombre: string; relevancia: number; beneficios: string[] }[] {
    // Mapear objetivos a categorías
    const objetivoMap: Record<string, string[]> = {
      'inmunidad': ['vitaminas', 'minerales'],
      'energia': ['vitaminas', 'aminoacidos'],
      'sueno': ['aminoacidos', 'botanicos'],
      'articula': ['otros', 'botanicos'],
      'cerebro': ['vitaminas', 'acidos_grasos', 'aminoacidos'],
      'deporte': ['aminoacidos', 'otros'],
      'digestion': ['probioticos', 'enzimas']
    };
    
    const categorias = objetivoMap[objetivo.toLowerCase()] || [];
    
    return Object.values(KNOWLEDGE_BASE)
      .filter(ing => {
        if (excludeIds.includes(ing.id)) return false;
        if (categorias.length > 0 && !categorias.includes(ing.categoria)) return false;
        return true;
      })
      .map(ing => {
        // Calcular relevancia basado en sinergias y beneficios
        const sinergias = this.obtenerSinergiasDe(ing.id);
        const beneficiosMatch = ing.beneficios.filter(b => 
          b.toLowerCase().includes(objetivo.toLowerCase())
        ).length;
        
        return {
          id: ing.id,
          nombre: ing.nombre,
          relevancia: sinergias.reduce((acc, s) => acc + s.peso, 0) + beneficiosMatch * 2,
          beneficios: ing.beneficios.slice(0, 3)
        };
      })
      .filter(r => r.relevancia > 0)
      .sort((a, b) => b.relevancia - a.relevancia)
      .slice(0, 10);
  }
  
  /**
   * Obtiene estadísticas del grafo
   */
  obtenerEstadisticas(): {
    totalNodos: number;
    totalAristas: number;
    sinergiasTotales: number;
    antagonismosTotales: number;
    nodoMasConectado: string;
    promedioConexiones: number;
  } {
    const aristas = Array.from(this.grafo.aristas.values());
    const sinergias = aristas.filter(a => a.peso > 0 && a.tipo === 'sinergia');
    const antagonismos = aristas.filter(a => a.peso < 0);
    
    const nodoMasConectado = this.obtenerHubSinergicos(1)[0]?.nombre || 'N/A';
    
    const promedioConexiones = Array.from(this.grafo.nodos.values())
      .reduce((acc, n) => acc + n.conexiones.length, 0) / this.grafo.nodos.size;
    
    return {
      totalNodos: this.grafo.nodos.size,
      totalAristas: aristas.length,
      sinergiasTotales: sinergias.length,
      antagonismosTotales: antagonismos.length,
      nodoMasConectado,
      promedioConexiones: promedioConexiones.toFixed(1)
    };
  }
  
  /**
   * Formatea nombre de categoría
   */
  private formatearCategoria(cat: string): string {
    return cat
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Exporta el grafo como JSON
   */
  exportar(): { nodos: any[]; aristas: any[] } {
    return {
      nodos: Array.from(this.grafo.nodos.values()),
      aristas: Array.from(this.grafo.aristas.values())
    };
  }
}

// Instancia singleton
export const synergyGraphService = new SynergyGraphService();
