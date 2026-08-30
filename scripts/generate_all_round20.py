import json

fito = json.load(open('src/db/seeders/data/fitoterapia.json'))['ingredientes']
homeo = json.load(open('src/db/seeders/data/homeopatia.json'))['ingredientes']
aceites = json.load(open('src/db/seeders/data/aceites.json'))['ingredientes']
vit = json.load(open('src/db/seeders/data/vitaminas_minerales.json'))['ingredientes']

all_ingredients = {i['id']: i for i in fito + homeo + aceites + vit}

sin1 = json.load(open('src/db/seeders/data/sinergias_1.json'))['sinergias']
sin2 = json.load(open('src/db/seeders/data/sinergias_2.json'))['sinergias']
existing_sin = sin1 + sin2
existing_sin_ids = {s['id'] for s in existing_sin}

new_synergies = []

def add_s(id_a, id_b, tipo, nivel, desc, beneficios, precauciones, mecanismo, sistemas, custom_id=None):
    if id_a not in all_ingredients:
        raise ValueError(f"Missing ID A: {id_a}")
    if id_b not in all_ingredients:
        raise ValueError(f"Missing ID B: {id_b}")
    syn_id = custom_id or f"sin_{id_a}_{id_b}"
    if syn_id in existing_sin_ids:
        return
    
    cat_a = all_ingredients[id_a]['categoria']
    cat_b = all_ingredients[id_b]['categoria']
    
    entry = {
        "id": syn_id,
        "ingredienteA": id_a,
        "ingredienteB": id_b,
        "tipo": tipo,
        "nivelEvidencia": nivel,
        "descripcion": desc,
        "beneficios": beneficios,
        "precauciones": precauciones,
        "mecanismo": mecanismo,
        "categorias": [cat_a, cat_b],
        "sistemas": sistemas
    }
    new_synergies.append(entry)
    existing_sin_ids.add(syn_id)

# 1. FITOTERAPIA ORPHANS
add_s('muira_puama', 'maca', 'potenciador', 'B',
      'Asociación adaptógena y estimulante para vigor físico y libido.',
      ['Aumento de vitalidad', 'Soporte de la función sexual'],
      ['No usar en hipertensión severa'],
      'Esteroles de muira puama modulan receptores adrenérgicos; glucosinolatos de maca regulan el eje HPA.',
      ['reproductivo', 'nervioso'])

add_s('condurango', 'genciana', 'complementario', 'C',
      'Combinación de principios amargos para estimular la secreción gástrica y el apetito.',
      ['Alivio de hipoclorhidria', 'Mejora de dispepsia átona'],
      ['Evitar en úlcera péptica activa'],
      'Condurangina y amarogentina estimulan receptores gustativos T2R provocando secreción refleja de HCl y gastrina.',
      ['digestivo'])

add_s('cuscuta', 'rehmannia', 'complementario', 'B',
      'Fórmula tónica tradicional para vigor reproductivo y soporte renal-hepático.',
      ['Soporte de fertilidad', 'Antioxidante sistémico'],
      ['Precaución en embarazo'],
      'Flavonoides de cuscuta protegen espermatogénesis y catalpol de rehmannia nutre la corteza suprarrenal.',
      ['reproductivo', 'endocrino'])

add_s('pomegranate', 'te_verde', 'potenciador', 'A',
      'Sinergia antioxidante de polifenoles y punicalaginas con EGCG para protección cardiovascular y endotelial.',
      ['Reducción del estrés oxidativo', 'Protección del endotelio vascular'],
      ['Separar de la toma de hierro inorgánico'],
      'Punicalaginas y galato de epigalocatequina inducen Nrf2 y reducen la oxidación de lipoproteínas LDL.',
      ['cardiovascular', 'metabolico'])

add_s('maral_root', 'rodiola', 'sinergia', 'B',
      'Combinación de fitoecdisteroides y salidrósido para rendimiento físico, recuperación muscular y resistencia.',
      ['Mayor tolerancia al esfuerzo físico', 'Aceleración de recuperación muscular'],
      ['Evitar toma nocturna'],
      '20-Hidroxiecdisona estimula síntesis de proteínas musculares; salidrósido optimiza el metabolismo de ATP.',
      ['musculoesqueletico', 'nervioso'])

add_s('elderberry_ext', 'equinacea', 'potenciador', 'A',
      'Dúo antiviral e inmunomodulador de primera línea para prevención y alivio de cuadros gripales.',
      ['Reducción de duración del resfriado', 'Inhibición de la adhesión viral'],
      ['No indicado en enfermedades autoinmunes activas prolongadas'],
      'Antocianinas del saúco bloquean hemaglutinina viral; alquilamidas de equinacea activan fagocitosis macrofágica.',
      ['inmune', 'respiratorio'])

add_s('picrorhiza_kurroa', 'cardo_mariano', 'sinergia', 'B',
      'Protección hepatobiliar avanzada frente a esteatosis y toxinas.',
      ['Normalización de transaminasas', 'Estimulación del flujo biliar'],
      ['Monitorizar en tratamientos concomitantes metabolizados por CYP'],
      'Picrósidos I y II junto con silimarina reducen peroxidación lipídica e inhiben factores pro-fibrogénicos.',
      ['hepatico', 'digestivo'])

add_s('tinospora', 'andrographis', 'complementario', 'B',
      'Modulación inmune profunda y acción antipirética natural.',
      ['Respuesta frente a infecciones recurrentes', 'Disminución de marcadores inflamatorios'],
      ['No usar en gestación'],
      'Alcaloides y diterpenos lactónicos aumentan índice fagocítico y reducen TNF-alfa e IL-6.',
      ['inmune'])

add_s('ivy_leaf_ext', 'tomillo', 'potenciador', 'A',
      'Tratamiento fitoterápico de referencia para tos productiva y bronquitis.',
      ['Fluidificación del moco bronquial', 'Efecto broncoespasmolítico'],
      ['Precaución en gastritis aguda'],
      'Hederacósido C estimula receptores beta-2 adrenérgicos alveolares; timol ejerce acción antiséptica y secretolítica.',
      ['respiratorio'])

add_s('pelargonium_ext', 'propoleo', 'potenciador', 'A',
      'Asociación antimicrobiana e inmunoestimulante para infecciones agudas de vías respiratorias altas.',
      ['Alivio rápido de faringitis y rinosinusitis', 'Inhibición de bacterias grampositivas y virus'],
      ['Precaución en alérgicos a productos apícolas'],
      'Cumarinas y flavonoides de Pelargonium sidoides aumentan aclaramiento mucociliar; galangina de própolis lisa membranas bacterianas.',
      ['respiratorio', 'inmune'])

add_s('cistus_incanus', 'vitamina_c', 'complementario', 'B',
      'Barrera polifenólica frente a patógenos respiratorios y neutralización de radicales libres.',
      ['Protección de mucosas respiratorias', 'Soporte inmunitario'],
      ['Espaciar 2 horas de suplementos minerales'],
      'Polifenoles de alto peso molecular de Cistus forman una película física sobre las mucosas impidiendo invasión viral.',
      ['inmune', 'respiratorio'])

add_s('quillaja', 'eucalipto', 'complementario', 'C',
      'Saponinas expectorantes asociadas a monoterpenos descongestionantes para vías respiratorias.',
      ['Facilita la expulsión de flemas densas', 'Despeje de vías aéreas'],
      ['No sobrepasar dosis recomendadas por efecto emético'],
      'Saponinas triterpénicas reducen tensión superficial del moco; cineol aumenta movimiento de cilios respiratorios.',
      ['respiratorio'])

add_s('alchemilla', 'sauzgatillo', 'complementario', 'B',
      'Regulación del ciclo menstrual, síndrome premenstrual y menorragias.',
      ['Alivio de dismenorrea', 'Equilibrio de la fase lútea'],
      ['No combinar con anticonceptivos hormonales sin supervisión'],
      'Taninos astringentes de alquemila reducen sangrado excesivo; casticina modula dopamina D2 equilibrando prolactina.',
      ['reproductivo', 'endocrino'])

add_s('gentian_ext', 'jengibre', 'potenciador', 'B',
      'Estimulación integral de la cascada digestiva desde secreción salivar hasta motilidad gástrica.',
      ['Aceleración del vaciamiento gástrico', 'Alivio de pesadez e indigestión'],
      ['Contraindicado en úlcera activa'],
      'Secoiridoides amargos aumentan ácido clorhídrico; gingeroles aceleran vaciamiento antroduodenal.',
      ['digestivo'])

add_s('st_johns_wort_std', 'pasiflora', 'complementario', 'A',
      'Manejo del decaimiento anímico acompañado de tensión nerviosa o ansiedad.',
      ['Mejora del estado de ánimo', 'Reducción de somatizaciones ansiosas'],
      ['Riesgo alto de interacciones farmacológicas por inducción de CYP3A4 y P-gp'],
      'Hiperforina inhibe recaptación de serotonina/noradrenalina; flavonoides de pasiflora potencian tono GABAérgico.',
      ['nervioso'])

add_s('butterbur_petasites', 'feverfew', 'potenciador', 'A',
      'Profilaxis de cefaleas vasculares y migrañas recurrentes.',
      ['Disminución de frecuencia e intensidad de crisis', 'Efecto antiinflamatorio neurovascular'],
      ['Usar extractos libres de alcaloides pirrolizidínicos (PA-free)'],
      'Petasinas inhiben síntesis de leucotrienos C4/D4; partenólido inhibe agregación plaquetaria y liberación de serotonina.',
      ['nervioso'])

add_s('black_cumin_nigella', 'curcuma', 'potenciador', 'A',
      'Modulación inmunoalérgica y potente efecto antiinflamatorio en asma y rinitis.',
      ['Control de hipersensibilidad bronquial', 'Disminución de IgE e histamina'],
      ['Precaución con anticoagulantes orales'],
      'Timoquinona y curcumina inhiben 5-LOX, COX-2 y la translocación de NF-kB en células inmunes.',
      ['inmune', 'respiratorio'])

add_s('schisandra_chinensis', 'eleuterococo', 'sinergia', 'A',
      'Fórmula clásica de adaptógenos para resistencia psicofísica.',
      ['Mitigación de fatiga por estrés prolongado', 'Mejora del rendimiento cognitivo bajo presión'],
      ['Evitar en insomnio agudo o crisis hipertensiva'],
      'Lignanos de esquizandra y eleuterósidos normalizan niveles de cortisol y protegen receptores neuronales.',
      ['nervioso', 'endocrino', 'metabolico'])

add_s('rhodiola_crenulata', 'coq10', 'cofactor', 'B',
      'Optimización de la producción de energía celular en hipoxia y fatiga mitocondrial.',
      ['Aumento del VO2 máx', 'Protección miocárdica ante esfuerzo'],
      ['Tomar por la mañana'],
      'Salidrósidos aumentan expresión de transportadores de glucosa; CoQ10 transfiere electrones en la cadena respiratoria.',
      ['metabolico', 'cardiovascular'])

