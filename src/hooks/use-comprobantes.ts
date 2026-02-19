'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Comprobante, ComprobantesPageResponse } from '@/types';
import { useComprobantesFilters, ComprobantesFilters } from './use-comprobantes-filters';

// Stable empty array reference to prevent infinite re-renders
const EMPTY_COMPROBANTES: Comprobante[] = [];

interface UseComprobantesOptions {
  enabled?: boolean;
}

function buildQueryParams(filters: ComprobantesFilters): string {
  const params = new URLSearchParams();

  // Convert __all__ to empty (don't send to API)
  if (filters.empresaId && filters.empresaId !== '__all__') {
    params.append('empresa_id', filters.empresaId);
  }
  if (filters.periodoDesde) params.append('periodo', filters.periodoDesde);
  if (filters.tipo && filters.tipo !== '__all__') {
    params.append('tipo', filters.tipo);
  }
  if (filters.direccion && filters.direccion !== '__all__') {
    params.append('direccion', filters.direccion);
  }
  if (filters.search) params.append('search', filters.search);
  params.append('sort_by', filters.sortBy);
  params.append('sort_order', filters.sortOrder);
  params.append('skip', String((filters.page - 1) * filters.limit));
  params.append('limit', String(filters.limit));

  return params.toString();
}

export function useComprobantes(options: UseComprobantesOptions = {}) {
  const { filters, setFilters, clearFilters, activeFiltersCount } = useComprobantesFilters();

  const query = useQuery({
    queryKey: ['comprobantes', filters],
    queryFn: async () => {
      const token = localStorage.getItem('svc_sunat_token');
      const params = buildQueryParams(filters);
      return api.get<ComprobantesPageResponse>(`/comprobantes?${params}`, token || undefined);
    },
    enabled: options.enabled !== false,
  });

  const batchDownload = useMutation({
    mutationFn: async ({ ids, formato }: { ids: string[]; formato: 'xml' | 'pdf' | 'all' }) => {
      const token = localStorage.getItem('svc_sunat_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comprobantes/batch/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids, formato }),
      });

      if (!response.ok) throw new Error('Error al descargar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobantes_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });

  return {
    // Data
    comprobantes: query.data?.items ?? EMPTY_COMPROBANTES,
    total: query.data?.total || 0,

    // Loading states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Filters
    filters,
    setFilters,
    clearFilters,
    activeFiltersCount,

    // Pagination helpers
    totalPages: Math.ceil((query.data?.total || 0) / filters.limit),
    hasNextPage: filters.page < Math.ceil((query.data?.total || 0) / filters.limit),
    hasPrevPage: filters.page > 1,

    // Actions
    batchDownload: batchDownload.mutate,
    isBatchDownloading: batchDownload.isPending,

    // Refresh
    refetch: query.refetch,
  };
}
