/**
 * productUsageClassifier.ts
 *
 * Clasificador riguroso de vía de administración, formato y rol clínico
 * para productos comerciales en el mostrador de farmacia.
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
 * Determina la vía de administración estricta y correcta de un producto comercial
 * evitando falsos positivos de palabras genéricas.
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
    fullText.includes('higiene periocular') ||
    fullText.includes('oftálmica') ||
    fullText.includes('oftalmica')
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

  // 3. Nasal / Respiratorio
  if (
    fullText.includes('nasal') ||
    fullText.includes('spray nasal') ||
    fullText.includes('agua de mar') ||
    fullText.includes('descongestionante nasal') ||
    fullText.includes('nebulizador nasal') ||
    fullText.includes('inhalador') ||
    fullText.includes('inhalación') ||
    fullText.includes('lavado nasal') ||
    fullText.includes('fosas nasales')
  ) {
    return 'respiratorio';
  }

  // 4. Bucofaríngea (Garganta, sprays bucofaríngeos, colutorios)
  if (
    fullText.includes('garganta') ||
    fullText.includes('spray garganta') ||
    fullText.includes('spray bucofaríngeo') ||
    fullText.includes('spray bucofaringeo') ||
    fullText.includes('colutorio') ||
    fullText.includes('enjuague bucal') ||
    fullText.includes('pastillas para chupar') ||
    fullText.includes('comprimidos para chupar') ||
    fullText.includes('bucofaríngeo') ||
    fullText.includes('bucofaringeo') ||
    fullText.includes('nebulizaciones bucofaríngeas') ||
    fullText.includes('nebulizaciones bucofaringeas') ||
    fullText.includes('aftas')
  ) {
    return 'bucal';
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
    fullText.includes('jabon') ||
    fullText.includes('dérmico') ||
    fullText.includes('dermico')
  ) {
    return 'topico';
  }

  // 6. Oral (Cápsulas, comprimidos, jarabes, sobres, gotas orales, perlas, gránulos homeopáticos, ampollas bebibles)
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
    fullText.includes('comidas') ||
    fullText.includes('desayuno') ||
    fullText.includes('almuerzo') ||
    fullText.includes('cena') ||
    fullText.includes('ayunas') ||
    fullText.includes('sublingual')
  ) {
    return 'oral';
  }

  return 'oral';
}

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
 * Calcula el score clínico de recomendación con ponderación estricta por vía y perfil.
 */
export function scoreProductForPathology(
  pp: PathologyProduct,
  pathology: DbPathology,
  clientProfile?: ClientProfileFilter | null,
): number {
  let score = 0;

  // 1. Coincidencia de ingredientes activos de la patología
  score += pp.matchedCount * 40;

  // 2. Cobertura de la fórmula KB
  if (pp.analysis) {
    if (pp.analysis.coberturaKb >= 100) score += 25;
    else if (pp.analysis.coberturaKb >= 50) score += 15;
    score -= pp.analysis.sinMatchCount * 3;
  }

  // 3. Indicación directa o nombre coincidente
  const normPathName = pathology.nombre.toLowerCase();
  const normProdName = pp.product.nombreComercial.toLowerCase();
  const indications = (pp.product.indicaciones ?? []).map((i) => i.toLowerCase());

  if (normProdName.includes(normPathName)) {
    score += 30;
  }
  if (indications.some((ind) => normPathName.includes(ind) || ind.includes(normPathName))) {
    score += 35;
  }

  // 4. Categoría fitoterapia o homeopatía
  if (pp.product.categoria === 'fitoterapia' || pp.product.categoria === 'homeopatia') {
    score += 10;
  }

  // 5. Restricciones del perfil de seguridad del cliente
  if (clientProfile) {
    if (clientProfile.hipertension && pp.product.hipertension === 'evitar') score -= 300;
    if (clientProfile.embarazo && (pp.product.embarazo === 'contraindicado' || pp.product.embarazo === 'evitar')) score -= 500;
    if (clientProfile.lactancia && (pp.product.lactancia === 'contraindicado' || pp.product.lactancia === 'evitar')) score -= 300;
    if (clientProfile.diabetes && pp.product.diabetes === 'evitar') score -= 300;
    if (clientProfile.celiacos && pp.product.celiacos === 'evitar') score -= 300;

    if (clientProfile.hipertension && pp.product.hipertension === 'apto') score += 15;
    if (clientProfile.embarazo && pp.product.embarazo === 'apto') score += 20;
    if (clientProfile.celiacos && pp.product.celiacos === 'apto') score += 15;
  }

  return score;
}