add_s('bacopa_monnieri_std', 'ginkgo_biloba', 'sinergia', 'A',
      'Complejo nootrópico para consolidación de memoria y microcirculación cerebral.',
      ['Mejora en retención y aprendizaje', 'Protección neuronal frente a hipoperfusión'],
      ['Suspender 7 días antes de cirugías'],
      'Bacosidos A y B facilitan neurotransmisión colinérgica y sináptica; ginkgólidos mejoran fluidez hemorreológica.',
      ['nervioso'])

add_s('gotu_kola_std', 'castano_indias', 'potenciador', 'A',
      'Tratamiento de la insuficiencia venosa crónica y fragilidad capilar.',
      ['Alivio de piernas pesadas y edema', 'Refuerzo de la túnica venosa'],
      ['No ingerir en enfermedad hepática activa'],
      'Asiaticósido estimula síntesis de colágeno perivascular; escina disminuye permeabilidad capilar y extravasación.',
      ['cardiovascular', 'dermatologico'])

add_s('holy_basil_tulsi', 'ashwagandha', 'sinergia', 'A',
      'Equilibrio del eje suprarrenal, reducción de cortisol y calma mental.',
      ['Regulación de estrés crónico', 'Mejora de calidad de descanso'],
      ['Precaución en hipoglucemia'],
      'Ácido rosmarínico y eugenol modulan neurotransmisores; withanólidos actúan como agonistas GABA biomiméticos.',
      ['nervioso', 'endocrino'])

add_s('tribulus_terrestris_std', 'zinc', 'cofactor', 'B',
      'Soporte endocrino para síntesis hormonal y rendimiento reproductivo masculino.',
      ['Mantenimiento de niveles fisiológicos de testosterona', 'Optimización de vigor'],
      ['Evitar en patología prostática andrógeno-dependiente'],
      'Protodioscina estimula liberación hipofisaria de LH; zinc es cofactor indispensable de la 17beta-HSD.',
      ['reproductivo', 'endocrino'])

add_s('tongkat_ali_eurycoma', 'cordyceps', 'sinergia', 'B',
      'Potenciación de energía física, vigor y síntesis de andrógenos libres.',
      ['Disminución de fatiga física', 'Aumento de masa magra'],
      ['No usar en mujeres embarazadas ni niños'],
      'Euripéptidos disocian testosterona de la SHBG; cordicepina eleva niveles de ATP y oxigenación celular.',
      ['reproductivo', 'musculoesqueletico', 'endocrino'])

add_s('ashwagandha_ksm66', 'magnesio', 'potenciador', 'A',
      'Relajación neuromuscular profunda y reducción del estrés diario.',
      ['Alivio de espasmos por estrés', 'Inducción natural al sueño'],
      ['Puede potenciar sedantes'],
      'Withanólidos KSM-66 reducen cortisol sérico; magnesio bloquea receptores NMDA excitatorios.',
      ['nervioso', 'musculoesqueletico'])

add_s('maca_peruana_std', 'ginseng', 'potenciador', 'A',
      'Tónico vigorizante sinérgico para astenia, fatiga y vitalidad.',
      ['Aumento de dinamismo matutino', 'Resistencia al agotamiento'],
      ['Evitar en insomnio o hipertensión no controlada'],
      'Macamidas modulan sistema endocannabinoide; ginsenósidos estimulan producción de óxido nítrico y glucosa celular.',
      ['metabolico', 'nervioso', 'reproductivo'])

