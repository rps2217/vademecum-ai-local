#!/usr/bin/env python3
"""Añade sinergias para los nuevos ingredientes (Ronda 16)."""
import json
from pathlib import Path

DATA_DIR = Path('src/db/seeders/data')

# Cargar IDs existentes
existing_ids = set()
for f in ['fitoterapia', 'homeopatia', 'aceites', 'vitaminas_minerales']:
    data = json.load(open(DATA_DIR / f'{f}.json'))
    for ing in data['ingredientes']:
        existing_ids.add(ing['id'])

# Cargar IDs de sinergias existentes
sin_data = json.load(open(DATA_DIR / 'sinergias.json'))
sin_ids = set(s['id'] for s in sin_data['sinergias'])

new_sinergias = [
    # ===== OCULAR: tríada AREDS2 + criptoxantina =====
    {
        "id": "sin_luteina_zeaxantina_meso",
        "ingredienteA": "luteina",
        "ingredienteB": "meso_zeaxantina",
        "tipo": "sinergia",
        "nivelEvidencia": "A",
        "descripcion": "Triada AREDS2/CREST: luteina + zeaxantina + meso-zeaxantina mejora densidad macular (MPOD) mas que cada una sola.",
        "beneficios": ["Mayor densidad del pigmento macular (MPOD)", "Mejor filtro de luz azul", "Proteccion degeneracion macular"],
        "precauciones": ["Ninguna relevante descrita"],
        "mecanismo": "Las tres xantofilas se acumulan selectivamente en distintas regiones de la macula; meso-zeaxantina domina el centro, luteina la periferia.",
        "categorias": ["vitamina", "vitamina"],
        "sistemas": ["ocular"]
    },
    {
        "id": "sin_meso_zeaxantina_zeaxantina",
        "ingredienteA": "meso_zeaxantina",
        "ingredienteB": "zeaxantina",
        "tipo": "sinergia",
        "nivelEvidencia": "A",
        "descripcion": "Isomeros de zeaxantina cooperan en el pigmento macular central.",
        "beneficios": ["Cobertura completa de la macula central", "Sinergia con luteina para MPOD"],
        "precauciones": [],
        "mecanismo": "Meso-zeaxantina (3R,3S) y zeaxantina (3R,3R) ocupan distintos sitios de la macula; complemento fisiologico.",
        "categorias": ["vitamina", "vitamina"],
        "sistemas": ["ocular"]
    },
    {
        "id": "sin_criptoxantina_luteina",
        "ingredienteA": "criptoxantina",
        "ingredienteB": "luteina",
        "tipo": "complementario",
        "nivelEvidencia": "B",
        "descripcion": "Carotenoide provitamina A + xantofila macular; doble proteccion retiniana.",
        "beneficios": ["Proteccion antioxidante retiniana combinada", "Soporte de vitamina A endogena"],
        "precauciones": ["Evitar dosis altas en fumadores (carotenos)"],
        "mecanismo": "Criptoxantina aporta retinol (vit. A) mientras luteina filtra luz azul; sinergia antioxidante.",
        "categorias": ["vitamina", "vitamina"],
        "sistemas": ["ocular"]
    },
    {
        "id": "sin_ginkgo_ocular_astaxantina",
        "ingredienteA": "ginkgo_biloba_ocular",
        "ingredienteB": "astaxantina",
        "tipo": "complementario",
        "nivelEvidencia": "B",
        "descripcion": "Mejora flujo sanguineo retiniano (ginkgo) + antioxidante retiniano potente (astaxantina).",
        "beneficios": ["Neuroproteccion del nervio optico", "Flujo ocular + antioxidante"],
        "precauciones": ["Riesgo de sangrado (ginkgo) con anticoagulantes"],
        "mecanismo": "Ginkgo mejora perfusion retiniana y astaxantina neutraliza ROS en membranas retinianas; complemento vascular+antioxidante.",
        "categorias": ["fitoterapia", "vitamina"],
        "sistemas": ["ocular"]
    },
    {
        "id": "sin_ginkgo_ocular_bilberry",
        "ingredienteA": "ginkgo_biloba_ocular",
        "ingredienteB": "bilberry",
        "tipo": "sinergia",
        "nivelEvidencia": "B",
        "descripcion": "Ginkgo + mirtilo (antocianinas) mejoran microcirculacion y vision nocturna.",
        "beneficios": ["Mejora microcirculacion ocular", "Vision nocturna", "Proteccion retiniana"],
        "precauciones": ["Riesgo de sangrado con anticoagulantes"],
        "mecanismo": "Ginkgo mejora flujo, antocianinas del mirtilo estimulan rodopsina; ambos antioxidantes retinianos.",
        "categorias": ["fitoterapia", "fitoterapia"],
        "sistemas": ["ocular"]
    },

    # ===== URINARIO =====
    {
        "id": "sin_goldenrod_arandano_rojo",
        "ingredienteA": "goldenrod",
        "ingredienteB": "arandano_rojo",
        "tipo": "sinergia",
        "nivelEvidencia": "B",
        "descripcion": "Diuretico + antiadherente bacteriano; combinacion clasica para cistitis recurrente.",
        "beneficios": ["Lavado mecanico de vias urinarias", "Previene adherencia de E. coli", "Sinergia profilactica"],
        "precauciones": ["Insuficiencia renal: precaucion"],
        "mecanismo": "Solidago aumenta diuresis (lavado) y proantocianidinas del arandano inhiben fimbrias P de E. coli.",
        "categorias": ["fitoterapia", "fitoterapia"],
        "sistemas": ["urinario"]
    },
    {
        "id": "sin_quercetina_arandano_rojo",
        "ingredienteA": "quercetina_urinario",
        "ingredienteB": "arandano_rojo",
        "tipo": "complementario",
        "nivelEvidencia": "B",
        "descripcion": "Antiinflamatorio + antiadherente; util en cistitis intersticial y recurrente.",
        "beneficios": ["Reduce inflamacion urinaria cronica", "Potencia efecto profilactico del arandano"],
        "precauciones": ["Quercetina reduce absorcion de fluoroquinolonas (separar 2h)"],
        "mecanismo": "Quercetina inhibe inflamacion (COX-2, mastocitos) y arandano bloquea adherencia bacteriana.",
        "categorias": ["vitamina", "fitoterapia"],
        "sistemas": ["urinario"]
    },
    {
        "id": "sin_goldenrod_diente_leon",
        "ingredienteA": "goldenrod",
        "ingredienteB": "diente_leon_raiz",
        "tipo": "sinergia",
        "nivelEvidencia": "C",
        "descripcion": "Diureticos sinergicos (Solidago + Taraxacum) sin deplecion de potasio.",
        "beneficios": ["Diuresis equilibrada", "Aporta potasio (diente de leon)", "Soporte hepatico concomitante"],
        "precauciones": ["Insuficiencia cardiaca/renal: evitar"],
        "mecanismo": "Solidago estimula diuresis osmotica; diente de leon es diuretico potasico que repone K+.",
        "categorias": ["fitoterapia", "fitoterapia"],
        "sistemas": ["urinario"]
    },
    {
        "id": "sin_diente_leon_picrorrhiza",
        "ingredienteA": "diente_leon_raiz",
        "ingredienteB": "picrorrhiza",
        "tipo": "sinergia",
        "nivelEvidencia": "B",
        "descripcion": "Doble hepatoprotector: coleretico (diente de leon) + regenerante (picrorrhiza).",
        "beneficios": ["Estimulacion biliar + regeneracion hepatocelular", "Util en higado graso/NAFLD"],
        "precauciones": ["Obstruccion biliar: evitar"],
        "mecanismo": "Diente de leon estimula flujo biliar; picrorrhiza (picrosidos) estimula regeneracion y es antioxidante.",
        "categorias": ["fitoterapia", "fitoterapia"],
        "sistemas": ["hepatico"]
    },

    # ===== REPRODUCTIVO =====
    {
        "id": "sin_maca_negra_maca",
        "ingredienteA": "maca_negra",
        "ingredienteB": "maca",
        "tipo": "complementario",
        "nivelEvidencia": "B",
        "descripcion": "Variedad negra + amarilla: cobertura fertilidad + energia.",
        "beneficios": ["Fertilidad masculina (negra) + energia/estado animico (amarilla)"],
        "precauciones": [],
        "mecanismo": "Diferentes perfiles de glucosinolatos; negra destaca en fertilidad, amarilla en energia.",
        "categorias": ["fitoterapia", "fitoterapia"],
        "sistemas": ["reproductivo"]
    },
    {
        "id": "sin_coq10_fertilidad_zinc",
        "ingredienteA": "coq10_fertilidad",
        "ingredienteB": "zinc",
        "tipo": "sinergia",
        "nivelEvidencia": "A",
        "descripcion": "CoQ10 (motilidad espermatica) + zinc (maduracion espermatica); clasico en fertilidad masculina.",
        "beneficios": ["Mejora motilidad y morfologia espermatica", "Proteccion antioxidante testicular"],
        "precauciones": ["Dosis altas de zinc >40mg/dia: disfuncion immune y cobre"],
        "mecanismo": "CoQ10 protege membrana mitocondrial del espermatozoide; zinc es cofactor de enzimas de maduracion y antioxidante testicular.",
        "categorias": ["vitamina", "mineral"],
        "sistemas": ["reproductivo"]
    },
    {
        "id": "sin_coq10_fertilidad_coq10",
        "ingredienteA": "coq10_fertilidad",
        "ingredienteB": "coq10",
        "tipo": "complemento",
        "nivelEvidencia": "A",
        "descripcion": "Mismo compuesto, presentacion fertilidad vs cardiologica.",
        "beneficios": ["Doble enfoque: fertilidad + cardioproteccion"],
        "precauciones": ["Evitar duplicar dosis total >200mg/dia sin supervision"],
        "mecanismo": "Mismo compuesto (ubiquinona/ubiquinol); presentacion optimizada segun objetivo.",
        "categorias": ["vitamina", "vitamina"],
        "sistemas": ["reproductivo"]
    },

    # ===== HEPATICO =====
    {
        "id": "sin_picrorrhiza_cardo_mariano",
        "ingredienteA": "picrorrhiza",
        "ingredienteB": "cardo_mariano",
        "tipo": "sinergia",
        "nivelEvidencia": "B",
        "descripcion": "Doble hepatoprotector: regenerante (picrorrhiza) + silimarina antioxidante (cardo mariano).",
        "beneficios": ["Proteccion hepatocelular sinergica", "Util en NAFLD, hepatitis cronica"],
        "precauciones": ["Picrorrhiza reduce absorcion de hierro"],
        "mecanismo": "Silimarina estabiliza membrana hepatocitaria; picrosidos de picrorrhiza estimulan regeneracion y son inmunomoduladores.",
        "categorias": ["fitoterapia", "fitoterapia"],
        "sistemas": ["hepatico"]
    },
    {
        "id": "sin_nac_hepatico_picrorrhiza",
        "ingredienteA": "n_acetilcisteina_hepatico",
        "ingredienteB": "picrorrhiza",
        "tipo": "sinergia",
        "nivelEvidencia": "B",
        "descripcion": "NAC (glutation) + picrorrhiza (regeneracion); potente hepatoproteccion.",
        "beneficios": ["Doble via antioxidante y regenerativa", "Util en hepatotoxicidad y NAFLD"],
        "precauciones": ["NAC: nauseas comunes"],
        "mecanismo": "NAC repone glutation (GSH) y picrorrhiza estimula regeneracion via picrosidos; sinergia antioxidante + regenerativa.",
        "categorias": ["aminoacido", "fitoterapia"],
        "sistemas": ["hepatico"]
    },
    {
        "id": "sin_nac_hepatico_nac",
        "ingredienteA": "n_acetilcisteina_hepatico",
        "ingredienteB": "nac",
        "tipo": "complemento",
        "nivelEvidencia": "A",
        "descripcion": "Mismo compuesto (NAC), presentacion con enfoque hepatologico vs general.",
        "beneficios": ["Unificar dosis en hepatoproteccion y mucolitico"],
        "precauciones": ["No duplicar dosis"],
        "mecanismo": "Mismo principio activo; NAC es donador de cisteina para glutation.",
        "categorias": ["aminoacido", "aminoacido"],
        "sistemas": ["hepatico"]
    },
    {
        "id": "sin_regaliz_dgl_boldo",
        "ingredienteA": "regaliz_dgl",
        "ingredienteB": "boldo",
        "tipo": "complementario",
        "nivelEvidencia": "C",
        "descripcion": "Protector gastrico (DGL) + coleretico (boldo); util en dispepsia biliar.",
        "beneficios": ["Protege mucosa + estimula flujo biliar"],
        "precauciones": ["Obstruccion biliar: evitar boldo"],
        "mecanismo": "DGL estimula mucina gastrica; boldina de boldo es coleretica y hepatoprotectora.",
        "categorias": ["fitoterapia", "fitoterapia"],
        "sistemas": ["hepatico"]
    },

    # ===== ENDOCRINO =====
    {
        "id": "sin_selenio_tiroideo_kelp_yodo",
        "ingredienteA": "selenio_tiroideo",
        "ingredienteB": "kelp_yodo",
        "tipo": "sinergia",
        "nivelEvidencia": "A",
        "descripcion": "Yodo (sustrato T3/T4) + selenio (cofactor desyodinasas); sinergia tiroidea clasica.",
        "beneficios": ["Soporte completo de hormona tiroidea", "Mejora conversion T4->T3"],
        "precauciones": ["Evitar en hipertiroidismo/Graves", "No exceder yodo (selenosis si >400mcg)"],
        "mecanismo": "Yodo es sustrato para sintesis de T3/T4; selenio es cofactor de desyodinasas que convierten T4->T3 y de GPx (antioxidante tiroideo).",
        "categorias": ["mineral", "fitoterapia"],
        "sistemas": ["endocrino"]
    },
    {
        "id": "sin_guggul_gymnema",
        "ingredienteA": "guggul",
        "ingredienteB": "gymnema_sylvestre",
        "tipo": "sinergia",
        "nivelEvidencia": "B",
        "descripcion": "Guggul (lipidos/tiroides) + gymnema (glucosa); doble metabolico.",
        "beneficios": ["Mejora perfil lipidemico + glucemico", "Util en sindrome metabolico"],
        "precauciones": ["Riesgo de hipoglucemia con antidiabeticos", "Guggul: interfiere con levotiroxina"],
        "mecanismo": "Guggul estimula tiroides y reduce colesterol; gymnema mejora sensibilidad a insulina y reduce absorcion de glucosa.",
        "categorias": ["fitoterapia", "fitoterapia"],
        "sistemas": ["endocrino"]
    },
    {
        "id": "sin_gymnema_cromo_v2",
        "ingredienteA": "gymnema_sylvestre",
        "ingredienteB": "cromo",
        "tipo": "complementario",
        "nivelEvidencia": "B",
        "descripcion": "Gymnema (insulina) + cromo (sensibilidad a insulina); doble glucemico.",
        "beneficios": ["Mejora glucemia basal y postprandial"],
        "precauciones": ["Riesgo de hipoglucemia con farmacos"],
        "mecanismo": "Gymnema estimula celulas beta y cromo es cofactor de la accion de insulina; sinergia metabolica.",
        "categorias": ["fitoterapia", "mineral"],
        "sistemas": ["endocrino"]
    },
    {
        "id": "sin_kelp_yodo_selenio",
        "ingredienteA": "kelp_yodo",
        "ingredienteB": "selenio",
        "tipo": "complemento",
        "nivelEvidencia": "A",
        "descripcion": "Equivalente al selenio_tiroideo: yodo + selenio como cofactor tiroideo.",
        "beneficios": ["Soporte tiroideo completo"],
        "precauciones": ["Hipertiroidismo: evitar"],
        "mecanismo": "Yodo + selenio cofactor desyodinasa; mismos ingredientes presentados por separado.",
        "categorias": ["fitoterapia", "mineral"],
        "sistemas": ["endocrino"]
    },

    # ===== MUSCULOESQUELETICO / CARDIO =====
    {
        "id": "sin_vitamina_k2_mk7_vitamina_d3",
        "ingredienteA": "vitamina_k2_mk7",
        "ingredienteB": "vitamina_d3",
        "tipo": "sinergia",
        "nivelEvidencia": "A",
        "descripcion": "K2 (MK-7) + D3: dirigen calcio a hueso y fuera de arterias; sinergia osea clasica.",
        "beneficios": ["Mejora densidad osea", "Reduce calcificacion vascular", "Sinergia con calcio"],
        "precauciones": ["K2 interfiere con anticoagulantes cumarinicos"],
        "mecanismo": "D3 favorece absorcion de calcio; K2 activa osteocalcina (hueso) y MGP (inhibe calcificacion arterial); sinergia calcio-dirigida.",
        "categorias": ["vitamina", "vitamina"],
        "sistemas": ["musculoesqueletico"]
    },
    {
        "id": "sin_vitamina_k2_mk7_ipriflavona",
        "ingredienteA": "vitamina_k2_mk7",
        "ingredienteB": "ipriflavona",
        "tipo": "complementario",
        "nivelEvidencia": "B",
        "descripcion": "K2 (activa osteocalcina) + ipriflavona (inhibe resorcion); doble hueso.",
        "beneficios": ["Estimula formacion + inhibe resorcion osea"],
        "precauciones": ["Ipriflavona: reduccion linfocitaria con uso prolongado"],
        "mecanismo": "K2 carboxila osteocalcina (fija calcio al hueso); ipriflavona inhibe osteoclastogenesis.",
        "categorias": ["vitamina", "vitamina"],
        "sistemas": ["musculoesqueletico"]
    },
    {
        "id": "sin_ipriflavona_calcio_microcristalino",
        "ingredienteA": "ipriflavona",
        "ingredienteB": "calcio_microcristalino",
        "tipo": "complementario",
        "nivelEvidencia": "B",
        "descripcion": "Ipriflavona (anti-resortivo) + calcio (sustrato); clasico en osteoporosis postmenopausica.",
        "beneficios": ["Inhibe perdida osea + aporta sustrato"],
        "precauciones": ["Ipriflavona + teofilina: reduce clearance"],
        "mecanismo": "Ipriflavona inhibe osteoclastos y calcio aporta sustrato mineral; sinergia con vitamina D3.",
        "categorias": ["vitamina", "mineral"],
        "sistemas": ["musculoesqueletico"]
    },
]

# Validar ingredientes y sinergia IDs
for s in new_sinergias:
    if s['ingredienteA'] not in existing_ids:
        raise ValueError(f"IngredienteA no existe: {s['ingredienteA']} (en {s['id']})")
    if s['ingredienteB'] not in existing_ids:
        raise ValueError(f"IngredienteB no existe: {s['ingredienteB']} (en {s['id']})")
    if s['id'] in sin_ids:
        raise ValueError(f"ID de sinergia duplicado: {s['id']}")
    sin_ids.add(s['id'])

sin_data['sinergias'].extend(new_sinergias)
sin_data['metadata']['total'] = len(sin_data['sinergias'])
sin_data['metadata']['ultimaActualizacion'] = '2026-08-10'
json.dump(sin_data, open(DATA_DIR / 'sinergias.json', 'w'), indent=2, ensure_ascii=False)

print(f"Sinergias: +{len(new_sinergias)} (total: {len(sin_data['sinergias'])})")