/**
 * Selecciona la Estrategia de Mostrador (Top jerárquico equilibrado por vía oral, tópica y natural).
 */
export function selectCounterRecommendations(
  products: PathologyProduct[],
  pathology: DbPathology,
  clientProfile?: ClientProfileFilter | null,
): StrategicRecommendation[] {
  if (!products || products.length === 0) return [];

  const scored = products.map((pp) => {
    const route = classifyProductRoute(pp.product);
    const score = scoreProductForPathology(pp, pathology, clientProfile);
    return { pp, route, score };
  });

  const safe = scored.filter((s) => s.score > -200);
  const pool = safe.length > 0 ? safe : scored;

  pool.sort((a, b) => b.score - a.score);

  const usedSkus = new Set<string>();
  const recommendations: StrategicRecommendation[] = [];

  const isDerm = pathology.sistemas.includes('dermatologico');
  const isMusc = pathology.sistemas.includes('musculoesqueletico');
  const isResp = pathology.sistemas.includes('respiratorio');

  // --- 1. TRATAMIENTO PRINCIPAL DE FONDO ---
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

  // --- 2. ALIVIO LOCAL / COMPLEMENTO INMEDIATO ---
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

  if (!secondaryCandidate) {
    secondaryCandidate = pool.find((item) => !usedSkus.has(item.pp.product.sku) && item.route !== primaryCandidate?.route);
  }
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

  // --- 3. ALTERNATIVA NATURAL / FITOTERAPIA ---
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

export interface SynergisticPack {
  packTitle: string;
  packDescription: string;
  badge: string;
  items: {
    roleLabel: string;
    item: PathologyProduct;
    route: ProductUsageRoute;
  }[];
}

/**
 * Genera packs sinérgicos de mostrador (duplas / tríos recomendados)
 * combinando vía sistémica, local y natural para dispensación conjunta.
 */
export function calculateSynergisticPacks(
  products: PathologyProduct[],
  pathology: DbPathology,
  clientProfile?: ClientProfileFilter | null,
): SynergisticPack[] {
  const strategy = selectCounterRecommendations(products, pathology, clientProfile);
  if (strategy.length < 2) return [];

  const packs: SynergisticPack[] = [];

  const primary = strategy.find((s) => s.role === 'principal');
  const relief = strategy.find((s) => s.role === 'alivio_local');
  const natural = strategy.find((s) => s.role === 'alternativa_natural');

  // Pack Principal Sinergético (si hay fondo + alivio local)
  if (primary && relief) {
    packs.push({
      packTitle: 'Pack Sinergético Integral Mostrador',
      packDescription: 'Combina el tratamiento de fondo sistémico con el alivio local inmediato para una resolución clínica óptima y rápida.',
      badge: 'Alta Sinergia',
      items: [
        { roleLabel: 'Fondo / Sistémico', item: primary.item, route: primary.route },
        { roleLabel: 'Alivio Local', item: relief.item, route: relief.route },
      ],
    });
  }

  // Pack Fitoterapia / Integrativo (si hay natural y otro)
  if (natural && primary && natural.item.product.sku !== primary.item.product.sku) {
    packs.push({
      packTitle: 'Pack Fitoterápico Integrativo',
      packDescription: 'Alternativa basada en fitoterapia estandarizada para pacientes que prefieren abordaje botánico sinérgico.',
      badge: '100% Natural',
      items: [
        { roleLabel: 'Fitoterapia Principal', item: natural.item, route: natural.route },
        { roleLabel: 'Soporte Complementario', item: primary.item, route: primary.route },
      ],
    });
  }

  return packs;
}