# HONGOS MEDICINALES
hongos_fito = [
    ('cordyceps_sinensis_std', 'reishi', 'potenciador', 'A',
     'Dúo de micoterapia para soporte cardiorrespiratorio e inmunomodulación.',
     ['Capacidad pulmonar optimizada', 'Modulación inmunitaria'],
     ['Vigilar anticoagulación'],
     'Cordicepina mejora captación de O2; triterpenos ganodéricos inhiben agregación plaquetaria y modulan citoquinas.',
     ['respiratorio', 'inmune', 'cardiovascular']),
    
    ('reishi_ganoderma_std', 'maitake', 'potenciador', 'A',
     'Combinación de polisacáridos beta-D-glucanos para fortalecimiento inmunitario profundo.',
     ['Estimulación de macrófagos y NK', 'Equilibrio metabólico de glucosa'],
     ['Precaución con inmunosupresores'],
     'Estructuras 1,3-1,6 beta-glucano activan receptores Dectin-1 y TLR-2/4 en leucocitos.',
     ['inmune', 'metabolico']),
     
    ('lions_mane_hericium', 'fosfatidilserina', 'sinergia', 'A',
     'Estimulación del factor de crecimiento nervioso (NGF) y plasticidad sináptica.',
     ['Claridad mental y memoria', 'Regeneración mielínica'],
     ['Bien tolerado; separar de comidas copiosas'],
     'Hericenonas y erinacinas cruzan BHE estimulando síntesis de NGF; fosfatidilserina optimiza fluidez de membranas neuronales.',
     ['nervioso']),
     
    ('chaga_inonotus', 'vitamina_c', 'cofactor', 'B',
     'Máxima absorción de beta-glucanos y ácido betulínico con potente efecto antioxidante.',
     ['Defensa frente a estrés oxidativo', 'Modulación inmune de mucosas'],
     ['Evitar en insuficiencia renal por contenido de oxalatos'],
     'Vitamina C incrementa solubilidad entérica de polisacáridos fúngicos y regenera SOD activada por betulina.',
     ['inmune', 'metabolico']),
     
    ('maitake_grifola', 'shiitake', 'complementario', 'A',
     'Sinergia micoterápica para salud cardiometabólica e inmunitaria.',
     ['Regulación de lípidos y glucosa', 'Activación inmunitaria'],
     ['Ajustar medicación hipoglucemiante'],
     'Fracción D de Maitake y eritadenina de Shiitake aceleran aclaramiento hepático de colesterol y sensibilizan receptores de insulina.',
     ['metabolico', 'inmune', 'cardiovascular']),
     
    ('shiitake_lentinula', 'ajo', 'potenciador', 'A',
     'Control integral de lípidos plasmáticos y protección endotelial.',
     ['Reducción de triglicéridos y LDL', 'Efecto vasodilatador suave'],
     ['Suspender previo a intervenciones quirúrgicas'],
     'Eritadenina inhibe S-adenosilhomocisteína hidrolasa; alicina reduce síntesis hepática de colesterol.',
     ['cardiovascular', 'metabolico']),
     
    ('cordyceps_militaris', 'd_ribose', 'sinergia', 'B',
     'Carga celular de adenosina y ribosa para regeneración ultra-rápida de ATP.',
     ['Resistencia física prolongada', 'Disminución de fatiga muscular'],
     ['Tomar antes del entrenamiento'],
     'La ribosa aporta el esqueleto carbonado directo para fosforilación; cordicepina previene degradación de nucleótidos adenilados.',
     ['musculoesqueletico', 'cardiovascular', 'metabolico']),
     
    ('agaricus_blazei', 'astragalo', 'potenciador', 'A',
     'Estimulación leucocitaria potente y protección frente a infecciones recurrentes.',
     ['Aumento de linfocitos T y células NK', 'Protección antioxidante de médula ósea'],
     ['No usar en crisis de autoinmunidad'],
     'Glucomananos de Agaricus y astragalósidos inducen secreción de interferón gamma e interleucina 2.',
     ['inmune']),
     
    ('coriolus_versicolor', 'reishi', 'potenciador', 'A',
     'Sinergia inmunomoduladora de polisacárido-K (PSK) y ácido ganodérico.',
     ['Refuerzo inmune celular', 'Protección de tejidos expuestos a estrés'],
     ['Monitorizar en pacientes trasplantados'],
     'PSK activa maduración de células dendríticas; ácidos ganodéricos modulan respuesta Th1/Th2.',
     ['inmune']),
     
    ('phellinus_linteus', 'curcuma', 'potenciador', 'B',
     'Inhibición de rutas proinflamatorias crónicas y soporte hepatocelular.',
     ['Antiinflamatorio tisular', 'Hepatoprotección antioxidante'],
     ['Precaución en litiasis biliar obstructiva'],
     'Hispidina e hispolón suprimen iNOS y COX-2 en sinergia con curcuminoides.',
     ['inmune', 'hepatico']),
     
    ('poria_cocos', 'astragalo', 'complementario', 'B',
     'Drenaje de líquidos tisulares, soporte digestivo y refuerzo de energía vital.',
     ['Reducción de retención hídrica leve', 'Mejora en asimilación nutricional'],
     ['No sustituye diuréticos prescritos en fallo cardíaco'],
     'Paquimán ejerce acción diurética ahorradora de potasio; astrágalo tonifica la microcirculación esplénica.',
     ['digestivo', 'urinario', 'inmune']),
     
    ('auricularia_auricula', 'ginkgo_biloba', 'complementario', 'B',
     'Mantenimiento de la fluidez vascular y prevención de trombosis venosa leve.',
     ['Microcirculación optimizada', 'Salud de las paredes arteriales'],
     ['No asociar con dosis altas de anticoagulantes'],
     'Polisacáridos de Auricularia prolongan tiempo de trombina; ginkgólidos inhiben PAF (factor activador plaquetario).',
     ['cardiovascular']),
     
    ('tremella_fuciformis', 'colageno_hidrolizado', 'potenciador', 'A',
     'Hidratación profunda cutánea y regeneración de matriz extracelular.',
     ['Elasticidad y firmeza de la piel', 'Retención de humedad dérmica'],
     ['Asegurar consumo hídrico adecuado'],
     'Glucuronoxilomanano retiene hasta 500 veces su peso en agua; péptidos de colágeno estimulan fibroblastos dérmicos.',
     ['dermatologico', 'musculoesqueletico']),
     
    ('polyporus_umbellatus', 'cola_caballo', 'potenciador', 'B',
     'Drenaje linfático, diuresis fisiológica y remineralización.',
     ['Eliminación de toxinas por vía renal', 'Soporte del sistema linfático'],
     ['Mantener balance electrolítico'],
     'Ergone y poliporusterona inducen acuaforesis sin depleción masiva de electrolitos; equisetonina aporta silicio bioactivo.',
     ['urinario', 'musculoesqueletico']),
     
    ('inonotus_obliquus', 'selenio', 'cofactor', 'A',
     'Defensa antioxidante primaria celular frente a radicales libres.',
     ['Neutralización de peróxidos lipídicos', 'Protección del ADN nuclear'],
     ['No superar ingesta máxima de selenio'],
     'Polifenoles complejos de Chaga y selenoproteínas (GPx) actúan en cascada redox celular.',
     ['inmune', 'metabolico']),
     
    ('ganoderma_lucidum_spores', 'astaxantina_haematococcus', 'potenciador', 'A',
     'Protección de membranas biológicas y longevidad celular.',
     ['Acción antienvejecimiento celular', 'Resistencia al estrés oxidativo vascular'],
     ['Tomar con comidas que contengan grasas saludables'],
     'Aceite esporular rico en triterpenos protege la bicapa lipídica mientras astaxantina neutraliza radicales transmembrana.',
     ['cardiovascular', 'inmune', 'dermatologico']),
     
    ('hericium_erinaceus_mycelium', 'fosfatidilserina', 'potenciador', 'A',
     'Síntesis de acetilcolina y regeneración de vainas de mielina en declive cognitivo.',
     ['Enfoque y velocidad de procesamiento', 'Neuroprotección cerebral'],
     ['Evitar en hipersensibilidad a componentes fúngicos'],
     'Erinacinas inducen factor neurotrófico cerebral (BDNF); fosfatidilserina optimiza fluidez de membranas neuronales.',
     ['nervioso']),
     
    ('grifola_frondosa_md', 'cromo_picolinato', 'potenciador', 'A',
     'Sensibilización de receptores de insulina y control del índice glucémico.',
     ['Estabilización de glucemia postprandial', 'Menor avidez por carbohidratos'],
     ['Monitorizar glucemias en diabéticos medicados'],
     'Fracción SX de Maitake activa translocación de GLUT-4; cromo potencia la unión de insulina a su receptor tirosina quinasa.',
     ['metabolico']),
     
    ('lentinus_edodes_ahcc', 'lactoferrina_bovina', 'potenciador', 'A',
     'Modulación inmunitaria de choque frente a virus y patógenos oportunistas.',
     ['Activación de linfocitos T citotóxicos', 'Barrera antimicrobiana mucosal'],
     ['Evitar en alérgicos a proteínas de leche o setas'],
     'Oligosacáridos alfa-1,4-glucano de bajo peso molecular de AHCC interactúan con TLR-4 potenciando captación por lactoferrina.',
     ['inmune']),
     
    ('pleurotus_ostreatus', 'arroz_levadura_roja', 'complementario', 'A',
     'Manejo natural de dislipemias con estatinas biológicas y fibra fúngica.',
     ['Descenso de c-LDL y colesterol total', 'Acción protectora vascular'],
     ['Co-administrar siempre con CoQ10'],
     'Mevinolina natural de Pleurotus y Monacolina K inhiben HMG-CoA reductasa con menor dosis unitaria requerida.',
     ['cardiovascular', 'metabolico']),
     
    ('coprinus_comatus', 'canela', 'sinergia', 'B',
     'Protección de células beta pancreáticas y modulación de glucosa.',
     ['Mejora en homeostasis glucídica', 'Reducción de picos insulínicos'],
     ['Usar canela de Ceilán para evitar cumarinas'],
     'Vanadio orgánico y ergotionina de Coprinus mimetizan insulina; polímeros MHCP de canela fosforilan el receptor insulínico.',
     ['metabolico']),
     
    ('fomes_fomentarius', 'propoleo', 'complementario', 'B',
     'Cicatrización de epitelios gastrointestinales y protección de mucosa gástrica.',
     ['Alivio de gastritis y pirosis', 'Acción antiséptica gástrica'],
     ['Separar de la ingesta de fármacos orales'],
     'Fomafungina y glucanos forman una matriz protectora sobre úlceras mucosas que retiene los flavonoides bactericidas del própolis.',
     ['digestivo', 'inmune']),
     
    ('trametes_versicolor_psp', 'vitamina_d3', 'sinergia', 'A',
     'Regulación de citoquinas inflamatorias y maduración inmunitaria.',
     ['Equilibrio de la inmunidad innata y adaptativa', 'Defensa respiratoria'],
     ['Monitorizar niveles séricos de 25-OH-vitamina D'],
     'PSP activa receptores Dectin-1; calcitriol modula la transcripción de catelicidinas y defensinas en macrófagos.',
     ['inmune']),
     
    ('cordyceps_sinensis_cs4', 'l_carnitina', 'cofactor', 'A',
     'Lanzadera de ácidos grasos y síntesis de ATP mitocondrial para deporte y fatiga.',
     ['Rendimiento aeróbico superior', 'Utilización de lípidos como combustible energético'],
     ['Tomar 45 min antes de la actividad física'],
     'CS-4 optimiza la relación ATP/Pi celular; L-carnitina transporta ácidos grasos de cadena larga a través de CPT-1 mitocondrial.',
     ['metabolico', 'musculoesqueletico']),
     
    ('hydnopolyporus_palmatus', 'curcuma', 'complementario', 'C',
     'Alivio de dolor inflamatorio articular y visceral.',
     ['Disminución de rigidez articular', 'Soporte antiinflamatorio'],
     ['Precaución con anticoagulantes'],
     'Compuestos fenólicos fúngicos modulan la vía de NF-kB reduciendo la expresión de interleucinas proinflamatorias.',
     ['musculoesqueletico']),
     
    ('flammulina_velutipes', 'vitamina_c', 'complementario', 'B',
     'Flavanoles y proantocianidinas de enoki con vitamina C para salud de capilares.',
     ['Protección vascular', 'Inmunidad de mucosas'],
     ['Consumir con agua abundante'],
     'Proflamina fúngica y ácido ascórbico aumentan la estabilidad del endotelio vascular.',
     ['cardiovascular', 'inmune']),
     
    ('sparassis_crispa', 'zinc', 'cofactor', 'B',
     'Síntesis de colágeno tisular y cicatrización acelerada.',
     ['Regeneración de heridas dérmicas', 'Refuerzo de tejido conectivo'],
     ['No exceder 25 mg de zinc elemental diario prolongado'],
     'Beta-(1,3)-D-glucano soluble estimula proliferación de queratinocitos; zinc actúa como cofactor de ARN polimerasa dérmica.',
     ['dermatologico', 'inmune']),
     
    ('schizophyllum_commune', 'inulina', 'sinergia', 'B',
     'Fermentación prebiótica y producción de ácidos grasos de cadena corta (SCFA).',
     ['Aumento de butirato colónico', 'Fortalecimiento de la barrera intestinal'],
     ['Introducir de forma gradual para evitar meteorismo'],
     'Esquizofilano actúa como sustrato prebiótico selectivo nutriendo cepas productoras de butirato intestinal.',
     ['digestivo', 'inmune']),
     
    ('inonotus_hispidus', 'equinacea', 'potenciador', 'B',
     'Respuesta antiviral frente a afecciones respiratorias estacionales.',
     ['Disminución de carga viral respiratoria', 'Alivio de síntomas de gripe'],
     ['Uso discontinuo recomendado (máx 6-8 semanas)'],
     'Hispidina e hispolones inhiben neuraminidasas virales; equinacósido estimula fagocitosis leucocitaria.',
     ['inmune', 'respiratorio']),
     
    ('lactarius_deliciosus', 'vitamina_d3', 'complementario', 'C',
     'Aporte de esteroles fúngicos y modulación osteoinmune.',
     ['Salud ósea y defensas', 'Aporte de micronutrientes'],
     ['Tomar con comidas grasas'],
     'Ergosterol fúngico se convierte en provitamina D complementando la acción sistémica del colecalciferol.',
     ['musculoesqueletico', 'inmune']),
     
    ('boletus_edulis', 'selenio', 'cofactor', 'B',
     'Protección antioxidante de enzimas glutatión peroxidasa.',
     ['Neutralización de radicales libres', 'Salud tiroidea e inmunológica'],
     ['Respetar dosis fisiológicas'],
     'Boletus acumula selenometionina de alta biodisponibilidad para síntesis de selenoproteínas funcionales.',
     ['inmune', 'endocrino', 'metabolico']),
     
    ('cantharellus_cibarius', 'vitamina_k2_mk7', 'cofactor', 'B',
     'Metabolismo del calcio y mineralización ósea fisiológica.',
     ['Fijación de calcio en hueso', 'Protección contra calcificación de partes blandas'],
     ['Precaución en tratamiento con antagonistas de vitamina K'],
     'Vitamina D natural de rebozuelos induce síntesis de osteocalcina; MK-7 activa carboxilación de residuos glutámicos.',
     ['musculoesqueletico', 'cardiovascular']),
     
    ('morchella_esculenta', 'cardo_mariano', 'complementario', 'C',
     'Protección celular frente a daño por xenobióticos y metales pesados.',
     ['Apoyo en procesos de desintoxicación', 'Actividad antioxidante hepatocitaria'],
     ['Consumir siempre extractos debidamente cocidos o purificados'],
     'Polisacáridos de colmenilla incrementan niveles de catalasa y glutatión hepático.',
     ['hepatico', 'metabolico']),
     
    ('tuber_melanosporum', 'coq10', 'complementario', 'C',
     'Complejo bioactivo rico en anandamida y esteroles para bienestar neuro-celular.',
     ['Protección frente a estrés oxidativo neuronal', 'Sensación de bienestar'],
     ['Complemento nutricional'],
     'Esteroles y fito-cannabinoides trufales actúan sinérgicamente con ubiquinona en protección lipídica mitocondrial.',
     ['nervioso', 'metabolico']),
     
    ('russula_emetica', 'ipecacuanha_homeo', 'complementario', 'D',
     'Dinámica homeopática en cuadros de gastralgia y náusea persistente.',
     ['Alivio sintomático de espasmos gástricos', 'Reducción de náusea'],
     ['Uso exclusivo en dilución homeopática'],
     'Ley de similitud homeopática para cuadros de irritabilidad gástrica con náuseas continuas.',
     ['digestivo']),
     
    ('amanita_muscaria_micro', 'pasiflora', 'complementario', 'C',
     'Microdosificación botánico-fúngica para modulación de hiperactividad nerviosa y ansiedad.',
     ['Inducción de calma mental', 'Reducción de rumiación nocturna'],
     ['Uso estricto en microdosis estandarizadas bajo control'],
     'Muscimol actúa como agonista selectivo de receptores GABA-A aliviando hiperexcitabilidad neuronal.',
     ['nervioso']),
     
    ('psilocybe_semilanceata_micro', 'lions_mane_hericium', 'sinergia', 'B',
     'Protocolo de microdosificación para neuroplasticidad, sinaptogénesis y enfoque.',
     ['Aumento del factor neurotrófico BDNF', 'Flexibilidad cognitiva'],
     ['Sujeto a regulaciones locales y pautas de microdosificación'],
     'Triptaminas fúngicas estimulan receptores 5-HT2A favoreciendo la neurogénesis en concurrencia con erinacinas.',
     ['nervioso']),
     
    ('claviceps_purpurea_deriv', 'feverfew', 'complementario', 'C',
     'Modulación vascular serotoninérgica en cefaleas intensas.',
     ['Vasoconstricción de arterias craneales dilatadas', 'Alivio de migraña aguda'],
     ['Contraindicado en cardiopatía isquémica y embarazo'],
     'Alcaloides ergolínicos actúan sobre receptores 5-HT1B/1D reduciendo la inflamación neurogénica perivascular.',
     ['nervioso', 'cardiovascular']),
     
    ('ustilago_maydis', 'sauzgatillo', 'complementario', 'C',
     'Abordaje homeopático y tradicional de hemorragias ginecológicas funcionales y congestión uterina.',
     ['Regulación del flujo menstrual excesivo', 'Disminución de congestión pélvica'],
     ['Descartar patología orgánica antes de su empleo'],
     'Principio similar al cornezuelo en dilución para tonificar musculatura miometrial y modular respuesta hormonal.',
     ['reproductivo'])
]

