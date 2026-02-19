'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, Loader2, FileX } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/utils';
import { useComprobantes } from '@/hooks/use-comprobantes';
import {
  ComprobantesFilters,
  ComprobantesTable,
  ComprobantesToolbar,
  ComprobantesPagination,
} from '@/components/comprobantes';
import type { Empresa, Comprobante } from '@/types';

function ComprobantesContent() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const {
    comprobantes,
    total,
    isLoading,
    filters,
    totalPages,
    batchDownload,
    isBatchDownloading,
  } = useComprobantes();

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const token = localStorage.getItem('svc_sunat_token');
        const data = await api.get<Empresa[]>('/empresas', token || undefined);
        setEmpresas(data);
      } catch (error) {
        console.error('Error fetching empresas:', error);
      }
    };
    fetchEmpresas();
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [comprobantes]);

  const handleViewPdf = useCallback(async (comprobante: Comprobante) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comprobantes/${comprobante.id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Error al obtener PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('Error al visualizar PDF');
    }
  }, []);

  const handleDownloadXml = useCallback(async (comprobante: Comprobante) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comprobantes/${comprobante.id}/xml`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Error al descargar XML');
      const blob = await response.blob();
      downloadBlob(blob, `${comprobante.serie}-${comprobante.numero}.xml`);
    } catch {
      toast.error('Error al descargar XML');
    }
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('svc_sunat_token');
      const params = new URLSearchParams();
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comprobantes/export/excel?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Error al exportar');
      const blob = await response.blob();
      downloadBlob(blob, `comprobantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel exportado');
    } catch {
      toast.error('Error al exportar');
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const handleBatchDownload = useCallback((formato: 'xml' | 'pdf') => {
    batchDownload(
      { ids: Array.from(selectedIds), formato },
      {
        onSuccess: () => {
          toast.success(`${formato.toUpperCase()}s descargados`);
          setSelectedIds(new Set());
        },
        onError: () => toast.error('Error al descargar'),
      }
    );
  }, [selectedIds, batchDownload]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Comprobantes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} comprobante{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={handleExportExcel} disabled={exporting || total === 0}>
          {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
          Exportar Excel
        </Button>
      </div>

      <ComprobantesFilters empresas={empresas} />

      <ComprobantesToolbar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDownloadXmls={() => handleBatchDownload('xml')}
        onDownloadPdfs={() => handleBatchDownload('pdf')}
        onExportSelection={handleExportExcel}
        isDownloading={isBatchDownloading}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : comprobantes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileX className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron comprobantes</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ComprobantesTable
            comprobantes={comprobantes}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onViewPdf={handleViewPdf}
            onDownloadXml={handleDownloadXml}
          />
          <ComprobantesPagination total={total} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

export default function ComprobantesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    }>
      <ComprobantesContent />
    </Suspense>
  );
}
