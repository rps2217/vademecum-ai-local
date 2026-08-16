#!/usr/bin/env python3
"""
Consolida 15 pares de ingredientes duplicados en la KB.

Para cada par (canonico, eliminado):
  - Mergea los datos del eliminado en el canonico (union de sistemas,
    indicaciones, sinonimos, propiedades, interacciones, fuentes).
  - Anade el ID eliminado como sinonimo del canonico.
  - Re-referencia todas las sinergias que apuntaban al ID eliminado.
  - Elimina sinergias que quedan duplicadas tras la consolidacion.

Idempotente: si se ejecuta de nuevo, no hace nada (los duplicados ya no existen).
"""

import json
import os
import re
import unicodedata
from copy import deepcopy

KB_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'db', 'seeders', 'data')

# (eliminado, canonico) — el eliminado se mergea en el canonico
CONSOLIDACION = {
    'diente_de_leon': 'diente_leon',
    'olivo_hoja': 'olivo',
    'cola_de_caballo': 'cola_caballo',
    'vara_de_oro': 'solidago',
    'marrubium': 'marrubio',
    'picrorhiza': 'picrorrhiza',
    'guggul': 'guggulu',
    'damiana_hoja': 'damiana',
    'ylang_ylang': 'ilang_ilang',
    'clavo_aceite': 'clavo',
    'l_triptofano': 'triptofano',
    'pqq_pyrroloquinoline': 'pqq',
    'nmn_nicotinamide': 'nmn',
    'lactobacillus_acidophilus': 'l_acidophilus',
    'bifidobacterium_longum': 'b_longum',
}


def load_kb():
    """Carga todos los JSON de la KB y devuelve {archivo: data}."""
    files = {
        'fitoterapia': 'fitoterapia.json',
        'homeopatia': 'homeopatia.json',
        'aceites': 'aceites.json',
        'vitaminas_minerales': 'vitaminas_minerales.json',
    }
    data = {}
    for key, fname in files.items():
        path = os.path.join(KB_DIR, fname)
        data[key] = json.load(open(path, 'r', encoding='utf-8'))
    return data


def load_sinergias():
    path = os.path.join(KB_DIR, 'sinergias.json')
    return json.load(open(path, 'r', encoding='utf-8'))


def find_ingredient_file(data, ing_id):
    """Encuentra en que archivo esta un ingrediente por ID."""
    for key, d in data.items():
        for ing in d['ingredientes']:
            if ing['id'] == ing_id:
                return key
    return None


def merge_unique(list1, list2):
    """Union de dos listas sin duplicados (preservando orden)."""
    result = list(list1)
    for item in list2:
        if item not in result:
            result.append(item)
    return result


