'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  Download,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  FileArchive,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { translateError } from '@/lib/error-messages';

interface Descarga {
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

// Convertir fecha UTC del backend a Date local
function parseUTCDate(dateStr: string): Date {
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

function formatTimeAgo(dateStr: string): string {
  const date = parseUTCDate(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}

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

function formatModulos(modulos: string[], maxShow: number = 2): string {
  if (!modulos || modulos.length === 0) return '';

  const labels = modulos.map(m => MODULO_LABELS[m] || m);

  if (labels.length <= maxShow) {
    return labels.join(', ');
  }

  const shown = labels.slice(0, maxShow).join(', ');
  const remaining = labels.length - maxShow;
  return `${shown}, +${remaining} más`;
}

function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

export default function DashboardPage() {
  const [descargas, setDescargas] = useState<Descarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchDescargas = async () => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const data = await api.get<Descarga[]>('/descargas?limit=10', token || undefined);
      setDescargas(data);
    } catch (error) {
      console.error('Error fetching descargas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDescargas();
    // Poll for updates every 5 seconds if there are processing downloads
    const interval = setInterval(() => {
      fetchDescargas();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (id: string) => {
    setRetrying(id);
    try {
      const token = localStorage.getItem('svc_sunat_token');
      await api.post(`/descargas/${id}/retry`, {}, token || undefined);
      await fetchDescargas();
    } catch (error) {
      console.error('Error retrying:', error);
    } finally {
      setRetrying(null);
    }
  };

  const handleDownload = async (id: string, type: 'zip' | 'excel') => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const endpoint = type === 'zip' ? `/descargas/${id}/download` : `/descargas/${id}/excel`;
      const response = await fetch(`http://localhost:4003/api/v1${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'zip' ? `descarga_${id}.zip` : `descarga_${id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  // Categorize downloads
  const processing = descargas.filter(d => d.estado === 'processing');
  const failed = descargas.filter(d => d.estado === 'failed');
  const lastCompleted = descargas.find(d => d.estado === 'completed');
  const history = descargas.filter(d => d.estado === 'completed').slice(1, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    );
  }

  const hasActivity = processing.length > 0 || failed.length > 0 || lastCompleted;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Estado de descargas</p>
        </div>
        <Link href="/descargas">
          <Button size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Nueva Descarga
          </Button>
        </Link>
      </div>

      {!hasActivity ? (
        /* Empty State */
        <div className="border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Download className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">Sin descargas pendientes</p>
          <p className="text-xs text-muted-foreground mb-4">Crea una descarga para comenzar</p>
          <Link href="/descargas">
            <Button>Nueva Descarga</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Processing */}
          {processing.map(d => (
            <div key={d.id} className="border border-primary/50 bg-primary/5 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Descarga en proceso</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.empresa_ruc} - {d.empresa_razon_social || 'Sin nombre'} · {formatPeriodo(d.periodo)} · {formatModulos(d.modulos)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-semibold text-primary">{d.progreso}%</p>
                  {d.mensaje_progreso && (
                    <p className="text-xs text-muted-foreground">{d.mensaje_progreso}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${d.progreso}%` }}
                />
              </div>
            </div>
          ))}

          {/* Failed */}
          {failed.map(d => {
            const friendlyError = translateError(d.errores);
            const colorClass = friendlyError.type === 'user' ? 'amber-500'
              : friendlyError.type === 'temporary' ? 'blue-500'
              : friendlyError.type === 'sunat' ? 'orange-500'
              : 'destructive';

            return (
              <div key={d.id} className={cn(
                "border rounded-lg p-4",
                friendlyError.type === 'user' && "border-amber-500/50 bg-amber-500/5",
                friendlyError.type === 'temporary' && "border-blue-500/50 bg-blue-500/5",
                friendlyError.type === 'sunat' && "border-orange-500/50 bg-orange-500/5",
                friendlyError.type === 'system' && "border-destructive/50 bg-destructive/5",
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    friendlyError.type === 'user' && "bg-amber-500/10",
                    friendlyError.type === 'temporary' && "bg-blue-500/10",
                    friendlyError.type === 'sunat' && "bg-orange-500/10",
                    friendlyError.type === 'system' && "bg-destructive/10",
                  )}>
                    <AlertTriangle className={cn(
                      "h-4 w-4",
                      friendlyError.type === 'user' && "text-amber-500",
                      friendlyError.type === 'temporary' && "text-blue-500",
                      friendlyError.type === 'sunat' && "text-orange-500",
                      friendlyError.type === 'system' && "text-destructive",
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      friendlyError.type === 'user' && "text-amber-500",
                      friendlyError.type === 'temporary' && "text-blue-500",
                      friendlyError.type === 'sunat' && "text-orange-500",
                      friendlyError.type === 'system' && "text-destructive",
                    )}>
                      {friendlyError.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.empresa_ruc} · {formatModulos(d.modulos)} · {formatPeriodo(d.periodo)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 {friendlyError.action}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-shrink-0",
                      friendlyError.type === 'user' && "text-amber-500 hover:text-amber-500 hover:bg-amber-500/10",
                      friendlyError.type === 'temporary' && "text-blue-500 hover:text-blue-500 hover:bg-blue-500/10",
                      friendlyError.type === 'sunat' && "text-orange-500 hover:text-orange-500 hover:bg-orange-500/10",
                      friendlyError.type === 'system' && "text-destructive hover:text-destructive hover:bg-destructive/10",
                    )}
                    onClick={() => handleRetry(d.id)}
                    disabled={retrying === d.id}
                  >
                    {retrying === d.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reintentar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Last Completed */}
          {lastCompleted && (
            <div className="border border-emerald-500/50 bg-emerald-500/5 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-500">Descarga lista</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lastCompleted.empresa_ruc} · {formatModulos(lastCompleted.modulos)} · {lastCompleted.total_comprobantes} docs · {formatTimeAgo(lastCompleted.created_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10 flex-shrink-0"
                  onClick={() => handleDownload(lastCompleted.id, 'zip')}
                >
                  <FileArchive className="h-4 w-4 mr-1" />
                  Descargar ZIP
                </Button>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="border border-border rounded-lg">
              <div className="p-4 flex items-center justify-between">
                <p className="text-sm font-medium">Historial reciente</p>
                <Link href="/descargas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver todo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="border-t border-border">
                {history.map((d, i) => (
                  <div
                    key={d.id}
                    className={cn(
                      "p-3 flex items-center gap-4 hover:bg-muted/50",
                      i > 0 && "border-t border-border"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono">{d.empresa_ruc}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatModulos(d.modulos)} · {formatPeriodo(d.periodo)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{d.total_comprobantes} docs</p>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{formatTimeAgo(d.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
