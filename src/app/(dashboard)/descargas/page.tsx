'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  Ban,
} from 'lucide-react';
import type { Empresa } from '@/types';
import { DescargaForm } from '@/components/forms/descarga-form';
import { DescargaArchivosModal } from '@/components/descarga-archivos-modal';
import { cn } from '@/lib/utils';
import { translateError } from '@/lib/error-messages';

// Convertir fecha UTC del backend a Date local
function parseUTCDate(dateStr: string): Date {
  // El backend devuelve UTC sin 'Z', agregar para que JS lo interprete correctamente
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

interface DescargaList {
  id: string;
  empresa_ruc: string;
  empresa_razon_social: string | null;
  estado: string;
  periodo: string;
  modulos: string[];
  total_comprobantes: number;
  progreso: number;
  mensaje_progreso: string | null;
  errores: string | null;
  created_at: string;
}

// Mapeo de módulos a nombres completos
const MODULO_LABELS: Record<string, string> = {
  facturas_emitidas: 'Facturas Emitidas',
  facturas_recibidas: 'Facturas Recibidas',
  boletas_emitidas: 'Boletas Emitidas',
  boletas_recibidas: 'Boletas Recibidas',
  nc_boletas_emitidas: 'NC Boletas Emitidas',
  nd_boletas_emitidas: 'ND Boletas Emitidas',
  guias_remision_emitidas: 'GRE Emitidas',
  guias_remision_recibidas: 'GRE Recibidas',
  guias_transportista_emitidas: 'GRT Emitidas',
  guias_transportista_recibidas: 'GRT Recibidas',
  retenciones_emitidas: 'Retenciones Emitidas',
  retenciones_recibidas: 'Retenciones Recibidas',
  percepciones_emitidas: 'Percepciones Emitidas',
  percepciones_recibidas: 'Percepciones Recibidas',
};

const formatModulos = (modulos: string[], maxShow: number = 2): string => {
  if (!modulos || modulos.length === 0) return '';

  const labels = modulos.map(m => MODULO_LABELS[m] || m);

  if (labels.length <= maxShow) {
    return labels.join(', ');
  }

  const shown = labels.slice(0, maxShow).join(', ');
  const remaining = labels.length - maxShow;
  return `${shown}, +${remaining} más`;
};

export default function DescargasPage() {
  const [descargas, setDescargas] = useState<DescargaList[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archivosModalOpen, setArchivosModalOpen] = useState(false);
  const [selectedDescargaId, setSelectedDescargaId] = useState<string | null>(null);

  const fetchDescargas = useCallback(async () => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const data = await api.get<DescargaList[]>('/descargas', token || undefined);
      setDescargas(data);
    } catch (error) {
      console.error('Error fetching descargas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmpresas = useCallback(async () => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const data = await api.get<Empresa[]>('/empresas?activa=true', token || undefined);
      setEmpresas(data);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    }
  }, []);

  useEffect(() => {
    fetchDescargas();
    fetchEmpresas();

    const interval = setInterval(() => {
      fetchDescargas();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchDescargas, fetchEmpresas]);

  const handleCreate = async (data: {
    empresa_id: string;
    periodo: string;
    modulos: string[];
    formatos: string[];
  }) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      await api.post('/descargas', data, token || undefined);
      toast.success('Descarga iniciada');
      setDialogOpen(false);
      fetchDescargas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear descarga');
    }
  };

  const handleRetry = async (descargaId: string) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      await api.post(`/descargas/${descargaId}/retry`, {}, token || undefined);
      toast.success('Reintentando descarga');
      fetchDescargas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al reintentar');
    }
  };

  const handleCancel = async (descargaId: string) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      await api.post(`/descargas/${descargaId}/cancel`, {}, token || undefined);
      toast.success('Descarga cancelada');
      fetchDescargas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cancelar');
    }
  };

  const handleDownloadFile = async (descargaId: string, periodo: string, ruc: string) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const descarga = await api.get<{ archivo_url: string }>(`/descargas/${descargaId}`, token || undefined);

      if (descarga.archivo_url) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003/api/v1'}/descargas/${descargaId}/download`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const contentType = response.headers.get('content-type') || '';
          const isZip = contentType.includes('zip') || descarga.archivo_url.endsWith('.zip');
          const extension = isZip ? 'zip' : 'xlsx';
          const filename = `${ruc}_${periodo}.${extension}`;

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success(isZip ? 'ZIP descargado' : 'Excel descargado');
        } else {
          toast.error('Error al descargar el archivo');
        }
      } else {
        toast.error('El archivo no está disponible');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al descargar');
    }
  };

  const handleDownloadExcel = async (descargaId: string, periodo: string, ruc: string) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003/api/v1'}/descargas/${descargaId}/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const filename = `${ruc}_${periodo}_detallado.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Excel detallado descargado');
      } else if (response.status === 404) {
        toast.error('Excel no disponible para esta descarga');
      } else {
        toast.error('Error al descargar el Excel');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al descargar');
    }
  };

  const getEstadoConfig = (estado: string) => {
    const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      completed: {
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Completado',
        className: 'text-emerald-500 bg-emerald-500/10',
      },
      processing: {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        label: 'Procesando',
        className: 'text-primary bg-primary/10',
      },
      pending: {
        icon: <Clock className="h-4 w-4" />,
        label: 'Pendiente',
        className: 'text-amber-500 bg-amber-500/10',
      },
      failed: {
        icon: <XCircle className="h-4 w-4" />,
        label: 'Fallido',
        className: 'text-destructive bg-destructive/10',
      },
      cancelled: {
        icon: <Ban className="h-4 w-4" />,
        label: 'Cancelado',
        className: 'text-orange-500 bg-orange-500/10',
      },
    };
    return config[estado] || { icon: null, label: estado, className: 'text-muted-foreground bg-muted' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Descargas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Descarga masiva de comprobantes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDescargas}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Nueva Descarga
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base">Nueva Descarga</DialogTitle>
                <DialogDescription className="text-sm">
                  Selecciona la empresa y el periodo
                </DialogDescription>
              </DialogHeader>
              <DescargaForm
                empresas={empresas}
                onSubmit={handleCreate}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : descargas.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Download className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No hay descargas registradas</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Crear descarga
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {descargas.map((descarga) => {
            const estadoConfig = getEstadoConfig(descarga.estado);
            return (
              <Card key={descarga.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Estado */}
                    <div className={cn('w-9 h-9 rounded flex items-center justify-center flex-shrink-0', estadoConfig.className)}>
                      {estadoConfig.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono text-sm font-medium text-foreground">{descarga.empresa_ruc}</p>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', estadoConfig.className)}>
                          {estadoConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {descarga.empresa_razon_social || 'Sin nombre'}
                      </p>
                      {/* Mostrar mensaje de progreso o error */}
                      {descarga.estado === 'processing' && descarga.mensaje_progreso && (
                        <p className="text-xs text-primary mt-1 truncate">
                          {descarga.mensaje_progreso}
                        </p>
                      )}
                      {descarga.estado === 'failed' && descarga.errores && (() => {
                        const friendlyError = translateError(descarga.errores);
                        return (
                          <p className="text-xs text-destructive mt-1">
                            ⚠️ {friendlyError.message} - {friendlyError.action}
                          </p>
                        );
                      })()}
                      {descarga.estado === 'cancelled' && (
                        <p className="text-xs text-orange-500 mt-1">
                          {descarga.mensaje_progreso || 'Cancelada por el usuario'}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Periodo</p>
                        <p className="font-medium text-foreground">{descarga.periodo}</p>
                      </div>
                      <div className="max-w-[200px]">
                        <p className="text-muted-foreground">Tipo</p>
                        <p
                          className="font-medium text-foreground truncate"
                          title={descarga.modulos.map(m => MODULO_LABELS[m] || m).join(', ')}
                        >
                          {formatModulos(descarga.modulos) || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Docs</p>
                        <p className="font-medium text-foreground">{descarga.total_comprobantes}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-muted-foreground">Fecha/Hora</p>
                        <p className="font-medium text-foreground">
                          {parseUTCDate(descarga.created_at).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    {descarga.estado === 'processing' && (
                      <div className="w-full sm:w-24 flex-shrink-0">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Progreso</span>
                          <span>{descarga.progreso}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${descarga.progreso}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {descarga.estado === 'completed' && (
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setSelectedDescargaId(descarga.id);
                            setArchivosModalOpen(true);
                          }}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Archivos
                        </Button>
                      )}
                      {descarga.estado === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleRetry(descarga.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Reintentar
                        </Button>
                      )}
                      {(descarga.estado === 'processing' || descarga.estado === 'pending') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                          onClick={() => handleCancel(descarga.id)}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de archivos */}
      <DescargaArchivosModal
        descargaId={selectedDescargaId}
        open={archivosModalOpen}
        onClose={() => setArchivosModalOpen(false)}
      />
    </div>
  );
}
