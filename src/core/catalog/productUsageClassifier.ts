/**
 * productUsageClassifier.ts
 *
 * Clasificador inteligente de vía de administración, formato y rol clínico
 * para productos comerciales en el mostrador de farmacia.
 *
 * Permite segmentar el catálogo en:
 * - Vía Oral (Sistémico / Tratamiento de fondo)
 * - Vía Tópica (Local / Cutáneo / Alivio inmediato)
 * - Vía Respiratoria / Nasal (Descongestión y vías altas)
 * - Vía Bucofaríngea (Garganta y mucosa oral)
 * - Vía Ocular / Ótica (Ojos y oídos)
 * - Otras vías
 */

import type { DbProduct, DbPathology } from '@/db/schema';
import type { PathologyProduct } from '@/hooks/useProductsForPathology';

export type ProductUsageRoute = 'oral' | 'topico' | 'respiratorio' | 'bucal' | 'ocular' | 'otico' | 'otro';

export interface RouteInfo {
  id: ProductUsageRoute;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
}

export const USAGE_ROUTES: Record<ProductUsageRoute, RouteInfo> = {
  oral: {
    id: 'oral',
    label: 'Vía Oral (Sistémico)',
    shortLabel: 'Oral',
    description: 'Cápsulas, comprimidos, jarabes y soluciones bebibles para acción interna de fondo.',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
  },
  topico: {
    id: 'topico',
    label: 'Vía Tópica (Cutáneo / Local)',
    shortLabel: 'Tópico',
    description: 'Geles, cremas, pomadas y bálsamos para alivio directo en la zona afectada.',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  },
  respiratorio: {
    id: 'respiratorio',
    label: 'Vía Nasal / Respiratoria',
    shortLabel: 'Nasal',
    description: 'Sprays nasales, soluciones salinas e inhaladores para descongestión respiratoria.',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
  },
  bucal: {
    id: 'bucal',
    label: 'Vía Bucofaríngea (Garganta)',
    shortLabel: 'Garganta / Bucal',
    description: 'Sprays de garganta, pastillas para chupar y colutorios para alivio orofaríngeo.',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
  },
  ocular: {
    id: 'ocular',
    label: 'Vía Oftálmica (Ojos)',
    shortLabel: 'Ocular',
    description: 'Colirios, lágrimas artificiales y toallitas de higiene periocular.',
    badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
  },
  otico: {
    id: 'otico',
    label: 'Vía Ótica (Oídos)',
    shortLabel: 'Ótico',
    description: 'Gotas óticas y sprays de limpieza del conducto auditivo.',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  },
  otro: {
    id: 'otro',
    label: 'Otras presentaciones',
    shortLabel: 'Otro',
    description: 'Formatos específicos o multidosis.',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60',
  },
};

/**
 * Determina la vía de administración preferente de un producto a partir de su
 * nombre, presentación, forma farmacéutica y posología.
 */
