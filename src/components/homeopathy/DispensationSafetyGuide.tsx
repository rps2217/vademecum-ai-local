/**
 * Guía de Dispensación, Seguridad y Consejos al Paciente en Mostrador
 */

import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import {
  ShieldCheck,
  Baby,
  Sparkles,
  UtensilsCrossed,
  Droplet,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export function DispensationSafetyGuide() {
  const rules = [
    {
      icon: Droplet,
      title: 'Vía Sublingual Pura',
      desc: 'Dejar que los gránulos o glóbulos se disuelvan lentamente bajo la lengua. La absorción a través de la mucosa sublingual es rápida y directa, evitando el primer paso hepático y la degradación gástrica.',
      tag: 'Administración',
    },
    {
      icon: UtensilsCrossed,
      title: 'Separación de Comidas y Aromas Fuertes',
      desc: 'Tomar preferentemente con la boca limpia: 15 minutos antes de comer o beber, o 1 hora después. Evitar el consumo inmediato de café concentrado, menta fuerte, tabaco o dentífricos mentolados que puedan saturar los receptores mucosos.',
      tag: 'Absorción',
    },
    {
      icon: Sparkles,
      title: 'Uso del Tapón Dosificador',
      desc: 'Invertir el tubo, girar el tapón hasta que caigan los 5 gránulos requeridos y verterlos directamente bajo la lengua sin tocarlos con los dedos para evitar contaminación de la superficie inerte del gránulo.',
      tag: 'Técnica',
    },
    {
      icon: CheckCircle2,
      title: 'Regla de Oro: Espaciar según Mejoría',
      desc: 'En cuadros agudos (golpe, fiebre, dolor espasmódico), las tomas son frecuentes (cada 1-2 horas). A medida que el paciente experimenta mejoría, espaciar las tomas (ej: 3 veces al día) y suspender al desaparecer los síntomas.',
      tag: 'Posología',
    },
    {
      icon: Baby,
      title: 'Seguridad en Pediatría y Lactantes',
      desc: 'Para recién nacidos y niños pequeños, disolver 5 gránulos en un vaso o biberón con 10-20 ml de agua mineral y administrar a sorbos o con jeringuilla. No existe riesgo de atragantamiento ni toxicidad orgánica.',
      tag: 'Pediatría',
    },
    {
      icon: ShieldCheck,
      title: 'Embarazo y Pacientes Polimedicados',
      desc: 'Debido a la ultra-dilución homeopática, los medicamentos no poseen toxicidad química ni interaccionan con anticoagulantes, estatinas o antihipertensivos. Excelente alternativa en embarazo y lactancia.',
      tag: 'Seguridad',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Decálogo de Dispensación y Consejos de Mostrador
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Buenas prácticas clínicas para la recomendación y educación del paciente en la farmacia
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <Card key={rule.title} className="p-4 sm:p-5 flex flex-col justify-between gap-3 border-border/70 hover:border-emerald-500/30 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                    {rule.tag}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {rule.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Caja de Conservación */}
      <Card className="p-4 bg-muted/30 border-dashed border-border flex items-start gap-3">
        <Radio className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-foreground">Consejo de Conservación en el Hogar:</span>
          <p className="text-muted-foreground leading-relaxed">
            Recomendar al paciente guardar los tubos homeopáticos protegidos de fuentes intensas de radiación electromagnética (microondas, routers, teléfonos móviles durante la recarga) y alejados de productos aromáticos intensos (alcanfor, aceites esenciales puros, lejías o perfumes).
          </p>
        </div>
      </Card>
    </div>
  );
}
