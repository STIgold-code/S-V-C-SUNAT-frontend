'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface ComprobantesFilters {
  search: string;
  empresaId: string;
  periodoDesde: string;
  periodoHasta: string;
  tipo: string;
  direccion: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

const DEFAULT_FILTERS: ComprobantesFilters = {
  search: '',
  empresaId: '__all__',
  periodoDesde: '',
  periodoHasta: '',
  tipo: '__all__',
  direccion: '__all__',
  sortBy: 'fecha',
  sortOrder: 'desc',
  page: 1,
  limit: 50,
};

export function useComprobantesFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: ComprobantesFilters = useMemo(() => ({
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
    empresaId: searchParams.get('empresa') || DEFAULT_FILTERS.empresaId,
    periodoDesde: searchParams.get('desde') || DEFAULT_FILTERS.periodoDesde,
    periodoHasta: searchParams.get('hasta') || DEFAULT_FILTERS.periodoHasta,
    tipo: searchParams.get('tipo') || DEFAULT_FILTERS.tipo,
    direccion: searchParams.get('direccion') || DEFAULT_FILTERS.direccion,
    sortBy: searchParams.get('sort') || DEFAULT_FILTERS.sortBy,
    sortOrder: (searchParams.get('order') as 'asc' | 'desc') || DEFAULT_FILTERS.sortOrder,
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '50', 10),
  }), [searchParams]);

  const setFilters = useCallback((newFilters: Partial<ComprobantesFilters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      const paramKey = key === 'empresaId' ? 'empresa'
        : key === 'periodoDesde' ? 'desde'
        : key === 'periodoHasta' ? 'hasta'
        : key === 'sortBy' ? 'sort'
        : key === 'sortOrder' ? 'order'
        : key;

      if (value && value !== DEFAULT_FILTERS[key as keyof ComprobantesFilters]) {
        params.set(paramKey, String(value));
      } else {
        params.delete(paramKey);
      }
    });

    // Reset page when filters change (except for page itself)
    if (!('page' in newFilters)) {
      params.delete('page');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') return false;
      return value && value !== DEFAULT_FILTERS[key as keyof ComprobantesFilters];
    }).length;
  }, [filters]);

  return {
    filters,
    setFilters,
    clearFilters,
    activeFiltersCount,
  };
}