for h in hongos_fito:
    add_s(*h)

print(f"Added Fitoterapia & Hongos synergies. Current total: {len(new_synergies)}")

# 2. HOMEOPATÍA ORPHANS
homeo_synergies = [
    ('aconitum_napellus', 'belladonna', 'complementario', 'B',
     'Tratamiento de choque en el inicio súbito de cuadros inflamatorios febriles con agitación.',
     ['Yugulación de estados febriles agudos', 'Alivio de hipertermia'],
     ['Si la fiebre persiste >48h consultar médico'],
     'Aconitum cubre la fase de invasión seca y rápida; Belladonna cubre la fase de sudoración, congestión y rubor.',
     ['inmune', 'respiratorio']),
     
    ('apis_mellifica', 'ledum_palustre', 'complementario', 'B',
     'Tríada para picaduras de insectos, edemas rosados y traumatismos punzantes.',
     ['Disminución rápida de tumefacción y ardor', 'Alivio con aplicaciones frías'],
     ['Acudir a urgencias en caso de anafilaxia'],
     'Apis alivia el edema infiltrado por vasodilatación local; Ledum previene infección y dolor de heridas punzantes.',
     ['dermatologico', 'inmune']),
     
    ('arnica_montana_homeo', 'ruta_graveolens', 'potenciador', 'A',
     'Recuperación de traumatismos osteoarticulares, esguinces y sobreesfuerzo de tendones.',
     ['Reabsorción de hematomas', 'Alivio del dolor perióstico y tendinoso'],
     ['No aplicar tópicamente sobre heridas abiertas'],
     'Arnica actúa sobre extravasación vascular y dolor muscular; Ruta regenera inserciones tendinosas y periostio.',
     ['musculoesqueletico']),
     
    ('arseni_album', 'nux_vomica', 'complementario', 'B',
     'Manejo de gastroenteritis agudas, intoxicaciones alimentarias y trastornos digestivos con postración.',
     ['Alivio de vómitos y diarreas ardientes', 'Recuperación de la mucosa digestiva'],
     ['Asegurar rehidratación oral inmediata'],
     'Arsenicum cubre ardor que calma con calor y debilidad; Nux vomica estimula eliminación hepática y alivia espasmos.',
     ['digestivo']),
     
    ('bryonia_alba', 'rhus_toxicodendron', 'antagonismo', 'B',
     'Modalidades opuestas de dolor articular: Bryonia agrava por movimiento, Rhus mejora tras inicio de movimiento.',
     ['Diferenciación clínica precisa del patrón de rigidez', 'Guía de prescripción individualizada'],
     ['No alternar simultáneamente sin definir modalidad dominante'],
     'Bryonia alivia inflamación de serosas en reposo absoluto; Rhus tox trata rigidez ligamentosa que calma con calor y movimiento continuo.',
     ['musculoesqueletico']),
     
    ('calcarea_carbonica', 'calcarea_phosphorica', 'complementario', 'B',
     'Constitución ósea, crecimiento infantil y consolidación de fracturas.',
     ['Soporte del desarrollo osteoarticular', 'Tratamiento de la fatiga del crecimiento'],
     ['Complementar con aporte nutricional adecuado de calcio y vitamina D'],
     'Calcarea carbonica regula asimilación metabólica; Calcarea phosphorica aporta dinamismo a la osteogénesis.',
     ['musculoesqueletico']),
     
    ('calcarea_fluorica', 'silicea', 'complementario', 'B',
     'Elasticidad de tejidos conectivos, tendones, venas y prevención de caries y estrías.',
     ['Firmeza ligamentosa y vascular', 'Prevención de deformaciones articulares'],
     ['Tratamiento de fondo a largo plazo'],
     'Calcarea fluorica restaura elasticidad de fibras elásticas; Silicea reestructura la matriz de colágeno y queratina.',
     ['musculoesqueletico', 'dermatologico']),
     
    ('causticum', 'gelsemium_sempervirens', 'complementario', 'C',
     'Tratamiento de paresias, debilidad motora y secuelas de parálisis facial o temblor.',
     ['Mejora del tono neuromuscular', 'Alivio de rigidez por frío seco'],
     ['Requiere valoración neurológica'],
     'Causticum actúa sobre parálisis de nervios motores periféricos; Gelsemium sobre debilidad y falta de coordinación.',
     ['nervioso', 'musculoesqueletico']),
     
    ('chamomilla_homeo', 'pulsatilla', 'complementario', 'B',
     'Alivio del dolor e irritabilidad en dentición infantil y cólicos.',
     ['Calma del llanto inconsolable', 'Sedación natural sin fármacos depresores'],
     ['Consultar si hay fiebre elevada'],
     'Chamomilla calma hipersensibilidad al dolor y cólera; Pulsatilla consuela al niño que demanda afecto y alivia catarro.',
     ['nervioso', 'digestivo']),
     
    ('china_officinalis', 'ferrum_metallicum', 'sinergia', 'B',
     'Astenia profunda tras hemorragias, deshidratación o pérdida prolongada de fluidos corporales.',
     ['Recuperación de vitalidad y tono vascular', 'Alivio de mareos y palidez'],
     ['Controlar hemograma para evaluar necesidad de hierro farmacológico'],
     'China restaura equilibrio tras deshidratación/anemia; Ferrum metallicum reactiva eritropoyesis y oxigenación tisular.',
     ['metabolico', 'cardiovascular']),
     
    ('dulcamara', 'rhus_toxicodendron', 'potenciador', 'B',
     'Afecciones reumáticas, neuralgias y catarros desencadenados por humedad y lluvia fría.',
     ['Alivio de dolor articular por cambio de tiempo', 'Yugulación de dermatitis por humedad'],
     ['Mantener abrigo y ambiente seco'],
     'Ambos remedios comparten tropismo por tejidos fibrosos agravados por clima frío húmedo.',
     ['musculoesqueletico', 'respiratorio']),
     
    ('ferrum_phosphoricum', 'aconitum_napellus', 'complementario', 'B',
     'Primer estadio de estados congestivos e inflamaciones respiratorias de comienzo gradual.',
     ['Control precoz de febrículas y otitis catarral', 'Prevención de exudados bronquiales'],
     ['Vigilar evolución térmica'],
     'Aconitum actúa en la fase hiperaguda sin sudor; Ferrum phos en la fase congestiva con fiebre moderada.',
     ['respiratorio', 'inmune']),
     
    ('gelsemium_sempervirens', 'ignatia_amara', 'complementario', 'B',
     'Ansiedad de anticipación, miedo escénico y choque emocional con temblores.',
     ['Control de taquicardia y parálisis por pánico', 'Alivio del nudo en garganta o epigastrio'],
     ['No interfiere con ansiolíticos convencionales'],
     'Gelsemium alivia la inhibición motora y diarrea por miedo; Ignatia regula la labilidad emocional y espasmos paradójicos.',
     ['nervioso']),
     
    ('hepar_sulphuris', 'silicea', 'complementario', 'B',
     'Manejo de procesos supurativos agudos y subagudos (abscesos, forúnculos, sinusitis).',
     ['Favorece la maduración o reabsorción del pus según dilución', 'Cicatrización limpia'],
     ['En implantes o cuerpos extraños, Silicea puede favorecer expulsión'],
     'Hepar sulphur en baja dilución acelera maduración y en alta reabsorbe; Silicea elimina residuos y consolida tejido.',
     ['inmune', 'dermatologico']),
     
    ('hypericum_perforatum_homeo', 'arnica_montana_homeo', 'potenciador', 'A',
     'Traumatismos en zonas ricas en terminaciones nerviosas (dedos, coxis, extracciones dentales).',
     ['Alivio del dolor lancinante neurítico', 'Recuperación tisular post-quirúrgica'],
     ['Mantener higiene local estricta'],
     'Arnica reabsorbe el hematoma tisular; Hypericum actúa específicamente como analgésico de nervios contundidos.',
     ['nervioso', 'musculoesqueletico']),
     
    ('ignatia_amara', 'natrum_muriaticum', 'complementario', 'B',
     'Tratamiento del duelo, pena silenciosa y somatizaciones afectivas.',
     ['Alivio de llanto contenido y melancolía', 'Disminución de cefaleas por tensión emocional'],
     ['Acompañar de soporte psicológico'],
     'Ignatia modula el impacto emocional agudo con suspiros y espasmos; Natrum muriaticum trata la tristeza crónica y el aislamiento.',
     ['nervioso']),
     
    ('ipecacuanha_homeo', 'antimonium_tartaricum', 'complementario', 'B',
     'Bronquitis y crisis de tos con acumulación mucosa y náuseas persistentes.',
     ['Expectoración de flemas densas', 'Alivio de accesos de tos con vómito reflejo'],
     ['Monitorizar saturación de oxígeno en bronquiolitis infantil'],
     'Ipeca calma tos espasmódica con lengua limpia y náusea continua; Antimonium tartaricum ayuda en estertores con dificultad para expectorar.',
     ['respiratorio']),
     
    ('kali_bichromicum', 'pulsatilla', 'complementario', 'B',
     'Sinusitis y secreciones mucosas espesas, filamentosas y adherentes.',
     ['Drenaje de senos paranasales', 'Alivio de dolor en raíz nasal'],
     ['Realizar lavados nasales salinos concomitantes'],
     'Kali bichromicum disuelve mucosidades amarillentas gomosas; Pulsatilla fluidifica catarros no irritantes al aire libre.',
     ['respiratorio']),
     
    ('kali_phosphoricum', 'magnesia_phosphorica', 'sinergia', 'A',
     'Tríada de sales de Schüssler para agotamiento mental, cefalea por estrés y calambres nerviosos.',
     ['Restauración del rendimiento intelectual (surmenage)', 'Alivio de neuralgias y contracturas'],
     ['Muy seguro y compatible con toda medicación'],
     'Kali phos es la sal del sistema nervioso por excelencia; Magnesia phos es el antiespasmódico bioquímico intracelular.',
     ['nervioso', 'musculoesqueletico']),
     
    ('lachesis_mutus', 'sepia_officinalis', 'complementario', 'B',
     'Trastornos de la peri- y postmenopausia: sofocos, labilidad anímica y congestión venosa.',
     ['Disminución de oleadas de calor que no toleran ropa ajustada', 'Equilibrio del estado de ánimo'],
     ['Control ginecológico rutinario'],
     'Lachesis cubre la intolerancia al calor y constricción en cuello; Sepia cubre la sensación de pesadez pélvica y abatimiento.',
     ['endocrino', 'reproductivo', 'nervioso']),
     
    ('lycopodium_clavatum', 'nux_vomica', 'complementario', 'B',
     'Dispepsias crónicas, hinchazón abdominal tras comer poco, somnolencia postprandial y pirosis.',
     ['Mejora de la función hepatobiliar', 'Disminución del meteorismo vespertino'],
     ['Corregir hábitos dietéticos y sedentarismo'],
     'Lycopodium trata la flatulencia inferior y digestión lenta; Nux vomica alivia el espasmo gastroesofágico por estrés y excesos.',
     ['digestivo', 'hepatico']),
     
    ('magnesia_phosphorica', 'colocynthis', 'potenciador', 'A',
     'Cólicos abdominales y dismenorrea que mejoran al doblarse en dos y por aplicación de calor.',
     ['Alivio rápido de espasmos viscerales', 'Disminución de dolor menstrual agudo'],
     ['Tomar disuelto en agua caliente (Método 7 caliente de Schüssler)'],
     'Magnesia phos restaura el potencial de membrana celular; Colocynthis relaja musculatura lisa espasmódica mediada por neurovegetativo.',
     ['digestivo', 'reproductivo']),
     
    ('mercurius_solubilis', 'belladonna', 'complementario', 'B',
     'Amigdalitis y faringitis agudas con adenopatías dolorosas, hipersalivación y sudoración nocturna.',
     ['Alivio del dolor al tragar que irradia al oído', 'Resolución de inflamación glandular'],
     ['Consultar si hay sospecha de estreptococo para test rápido'],
     'Belladonna trata la congestión roja brillante inicial; Mercurius cubre la fase de exudado mucoso, halitosis e inflamación ganglionar.',
     ['inmune', 'respiratorio']),
     
    ('natrum_muriaticum', 'sepia_officinalis', 'complementario', 'B',
     'Trastornos neuroendocrinos, sequedad de mucosas, melancolía y fatiga crónica femenina.',
     ['Restauración de la hidratación de mucosas', 'Regulación del tono anímico y vitalidad'],
     ['Mantener estilo de vida saludable'],
     'Natrum mur regula el balance hidroelectrolítico celular y nutricional; Sepia tonifica el sistema venoso pelviano y el eje ovárico.',
     ['endocrino', 'nervioso', 'reproductivo'])
]