def consolidate():
    data = load_kb()
    sinergias_data = load_sinergias()
    sinergias = sinergias_data['sinergias']

    # Verificar que todos los IDs existen
    all_ids = set()
    for d in data.values():
        for ing in d['ingredientes']:
            all_ids.add(ing['id'])

    for elim, canon in CONSOLIDACION.items():
        if elim not in all_ids:
            print(f"  SKIP: {elim} ya no existe (consolidacion previa)")
            continue
        if canon not in all_ids:
            print(f"  ERROR: canonico {canon} no existe!")
            continue

    # --- Merge de ingredientes ---
    print("=== MERGE DE INGREDIENTES DUPLICADOS ===")
    merged_count = 0
    for elim, canon in CONSOLIDACION.items():
        if elim not in all_ids:
            continue

        # Encontrar ambos ingredientes
        canon_file = find_ingredient_file(data, canon)
        elim_file = find_ingredient_file(data, elim)
        canon_ing = None
        elim_ing = None
        for ing in data[canon_file]['ingredientes']:
            if ing['id'] == canon:
                canon_ing = ing
                break
        for ing in data[elim_file]['ingredientes']:
            if ing['id'] == elim:
                elim_ing = ing
                break

        if not canon_ing or not elim_ing:
            print(f"  ERROR: no se encontraron {canon} o {elim}")
            continue

        # Merge: union de campos
        canon_ing['sistemas'] = merge_unique(
            canon_ing.get('sistemas', []),
            elim_ing.get('sistemas', [])
        )
        canon_ing['indicaciones'] = merge_unique(
            canon_ing.get('indicaciones', []),
            elim_ing.get('indicaciones', [])
        )
        canon_ing['propiedades'] = merge_unique(
            canon_ing.get('propiedades', []),
            elim_ing.get('propiedades', [])
        )
        canon_ing['interacciones'] = merge_unique(
            canon_ing.get('interacciones', []),
            elim_ing.get('interacciones', [])
        )
        canon_ing['fuentes'] = merge_unique(
            canon_ing.get('fuentes', []),
            elim_ing.get('fuentes', [])
        )
        # Anadir el ID eliminado como sinonimo
        canon_ing['sinonimos'] = merge_unique(
            canon_ing.get('sinonimos', []),
            elim_ing.get('sinonimos', []) + [elim]
        )

        # Familia: preferir la mas descriptiva (no "No aplica")
        if canon_ing.get('familia') in (None, '', 'No aplica') and elim_ing.get('familia') not in (None, '', 'No aplica'):
            canon_ing['familia'] = elim_ing['familia']

        # Eliminar el ingrediente duplicado
        data[elim_file]['ingredientes'] = [
            ing for ing in data[elim_file]['ingredientes'] if ing['id'] != elim
        ]

        print(f"  {elim} -> {canon}: mergeado ({len(canon_ing['indicaciones'])} indic, {len(canon_ing['sistemas'])} sist)")
        merged_count += 1

    print(f"\nTotal mergeado: {merged_count} ingredientes")

    # --- Re-referenciar sinergias ---
    print("\n=== RE-REFERENCIAR SINERGIAS ===")
    sinergias_actualizadas = 0
    for s in sinergias:
        changed = False
        if s['ingredienteA'] in CONSOLIDACION:
            s['ingredienteA'] = CONSOLIDACION[s['ingredienteA']]
            changed = True
        if s['ingredienteB'] in CONSOLIDACION:
            s['ingredienteB'] = CONSOLIDACION[s['ingredienteB']]
            changed = True
        if changed:
            sinergias_actualizadas += 1
    print(f"  {sinergias_actualizadas} sinergias re-referenciadas")

    # --- Eliminar sinergias duplicadas (mismo par A+B en cualquier orden) ---
    print("\n=== ELIMINAR SINERGIAS DUPLICADAS ===")
    seen_pairs = set()
    sinergias_unicas = []
    duplicadas_eliminadas = 0
    for s in sinergias:
        a, b = s['ingredienteA'], s['ingredienteB']
        pair = tuple(sorted([a, b]))
        if pair in seen_pairs:
            duplicadas_eliminadas += 1
            print(f"  ELIM: {s['id']} ({a} + {b}) — duplicada")
            continue
        seen_pairs.add(pair)
        sinergias_unicas.append(s)
    print(f"  {duplicadas_eliminadas} sinergias duplicadas eliminadas")

    # --- Eliminar sinergias auto-referenciadas (A == B tras consolidacion) ---
    auto_refs = [s for s in sinergias_unicas if s['ingredienteA'] == s['ingredienteB']]
    if auto_refs:
        print(f"\n=== ELIMINAR SINERGIAS AUTO-REFERENCIADAS ({len(auto_refs)}) ===")
        for s in auto_refs:
            print(f"  ELIM: {s['id']} ({s['ingredienteA']} + {s['ingredienteB']})")
        sinergias_unicas = [s for s in sinergias_unicas if s['ingredienteA'] != s['ingredienteB']]

    sinergias_data['sinergias'] = sinergias_unicas

    # --- Actualizar metadata ---
    print("\n=== ACTUALIZAR METADATA ===")
    total_ingredientes = sum(len(d['ingredientes']) for d in data.values())
    for key, d in data.items():
        if 'metadata' in d:
            old_total = d['metadata'].get('total', '?')
            d['metadata']['total'] = len(d['ingredientes'])
            print(f"  {key}: {old_total} -> {d['metadata']['total']}")
    if 'metadata' in sinergias_data:
        old_total = sinergias_data['metadata'].get('total', '?')
        sinergias_data['metadata']['total'] = len(sinergias_unicas)
        print(f"  sinergias: {old_total} -> {sinergias_data['metadata']['total']}")

    print(f"\nTotal ingredientes final: {total_ingredientes}")
    print(f"Total sinergias final: {len(sinergias_unicas)}")

    # --- Guardar ---
    print("\n=== GUARDAR JSON ===")
    for key, fname in [('fitoterapia', 'fitoterapia.json'), ('homeopatia', 'homeopatia.json'),
                       ('aceites', 'aceites.json'), ('vitaminas_minerales', 'vitaminas_minerales.json')]:
        path = os.path.join(KB_DIR, fname)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data[key], f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f"  {fname} guardado")

    path = os.path.join(KB_DIR, 'sinergias.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(sinergias_data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f"  sinergias.json guardado")

    print("\n✅ Consolidacion completada!")


if __name__ == '__main__':
    consolidate()
