import part1 from './sinergias_1.json';
import part2 from './sinergias_2.json';
import part3 from './sinergias_3.json';

export const sinergias = [...part1.sinergias, ...part2.sinergias, ...part3.sinergias];

export const metadata = {
  version: "2.1.0",
  total: sinergias.length,
  ultimaActualizacion: "2026-08-30",
  fuentes: [
    "EMA HMPC (European Medicines Agency, Herbal Medicinal Products Committee)",
    "WHO Monographs on Selected Medicinal Plants",
    "ESCOP Monographs",
    "German Commission E Monographs",
    "EFSA Scientific Opinions on Health Claims",
    "Boericke & Kent Homeopathic Materias Medicas",
    "Tisserand & Young Essential Oil Safety (Clinical Aromatherapy)",
    "PubMed Clinical Trials & Meta-analyses (2018-2026)"
  ]
};

export default {
  sinergias,
  metadata
};
