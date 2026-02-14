'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  PlayCircle,
  Loader2,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { DescargaProgramadaForm } from '@/components/forms/descarga-programada-form';
import type { Empresa } from '@/types';
import { cn } from '@/lib/utils';

interface DescargaProgramada {
  id: string;
  nombre: string;
  activo: boolean;
  empresa_ruc: string | null;
  frecuencia: string;
  hora: string;
  proxima_ejecucion: string | null;
  total_ejecuciones: number;
  ejecuciones_exitosas: number;
}

export default function ProgramadasPage() {
  const [programadas, setProgramadas] = useState<DescargaProgramada[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('svc_sunat_token');

      const [programadasData, empresasData] = await Promise.all([
        api.get<DescargaProgramada[]>('/descargas-programadas', token || undefined),
        api.get<Empresa[]>('/empresas', token || undefined),
      ]);

      setProgramadas(programadasData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      await api.post(`/descargas-programadas/${id}/toggle`, {}, token || undefined);
      toast.success('Estado actualizado');
      fetchData();
    } catch (error) {
      toast.error('Error al cambiar estado');
      console.error('Error toggling:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Estas seguro de eliminar esta descarga programada?')) return;

    try {
      const token = localStorage.getItem('svc_sunat_token');
      await api.delete(`/descargas-programadas/${id}`, token || undefined);
      toast.success('Descarga programada eliminada');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar');
      console.error('Error deleting:', error);
    }
  };

  const handleExecuteNow = async (id: string) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      await api.post(`/descargas-programadas/${id}/ejecutar`, {}, token || undefined);
      toast.success('Descarga iniciada. Revisa la seccion de descargas.');
    } catch (error) {
      toast.error('Error al ejecutar');
      console.error('Error executing:', error);
    }
  };

  const formatFrecuencia = (frecuencia: string) => {
    const labels: Record<string, string> = {
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
    };
    return labels[frecuencia] || frecuencia;
  };

  const getFrecuenciaStyle = (frecuencia: string) => {
    const styles: Record<string, string> = {
      daily: 'bg-primary/10 text-primary',
      weekly: 'bg-violet-500/10 text-violet-500',
      monthly: 'bg-amber-500/10 text-amber-500',
    };
    return styles[frecuencia] || 'bg-muted text-muted-foreground';
  };

  const formatNextExecution = (dateStr: string | null) => {
    if (!dateStr) return 'No programada';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Programadas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Descargas automaticas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Nueva Programacion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base">Nueva Programacion</DialogTitle>
                <DialogDescription className="text-sm">
                  Configura una descarga automatica
                </DialogDescription>
              </DialogHeader>
              <DescargaProgramadaForm
                empresas={empresas}
                onSuccess={() => {
                  setDialogOpen(false);
                  fetchData();
                }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold text-foreground">{programadas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
                <Play className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Activas</p>
                <p className="text-lg font-semibold text-emerald-500">
                  {programadas.filter((p) => p.activo).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <PlayCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ejecuciones</p>
                <p className="text-lg font-semibold text-primary">
                  {programadas.reduce((acc, p) => acc + p.total_ejecuciones, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : programadas.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No hay programaciones</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Crear programacion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {programadas.map((prog) => (
            <Card
              key={prog.id}
              className={cn('border-border', !prog.activo && 'opacity-60')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Status */}
                  <div className={cn(
                    'w-9 h-9 rounded flex items-center justify-center flex-shrink-0',
                    prog.activo ? 'bg-emerald-500/10' : 'bg-muted'
                  )}>
                    {prog.activo ? (
                      <Play className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Pause className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{prog.nombre}</p>
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', getFrecuenciaStyle(prog.frecuencia))}>
                        {formatFrecuencia(prog.frecuencia)}
                      </span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium',
                        prog.activo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                      )}>
                        {prog.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="font-mono">{prog.empresa_ruc || 'Todas'}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Hora</p>
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <Clock className="h-3 w-3" />
                        {prog.hora}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-muted-foreground">Proxima</p>
                      <p className="font-medium text-foreground">{formatNextExecution(prog.proxima_ejecucion)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ejecuciones</p>
                      <p className="font-medium">
                        <span className="text-emerald-500">{prog.ejecuciones_exitosas}</span>
                        <span className="text-muted-foreground mx-0.5">/</span>
                        <span className="text-foreground">{prog.total_ejecuciones}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(prog.id)}
                      title={prog.activo ? 'Pausar' : 'Activar'}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {prog.activo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExecuteNow(prog.id)}
                      title="Ejecutar ahora"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prog.id)}
                      title="Eliminar"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