export function classifyProductRoute(product: DbProduct): ProductUsageRoute {
  const presentacion = String(product.data?.presentacion ?? '').toLowerCase();
  const forma = String(product.data?.formaFarmaceutica ?? '').toLowerCase();
  const nombre = (product.nombreComercial ?? '').toLowerCase();
  const posologia = (product.posologia ?? '').toLowerCase();
  const comoFunciona = (product.comoFunciona ?? product.como_funciona ?? '').toLowerCase();

  const fullText = `${nombre} ${presentacion} ${forma} ${posologia} ${comoFunciona}`;

  // 1. Ocular
  if (
    fullText.includes('colirio') ||
    fullText.includes('oftálmico') ||
    fullText.includes('oftalmico') ||
    fullText.includes('lágrima artificial') ||
    fullText.includes('lagrima artificial') ||
    fullText.includes('baño ocular') ||
    fullText.includes('gotas oculares') ||
    fullText.includes('higiene periocular')
  ) {
    return 'ocular';
  }

  // 2. Ótico
  if (
    fullText.includes('ótico') ||
    fullText.includes('otico') ||
    fullText.includes('gotas óticas') ||
    fullText.includes('gotas oticas') ||
    fullText.includes('higiene de oídos') ||
    fullText.includes('conducto auditivo')
  ) {
    return 'otico';
  }

  // 3. Bucofaríngeo (Garganta, mucosa oral, colutorios)
  if (
    fullText.includes('garganta') ||
    fullText.includes('spray garganta') ||
    fullText.includes('spray bucal') ||
    fullText.includes('colutorio') ||
    fullText.includes('enjuague bucal') ||
    fullText.includes('pastillas para chupar') ||
    fullText.includes('comprimidos para chupar') ||
    fullText.includes('chupar') ||
    fullText.includes('gingival') ||
    fullText.includes('bucofaríngeo') ||
    fullText.includes('bucofaringeo') ||
    fullText.includes('aftas')
  ) {
    return 'bucal';
  }

  // 4. Nasal / Respiratorio
  if (
    fullText.includes('nasal') ||
    fullText.includes('spray nasal') ||
    fullText.includes('agua de mar') ||
    fullText.includes('descongestionante nasal') ||
    fullText.includes('nebulizador') ||
    fullText.includes('nebulización') ||
    fullText.includes('inhalador') ||
    fullText.includes('inhalación') ||
    fullText.includes('lavado nasal')
  ) {
    return 'respiratorio';
  }

  // 5. Tópico / Cutáneo
  if (
    fullText.includes('crema') ||
    fullText.includes('gel ') ||
    fullText.endsWith('gel') ||
    fullText.includes('pomada') ||
    fullText.includes('ungüento') ||
    fullText.includes('unguento') ||
    fullText.includes('bálsamo') ||
    fullText.includes('balsamo') ||
    fullText.includes('loción') ||
    fullText.includes('locion') ||
    fullText.includes('tópico') ||
    fullText.includes('topico') ||
    fullText.includes('cutáneo') ||
    fullText.includes('cutaneo') ||
    fullText.includes('roll-on') ||
    fullText.includes('roll on') ||
    fullText.includes('parche') ||
    fullText.includes('apósito') ||
    fullText.includes('aposito') ||
    fullText.includes('masaje') ||
    fullText.includes('fricción') ||
    fullText.includes('shampoo') ||
    fullText.includes('jabón') ||
    fullText.includes('jabon')
  ) {
    return 'topico';
  }

  // 6. Oral (la mayoría de comprimidos, cápsulas, jarabes, perlas, sobres)
  if (
    fullText.includes('comprimido') ||
    fullText.includes('cápsula') ||
    fullText.includes('capsula') ||
    fullText.includes('sobre') ||
    fullText.includes('jarabe') ||
    fullText.includes('perla') ||
    fullText.includes('tableta') ||
    fullText.includes('solución oral') ||
    fullText.includes('solucion oral') ||
    fullText.includes('gotas orales') ||
    fullText.includes('vial') ||
    fullText.includes('gránulo') ||
    fullText.includes('granulo') ||
    fullText.includes('glóbulo') ||
    fullText.includes('globulo') ||
    fullText.includes('tubo') ||
    fullText.includes('infusión') ||
    fullText.includes('infusion') ||
    fullText.includes('polvo') ||
    fullText.includes('bebible') ||
    fullText.includes('ingerir') ||
    fullText.includes('tomar') ||
    fullText.includes('desayuno') ||
    fullText.includes('almuerzo') ||
    fullText.includes('cena') ||
    fullText.includes('ayunas')
  ) {
    return 'oral';
  }

  // Por defecto en vademécum de farmacia
  return 'oral';
}

/**
 * Rol clínico recomendado para la tarjeta destacada en mostrador
 */
export type StrategicRole = 'principal' | 'alivio_local' | 'alternativa_natural';

export interface StrategicRecommendation {
  role: StrategicRole;
  roleTitle: string;
  roleBadge: string;
  roleDescription: string;
  item: PathologyProduct;
  route: ProductUsageRoute;
}

