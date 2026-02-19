'use client';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useComprobantesFilters } from '@/hooks/use-comprobantes-filters';
import type { Empresa } from '@/types';

const TIPOS_COMPROBANTE = [
  { value: '__all__', label: 'Todos los tipos' },
  { value: 'factura', label: 'Facturas' },
  { value: 'boleta', label: 'Boletas' },
  { value: 'nota_credito', label: 'Notas de Crédito' },
  { value: 'nota_debito', label: 'Notas de Débito' },
  { value: 'guia', label: 'Guías' },
  { value: 'retencion', label: 'Retenciones' },
];

const DIRECCIONES = [
  { value: '__all__', label: 'Todos' },
  { value: 'emitidas', label: 'Emitidos' },
  { value: 'recibidas', label: 'Recibidos' },
];

interface ComprobantesFiltersProps {
  empresas: Empresa[];
}

export function ComprobantesFilters({ empresas }: ComprobantesFiltersProps) {
  const { filters, setFilters, clearFilters } = useComprobantesFilters();

  const activeFilters = [
    filters.empresaId !== '__all__' && { key: 'empresaId', label: `Empresa: ${empresas.find(e => e.id === filters.empresaId)?.ruc || filters.empresaId}` },
    filters.periodoDesde && { key: 'periodoDesde', label: filters.periodoDesde },
    filters.tipo !== '__all__' && { key: 'tipo', label: TIPOS_COMPROBANTE.find(t => t.value === filters.tipo)?.label },
    filters.direccion !== '__all__' && { key: 'direccion', label: DIRECCIONES.find(d => d.value === filters.direccion)?.label },
  ].filter(Boolean) as { key: string; label: string }[];

  const selectClassName = "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por serie, número, RUC..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9 h-9"
          />
        </div>

        <select
          value={filters.empresaId}
          onChange={(e) => setFilters({ empresaId: e.target.value })}
          className={`${selectClassName} w-full lg:w-[200px]`}
        >
          <option value="__all__">Todas las empresas</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.ruc} - {empresa.razon_social || 'Sin nombre'}
            </option>
          ))}
        </select>

        <Input
          type="month"
          value={filters.periodoDesde}
          onChange={(e) => setFilters({ periodoDesde: e.target.value })}
          className="w-full lg:w-[160px] h-9"
        />

        <select
          value={filters.tipo}
          onChange={(e) => setFilters({ tipo: e.target.value })}
          className={`${selectClassName} w-full lg:w-[160px]`}
        >
          {TIPOS_COMPROBANTE.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={filters.direccion}
          onChange={(e) => setFilters({ direccion: e.target.value })}
          className={`${selectClassName} w-full lg:w-[130px]`}
        >
          {DIRECCIONES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros activos:</span>
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full"
            >
              {filter.label}
              <button
                onClick={() => setFilters({ [filter.key]: filter.key === 'periodoDesde' ? '' : '__all__' })}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-destructive hover:text-destructive/80 font-medium"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
