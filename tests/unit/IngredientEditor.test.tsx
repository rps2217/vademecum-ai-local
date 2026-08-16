import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { IngredientEditor } from '@/components/admin/IngredientEditor';
import type { DbIngredient } from '@/db/schema';

function makeIngredient(overrides: Partial<DbIngredient> = {}): DbIngredient {
  return {
    id: 'ing-test',
    nombre: 'Valeriana',
    sinonimos: ['Hierba de los gatos'],
    categoria: 'fitoterapia',
    familia: 'Valerianaceae',
    sistemas: ['nervioso'],
    indicaciones: ['insomnio', 'ansiedad'],
    evidencia: 'B',
    propiedades: ['Sedante', 'Relajante muscular'],
    interacciones: ['Benzodiacepinas'],
    seguridad: { embarazo: 'evitar', lactancia: 'evitar', pediatria: 'contraindicado' },
    fuentes: [],
    lamport: 5,
    deviceId: 'dev-1',
    updatedAt: 100,
    createdAt: 100,
    tombstone: 0,
    ...overrides,
  };
}

describe('IngredientEditor', () => {
  it('renderiza campos vacíos en modo creación (sin ingredient)', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByLabelText } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    expect((getByPlaceholderText('Ej: Valeriana') as HTMLInputElement).value).toBe('');
    expect((getByLabelText('Categoría') as HTMLSelectElement).value).toBe('fitoterapia');
  });

  it('precarga los datos del ingrediente en modo edición', () => {
    const onSave = vi.fn();
    const ing = makeIngredient();
    const { getByPlaceholderText, getByLabelText } = render(
      <IngredientEditor ingredient={ing} onSave={onSave} onCancel={() => {}} />,
    );
    expect((getByPlaceholderText('Ej: Valeriana') as HTMLInputElement).value).toBe('Valeriana');
    expect((getByPlaceholderText('Ej: Valerianaceae') as HTMLInputElement).value).toBe('Valerianaceae');
    expect((getByLabelText('Categoría') as HTMLSelectElement).value).toBe('fitoterapia');
  });

  it('no llama onSave si el nombre está vacío (validación)', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByRole, getByText } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(getByText(/nombre es requerido/i)).toBeTruthy();
  });

  it('llama onSave con el DbIngredient correcto al crear', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.change(getByPlaceholderText('Ej: Valeriana'), { target: { value: 'Pasiflora' } });
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0] as DbIngredient;
    expect(saved.nombre).toBe('Pasiflora');
    expect(saved.id).toBeTruthy();
    expect(saved.lamport).toBe(1);
    expect(saved.tombstone).toBe(0);
    expect(saved.sinonimos).toEqual([]);
    expect(saved.fuentes).toEqual([]);
  });

  it('incrementa lamport al editar un ingrediente existente', () => {
    const onSave = vi.fn();
    const ing = makeIngredient({ lamport: 10 });
    const { getByRole } = render(
      <IngredientEditor ingredient={ing} onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.click(getByRole('button', { name: /Guardar Cambios/i }));
    const saved = onSave.mock.calls[0][0] as DbIngredient;
    expect(saved.id).toBe('ing-test');
    expect(saved.lamport).toBe(11);
    expect(saved.createdAt).toBe(100);
  });

  it('parsea sinónimos separados por comas (trim + filter vacíos)', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.change(getByPlaceholderText('Ej: Valeriana'), { target: { value: 'Manzanilla' } });
    fireEvent.change(getByPlaceholderText('Ej: Valeriana officinalis, Hierba de los gatos'), {
      target: { value: '  Matricaria , , Manzanilla común  ' },
    });
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    const saved = onSave.mock.calls[0][0] as DbIngredient;
    expect(saved.sinonimos).toEqual(['Matricaria', 'Manzanilla común']);
  });

  it('parsea indicaciones separadas por comas', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.change(getByPlaceholderText('Ej: Valeriana'), { target: { value: 'Jengibre' } });
    fireEvent.change(getByPlaceholderText('Ej: Insomnio, Ansiedad, Estrés'), {
      target: { value: 'Náusea, Digestión, , ' },
    });
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    const saved = onSave.mock.calls[0][0] as DbIngredient;
    expect(saved.indicaciones).toEqual(['Náusea', 'Digestión']);
  });

  it('parsea propiedades separadas por newlines', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByLabelText, getByRole } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.change(getByPlaceholderText('Ej: Valeriana'), { target: { value: 'Romero' } });
    fireEvent.change(getByLabelText('Propiedades'), {
      target: { value: 'Antioxidante\nCirculación\n\nMemoria' },
    });
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    const saved = onSave.mock.calls[0][0] as DbIngredient;
    expect(saved.propiedades).toEqual(['Antioxidante', 'Circulación', 'Memoria']);
  });

  it('togglea sistemas corporales al click', () => {
    const onSave = vi.fn();
    const { getByText, getByRole } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    const digestivoBtn = getByRole('button', { name: /Sistema Digestivo/i });
    expect(digestivoBtn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(digestivoBtn);
    expect(digestivoBtn.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(digestivoBtn);
    expect(digestivoBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('persiste los sistemas seleccionados en onSave', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.change(getByPlaceholderText('Ej: Valeriana'), { target: { value: 'Test' } });
    fireEvent.click(getByRole('button', { name: /Sistema Inmunitario/i }));
    fireEvent.click(getByRole('button', { name: /Sistema Respiratorio/i }));
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    const saved = onSave.mock.calls[0][0] as DbIngredient;
    expect(saved.sistemas).toEqual(['inmune', 'respiratorio']);
  });

  it('guarda los campos de seguridad (embarazo, lactancia, pediatria)', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByLabelText, getByRole } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.change(getByPlaceholderText('Ej: Valeriana'), { target: { value: 'Milho' } });
    fireEvent.change(getByLabelText('Seguridad en embarazo'), { target: { value: 'contraindicado' } });
    fireEvent.change(getByLabelText('Seguridad en lactancia'), { target: { value: 'apto' } });
    fireEvent.change(getByLabelText('Seguridad en pediatría'), { target: { value: 'evitar' } });
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    const saved = onSave.mock.calls[0][0] as DbIngredient;
    expect(saved.seguridad).toEqual({ embarazo: 'contraindicado', lactancia: 'apto', pediatria: 'evitar' });
  });

  it('llama onCancel al cerrar el editor', () => {
    const onCancel = vi.fn();
    const { getByLabelText } = render(
      <IngredientEditor onSave={() => {}} onCancel={onCancel} />,
    );
    fireEvent.click(getByLabelText('Cerrar editor'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('precarga los sistemas del ingrediente existente', () => {
    const ing = makeIngredient({ sistemas: ['nervioso', 'digestivo'] });
    const { getByRole } = render(
      <IngredientEditor ingredient={ing} onSave={() => {}} onCancel={() => {}} />,
    );
    expect(getByRole('button', { name: /Sistema Nervioso/i }).getAttribute('aria-pressed')).toBe('true');
    expect(getByRole('button', { name: /Sistema Digestivo/i }).getAttribute('aria-pressed')).toBe('true');
    expect(getByRole('button', { name: /Sistema Inmunitario/i }).getAttribute('aria-pressed')).toBe('false');
  });

  it('precarga los campos de seguridad del ingrediente existente', () => {
    const ing = makeIngredient({ seguridad: { embarazo: 'evitar', lactancia: 'contraindicado', pediatria: 'apto' } });
    const { getByLabelText } = render(
      <IngredientEditor ingredient={ing} onSave={() => {}} onCancel={() => {}} />,
    );
    expect((getByLabelText('Seguridad en embarazo') as HTMLSelectElement).value).toBe('evitar');
    expect((getByLabelText('Seguridad en lactancia') as HTMLSelectElement).value).toBe('contraindicado');
    expect((getByLabelText('Seguridad en pediatría') as HTMLSelectElement).value).toBe('apto');
  });

  it('precarga los sinónimos e indicaciones como string separado por comas', () => {
    const ing = makeIngredient({ sinonimos: ['A', 'B'], indicaciones: ['X', 'Y'] });
    const { getByPlaceholderText } = render(
      <IngredientEditor ingredient={ing} onSave={() => {}} onCancel={() => {}} />,
    );
    expect((getByPlaceholderText('Ej: Valeriana officinalis, Hierba de los gatos') as HTMLInputElement).value).toBe('A, B');
    expect((getByPlaceholderText('Ej: Insomnio, Ansiedad, Estrés') as HTMLInputElement).value).toBe('X, Y');
  });

  it('resetea el error de nombre al escribir de nuevo', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByRole, queryByText } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    expect(queryByText(/nombre es requerido/i)).toBeTruthy();
    fireEvent.change(getByPlaceholderText('Ej: Valeriana'), { target: { value: 'X' } });
    expect(queryByText(/nombre es requerido/i)).toBeNull();
  });

  it('guarda familia vacía como undefined (no string vacío)', () => {
    const onSave = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <IngredientEditor onSave={onSave} onCancel={() => {}} />,
    );
    fireEvent.change(getByPlaceholderText('Ej: Valeriana'), { target: { value: 'Test' } });
    fireEvent.click(getByRole('button', { name: /Crear Ingrediente/i }));
    const saved = onSave.mock.calls[0][0] as DbIngredient;
    expect(saved.familia).toBeUndefined();
  });
});