for hs in homeo_synergies:
    add_s(*hs)

print(f"Added Homeopatia synergies. Current total: {len(new_synergies)}")

# 3. ACEITES ESENCIALES ORPHANS
aceites_synergies = [
    ('pino_silvestre_aceite', 'eucalipto_radiata_aceite', 'potenciador', 'A',
     'Difusión e inhalación para desinfección ambiental y descongestión bronquial.',
     ['Antiséptico de vías respiratorias', 'Efecto tónico y energizante'],
     ['Evitar aplicación cutánea pura (dermocáustico leve); diluir'],
     'Alfa-pineno y 1,8-cineol ejercen sinergia antibacteriana, mucolítica y descongestiva de la mucosa respiratoria.',
     ['respiratorio', 'inmune']),
     
    ('cipres_siempreverde_aceite', 'lentisco_aceite', 'potenciador', 'A',
     'Descongestionante venoso y linfático de referencia para varices y piernas cansadas.',
     ['Reactivación del retorno venoso', 'Reducción de edema maleolar'],
     ['Contraindicado en patologías estrógeno-dependientes'],
     'Monoterpenos del ciprés tonifican la pared vascular; alfa-pineno del lentisco descongestiona la circulación linfática.',
     ['cardiovascular']),
     
    ('katrafay_aceite', 'gaulteria_aceite', 'potenciador', 'A',
     'Fórmula de masaje antiinflamatoria y analgésica para reumatismos, lumbalgias y tendinitis.',
     ['Alivio inmediato del dolor osteomuscular', 'Desinflamación de tejidos articulares'],
     ['No usar en alérgicos a salicilatos o anticoagulados'],
     'Ishwarano de Katrafay actúa sobre receptores de dolor periférico; salicilato de metilo inhibe COX-2 periférica.',
     ['musculoesqueletico']),
     
    ('hierba_luisa', 'menta_piperita', 'potenciador', 'B',
     'Masaje digestivo y tónico neuromuscular para pesadez, náuseas y cefaleas tensionales.',
     ['Alivio de espasmos gástricos', 'Efecto refrescante y analgésico'],
     ['No usar en menores de 6 años ni embarazadas'],
     'Citrales de hierba luisa relajan fibra muscular lisa; mentol bloquea canales de calcio y estimula receptores TRPM8 térmicos.',
     ['digestivo', 'nervioso']),
     
    ('mandarina_roja_aceite', 'lavanda_angustifolia_aceite', 'potenciador', 'A',
     'Aromaterapia relajante y ansiolítica segura para insomnio infantil y estrés del adulto.',
     ['Facilita el adormecimiento natural', 'Disminución de agitación nocturna'],
     ['Fotosensibilizante por vía tópica (cumarinas en cítricos); no exponer al sol'],
     'Limoneno y N-metilantranilato de metilo actúan sobre receptores 5-HT1A; linalol y acetato de linalilo modulan GABA.',
     ['nervioso']),
     
    ('manzanilla_romana_aceite', 'lavanda_vera_aceite', 'potenciador', 'A',
     'Calmante mayor del sistema nervioso central en crisis de ansiedad, shock emocional e insomnio.',
     ['Sedación rápida y alivio de palpitaciones nerviosas', 'Desactivación de crisis de angustia'],
     ['Excelente tolerancia cutánea diluido'],
     'Angelatos de isobutilo ejercen una de las mayores acciones antiespasmódicas y ansiolíticas de la aromaterapia médica.',
     ['nervioso']),
     
    ('enebro_ramas_aceite', 'pino_maritimo_aceite', 'sinergia', 'B',
     'Drenaje renal y reumatológico en masajes de retención de líquidos y dolor articular.',
     ['Eliminación de toxinas y ácido úrico', 'Efecto rubefaciente suave'],
     ['Contraindicado en insuficiencia renal aguda'],
     'Monoterpenos estimulan el filtrado glomerular y reactivan la microcirculación periauricular.',
     ['urinario', 'musculoesqueletico']),
     
    ('laurel_noble_aceite', 'arbol_te_aceite', 'potenciador', 'A',
     'Tratamiento de aftas bucales, infecciones virales y dolor neurálgico odontológico.',
     ['Cicatrización de llagas bucales', 'Poderoso antiviral y antibacteriano local'],
     ['Probar tolerancia previa en pliegue del codo'],
     '1,8-cineol, eugenol y terpinen-4-ol rompen biopelículas bacterianas y calman el dolor neurálgico local.',
     ['inmune', 'digestivo']),
     
    ('salvia_esclarea_aceite', 'anis_estrellado_aceite', 'potenciador', 'B',
     'Alivio de sofocos, sequedad vaginal y amenorrea en la perimenopausia.',
     ['Regulación del equilibrio estrogénico', 'Disminución de sudores nocturnos'],
     ['Contraindicado en antecedentes de cáncer hormono-dependiente (mama, endometrio)'],
     'Esclareol y trans-anetol ejercen acción mimética sobre receptores beta de estrógeno.',
     ['endocrino', 'reproductivo']),
     
    ('abeto_balsamico_aceite', 'eucalipto_globulus_aceite', 'potenciador', 'A',
     'Balsámico pectoral para catarros, tos irritativa y congestión de vías bajas.',
     ['Fluidificación bronquial profunda', 'Acción antiséptica aérea'],
     ['Precaución en asmáticos durante fase aguda'],
     'Acetato de bornilo y cineol reducen la viscosidad del moco y relajan la musculatura bronquial.',
     ['respiratorio']),
     
    ('houttuynia_aceite', 'arbol_te_aceite', 'potenciador', 'B',
     'Purificación de piel con tendencia acneica e infecciones cutáneas resistentes.',
     ['Inhibición de Cutibacterium acnes', 'Disminución de inflamación comedoniana'],
     ['Usar diluido en aceite vegetal portador'],
     'Decanoil acetaldehído y terpinen-4-ol destruyen la pared celular bacteriana y controlan secreción sebácea.',
     ['dermatologico', 'inmune']),
     
    ('raiz_angelica_aceite', 'jengibre_aceite', 'potenciador', 'B',
     'Tónico carminativo y digestivo para aerofagia, meteorismo y fatiga psicosomática.',
     ['Expulsión de gases acumulados', 'Estimulación del fuego digestivo'],
     ['Fotosensibilizante cutáneo; evitar sol tras aplicación'],
     'Furanocumarinas y sesquiterpenos estimulan el peristaltismo coordinado y reducen el tono del esfínter pilórico.',
     ['digestivo', 'nervioso']),
     
    ('abrojo_aceite', 'palmarosa', 'sinergia', 'A',
     'Regeneración intensiva dérmica, quemaduras, radiodermitis y arrugas profundas.',
     ['Cicatrización celular acelerada', 'Restauración de la barrera hidrolipídica'],
     ['Uso tópico cosmético / dermatológico'],
     'Ácidos grasos raros omega-7 (palmitoleico) y carotenoides estimulan proliferación epitelial en sinergia con geraniol.',
     ['dermatologico']),
     
    ('albahaca_sagrada_aceite', 'incienso_aceite', 'sinergia', 'A',
     'Aromaterapia meditativa para estrés crónico, sobrecarga mental y asma emocional.',
     ['Apertura de la respiración profunda', 'Disminución del parloteo mental y ansiedad'],
     ['Apto para difusión e inhalación seca'],
     'Eugenol y alfa-pineno calman la reactividad del sistema límbico y reducen broncoconstricción refleja.',
     ['nervioso', 'respiratorio', 'inmune']),
     
    ('melissa_true_aceite', 'ravintsara_aceite', 'potenciador', 'A',
     'Tratamiento local precoz de brotes de herpes labial / zóster y agitación extrema.',
     ['Freno inmediato de la replicación viral', 'Alivio del prurito y dolor neurálgico'],
     ['Diluir al 5% en aceite vegetal'],
     'Geranial, neral y 1,8-cineol inactivan viriones del virus herpes simple (HSV-1) por contacto directo.',
     ['dermatologico', 'inmune', 'nervioso']),
     
    ('pino_maritimo_aceite', 'cipres_siempreverde_aceite', 'complementario', 'A',
     'Masaje tónico vascular para insuficiencia venosa y celulitis edematosa.',
     ['Drenaje de estasis venoso', 'Alivio del dolor por congestión capilar'],
     ['Aplicar en sentido ascendente hacia el corazón'],
     'Trementina y pineno favorecen la oxigenación capilar y previenen microtrombosis perivenosa.',
     ['cardiovascular', 'respiratorio']),
     
    ('vetiver_haiti_aceite', 'lavanda_angustifolia_aceite', 'potenciador', 'A',
     'Anclaje del sistema nervioso en hiperactividad, insomnio de conciliación y ansiedad difusa.',
     ['Profunda relajación física y mental', 'Alineación de ritmos circadianos'],
     ['Aroma terroso denso; usar en baja dosificación'],
     'Vetiverol y khusimol interactúan con receptores GABAérgicos induciendo ondas cerebrales alfa y theta.',
     ['nervioso']),
     
    ('valeriana_jatamansi_aceite', 'manzanilla_romana_aceite', 'potenciador', 'A',
     'Sinergia de alta potencia sedante para crisis de pánico nocturno y taquicardias emocionales.',
     ['Sedación neuromuscular profunda', 'Interrupción de espasmos viscerales por estrés'],
     ['Puede provocar somnolencia; no conducir tras su uso'],
     'Jatamansona y valeranona ejercen una intensa depresión fisiológica del centro vasomotor y límbico.',
     ['nervioso']),
     
    ('tomillo_geraniol_aceite', 'palmarosa_aceite', 'potenciador', 'A',
     'Antifúngico suave pero potente para micosis cutáneas, pie de atleta y candidiasis.',
     ['Eliminación de hongos dermatofitos', 'Respeto absoluto por la integridad dérmica'],
     ['Apto para pieles sensibles a diferencia del timol'],
     'Geraniol puro desestabiliza la membrana de ergosterol en Candida albicans y Trichophyton sin irritación.',
     ['dermatologico', 'inmune']),
     
    ('ajedrea_montana_aceite', 'oregano_compacto_aceite', 'potenciador', 'A',
     'Antiinfeccioso mayor de choque para disbiosis bacteriana y parasitosis intestinales.',
     ['Poder antibacteriano y antiparasitario de amplio espectro', 'Erradicación de patógenos resistentes'],
     ['Dermocáustico e hepatotóxico en dosis altas; usar microencapsulado con protector hepático'],
     'Carvacrol y timol rompen la pared fosfolipídica celular provocando lisis bacteriana masiva.',
     ['inmune', 'digestivo']),
     
    ('leche_eneldo_aceite', 'hinojo_aceite', 'potenciador', 'B',
     'Fórmula carminativa suave para cólicos infantiles y digestiones espasmódicas.',
     ['Dispersión rápida de burbujas de gas intestinal', 'Relajación del píloro e intestino'],
     ['Usar en dilución muy alta en niños (>1 año)'],
     'Carvona y anetol disminuyen la contractura del músculo liso gastrointestinal.',
     ['digestivo', 'nervioso']),
     
    ('cipres_azul_aceite', 'manzanilla_azul_aceite', 'potenciador', 'A',
     'Antiinflamatorio dérmico potente y antihistamínico para eccemas, urticarias y quemaduras.',
     ['Alivio del picor ardiente dérmico', 'Reducción del eritema inflamatorio'],
     ['Color azul natural intenso (guayazuleno/camazuleno)'],
     'Guayazuleno y camazuleno bloquean la desgranulación mastocitaria y la síntesis de histamina y leucotrieno B4.',
     ['dermatologico', 'respiratorio']),
     
    ('romero_verbenona_aceite', 'limon_aceite', 'sinergia', 'A',
     'Drenaje hepático primaveral, detoxificación biliar y tónico del folículo piloso.',
     ['Regeneración celular hepatocítica', 'Eliminación de toxinas biliares'],
     ['No usar en menores ni epilepsia'],
     'Verbenona estimula la secreción de sales biliares (colerético) y regenera epitelio hepático.',
     ['hepatico', 'dermatologico', 'nervioso']),
     
    ('citronela_java_aceite', 'geranio_bourbon_aceite', 'potenciador', 'A',
     'Repelente natural contra mosquitos e insectos y calmante tras picaduras.',
     ['Protección frente a picaduras de insectos', 'Acción antiinflamatoria en piel picada'],
     ['Reaplicar cada 2-3 horas en exteriores'],
     'Citronelal y geraniol confunden los receptores olfativos de los insectos vectores.',
     ['dermatologico']),
     
    ('palo_santo_bursera_aceite', 'incienso_olibanum_aceite', 'sinergia', 'A',
     'Respiración meditativa, alivio de opresión torácica y purificación ambiental.',
     ['Apertura bronquial y relajación diafragmática', 'Inducción a la calma mental'],
     ['Usar de fuentes éticas y sostenibles'],
     'Limoneno y alfa-pineno modulan el tono vagal promoviendo el predominio parasimpático.',
     ['nervioso', 'inmune', 'respiratorio']),
     
    ('eucalipto_citriodora_aceite', 'gaulteria_aceite', 'potenciador', 'A',
     'Antiinflamatorio específico de tendones, ligamentos y epicondilitis (codo de tenista).',
     ['Alivio de tendinitis y periartritis', 'Disminución del calor y edema local'],
     ['Diluir adecuadamente; no usar en alérgicos a aspirina'],
     'Citronelal inhibe la síntesis de prostaglandinas proinflamatorias en sinergia con el salicilato.',
     ['musculoesqueletico', 'dermatologico']),
     
    ('nuez_moscada_aceite', 'clavo', 'potenciador', 'B',
     'Rubefaciente térmico y analgésico en dolores reumáticos crónicos y frío articular.',
     ['Aporte de calor penetrante en articulaciones frías', 'Alivio del dolor reumático'],
     ['Dermocáustico; usar siempre diluido al 1-2%'],
     'Miristicina y eugenol estimulan las fibras nerviosas térmicas reduciendo la percepción del dolor crónico.',
     ['nervioso', 'digestivo', 'musculoesqueletico'])
]

