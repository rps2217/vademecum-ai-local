/**
 * SynergyGraphEditor - Editor Visual de Sinergias
 * 
 * Permite crear, editar y eliminar relaciones de sinergia
 * entre ingredientes usando una interfaz visual e intuitiva.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { knowledgeLoader } from '../../core/knowledge-base';
import { synergyEngineV2 } from '../../core/synergy/SynergyEngineV2';
import { cn } from '../../lib/utils';
import { logger } from '../../services/LoggerService';
import { 
  Plus, Trash2, Edit3, X, Save, Search, 
  ZoomIn, ZoomOut, RotateCcw, Link2, 
  AlertTriangle, CheckCircle, Info, ChevronDown 
} from 'lucide-react';

// Tipos de sinergia
export type SynergyType = 'potenciador' | 'complementario' | 'cofactor' | 'secuencial' | 'bioactivador';

export interface SynergyLink {
  id?: string;
  ingredienteA: string;
  ingredienteB: string;
  tipo: SynergyType;
  descripcion: string;
  nivelEvidencia: 'A' | 'B' | 'C' | 'D';
  mecanismo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Node {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

interface Link {
  source: string;
  target: string;
  type: string;
  data?: SynergyLink;
}

// Categorías y colores
const categoryColors: Record<string, string> = {
  fitoterapia: '#10b981',
  homeopatia: '#8b5cf6',
  aceite_esencial: '#f59e0b',
  vitaminas: '#3b82f6',
  minerales: '#64748b',
  aminoacidos: '#2563eb',
  probioticos: '#0d9488',
  prebioticos: '#22c55e',
  enzimas: '#ea580c',
};

const synergyTypeConfig: Record<SynergyType, { color: string; label: string; icon: string }> = {
  potenciador: { color: '#10b981', label: 'Potenciador', icon: '⚡' },
  complementario: { color: '#3b82f6', label: 'Complementario', icon: '🔗' },
  cofactor: { color: '#8b5cf6', label: 'Cofactor', icon: '🧬' },
  bioactivador: { color: '#f59e0b', label: 'Bioactivador', icon: '🔬' },
  secuencial: { color: '#06b6d4', label: 'Secuencial', icon: '📈' },
};

interface SynergyGraphEditorProps {
  onSynergyCreated?: (synergy: SynergyLink) => void;
  onSynergyUpdated?: (synergy: SynergyLink) => void;
  onSynergyDeleted?: (synergy: SynergyLink) => void;
}

export default function SynergyGraphEditor({ 
  onSynergyCreated,
  onSynergyUpdated,
  onSynergyDeleted 
}: SynergyGraphEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [connectSource, setConnectSource] = useState<Node | null>(null);
  const [animationRef, setAnimationRef] = useState<number | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSynergy, setEditingSynergy] = useState<SynergyLink | null>(null);
  const [formData, setFormData] = useState<SynergyLink>({
    ingredienteA: '',
    ingredienteB: '',
    tipo: 'potenciador',
    descripcion: '',
    nivelEvidencia: 'C',
    mecanismo: '',
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState<any[]>([]);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    initGraph();
    return () => {
      if (animationRef) cancelAnimationFrame(animationRef);
    };
  }, []);

  // Filter ingredients for search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const all = knowledgeLoader.getAll();
      const filtered = all.filter((ing: any) => 
        ing.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);
      setFilteredIngredients(filtered);
    } else {
      setFilteredIngredients([]);
    }
  }, [searchQuery]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const initGraph = () => {
    const ingredients = knowledgeLoader.getAll();
    const synergies = synergyEngineV2.getAllSynergies();

    // Crear nodos
    const nodeMap = new Map<string, Node>();
    const width = 800;
    const height = 600;
    
    ingredients.slice(0, 40).forEach((ing: any, i) => {
      const angle = (2 * Math.PI * i) / Math.min(ingredients.length, 40);
      const radius = 220;
      nodeMap.set(ing.id, {
        id: ing.id,
        name: ing.nombre,
        category: ing.categoria || 'fitoterapia',
        x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 60,
        y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 60,
        vx: 0,
        vy: 0,
      });
    });

    // Crear enlaces desde el motor de sinergias
    const nodeLinks: Link[] = synergies
      .filter((s: any) => nodeMap.has(s.ingredienteA) && nodeMap.has(s.ingredienteB))
      .map((s: any) => ({
        source: s.ingredienteA,
        target: s.ingredienteB,
        type: s.tipo,
        data: s as SynergyLink,
      }));

    setNodes(Array.from(nodeMap.values()));
    setLinks(nodeLinks);
    simulate();
  };

  const simulate = useCallback(() => {
    if (animationRef) cancelAnimationFrame(animationRef);

    let iteration = 0;
    const maxIterations = 300;
    let currentNodes = [...nodes];

    const tick = () => {
      if (iteration >= maxIterations || currentNodes.length === 0) {
        setNodes([...currentNodes]);
        return;
      }

      const alpha = 0.1;
      
      // Fuerzas
      currentNodes.forEach(node => {
        // Fuerza de centrífuga
        const dx = node.x - 400;
        const dy = node.y - 300;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        node.vx -= (dx / dist) * 0.01 * alpha;
        node.vy -= (dy / dist) * 0.01 * alpha;

        // Repulsión entre nodos
        currentNodes.forEach(other => {
          if (node.id === other.id) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 150) {
            node.vx += (dx / dist) * 0.05 * alpha;
            node.vy += (dy / dist) * 0.05 * alpha;
          }
        });
      });

      // Atracción por enlaces
      links.forEach(link => {
        const source = currentNodes.find(n => n.id === link.source);
        const target = currentNodes.find(n => n.id === link.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        source.vx += (dx / dist) * 0.02 * alpha;
        source.vy += (dy / dist) * 0.02 * alpha;
        target.vx -= (dx / dist) * 0.02 * alpha;
        target.vy -= (dy / dist) * 0.02 * alpha;
      });

      // Aplicar velocidad con damping
      currentNodes.forEach(node => {
        if (node.fx === undefined) {
          node.x += node.vx * 0.5;
          node.y += node.vy * 0.5;
          node.vx *= 0.8;
          node.vy *= 0.8;
          
          node.x = Math.max(50, Math.min(750, node.x));
          node.y = Math.max(50, Math.min(550, node.y));
        }
      });

      setNodes([...currentNodes]);
      iteration++;
      setAnimationRef(requestAnimationFrame(tick));
    };

    setAnimationRef(requestAnimationFrame(tick));
  }, [nodes, links]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3, prev.scale * delta)),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isConnectMode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isConnectMode) {
      if (!connectSource) {
        setConnectSource(node);
        showToast(`Selecciona otro nodo para conectar con ${node.name}`, 'info');
      } else if (connectSource.id !== node.id) {
        // Crear nueva sinergia
        setFormData({
          ingredienteA: connectSource.id,
          ingredienteB: node.id,
          tipo: 'potenciador',
          descripcion: '',
          nivelEvidencia: 'C',
          mecanismo: '',
        });
        setModalMode('create');
        setShowModal(true);
        setIsConnectMode(false);
        setConnectSource(null);
      }
    } else {
      setSelectedNode(node);
      setSelectedLink(null);
    }
  };

  const handleLinkClick = (link: Link, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLink(link);
    setSelectedNode(null);
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setSelectedLink(null);
    setConnectSource(null);
    setIsConnectMode(false);
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    simulate();
  };

  // Modal handlers
  const openCreateModal = () => {
    setFormData({
      ingredienteA: selectedNode?.id || '',
      ingredienteB: '',
      tipo: 'potenciador',
      descripcion: '',
      nivelEvidencia: 'C',
      mecanismo: '',
    });
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = () => {
    if (selectedLink?.data) {
      setFormData(selectedLink.data);
      setEditingSynergy(selectedLink.data);
      setModalMode('edit');
      setShowModal(true);
    }
  };

  const handleSaveSynergy = () => {
    try {
      if (modalMode === 'create') {
        // Validar que no exista
        const exists = links.some(
          l => (l.source === formData.ingredienteA && l.target === formData.ingredienteB) ||
               (l.source === formData.ingredienteB && l.target === formData.ingredienteA)
        );
        
        if (exists) {
          showToast('Ya existe una sinergia entre estos ingredientes', 'error');
          return;
        }

        // Crear nueva sinergia
        const newSynergy: SynergyLink = {
          ...formData,
          createdAt: new Date().toISOString(),
        };

        // Agregar a links localmente (en producción se guardaría en BD)
        const sourceNode = nodes.find(n => n.id === formData.ingredienteA);
        const targetNode = nodes.find(n => n.id === formData.ingredienteB);

        if (sourceNode && targetNode) {
          setLinks([...links, {
            source: formData.ingredienteA,
            target: formData.ingredienteB,
            type: formData.tipo,
            data: newSynergy,
          }]);
        }

        logger.info(`Sinergia creada: ${formData.ingredienteA} + ${formData.ingredienteB}`, 'SynergyEditor');
        showToast('Sinergia creada correctamente', 'success');
        onSynergyCreated?.(newSynergy);
      } else {
        // Actualizar sinergia existente
        const updatedSynergy: SynergyLink = {
          ...formData,
          updatedAt: new Date().toISOString(),
        };

        setLinks(links.map(l => 
          l.source === editingSynergy?.ingredienteA && l.target === editingSynergy?.ingredienteB
            ? { ...l, type: formData.tipo, data: updatedSynergy }
            : l
        ));

        logger.info(`Sinergia actualizada`, 'SynergyEditor');
        showToast('Sinergia actualizada correctamente', 'success');
        onSynergyUpdated?.(updatedSynergy);
      }
      setShowModal(false);
    } catch (error) {
      logger.error('Error guardando sinergia', 'SynergyEditor', error);
      showToast('Error al guardar la sinergia', 'error');
    }
  };

  const handleDeleteSynergy = () => {
    if (selectedLink?.data) {
      if (confirm('¿Estás seguro de eliminar esta sinergia?')) {
        setLinks(links.filter(l => 
          !(l.source === selectedLink.source && l.target === selectedLink.target)
        ));
        logger.info(`Sinergia eliminada: ${selectedLink.source} + ${selectedLink.target}`, 'SynergyEditor');
        showToast('Sinergia eliminada', 'success');
        onSynergyDeleted?.(selectedLink.data);
        setSelectedLink(null);
      }
    }
  };

  const selectIngredient = (field: 'ingredienteA' | 'ingredienteB') => {
    return (ingredientId: string) => {
      setFormData(prev => ({ ...prev, [field]: ingredientId }));
      setSearchQuery('');
      setFilteredIngredients([]);
    };
  };

  const getIngredientName = (id: string) => {
    return nodes.find(n => n.id === id)?.name || id;
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right",
          toast.type === 'success' && "bg-green-500 text-white",
          toast.type === 'error' && "bg-red-500 text-white",
          toast.type === 'info' && "bg-blue-500 text-white"
        )}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
          {toast.type === 'info' && <Info className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 border-b bg-slate-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {nodes.length} nodos • {links.length} conexiones
            </span>
            {isConnectMode && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Link2 className="w-4 h-4" />
                Modo conexión activo
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsConnectMode(!isConnectMode);
                setConnectSource(null);
              }}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                isConnectMode 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Link2 className="w-4 h-4" />
              {isConnectMode ? 'Cancelar' : 'Conectar'}
            </button>
            
            <button
              onClick={openCreateModal}
              disabled={!selectedNode}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Sinergia
            </button>

            {selectedLink && (
              <>
                <button
                  onClick={openEditModal}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={handleDeleteSynergy}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale / 1.2) }))}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={resetView}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Reiniciar vista"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          height={600}
          className={cn("cursor-grab active:cursor-grabbing", isConnectMode && "cursor-crosshair")}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleBackgroundClick}
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Links */}
            {links.map((link, i) => {
              const source = nodes.find(n => n.id === link.source);
              const target = nodes.find(n => n.id === link.target);
              if (!source || !target) return null;

              const isSelected = selectedLink?.source === link.source && selectedLink?.target === link.target;
              const isHovered = hoveredLink === link;
              const color = synergyTypeConfig[link.type as SynergyType]?.color || '#94a3b8';

              return (
                <g key={`link-${i}`}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={color}
                    strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                    strokeOpacity={isSelected || isHovered ? 1 : 0.6}
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredLink(link)}
                    onMouseLeave={() => setHoveredLink(null)}
                    onClick={(e) => handleLinkClick(link, e)}
                  />
                  {/* Tipo label */}
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2 - 8}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 pointer-events-none"
                    style={{ fontSize: 9 }}
                  >
                    {synergyTypeConfig[link.type as SynergyType]?.icon}
                  </text>
                </g>
              );
            })}

            {/* Connection line when in connect mode */}
            {isConnectMode && connectSource && (
              <circle
                cx={connectSource.x}
                cy={connectSource.y}
                r={25}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={3}
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            )}

            {/* Nodes */}
            {nodes.map(node => {
              const isConnectSource = connectSource?.id === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={(e) => handleNodeClick(node, e)}
                >
                  <circle
                    r={selectedNode?.id === node.id ? 22 : isConnectSource ? 22 : 18}
                    fill={categoryColors[node.category] || '#94a3b8'}
                    stroke={selectedNode?.id === node.id ? '#fff' : isConnectSource ? '#3b82f6' : 'transparent'}
                    strokeWidth={selectedNode?.id === node.id || isConnectSource ? 3 : 0}
                    className="transition-all"
                  />
                  <text
                    dy={node.y > 450 ? -28 : 32}
                    textAnchor="middle"
                    className="text-xs fill-gray-700 font-medium pointer-events-none select-none"
                    style={{ fontSize: 10 }}
                  >
                    {node.name.length > 15 ? node.name.slice(0, 15) + '...' : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">Tipos de Sinergia</p>
          <div className="space-y-1.5">
            {Object.entries(synergyTypeConfig).map(([type, config]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="text-xs text-gray-600">{config.icon} {config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categorías */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">Categorías</p>
          <div className="space-y-1">
            {Object.entries(categoryColors).slice(0, 5).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 capitalize">{cat.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {(selectedNode || selectedLink) && (
        <div className="p-4 border-t bg-slate-50">
          {selectedNode && (
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{selectedNode.name}</h4>
                <p className="text-sm text-gray-500 capitalize">
                  {selectedNode.category.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-gray-400 mt-1">ID: {selectedNode.id}</p>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {selectedLink && selectedLink.data && (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: synergyTypeConfig[selectedLink.data.tipo]?.color }}
                  >
                    {synergyTypeConfig[selectedLink.data.tipo]?.icon} {selectedLink.data.tipo}
                  </span>
                  <span className="text-xs text-gray-500">
                    Evidencia: {selectedLink.data.nivelEvidencia}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {getIngredientName(selectedLink.source)} + {getIngredientName(selectedLink.target)}
                </p>
                {selectedLink.data.descripcion && (
                  <p className="text-sm text-gray-500 mt-1">{selectedLink.data.descripcion}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openEditModal}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit3 className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={handleDeleteSynergy}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
                <button
                  onClick={() => setSelectedLink(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'create' ? 'Nueva Sinergia' : 'Editar Sinergia'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Ingrediente A */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingrediente A
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={getIngredientName(formData.ingredienteA)}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Selecciona un ingrediente"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Ingrediente B */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingrediente B
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.ingredienteB ? getIngredientName(formData.ingredienteB) : ''}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Buscar por nombre
                      const found = nodes.find(n => n.name.toLowerCase().includes(e.target.value.toLowerCase()));
                      if (found) {
                        setFormData(prev => ({ ...prev, ingredienteB: found.id }));
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Escribe para buscar..."
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {filteredIngredients.length > 0 && (
                  <div className="mt-1 border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredIngredients.map(ing => (
                      <button
                        key={ing.id}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, ingredienteB: ing.id }));
                          setSearchQuery('');
                          setFilteredIngredients([]);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: categoryColors[ing.categoria] || '#94a3b8' }}
                        />
                        <span className="text-sm">{ing.nombre}</span>
                        <span className="text-xs text-gray-400">{ing.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tipo de Sinergia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Sinergia
                </label>
                <div className="relative">
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as SynergyType }))}
                    className="w-full px-3 py-2 border rounded-lg appearance-none bg-white"
                  >
                    {Object.entries(synergyTypeConfig).map(([type, config]) => (
                      <option key={type} value={type}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Nivel de Evidencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de Evidencia
                </label>
                <div className="flex gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setFormData(prev => ({ ...prev, nivelEvidencia: level }))}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                        formData.nivelEvidencia === level
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  A=Ensayos clínicos, B=Estudios observacionales, C=Expertos, D=Preclínico
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  placeholder="Describe la interacción..."
                />
              </div>

              {/* Mecanismo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mecanismo (opcional)
                </label>
                <textarea
                  value={formData.mecanismo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mecanismo: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  placeholder="Explica el mecanismo de acción..."
                />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSynergy}
                disabled={!formData.ingredienteA || !formData.ingredienteB}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
