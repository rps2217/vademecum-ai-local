import part1 from './patologias_1.json';
import part2 from './patologias_2.json';
import part3 from './patologias_3.json';

export const patologias = [...part1.patologias, ...part2.patologias, ...part3.patologias];

export const metadata = {
  version: "2.0.0",
  total: patologias.length,
  ultimaActualizacion: "2025-02-14"
};

export default {
  patologias,
  metadata
};
