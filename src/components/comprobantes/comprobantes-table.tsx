'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Comprobante } from '@/types';
import { useComprobantesFilters } from '@/hooks/use-comprobantes-filters';

interface ComprobantesTableProps {
  comprobantes: Comprobante[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onViewPdf: (comprobante: Comprobante) => void;
  onDownloadXml: (comprobante: Comprobante) => void;
}

const TIPO_COLORS: Record<string, string> = {
  factura: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  boleta: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  nota_credito: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  nota_debito: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  guia: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  retencion: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
};

export function ComprobantesTable({
  comprobantes,
  selectedIds,
  onSelectionChange,
  onViewPdf,
  onDownloadXml,
}: ComprobantesTableProps) {
  const { filters, setFilters } = useComprobantesFilters();

  const allSelected = comprobantes.length > 0 && comprobantes.every((c) => selectedIds.has(c.id));
  const someSelected = comprobantes.some((c) => selectedIds.has(c.id));

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(comprobantes.map((c) => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      setFilters({ sortBy: column, sortOrder: 'desc' });
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sortBy !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return filters.sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency === 'PEN' ? 'PEN' : 'USD',
    }).format(amount);
  };

  const getContraparte = (comp: Comprobante) => {
    const isEmitido = comp.modulo?.includes('emitidas');
    return {
      ruc: isEmitido ? comp.ruc_receptor : comp.ruc_emisor,
      razon: isEmitido ? comp.razon_receptor : comp.razon_emisor,
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="w-10 p-3">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </th>
              <th className="p-3 text-left">
                <button onClick={() => handleSort('tipo')} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                  Tipo <SortIcon column="tipo" />
                </button>
              </th>
              <th className="p-3 text-left font-medium text-muted-foreground">Serie-Numero</th>
              <th className="p-3 text-left">
                <button onClick={() => handleSort('fecha')} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                  Fecha <SortIcon column="fecha" />
                </button>
              </th>
              <th className="p-3 text-left font-medium text-muted-foreground">
                Contraparte
                {filters.direccion !== '__all__' && (
                  <span className="text-xs font-normal text-muted-foreground/70 ml-1">
                    ({filters.direccion === 'recibidas' ? 'Proveedor' : 'Cliente'})
                  </span>
                )}
              </th>
              <th className="p-3 text-right">
                <button onClick={() => handleSort('total')} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground ml-auto">
                  Total <SortIcon column="total" />
                </button>
              </th>
              <th className="p-3 text-center font-medium text-muted-foreground">Archivos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {comprobantes.map((comp) => {
              const contraparte = getContraparte(comp);
              const isNegative = comp.tipo === 'nota_credito';

              return (
                <tr
                  key={comp.id}
                  className={cn(
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                    selectedIds.has(comp.id) && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <td className="p-3">
                    <Checkbox checked={selectedIds.has(comp.id)} onCheckedChange={() => toggleOne(comp.id)} />
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className={cn('text-xs', TIPO_COLORS[comp.tipo])}>
                      {comp.tipo.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono">{comp.serie}-{comp.numero}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(comp.fecha_emision).toLocaleDateString('es-PE')}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{contraparte.ruc || '-'}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {contraparte.razon || '-'}
                      </span>
                    </div>
                  </td>
                  <td className={cn('p-3 text-right font-medium', isNegative && 'text-red-500')}>
                    {isNegative && '-'}{formatCurrency(comp.total, comp.moneda)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {comp.has_pdf && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onViewPdf(comp)}>
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      {comp.has_xml && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDownloadXml(comp)}>
                          <Download className="h-4 w-4 text-emerald-500" />
                        </Button>
                      )}
                      {!comp.has_pdf && !comp.has_xml && (
                        <span className="text-xs text-muted-foreground">Sin archivos</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
