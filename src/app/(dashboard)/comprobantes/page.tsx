'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Search,
  FileText,
  Download,
  Eye,
  Loader2,
  FileX,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import type { Empresa, Comprobante, ComprobantesPageResponse } from '@/types';
import { cn } from '@/lib/utils';

const TIPOS_COMPROBANTE = [
  { value: '__all__', label: 'Todos los tipos' },
  { value: 'factura', label: 'Facturas' },
  { value: 'boleta', label: 'Boletas' },
  { value: 'nota_credito', label: 'Notas de Crédito' },
  { value: 'nota_debito', label: 'Notas de Débito' },
  { value: 'guia', label: 'Guías' },
  { value: 'retencion', label: 'Retenciones' },
  { value: 'percepcion', label: 'Percepciones' },
];

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const limit = 50;

  // Filters
  const [search, setSearch] = useState('');
  const [empresaId, setEmpresaId] = useState('__all__');
  const [periodo, setPeriodo] = useState('');
  const [tipo, setTipo] = useState('__all__');

  const fetchEmpresas = useCallback(async () => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const data = await api.get<Empresa[]>('/empresas', token || undefined);
      setEmpresas(data);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    }
  }, []);

  const fetchComprobantes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('svc_sunat_token');

      const params = new URLSearchParams();
      if (empresaId && empresaId !== '__all__') params.append('empresa_id', empresaId);
      if (periodo) params.append('periodo', periodo);
      if (tipo && tipo !== '__all__') params.append('tipo', tipo);
      if (search) params.append('search', search);
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());

      const data = await api.get<ComprobantesPageResponse>(
        `/comprobantes?${params.toString()}`,
        token || undefined
      );
      setComprobantes(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching comprobantes:', error);
      toast.error('Error al cargar comprobantes');
    } finally {
      setLoading(false);
    }
  }, [empresaId, periodo, tipo, search, skip]);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setSkip(0);
      fetchComprobantes();
    }, 300);
    return () => clearTimeout(debounce);
  }, [empresaId, periodo, tipo, search]);

  useEffect(() => {
    fetchComprobantes();
  }, [skip]);

  const handleViewPdf = (comprobante: Comprobante) => {
    const token = localStorage.getItem('svc_sunat_token');
    const url = `${process.env.NEXT_PUBLIC_API_URL}/comprobantes/${comprobante.id}/pdf`;
    window.open(url + `?token=${token}`, '_blank');
  };

  const handleDownloadXml = async (comprobante: Comprobante) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comprobantes/${comprobante.id}/xml`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al descargar XML');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${comprobante.serie}-${comprobante.numero}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Error al descargar XML');
    }
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency === 'PEN' ? 'PEN' : 'USD',
    }).format(amount);
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'factura':
        return 'bg-blue-500/10 text-blue-500';
      case 'boleta':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'nota_credito':
        return 'bg-amber-500/10 text-amber-500';
      case 'nota_debito':
        return 'bg-rose-500/10 text-rose-500';
      case 'guia':
        return 'bg-violet-500/10 text-violet-500';
      case 'retencion':
        return 'bg-cyan-500/10 text-cyan-500';
      case 'percepcion':
        return 'bg-pink-500/10 text-pink-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('svc_sunat_token');

      const params = new URLSearchParams();
      if (empresaId && empresaId !== '__all__') params.append('empresa_id', empresaId);
      if (periodo) params.append('periodo', periodo);
      if (tipo && tipo !== '__all__') params.append('tipo', tipo);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comprobantes/export/excel?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobantes_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel exportado correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Comprobantes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} comprobante{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleExportExcel}
          disabled={exporting || total === 0}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          Exportar Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por serie, número, RUC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-full sm:w-[200px] h-9">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las empresas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.ruc} - {empresa.razon_social || 'Sin nombre'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="month"
              placeholder="Periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full sm:w-[160px] h-9"
            />

            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_COMPROBANTE.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : comprobantes.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <FileX className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              No se encontraron comprobantes
            </p>
            <p className="text-xs text-muted-foreground">
              Descarga comprobantes desde la sección de Descargas
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table */}
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Serie-Número</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Cliente/Proveedor</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Archivos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comprobantes.map((comp) => (
                    <tr key={comp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <Badge variant="secondary" className={cn('text-xs', getTipoBadgeColor(comp.tipo))}>
                          {comp.tipo.charAt(0).toUpperCase() + comp.tipo.slice(1).replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-foreground">
                        {comp.serie}-{comp.numero}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(comp.fecha_emision).toLocaleDateString('es-PE')}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-foreground">{comp.ruc_receptor || comp.ruc_emisor}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {comp.razon_receptor || comp.razon_emisor || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-foreground">
                        {formatCurrency(comp.total, comp.moneda)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {comp.has_pdf && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPdf(comp)}
                              className="h-7 w-7 p-0"
                              title="Ver PDF"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          {comp.has_xml && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadXml(comp)}
                              className="h-7 w-7 p-0"
                              title="Descargar XML"
                            >
                              <Download className="h-4 w-4 text-emerald-500" />
                            </Button>
                          )}
                          {!comp.has_pdf && !comp.has_xml && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {skip + 1} - {Math.min(skip + limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkip(Math.max(0, skip - limit))}
                  disabled={skip === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkip(skip + limit)}
                  disabled={skip + limit >= total}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
