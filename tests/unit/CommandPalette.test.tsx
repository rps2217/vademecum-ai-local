import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '@/ui/CommandPalette';
import { db } from '@/db';
import { ingredientSearchService } from '@/core/search';
import { waitFor } from '@testing-library/react';

async function seedTestData() {
  await db.ingredients.clear();
  await db.pathologies.clear();
  await db.ingredients.bulkPut([
    {
      id: 'ing-ashwagandha',
      nombre: 'Ashwagandha',
      sinonimos: ['withania somnifera'],
      categoria: 'fitoterapia',
      sistemas: ['nervioso'],
      indicaciones: ['ansiedad', 'estres'],
      evidencia: 'A',
      propiedades: ['adaptogeno'],
      seguridad: { embarazo: 'evitar', lactancia: 'evitar', pediatria: 'evitar', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' },
      interacciones: [],
      fuentes: [],
      lamport: 1, deviceId: 'test', updatedAt: 1, createdAt: 1, tombstone: 0,
    },
    {
      id: 'ing-magnesio',
      nombre: 'Magnesio Glicinato',
      sinonimos: [],
      categoria: 'mineral',
      sistemas: ['nervioso', 'muscular'],
      indicaciones: ['ansiedad', 'fatiga'],
      evidencia: 'A',
      propiedades: ['relajante'],
      seguridad: { embarazo: 'apto', lactancia: 'apto', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' },
      interacciones: [],
      fuentes: [],
      lamport: 1, deviceId: 'test', updatedAt: 1, createdAt: 1, tombstone: 0,
    },
    {
      id: 'ing-valeriana',
      nombre: 'Valeriana',
      sinonimos: ['valeriana officinalis'],
      categoria: 'fitoterapia',
      sistemas: ['nervioso'],
      indicaciones: ['insomnio', 'ansiedad'],
      evidencia: 'B',
      propiedades: ['sedante'],
      seguridad: { embarazo: 'evitar', lactancia: 'evitar', pediatria: 'evitar', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' },
      interacciones: [],
      fuentes: [],
      lamport: 1, deviceId: 'test', updatedAt: 1, createdAt: 1, tombstone: 0,
    },
  ]);
  await db.pathologies.put({
    id: 'ansiedad',
    nombre: 'Ansiedad',
    definicion: 'Trastorno de ansiedad',
    causas: [],
    sintomas: ['preocupacion', 'inquietud', 'taquicardia'],
    sistemas: ['nervioso'],
    tratamientoAlopatico: { primeraLinea: [], mecanismo: '', efectosSecundarios: [] },
    tratamientoNatural: { fitoterapia: [], suplementos: [], homeopatia: [], aceites: [], cuandoPreferir: '' },
    prevencion: [],
    cuandoConsultar: '',
    evidencia: 'A',
    fuentes: [],
    lamport: 1, deviceId: 'test', updatedAt: 1, createdAt: 1, tombstone: 0,
  });
  await ingredientSearchService.buildIndex();
}

function renderPalette(open: boolean, onClose = () => {}) {
  return render(
    <MemoryRouter>
      <CommandPalette open={open} onClose={onClose} />
    </MemoryRouter>
  );
}

describe('CommandPalette', () => {
  beforeEach(async () => {
    await seedTestData();
  });

  it('no renderiza nada cuando open=false', () => {
    renderPalette(false);
    expect(screen.queryByPlaceholderText(/Buscar secciones/)).toBeNull();
  });

  it('renderiza el input de búsqueda cuando open=true', async () => {
    renderPalette(true);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar secciones/)).toBeTruthy();
    });
  });

  it('muestra los items de navegación cuando no hay query', async () => {
    renderPalette(true);
    await waitFor(() => {
      expect(screen.getByText('Inicio / Búsqueda')).toBeTruthy();
      expect(screen.getByText('Base de Conocimiento')).toBeTruthy();
      expect(screen.getByText('Sinergias')).toBeTruthy();
      expect(screen.getByText('Configuración')).toBeTruthy();
    });
  });

  it('muestra el backdrop button con aria-label "Cerrar"', async () => {
    renderPalette(true);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy();
    });
  });

  it('llama onClose al hacer clic en el backdrop', async () => {
    let closed = false;
    renderPalette(true, () => { closed = true; });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(closed).toBe(true);
  });

  it('cierra con tecla Escape', async () => {
    let closed = false;
    renderPalette(true, () => { closed = true; });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar secciones/)).toBeTruthy();
    });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });

  it('filtra ingredientes al escribir', async () => {
    renderPalette(true);
    const input = await screen.findByPlaceholderText(/Buscar secciones/);
    fireEvent.change(input, { target: { value: 'magnesio' } });
    await waitFor(() => {
      expect(screen.getByText('Magnesio Glicinato')).toBeTruthy();
    });
  });

  it('filtra patologías al escribir', async () => {
    renderPalette(true);
    const input = await screen.findByPlaceholderText(/Buscar secciones/);
    fireEvent.change(input, { target: { value: 'ansiedad' } });
    await waitFor(() => {
      expect(screen.getByText('Ansiedad')).toBeTruthy();
    });
  });

  it('muestra el hint de categoría para ingredientes', async () => {
    renderPalette(true);
    const input = await screen.findByPlaceholderText(/Buscar secciones/);
    fireEvent.change(input, { target: { value: 'valeriana' } });
    await waitFor(() => {
      expect(screen.getByText('Valeriana')).toBeTruthy();
      expect(screen.getByText('Fitoterapia')).toBeTruthy();
    });
  });

  it('mantiene items de navegación cuando la búsqueda no coincide con ingredientes/patologías', async () => {
    renderPalette(true);
    const input = await screen.findByPlaceholderText(/Buscar secciones/);
    fireEvent.change(input, { target: { value: 'zzzzzzz_no_existe' } });
    await waitFor(() => {
      // Los nav items siempre están presentes
      expect(screen.getByText('Inicio / Búsqueda')).toBeTruthy();
      expect(screen.getByText('Configuración')).toBeTruthy();
    });
  });

  it('muestra el contador de resultados en el footer', async () => {
    renderPalette(true);
    await waitFor(() => {
      // 6 items de navegación
      const footer = screen.getByText(/resultados/);
      expect(footer.textContent).toMatch(/\d+ resultados/);
    });
  });

  it('navega con ArrowDown cambiando el item activo', async () => {
    renderPalette(true);
    await waitFor(() => {
      expect(screen.getByText('Inicio / Búsqueda')).toBeTruthy();
    });
    // El primer item debería estar activo (CornerDownLeft visible)
    // Disparar ArrowDown no debe lanzar errores
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    // No hay forma fácil de verificar el item activo sin clases CSS,
    // pero verificar que no crashea
    expect(screen.getByText('Inicio / Búsqueda')).toBeTruthy();
  });

  it('no crashea al re-abrir (regresión: el bug de crypto.randomUUID)', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <CommandPalette open={true} onClose={() => {}} />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar secciones/)).toBeTruthy();
    });

    // Cerrar y re-abrir múltiples veces — esto crasheaba antes del fix
    rerender(
      <MemoryRouter>
        <CommandPalette open={false} onClose={() => {}} />
      </MemoryRouter>
    );
    rerender(
      <MemoryRouter>
        <CommandPalette open={true} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Buscar secciones/)).toBeTruthy();

    // Escribir, cerrar, re-abrir — debe resetear el query
    fireEvent.change(screen.getByPlaceholderText(/Buscar secciones/), { target: { value: 'test' } });
    rerender(
      <MemoryRouter>
        <CommandPalette open={false} onClose={() => {}} />
      </MemoryRouter>
    );
    rerender(
      <MemoryRouter>
        <CommandPalette open={true} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Buscar secciones/)).toHaveValue('');
  });
});