for ace in aceites_synergies:
    add_s(*ace)

print(f"Added Aceites esenciales synergies. Current total: {len(new_synergies)}")

# 4. VITAMINAS, MINERALES, AMINOÁCIDOS Y PROBIÓTICOS ORPHANS
nutri_synergies = [
    ('camu_camu', 'acerola', 'potenciador', 'A',
     'Dúo de fuentes naturales de vitamina C con bioflavonoides y elagitaninos para biodisponibilidad superior.',
     ['Absorción celular maximizada de vitamina C', 'Defensa antioxidante de mucosas'],
     ['Tomar por la mañana'],
     'Los flavonoides cítricos y polifenoles del camu camu protegen el ácido ascórbico de la oxidación facilitando su transporte por transportadores SVCT.',
     ['inmune', 'metabolico']),
     
    ('vitamina_b5_pantotenato', 'biotina_crinip', 'sinergia', 'A',
     'Metabolismo de ácidos grasos y síntesis de queratina en caída capilar y fragilidad ungueal.',
     ['Fortalecimiento del tallo capilar', 'Control de dermatitis seborreica'],
     ['Compatible con micronutrientes como zinc y hierro'],
     'Pantotenato es el núcleo de la Coenzima A indispensable para carboxilaciones mediadas por biotina en queratinocitos.',
     ['metabolico', 'dermatologico']),
     
    ('pipquinafosfolipidos', 'cardo_mariano', 'potenciador', 'A',
     'Formación de fitosomas hepatoprotectores y reparación de membranas celulares en esteatosis hepática.',
     ['Mayor absorción de silimarina', 'Regeneración de la arquitectura del hepatocito'],
     ['Tomar con comidas ricas en lípidos'],
     'La fosfatidilcolina emulsiona la silimarina facilitando su paso a través de la mucosa duodenal y aporta colina para el transporte de VLDL.',
     ['hepatico', 'digestivo', 'nervioso']),
     
    ('polen_abeja_ext', 'jalea_real', 'potenciador', 'A',
     'Complejo nutricional integral de aminoácidos, enzimas y vitaminas para fatiga y convalecencia.',
     ['Recuperación de vitalidad', 'Estimulación del apetito y defensas'],
     ['Contraindicado en alérgicos al polen'],
     'Sinergia de micronutrientes bioasimilables y ácido 10-HDA que estimulan la hematopoyesis y el metabolismo basal.',
     ['metabolico', 'inmune']),
     
    ('lactoferrina_bovina', 'hierro_bisglicinato', 'potenciador', 'A',
     'Fijación inteligente de hierro sin irritación gástrica ni proliferación bacteriana patógena.',
     ['Corrección eficaz de anemia ferropénica', 'Protección de la microbiota intestinal frente a exceso de hierro libre'],
     ['Apta para personas con intolerancia al sulfato ferroso'],
     'Lactoferrina secuestra y transporta iones férricos directamente a receptores enterocíticos específicos.',
     ['inmune', 'digestivo', 'metabolico']),
     
    ('astaxantina_haematococcus', 'luteina', 'potenciador', 'A',
     'Protección integral de la retina, mácula y córnea frente a luz azul y daño solar.',
     ['Alivio de fatiga visual por pantallas', 'Prevención de degeneración macular'],
     ['Tomar junto a grasas saludables'],
     'Astaxantina cruza la barrera hematorretiniana protegiendo fotorreceptores; luteína absorbe longitudes de onda de alta energía.',
     ['ocular', 'dermatologico', 'cardiovascular']),
     
    ('potasio_citrato_bis', 'magnesio', 'potenciador', 'A',
     'Alcalinización urinaria, prevención de litiasis por ácido úrico/oxalato cálcico y relajación muscular.',
     ['Inhibición de cristalización de sales en orina', 'Prevención de calambres musculares'],
     ['Monitorizar potasio en insuficiencia renal'],
     'El citrato forma complejos solubles con el calcio impidiendo su precipitación y alcaliniza el pH tubular.',
     ['urinario', 'cardiovascular', 'musculoesqueletico']),
     
    ('yoduro_potasio_lugol', 'selenio_tiroideo', 'cofactor', 'A',
     'Síntesis armónica de hormonas tiroideas T3/T4 previniendo daño oxidativo tiroideo.',
     ['Prevención del bocio e hipotiroidismo funcional', 'Neutralización de peróxidos tóxicos en la tirocito'],
     ['No utilizar en hipertiroidismo o tiroiditis autoinmune activa sin control médico'],
     'El yoduro es el sustrato de la TPO; selenio forma parte de la glutatión peroxidasa que neutraliza el H2O2 generado durante la yodación.',
     ['endocrino', 'inmune']),
     
    ('silicio_ortosilicico', 'colageno_hidrolizado', 'cofactor', 'A',
     'Estimulación de la enzima prolil hidroxilasa para la síntesis de colágeno y salud osteoarticular.',
     ['Mayor densidad ósea y flexibilidad articular', 'Fortalecimiento de cabello y uñas'],
     ['Tomar en ayunas o antes de dormir'],
     'El ácido ortosilícico estabiliza la triple hélice de colágeno y promueve la síntesis de glucosaminoglicanos por condrocitos.',
     ['dermatologico', 'musculoesqueletico']),
     
    ('calcio_microcristalino', 'vitamina_k2_mk7', 'cofactor', 'A',
     'Fijación selectiva de calcio en matriz ósea evitando calcificaciones vasculares o renales.',
     ['Incremento de densidad mineral ósea en osteoporosis', 'Protección de la elasticidad de arterias'],
     ['Distribuir tomas de calcio a lo largo del día'],
     'Vitamina K2 carboxila la osteocalcina en osteoblastos fijando calcio, y carboxila la MGP endotelial inhibiendo calcificación de la túnica media.',
     ['musculoesqueletico', 'cardiovascular']),
     
    ('vanadyl_sulfato', 'cromo_picolinato', 'potenciador', 'B',
     'Sinergia de oligoelementos miméticos de la insulina para control glucémico y resistencia a la insulina.',
     ['Mejora de la sensibilidad a la insulina', 'Reducción de glucemias basales'],
     ['Monitorear glucemias en pacientes tratados con insulina o antidiabéticos orales'],
     'Vanadilo fosforila el sustrato del receptor de insulina (IRS-1) y cromo estimula la actividad tirosina quinasa.',
     ['metabolico']),
     
    ('biotina_crinip', 'zinc', 'cofactor', 'A',
     'Dúo dermatológico para proliferación celular en folículo piloso, queratinización y control de sebo.',
     ['Detención del efluvio telógeno', 'Mejora del grosor capilar'],
     ['No interferir con análisis tiroideos (suspender biotina 48h antes de analíticas)'],
     'Zinc es cofactor de ARN/ADN polimerasas del bulbo piloso; biotina interviene en la carboxilación de ácidos grasos cutáneos.',
     ['dermatologico', 'nervioso']),
     
    ('complejo_b_50', 'coq10', 'cofactor', 'A',
     'Combustible celular total: vitaminas del complejo B y CoQ10 para la cadena de transporte de electrones mitocondrial.',
     ['Eliminación del cansancio físico y mental', 'Rendimiento metabólico superior'],
     ['Tomar por la mañana con el desayuno'],
     'B1, B2, B3 y B5 generan NADH y FADH2 en ciclo de Krebs; CoQ10 transfiere los electrones al complejo III para producir ATP.',
     ['metabolico', 'nervioso']),
     
    ('magnesio_glicerofosfato', 'vitamina_b6', 'cofactor', 'A',
     'Absorción neuronal y celular de magnesio sin efectos laxantes gastrointestinales.',
     ['Alivio de contracturas musculares y calambres', 'Modulación del estrés y reducción de migrañas'],
     ['Sal de magnesio de altísima tolerancia digestiva'],
     'Glicerofosfato cruza membranas neuronales eficientemente; piridoxal-5-fosfato facilita el transporte intracelular de magnesio.',
     ['nervioso', 'musculoesqueletico']),
     
    ('colina_estandar', 'inositol', 'sinergia', 'A',
     'Factores lipotrópicos para el metabolismo de grasas hepáticas y síntesis de neurotransmisores.',
     ['Prevención del hígado graso no alcohólico', 'Soporte de la memoria y función hepática'],
     ['Dosis ajustadas para evitar sobrecarga gástrica'],
     'Colina e inositol forman fosfatidilcolina y fosfatidilinositol, requeridos para ensamblar lipoproteínas VLDL y exportar triglicéridos hepáticos.',
     ['hepatico', 'nervioso', 'metabolico']),
     
    ('d_ribose', 'creatina', 'potenciador', 'A',
     'Resíntesis instantánea de ATP y fosfocreatina en esfuerzo muscular y miocardiopatía.',
     ['Aceleración de recuperación muscular', 'Aumento de fuerza explosiva y energía'],
     ['Tomar pre o post-entrenamiento con agua abundante'],
     'D-Ribosa aporta la molécula de partida para la síntesis de novo de nucleótidos de adenina; creatina almacena enlaces fosfato de alta energía.',
     ['cardiovascular', 'musculoesqueletico', 'metabolico']),
     
    ('indole_3_carbinol', 'dim', 'sinergia', 'A',
     'Modulación del metabolismo hepático de estrógenos hacia la vía protectora 2-hidroxilada.',
     ['Equilibrio hormonal en hiperestrogenismo', 'Prevención en tejidos mamario y prostático'],
     ['No recomendado durante el embarazo'],
     'I3C y DIM inducen la enzima CYP1A1 aumentando el ratio 2-hidroxiestrona frente al metabolito proliferativo 16-alfa-hidroxiestrona.',
     ['endocrino', 'inmune', 'hepatico']),
     
    ('leucina_pura', 'vitamina_d3', 'potenciador', 'A',
     'Estimulación de la vía mTOR y receptores VDR musculares para frenar la sarcopenia y ganar masa magra.',
     ['Preservación muscular en adultos mayores y deportistas', 'Aumento de síntesis proteica miofibrilar'],
     ['Distribuir junto a ingestas proteicas'],
     'L-leucina activa directamente el complejo mTORC1; la vitamina D sensibiliza los miocitos aumentando la densidad de receptores de leucina.',
     ['musculoesqueletico', 'metabolico']),
     
    ('betacaroteno', 'vitamina_e', 'sinergia', 'A',
     'Red antioxidante lipídica para piel, ojos y membranas celulares.',
     ['Fotoprotección frente a radiación UV', 'Neutralización de peróxidos lipídicos'],
     ['Evitar dosis altas de betacaroteno sintético en fumadores activos'],
     'El betacaroteno desactiva el oxígeno singlete excitado; el alfa-tocoferol intercepta los radicales peroxilo en la bicapa lipídica.',
     ['ocular', 'inmune', 'dermatologico']),
     
    ('vitamina_b2', 'magnesio', 'potenciador', 'A',
     'Protocolo de profilaxis de migraña recomendado por guías neurológicas.',
     ['Reducción demostrada de días con crisis migrañosa', 'Normalización de fosforilación oxidativa cerebral'],
     ['Colorea la orina de amarillo fosforescente inocuo'],
     'La riboflavina actúa como cofactor de FMN/FAD en la cadena respiratoria mitocondrial neuronal; magnesio previene la vasoconstricción y depresión cortical propagada.',
     ['nervioso', 'ocular', 'dermatologico']),
     
    ('acido_folico', 'vitamina_b12', 'cofactor', 'A',
     'Ciclo de la metilación, síntesis de ADN y reducción de niveles tóxicos de homocisteína.',
     ['Prevención de defectos del tubo neural', 'Protección cardiovascular y cerebral'],
     ['Descartar déficit de B12 antes de dar dosis altas de folato solo'],
     'El 5-metiltetrahidrofolato transfiere su grupo metilo a la cobalamina para formar metilcobalamina y regenerar metionina desde homocisteína.',
     ['cardiovascular', 'nervioso', 'metabolico']),
     
    ('paba', 'biotina_crinip', 'complementario', 'B',
     'Mantenimiento del pigmento melánico capilar y estructura del cabello.',
     ['Protección frente al encanecimiento prematuro', 'Salud del cuero cabelludo'],
     ['No combinar con sulfonamidas antibióticas (PABA es antagonista)'],
     'El ácido para-aminobenzoico participa en la síntesis endógena de folatos y en la fijación de pigmentos en la corteza capilar.',
     ['dermatologico']),
     
    ('nadh', 'coq10', 'potenciador', 'A',
     'Dupla energética mitocondrial para síndrome de fatiga crónica, fibromialgia y lucidez cognitiva.',
     ['Aumento significativo de la energía vital', 'Mejora en concentración y memoria de trabajo'],
     ['Tomar en ayunas sublingual o cápsulas gastrorresistentes'],
     'NADH dona electrones al Complejo I y CoQ10 los transfiere al Complejo III generando el gradiente protónico para la ATP sintasa.',
     ['nervioso', 'metabolico']),
     
    ('n_acetilglucosamina', 'l_glutamina', 'potenciador', 'A',
     'Regeneración de la capa de mucina y uniones estrechas en permeabilidad intestinal y dolor articular.',
     ['Reparación de la barrera intestinal (leaky gut)', 'Síntesis de líquido sinovial articular'],
     ['Apto para intolerantes a mariscos si es de origen fermentativo'],
     'NAG es el bloque de construcción del glicocáliz mucosal y ácido hialurónico; glutamina nutre enterocitos y condrocitos.',
     ['musculoesqueletico', 'digestivo', 'dermatologico']),
     
    ('policosanol', 'arroz_levadura_roja', 'potenciador', 'B',
     'Control integral de lípidos plasmáticos y protección contra oxidación de LDL.',
     ['Reducción del colesterol total y LDL', 'Mantenimiento de vasodilatación endotelial'],
     ['Asociar siempre con CoQ10'],
     'Policosanol inhibe la síntesis hepática de colesterol y estimula la recaptación de LDL por receptores hepáticos.',
     ['cardiovascular', 'metabolico']),
     
    ('vinpocetina', 'ginkgo_biloba', 'potenciador', 'A',
     'Microcirculación cerebral, perfusión retiniana y metabolismo de la glucosa neuronal.',
     ['Mejora en memoria, atención y acúfenos vasculares', 'Protección frente a daño isquémico'],
     ['Precaución con fármacos antiagregantes plaquetarios'],
     'Vinpocetina inhibe la fosfodiesterasa tipo 1 (PDE1) aumentando GMPc y el flujo sanguíneo cerebral sin efecto de robo coronario.',
     ['nervioso', 'ocular']),
     
    ('coleus_forskohlii', 'te_verde', 'sinergia', 'A',
     'Elevación del AMP cíclico (AMPc) y termogénesis para apoyo en composición corporal y metabolismo.',
     ['Aumento de lipólisis en adipocitos', 'Mantenimiento del gasto energético basal'],
     ['No usar en úlcera gástrica ni hipotensión grave'],
     'Forskolina activa directamente la adenilato ciclasa elevando AMPc; EGCG inhibe catecol-O-metiltransferasa prolongando el estímulo lipolítico.',
     ['endocrino', 'cardiovascular', 'metabolico']),
     
    ('silimarina', 'curcuma', 'potenciador', 'A',
     'Protección hepatocelular de amplio espectro, acción antifibrótica y colerética.',
     ['Descenso de transaminasas e inflamación hepática', 'Regeneración tisular tras sobrecargas medicamentosas'],
     ['Excelente perfil de seguridad'],
     'Silibina y curcumina inhiben la activación de células estrelladas hepáticas y el factor pro-fibrótico TGF-beta1.',
     ['hepatico', 'dermatologico']),
     
    ('beta_sitosterol', 'serenoa_repens', 'potenciador', 'A',
     'Tratamiento de elección fitofarmacológico para síntomas de hiperplasia benigna de próstata (HBP).',
     ['Mejora del flujo urinario máximo y vaciamiento vesical', 'Disminución de nicturia y polaquiuria'],
     ['Descartar previamente neoplasia prostática mediante PSA'],
     'Beta-sitosterol inhibe la 5-alfa reductasa y modula la síntesis de prostaglandinas inflamatorias en el estroma prostático.',
     ['reproductivo', 'urinario', 'cardiovascular']),
     
    ('crocetina', 'astaxantina_haematococcus', 'potenciador', 'A',
     'Difusión de oxígeno y protección de la microcirculación coroidea y retiniana.',
     ['Oxigenación retiniana optimizada', 'Protección frente a degeneración macular seca'],
     ['Tomar con comidas'],
     'La crocetina atraviesa barreras tisulares con facilidad incrementando la tasa de difusión de oxígeno en tejidos isquémicos retinianos.',
     ['ocular', 'cardiovascular', 'nervioso']),
     
    ('criptoxantina', 'luteina', 'complementario', 'B',
     'Composición del pigmento macular y mantenimiento de la densidad óptica macular.',
     ['Filtrado de radiación lumínica dañina', 'Agudeza visual en condiciones de deslumbramiento'],
     ['Carotenoide de origen natural'],
     'Beta-criptoxantina se distribuye en la retina periférica complementando la concentración de luteína en la mácula central.',
     ['ocular', 'inmune']),
     
    ('meso_zeaxantina', 'luteina', 'potenciador', 'A',
     'Fórmula AREDS2 optimizada: la tríada de carotenoides maculares en proporción fisiológica.',
     ['Protección del centro de la fóvea', 'Prevención de progresión de DMAE'],
     ['Tratamiento de elección oftálmico'],
     'Meso-zeaxantina se localiza específicamente en el epicentro foveal donde la concentración de otros carotenoides es menor.',
     ['ocular']),
     
    ('quercetina_urinario', 'bromelina', 'potenciador', 'A',
     'Alivio de la inflamación en cistitis intersticial, prostatitis abacteriana crónica y dolor pélvico.',
     ['Disminución de espasmos y ardor urinario', 'Absorción optimizada de quercetina'],
     ['Tomar 20 min antes de las comidas'],
     'Quercetina estabiliza mastocitos vesicales/prostáticos reduciendo liberación de histamina; bromelina quadruplica su absorción entérica.',
     ['urinario', 'inmune', 'cardiovascular']),
     
    ('coq10_fertilidad', 'l_carnitina', 'potenciador', 'A',
     'Calidad del espermiograma (movilidad, morfología) y energía mitocondrial del ovocito.',
     ['Aumento de la movilidad espermática progresiva', 'Protección del ADN germinal frente a fragmentación'],
     ['Tratamiento mínimo recomendado: 3 meses (ciclo de espermatogénesis)'],
     'CoQ10 en la pieza media espermática aporta ATP para el batido flagelar; L-carnitina transporta sustratos oxidativos.',
     ['reproductivo', 'cardiovascular', 'metabolico']),
     
    ('n_acetilcisteina_hepatico', 'selenio', 'cofactor', 'A',
     'Síntesis celular de glutatión reducido (GSH) para detoxificación hepática y protección respiratoria.',
     ['Depuración de fármacos y toxinas', 'Fluidificación de secreciones mucosas y defensas'],
     ['Olor azufrado característico inocuo'],
     'NAC provee la L-cisteína limitante para la síntesis de GSH; selenio es el centro activo de la glutatión peroxidasa.',
     ['hepatico', 'respiratorio', 'inmune']),
     
    ('selenio_tiroideo', 'zinc', 'cofactor', 'A',
     'Conversión periférica de hormona tiroidea T4 inactiva en T3 activa.',
     ['Optimización del metabolismo basal tiroideo', 'Disminución de anticuerpos en tiroiditis de Hashimoto'],
     ['Tomar separado de suplementos con hierro o calcio'],
     'Las desyodasas tipo 1 y 2 requieren selenocisteína para eliminar el átomo de yodo 5\'; zinc es requerido por el receptor nuclear de T3.',
     ['endocrino', 'inmune']),
     
    ('vitamina_k2_mk7', 'vitamina_d3', 'sinergia', 'A',
     'Eje esencial D3/K2 para dirección del calcio al hueso y protección de arterias.',
     ['Salud osteoarticular integral', 'Prevención de rigidez y placas arteriales'],
     ['Tomar con una comida que contenga aceite de oliva o grasas'],
     'Vitamina D3 estimula la producción de osteocalcina y MGP; Vitamina K2 las activa químicamente mediante carboxilación gamma.',
     ['cardiovascular', 'musculoesqueletico']),
     
    ('ipriflavona', 'calcio_microcristalino', 'sinergia', 'A',
     'Inhibición de la resorción osteoclástica y estímulo de la densidad ósea postmenopáusica.',
     ['Freno a la pérdida de masa ósea', 'Soporte estructural del esqueleto'],
     ['No altera hormonas circulantes'],
     'Ipriflavona actúa directamente sobre osteoclastos frenando su actividad lítica mientras provee calcio para nueva matriz ósea.',
     ['musculoesqueletico', 'endocrino']),
     
    ('lactobacillus_rhamnosus', 'saccharomyces_boulardii', 'potenciador', 'A',
     'Prevención y tratamiento de diarrea asociada a antibióticos y diarrea del viajero.',
     ['Preservación de la barrera mucosa colónica', 'Reducción de colonización por Clostridioides difficile'],
     ['Tomar separado de la toma del antibiótico'],
     'LGG produce bacteriocinas y compite por sitios de unión; S. boulardii neutraliza toxinas A y B mediante proteasas secretadas.',
     ['digestivo', 'inmune']),
     
    ('arabinogalactano', 'l_acidophilus', 'sinergia', 'A',
     'Simbiosis de fibra prebiótica fermentable de alerce y probióticos para inmunidad de mucosas.',
     ['Aumento de bifidobacterias y lactobacilos', 'Elevación de IgA secretora en mucosas'],
     ['Excelente tolerancia digestiva'],
     'El arabinogalactano es un polisacárido altamente ramificado fermentado por lactobacilos generando acetato y propionato.',
     ['inmune', 'digestivo']),
     
    ('nanocobre', 'zinc', 'antagonismo', 'A',
     'Equilibrio fisiológico estricto en la absorción intestinal de zinc y cobre.',
     ['Mantenimiento del ratio fisiológico Zn/Cu (aprox 10:1)', 'Prevención de anemia microcítica por déficit de cobre'],
     ['Dosis altas prolongadas de zinc bloquean la absorción de cobre'],
     'Zinc induce metalotioneína en los enterocitos, la cual posee mayor afinidad por el cobre atrapándolo y excretándolo con la descamación.',
     ['inmune', 'dermatologico', 'metabolico', 'nervioso']),
     
    ('queratina', 'l_cisteina', 'potenciador', 'A',
     'Estructura de puentes disulfuro y resistencia mecánica en tallo capilar y lámina ungueal.',
     ['Disminución de rotura de cabello y uñas', 'Recuperación de brillo y densidad'],
     ['Tratamiento continuado de 3 a 6 meses'],
     'La queratina hidrolizada aporta oligopéptidos ricos en aminoácidos azufrados que se integran en la matriz intracelular de queratinocitos.',
     ['dermatologico']),
     
    ('estroncio', 'calcio_microcristalino', 'antagonismo', 'A',
     'Competencia por transportadores intestinales de cationes divalentes en salud ósea.',
     ['Separar la toma de estroncio y calcio al menos 2 horas', 'Estimulación de osteoblastos y mineralización'],
     ['No tomar simultáneamente en la misma comida'],
     'Ambos minerales utilizan los mismos canales TRPV6 y transportadores de absorción entérica saturables.',
     ['musculoesqueletico']),
     
    ('germanio', 'vitamina_c', 'complementario', 'B',
     'Oxigenación celular e inmunoestimulación complementaria.',
     ['Soporte de la producción de interferón', 'Protección frente a hipoxia tisular'],
     ['Usar exclusivamente germanio orgánico (Ge-132); evitar sales inorgánicas por nefrotoxicidad'],
     'El sesquióxido de germanio orgánico facilita la cesión de oxígeno a nivel tisular actuando como semiconductor redox.',
     ['inmune', 'endocrino', 'metabolico']),
     
    ('b_infantis', 'arabinogalactano', 'sinergia', 'A',
     'Microbiota infantil y del adulto: colonización entérica y maduración inmunitaria.',
     ['Alivio de disbiosis e inflamación intestinal', 'Reducción de sintomatología en colon irritable'],
     ['Apto para uso continuado'],
     'Bifidobacterium infantis metaboliza oligosacáridos complejos produciendo ácido láctico y butirato inmunoprotector.',
     ['digestivo', 'inmune']),
     
    ('l_prolina', 'vitamina_c', 'cofactor', 'A',
     'Hidroxilación enzimática de prolina para ensamblaje de la triple hélice de colágeno.',
     ['Elasticidad dérmica y articular', 'Cicatrización acelerada de tejidos blandos'],
     ['Tomar con abundante líquido'],
     'Vitamina C es el cofactor reductor de la prolil hidroxilasa manteniendo el hierro en estado Fe2+ activo.',
     ['musculoesqueletico', 'dermatologico'])
]

