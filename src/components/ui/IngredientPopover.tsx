/**
 * IngredientPopover - Popover para mostrar información detallada de ingredientes
 * Inspirado en appsimple: simple, rápido, visual
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, ChevronDown, ChevronUp, AlertTriangle, 
  Info, Pill, Leaf, Beaker, Sparkles, CheckCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { findIngredient, type IngredientInfo } from '../../core/ingredient-database/ingredients';

interface IngredientPopoverProps {
  ingredientName: string;
  children: React.ReactNode;
  className?: string;
}

export function IngredientPopover({ ingredientName, children, className }: IngredientPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<IngredientInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Buscar información del ingrediente
  useEffect(() => {
    if (isOpen && !info) {
      setLoading(true);
      // Simular pequeño delay para efecto visual
      setTimeout(() => {
        const found = findIngredient(ingredientName);
        setInfo(found);
        setLoading(false);
      }, 100);
    }
  }, [isOpen, ingredientName, info]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'homeopatia':
        return <Beaker className="w-4 h-4" />;
      case 'fitoterapia':
        return <Leaf className="w-4 h-4" />;
      case 'suplemento':
        return <Pill className="w-4 h-4" />;
      case 'aminoacidos':
        return <Sparkles className="w-4 h-4" />;
      case 'probioticos':
        return <Beaker className="w-4 h-4" />;
      case 'prebioticos':
        return <Leaf className="w-4 h-4" />;
      case 'enzimas':
        return <Pill className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'homeopatia':
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'fitoterapia':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'suplemento':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'aminoacidos':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'probioticos':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'prebioticos':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'enzimas':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      {/* Trigger */}
      <span 
        ref={triggerRef}
        className={cn(
          "inline-flex items-center gap-0.5 cursor-pointer group",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <Info className="w-2.5 h-2.5" />
        </span>
      </span>

      {/* Popover */}
      {isOpen && (
        <div 
          ref={popoverRef}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          {/* Content */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  info ? getCategoryColor(info.category) : "bg-gray-100"
                )}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
                  ) : info ? (
                    getCategoryIcon(info.category)
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {loading ? 'Buscando...' : info?.name || ingredientName}
                  </h3>
                  {info?.scientificName && (
                    <p className="text-xs text-gray-500 italic">{info.scientificName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
                </div>
              ) : info ? (
                <div className="space-y-4">
                  {/* Descripción */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {info.description}
                  </p>

                  {/* Origen */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Info className="w-3.5 h-3.5" />
                      Origen
                    </div>
                    <p className="text-sm text-gray-700">
                      {info.origin.type === 'planta' && '🌿 '}
                      {info.origin.type === 'mineral' && '💎 '}
                      {info.origin.type === 'animal' && '🦋 '}
                      {info.origin.type === 'sintetico' && '⚗️ '}
                      {info.origin.type === 'microorganismo' && '🦠 '}
                      {info.origin.description}
                    </p>
                  </div>

                  {/* Mecanismo de acción */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      ¿Cómo funciona?
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {info.mechanism}
                    </p>
                  </div>

                  {/* Usos principales */}
                  {info.indications.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-violet-600 mb-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Usos principales
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {info.indications.slice(0, 6).map((ind, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-lg"
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contraindicaciones */}
                  {info.contraindications.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-red-600 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Contraindicaciones
                      </div>
                      <div className="space-y-1">
                        {info.contraindications.map((contra, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-red-400 mt-1">•</span>
                            {contra}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dosis */}
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="text-xs font-medium text-amber-700 mb-1">
                      💊 Dosis habitual
                    </div>
                    <p className="text-sm text-amber-800">
                      {info.dosage}
                    </p>
                  </div>

                  {/* Interacciones */}
                  {info.interactions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-orange-600 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Interacciones
                      </div>
                      <div className="space-y-1">
                        {info.interactions.map((inter, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-orange-400 mt-1">⚠️</span>
                            {inter}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Sin información disponible
                  </h4>
                  <p className="text-sm text-gray-500">
                    No tenemos datos sobre "{ingredientName}" en nuestra base de conocimiento.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Base de conocimiento local
              </span>
              {info && (
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-medium",
                  getCategoryColor(info.category)
                )}>
                  {info.category}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente para hacer clicable un texto que contiene ingredientes
export function IngredientText({ 
  text, 
  className,
  onIngredientClick 
}: { 
  text: string; 
  className?: string;
  onIngredientClick?: (name: string) => void;
}) {
    // Palabras que podrían ser ingredientes (EXPANDIDO - 400+ ingredientes)
  const ingredientKeywords = [
    // === HOMEOPATÍA COMPLETA (100+ remedios) ===
    // Remedios comunes
    'aconitum', 'aconite', 'acónito', 'aconitum napellus',
    'apis', 'apis mellifica', 'abeja',
    'arnica', 'árnica', 'arnica montana',
    'arsenicum', 'arsenicum album', 'arsénico', 'arsenic',
    'baryta', 'baryta carbonica', 'baryta carb',
    'belladonna', 'bella donna', 'deadly nightshade',
    'bryonia', 'bryonia alba',
    'calcarea', 'calcarea carbonica', 'calcarea carb', 'calcarea fluorica', 'calcarea phosphorica',
    'calendula',
    'cantharis', 'cantharis vesicatoria',
    'carbo', 'carbo vegetabilis', 'carbo veg',
    'causticum',
    'chamomilla', 'manzanilla',
    'china', 'china rubra', 'quina', 'cinchona',
    'cimicifuga', 'actaea racemosa',
    'cocculus', 'cocculus indicus',
    'colocynthis', 'coloquíntida',
    'conium', 'conium maculatum',
    'crotalus', 'crotalus horridus',
    'cuprum', 'cuprum metallicum',
    'dulcamara',
    'eupatorium', 'eupatorium perfoliatum',
    'euphrasia', 'euphrasia officinalis',
    'ferrum', 'ferrum metallicum', 'ferrum phos',
    'gelsemium', 'gelsemium sempervirens',
    'graphites', 'grafito',
    'hamamelis', 'witch hazel', 'avellano',
    'hepatic', 'hepar sulfur', 'hepar sulph', 'hepar sulf',
    'hyoscyamus', 'hyoscyamus niger', 'beleño',
    'hypericum', 'hierba de san juan',
    'ignatia', 'ignatia amara',
    'iris', 'iris versicolor',
    'kalmia', 'kalmia latifolia',
    'kali', 'kali bichromicum', 'kali carb', 'kali carbonicum', 'kali phosphoricum',
    'lachesis', 'lachesis muta',
    'ledum', 'ledum palustre',
    'lithium', 'lithium carbonicum',
    'lycopodium', 'licopodio',
    'magnesia', 'magnesia carbonica', 'magnesia phosphorica', 'magnesia phos',
    'mercurius', 'mercurius solubilis', 'mercurio',
    'mezereum',
    'moschus',
    'muriatic', 'muriaticum acidum',
    'natrum', 'natrum carbonicum', 'natrum mur', 'natrum muriaticum', 'natrum phos', 'natrum sulfuricum',
    'nitric', 'nitricum acidum',
    'nux', 'nux vomica', 'nux-vomica', 'nux vom',
    'opium',
    'petroleum',
    'phellandrium',
    'phosphorus', 'fosforo', 'phosphoricum',
    'phytolacca', 'phytolacca decandra',
    'platina', 'platinum',
    'plumbum', 'plumbum metallicum',
    'pulsatilla', 'anemone pulsatilla',
    'ranunculus', 'ranunculus bulbosus',
    'rhus', 'rhus toxicodendron', 'rhus tox', 'rhus-tox',
    'rhododendron',
    'rumex', 'rumex crispus',
    'ruta', 'ruta graveolens',
    'sabadilla',
    'sambucus', 'sambucus nigra',
    'sepia',
    'silicea', 'silicea terra', 'sílice',
    'spongia', 'spongia tosta',
    'staphysagria', 'estafisagria',
    'stramonium', 'estramonio',
    'sulfur', 'sulphur', 'azufre', 'sulf',
    'sumbul',
    'symphytum', 'consuelda',
    'tabacum',
    'thuja', 'thuja occidentalis',
    'veratrum', 'veratrum album',
    'zincum', 'zincum metallicum', 'zinc',
    
    // === FITOTERAPIA COMPLETA ===
    // Digestivo
    'alcachofa', 'alcaucil', 'cynara scolymus',
    'cardo', 'cardo mariano', 'silybum', 'cardo mariano',
    'diente de leon', 'diente de león', 'taraxacum', 'dandelion',
    'gentiana', 'gentian',
    'hinojo', 'foeniculum', 'fennel',
    'jenjibre', 'jengibre', 'ginger', 'zingiber',
    'manzanilla', 'chamomile', 'matricaria',
    'melisa', 'melissa', 'toronjil', 'lemon balm',
    'menta', 'menta piperita', 'peppermint',
    'regaliz', 'licorice', 'glycyrrhiza',
    'valeriana', 'valerian root',
    
    // Nervioso
    'ashwagandha', 'withania', 'somnifera',
    'bacopa', 'brahmi', 'bacopa monnieri',
    'ginkgo', 'ginkgo biloba',
    'ginseng', 'panax ginseng',
    'gotu kola', 'centella', 'gotu kola',
    'griffonia', 'griffonia simplicifolia',
    'kava', 'kava kava', 'piper methysticum',
    'l-teanina', 'l teanina', 'teanina', 'theanine', 'suntheanine',
    'lúpulo', 'lupulo', 'hops', 'humulus',
    'mucuna', 'mucuna pruriens',
    'pasiflora', 'passiflora', 'maracuya',
    'rodiola', 'rhodiola', 'golden root',
    'salvia', 'salvia officinalis', 'sage',
    'schisandra', 'wu wei zi',
    'tila', 'tilo', 'linden', 'tilia',
    'verbena',
    
    // Inmunidad
    'equinacea', 'equinácea', 'echinacea',
    'propoleo', 'própoleo', 'propolis',
    'umbo', 'copahuite', 'mirto', 'myrtus',
    
    // Cardiovascular
    'ajo', 'allium sativum', 'garlic',
    'espino blanco', 'espino-blanco', 'hawthorn', 'crataegus',
    'muérdago', 'muerdago', 'mistletoe', 'viscum',
    'olivo', 'olive', 'olea europaea', 'olive leaf',
    'marron', 'marron indio', 'aesculus', 'horse chestnut',
    
    // Respiratorio
    'alho', 'alho silvestre', 'allium ursinum', 'wild garlic',
    'grindelia', 'gumweed',
    'gordolobo', 'mullein', 'verbascum',
    'hisopo', 'hyssop', 'hyssopus',
    'licen', 'liquen de islandia', 'iceland moss', 'cetrelia',
    'pelargonio', 'pelargonium', 'umckaloabo',
    'plantago', 'llanten', 'plantain',
    'tomillo', 'thyme', 'thymus',
    'eucalipto', 'eucalyptus',
    'sauco', 'elderberry', 'sambucus',
    
    // Urinario
    'abedul', 'birch', 'betula',
    'gayuba', 'uva ursi', 'bearberry', 'arctostaphylos',
    'ortiga', 'ortiga verde', 'nettle', 'urtica',
    'pierna', 'willowherb', 'epilobium',
    'vara de oro', 'goldenrod', 'solidago',
    
    // Locomotor
    'harpagofito', 'garra del diablo', 'devils claw', 'harpagophytum',
    'cola de caballo', 'horsetail', 'equisetum',
    
    // Piel
    'aloe', 'aloe vera', 'aloe barbadensis',
    
    // === HONGOS MEDICINALES ===
    'reishi', 'ganoderma', 'lingzhi',
    'cordyceps', 'cordyceps sinensis',
    'maitake', 'grifola',
    'shiitake', 'lentinula edodes',
    'hericium', 'hericium erinaceus', 'lions mane',
    'chaga', 'inonotus obliquus',
    
    // === VITAMINAS ===
    'vitamina', 'vitamina-c', 'vitamina-d', 'vitamina-e', 'vitamina-k', 'vitamina-b',
    'vitamina a', 'vitamina b1', 'vitamina b6', 'vitamina b12', 'vitamina b2', 'vitamina b3', 'vitamina b5',
    'complejo b', 'vitaminas del grupo b',
    'ácido fólico', 'folato', 'ácido ascórbico', 'biotina', 'colina', 'inositol',
    'retinol', 'tocoferol', 'calciferol',
    
    // === MINERALES ===
    'zinc', 'zinc quelado', 'zinc picolinato', 'zinc gluconato', 'zinc citrato',
    'magnesio', 'magnesio glicinato', 'magnesio citrato', 'magnesio treonato', 'magnesio malato', 'magnesio oxido', 'magnesio taurato',
    'selenio', 'selenometionina', 'selenito',
    'hierro', 'hierro quelado', 'hierro bisglicinato', 'hierro fumarato', 'hierro sulfato',
    'calcio', 'calcio citrato', 'calcio carbonato', 'calcio coral', 'calcio malato', 'calcio glicinato',
    'cobre', 'cobre glicinato', 'cobre citrato',
    'cromo', 'cromo picolinato',
    'manganeso', 'boro', 'boro citrato',
    'potasio', 'potasio citrato', 'potasio glicinato',
    'yodo', 'ioduro', 'kelp',
    
    // === AMINOÁCIDOS ===
    'gaba', 'ácido gamma-aminobutírico',
    'nac', 'nacetilcisteina', 'n-acetilcisteína',
    'glicina', 'glycine',
    '5-htp', '5htp', 'hidroxitriptofano',
    'teanina', 'theanine',
    'triptofano', 'tryptophan',
    'tirosina', 'tyrosine',
    'glutamina', 'glutamine',
    'lisina', 'lysine',
    'ornitina', 'ornithine',
    'arginina', 'arginine', 'l-arginina',
    'carnitina', 'carnitine', 'acetil l carnitina',
    'creatina', 'creatine',
    'taurina', 'taurine',
    'cisteina', 'cysteine',
    'metionina', 'methionine',
    'treonina', 'threonine',
    'fenilalanina', 'phenylalanine',
    'l-dopa', 'levodopa', 'dopa',
    'sam', 'sam-e', 'same', 's-adenosil metionina',
    'dlpa', 'dopa',
    
    // === SUPLEMENTOS ===
    'colageno', 'colágeno hidrolizado', 'colágeno marino', 'collagen',
    'coq10', 'coenzima q10', 'ubiquinol', 'ubiquinona',
    'resveratrol', 'trans-resveratrol',
    'astaxantina',
    'quercetina', 'rutina',
    'omega-3', 'omega 3', 'omega3', 'omega-6', 'omega 6', 'dha', 'epa', 'aceite de pescado', 'fish oil', 'ácidos grasos',
    'probióticos', 'probiotico', 'lactobacillus', 'bifidobacterium', 'flora intestinal',
    'prebióticos', 'prebiotico', 'inulina', 'fructooligosacáridos', 'fos',
    'espirulina', 'chlorella', 'agua marina',
    'melatonina',
    'glucosamina', 'glucosamine', 'sulfato de glucosamina',
    'condroitina', 'chondroitin',
    'msm', 'metilsulfonilmetano',
    'cartílago de tiburón', 'shark cartilage',
    'dlpa', 'fenilalanina',
    'bitartrato de creatina', 'creatina monohidrato',
    
    // === ENZIMAS Y DIGESTIVOS ===
    'bromelaína', 'bromelain', 'bromelina',
    'papaína', 'papain',
    'enzimas digestivas', 'digestive enzymes',
    'amilasa', 'lipasa', 'proteasa', 'lactasa',
    'fibra', 'fibra dietética', 'psyllium', 'ispagula',
    
    // === OTROS SUPLEMENTOS ===
    'ácido alfa lipoico', 'ácido alfa-lipoico', 'lipoico', 'ala', 'alpha lipoic acid',
    'picolinato de cromo',
    'bitartrato de catecolamina',
    'dhea', 'dehidroepiandrosterona',
    'melatonina', 'hormona del sueño',
  ];

  // Encontrar ingredientes en el texto
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const lowerText = text.toLowerCase();

  // Buscar todas las coincidencias
  const matches: Array<{ start: number; end: number; word: string }> = [];
  
  ingredientKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Verificar que no se superponga
      const overlaps = matches.some(m => 
        (match!.index >= m.start && match!.index < m.end) ||
        (match!.index + match![0].length > m.start && match!.index < m.start)
      );
      if (!overlaps) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          word: match[0]
        });
      }
    }
  });

  // Ordenar por posición
  matches.sort((a, b) => a.start - b.start);

  // Crear partes del texto
  matches.forEach((m, i) => {
    if (m.start > lastIndex) {
      parts.push(
        <span key={`text-${i}`}>{text.slice(lastIndex, m.start)}</span>
      );
    }
    
    parts.push(
      <IngredientPopover 
        key={`ing-${i}`} 
        ingredientName={m.word}
      >
        <span className="bg-emerald-100 text-emerald-800 px-1 rounded font-medium hover:bg-emerald-200 transition-colors cursor-pointer">
          {text.slice(m.start, m.end)}
        </span>
      </IngredientPopover>
    );
    
    lastIndex = m.end;
  });

  // Texto restante
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">{text.slice(lastIndex)}</span>
    );
  }

  return <span className={className}>{parts.length > 0 ? parts : text}</span>;
}

export default IngredientPopover;