export interface ClientProfileFilter {
  embarazo?: boolean;
  lactancia?: boolean;
  pediatria?: boolean;
  hipertension?: boolean;
  diabetes?: boolean;
  celiacos?: boolean;
}

/**
 * Calcula el score de recomendación para un producto en el contexto de una patología y perfil de cliente.
 */
export function scoreProductForPathology(
  pp: PathologyProduct,
  pathology: DbPathology,
  clientProfile?: ClientProfileFilter | null,
): number {
  let score = 0;

  // 1. Ingredientes de la patología que cubre (fuerza terapéutica)
  score += pp.matchedCount * 30;

  // 2. Cobertura de la fórmula según análisis KB
  if (pp.analysis) {
    if (pp.analysis.coberturaKb >= 100) score += 20;
    else if (pp.analysis.coberturaKb >= 50) score += 10;
    score -= pp.analysis.sinMatchCount * 2;
  }

  // 3. Indicación directa en el producto
  const normPathName = pathology.nombre.toLowerCase();
  const normProdName = pp.product.nombreComercial.toLowerCase();
  const indications = (pp.product.indicaciones ?? []).map((i) => i.toLowerCase());

  if (normProdName.includes(normPathName)) {
    score += 25;
  }
  if (indications.some((ind) => normPathName.includes(ind) || ind.includes(normPathName))) {
    score += 30;
  }

  // 4. Si es categoría fitoterapia / homeopatía
  if (pp.product.categoria === 'fitoterapia' || pp.product.categoria === 'homeopatia') {
    score += 5;
  }

  // 5. Verificación de perfil de seguridad del cliente (Hard filter / boost)
  if (clientProfile) {
    if (clientProfile.hipertension && pp.product.hipertension === 'evitar') score -= 200;
    if (clientProfile.embarazo && (pp.product.embarazo === 'contraindicado' || pp.product.embarazo === 'evitar')) score -= 300;
    if (clientProfile.lactancia && (pp.product.lactancia === 'contraindicado' || pp.product.lactancia === 'evitar')) score -= 200;
    if (clientProfile.diabetes && pp.product.diabetes === 'evitar') score -= 200;
    if (clientProfile.celiacos && pp.product.celiacos === 'evitar') score -= 200;

    // Bonificación si es explícitamente apto ante perfil restringido
    if (clientProfile.hipertension && pp.product.hipertension === 'apto') score += 10;
    if (clientProfile.embarazo && pp.product.embarazo === 'apto') score += 15;
    if (clientProfile.celiacos && pp.product.celiacos === 'apto') score += 10;
  }

  return score;
}

/**
 * Selecciona la Estrategia de Mostrador (Top 2 o 3 recomendaciones estructuradas)
 * combinando vía de fondo (oral), vía de rescate local (tópica/nasal/bucal) y alternativa natural.
 */