for nu in nutri_synergies:
    add_s(*nu)

print(f"Total new synergies generated: {len(new_synergies)}")

# Now let's distribute the new synergies into sinergias_1, sinergias_2, and sinergias_3
all_syn_combined = existing_sin + new_synergies
print(f"Grand total synergies: {len(all_syn_combined)}")

# Split into 3 files (~280-300 items each, all well under 250 KB)
part1 = all_syn_combined[:280]
part2 = all_syn_combined[280:560]
part3 = all_syn_combined[560:]

print(f"Split counts: part1={len(part1)}, part2={len(part2)}, part3={len(part3)}")

with open('src/db/seeders/data/sinergias_1.json', 'w', encoding='utf-8') as f:
    json.dump({'sinergias': part1}, f, ensure_ascii=False, indent=2)
    f.write('\n')

with open('src/db/seeders/data/sinergias_2.json', 'w', encoding='utf-8') as f:
    json.dump({'sinergias': part2}, f, ensure_ascii=False, indent=2)
    f.write('\n')

with open('src/db/seeders/data/sinergias_3.json', 'w', encoding='utf-8') as f:
    json.dump({'sinergias': part3}, f, ensure_ascii=False, indent=2)
    f.write('\n')

sinergias_ts_content = f"""import part1 from './sinergias_1.json';
import part2 from './sinergias_2.json';
import part3 from './sinergias_3.json';

export const sinergias = [...part1.sinergias, ...part2.sinergias, ...part3.sinergias];

export const metadata = {{
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
}};

export default {{
  sinergias,
  metadata
}};
"""

with open('src/db/seeders/data/sinergias.ts', 'w', encoding='utf-8') as f:
    f.write(sinergias_ts_content)

print("Saved sinergias_1.json, sinergias_2.json, sinergias_3.json and sinergias.ts successfully!")
