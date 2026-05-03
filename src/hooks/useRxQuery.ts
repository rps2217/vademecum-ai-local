import { useEffect, useState } from 'react';
import { RxQuery } from 'rxdb';

export function useRxQuery<T>(query: RxQuery<any, T | T[], any> | undefined) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!query) return;

        setLoading(true);
        const subscription = query.$.subscribe({
            next: (results) => {
                if (Array.isArray(results)) {
                    setData(results);
                } else if (results) {
                    setData([results as T]);
                } else {
                    setData([]);
                }
                setLoading(false);
            },
            error: (err) => {
                setError(err);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [query]);

    return { data, loading, error };
}

