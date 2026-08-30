import part1 from './sinergias_1.json';
import part2 from './sinergias_2.json';

export const sinergias = [...part1.sinergias, ...part2.sinergias];

export const metadata = {
  version: "2.0.0",
  total: sinergias.length,
  ultimaActualizacion: "2025-02-14",
  fuentes: [
  "Natural Medicines Comprehensive Database",
  "ESCOP Monographs",
  "Commission E Monographs",
  "EMA/HMPC Community herbal monographs",
  "Micromedex Drug-Nutrient Interactions",
  "Memorial Sloan Kettering Cancer Center - About Herbs",
  "NIH Office of Dietary Supplements",
  "German Commission E Monographs",
  "World Health Organization (WHO) Monographs on Selected Medicinal Plants",
  "Cochrane Systematic Reviews on Botanical and Dietary Supplements",
  "Clinical studies on probiotic-prebiotic synbiotic combinations (2018-2024)"
]
};

export default {
  sinergias,
  metadata
};