export function selectCounterRecommendations(
  products: PathologyProduct[],
  pathology: DbPathology,
  clientProfile?: ClientProfileFilter | null,
): StrategicRecommendation[] {
  if (!products || products.length === 0) return [];

  // Mapear con vía y puntaje
  const scored = products.map((pp) => {
    const route = classifyProductRoute(pp.product);
    const score = scoreProductForPathology(pp, pathology, clientProfile);
    return { pp, route, score };
  });

  // Filtrar los que no estén severamente contraindicados
  const safe = scored.filter((s) => s.score > -100);
  const pool = safe.length > 0 ? safe : scored;

  // Ordenar de mayor a menor score
  pool.sort((a, b) => b.score - a.score);

  const usedSkus = new Set<string>();
  const recommendations: StrategicRecommendation[] = [];

  const isDerm = pathology.sistemas.includes('dermatologico');
  const isResp = pathology.sistemas.includes('respiratorio');
  const isMusc = pathology.sistemas.includes('musculoesqueletico');

  // --- SELECCIÓN 1: TRATAMIENTO PRINCIPAL DE FONDO ---
  // Si es dermatológico puro, el tratamiento principal suele ser tópico; en el resto suele ser oral.
  const primaryCandidate = isDerm
    ? pool.find((item) => item.route === 'topico') ?? pool[0]
    : pool.find((item) => item.route === 'oral') ?? pool[0];

  if (primaryCandidate) {
    usedSkus.add(primaryCandidate.pp.product.sku);
    recommendations.push({
      role: 'principal',
      roleTitle: isDerm ? '1. Tratamiento Tópico Principal' : '1. Tratamiento Principal (Vía Oral)',
      roleBadge: 'Primera Línea',
      roleDescription: isDerm
        ? 'Actuación directa sobre la lesión cutánea para calmar y reparar la barrera epidérmica.'
        : 'Acción sistémica de fondo orientada a resolver el foco de la patología.',
      item: primaryCandidate.pp,
      route: primaryCandidate.route,
    });
  }

  // --- SELECCIÓN 2: ALIVIO LOCAL / COMPLEMENTO INMEDIATO ---
  // Si ya tenemos oral, buscamos tópico (en músculo/articulación), o nasal/bucal (en respiratorio), o un coadyuvante.
  let secondaryCandidate: (typeof pool)[number] | undefined;

  if (isMusc) {
    secondaryCandidate = pool.find((item) => !usedSkus.has(item.pp.product.sku) && item.route === 'topico');
  } else if (isResp) {
    secondaryCandidate = pool.find(
      (item) => !usedSkus.has(item.pp.product.sku) && (item.route === 'respiratorio' || item.route === 'bucal'),
    );
  } else if (isDerm) {
    secondaryCandidate = pool.find((item) => !usedSkus.has(item.pp.product.sku) && item.route === 'oral');
  }

  // Si no hay específico de la vía sinérgica, tomar el siguiente mejor producto no usado
  if (!secondaryCandidate) {
    secondaryCandidate = pool.find((item) => !usedSkus.has(item.pp.product.sku));
  }

  if (secondaryCandidate) {
    usedSkus.add(secondaryCandidate.pp.product.sku);
    let secTitle = '2. Coadyuvante de Alivio Inmediato';
    let secDesc = 'Complemento sinérgico para potenciar la eficacia clínica del tratamiento.';

    if (secondaryCandidate.route === 'topico') {
      secTitle = '2. Alivio Tópico Inmediato (Local)';
      secDesc = 'Aplicación directa sobre la zona afectada para calmar el dolor o inflamación en minutos.';
    } else if (secondaryCandidate.route === 'respiratorio') {
      secTitle = '2. Descongestión Inmediata (Vía Nasal)';
      secDesc = 'Higiene y despeje de fosas nasales para restaurar el flujo respiratorio.';
    } else if (secondaryCandidate.route === 'bucal') {
      secTitle = '2. Alivio Bucofaríngeo (Garganta)';
      secDesc = 'Efecto antiséptico y calmante directo sobre la mucosa orofaríngea irritada.';
    }

    recommendations.push({
      role: 'alivio_local',
      roleTitle: secTitle,
      roleBadge: 'Alivio Local',
      roleDescription: secDesc,
      item: secondaryCandidate.pp,
      route: secondaryCandidate.route,
    });
  }

  // --- SELECCIÓN 3: ALTERNATIVA NATURAL / SIN RECETA ---
  const naturalCandidate = pool.find(
    (item) =>
      !usedSkus.has(item.pp.product.sku) &&
      (item.pp.product.categoria === 'fitoterapia' || item.pp.product.categoria === 'homeopatia'),
  );

  if (naturalCandidate) {
    usedSkus.add(naturalCandidate.pp.product.sku);
    recommendations.push({
      role: 'alternativa_natural',
      roleTitle: '3. Alternativa Natural / Fitoterapia',
      roleBadge: 'Natural',
      roleDescription: 'Opción basada en extractos botánicos estandarizados o medicina integrativa.',
      item: naturalCandidate.pp,
      route: naturalCandidate.route,
    });
  }

  return recommendations;
}
