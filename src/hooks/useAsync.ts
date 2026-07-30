/**
 * useAsync - Hook para operaciones asíncronas
 * 
 * Maneja estados de loading, success y error.
 */

import { useState, useCallback } from 'react';

export type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });

  const execute = useCallback(async (promise: Promise<T>) => {
    setState({ status: 'loading' });
    try {
      const data = await promise;
      setState({ status: 'success', data });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setState({ status: 'error', error });
      throw error;
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { ...state, execute, reset };
}
