'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  Building2,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmpresaStats {
  total: number;
  activas: number;
  validadas: number;
  por_grupo: Record<string, number>;
}

interface DescargaStats {
  total_descargas: number;
  completadas: number;
  en_proceso: number;
  fallidas: number;
  total_comprobantes: number;
}

interface RecentDescarga {
  id: string;
  empresa_ruc: string;
  empresa_razon_social: string | null;
  estado: string;
  periodo: string;
  total_comprobantes: number;
  created_at: string;
}

export default function DashboardPage() {
  const [empresaStats, setEmpresaStats] = useState<EmpresaStats | null>(null);
  const [descargaStats, setDescargaStats] = useState<DescargaStats | null>(null);
  const [recentDescargas, setRecentDescargas] = useState<RecentDescarga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('svc_sunat_token');

        const [empresas, descargas, recent] = await Promise.all([
          api.get<EmpresaStats>('/empresas/stats', token || undefined),
          api.get<DescargaStats>('/descargas/stats', token || undefined),
          api.get<RecentDescarga[]>('/descargas?limit=5', token || undefined),
        ]);

        setEmpresaStats(empresas);
        setDescargaStats(descargas);
        setRecentDescargas(recent);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Completado' },
      processing: { bg: 'bg-primary/10', text: 'text-primary', label: 'Procesando' },
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Pendiente' },
      failed: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Fallido' },
    };
    const { bg, text, label } = config[estado] || { bg: 'bg-muted', text: 'text-muted-foreground', label: estado };
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', bg, text)}>
        {label}
      </span>
    );
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen de empresas y descargas
          </p>
        </div>
        <Link href="/descargas">
          <Button size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Nueva Descarga
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Empresas</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{empresaStats?.total || 0}</p>
              </div>
              <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Activas</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{empresaStats?.activas || 0}</p>
              </div>
              <div className="w-9 h-9 rounded bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Descargas</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{descargaStats?.total_descargas || 0}</p>
              </div>
              <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center">
                <Download className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Comprobantes</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {descargaStats?.total_comprobantes?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Download Status */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Completadas</p>
                <p className="text-lg font-semibold text-foreground">{descargaStats?.completadas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div>
                <p className="text-xs text-muted-foreground">En Proceso</p>
                <p className="text-lg font-semibold text-foreground">{descargaStats?.en_proceso || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Fallidas</p>
                <p className="text-lg font-semibold text-foreground">{descargaStats?.fallidas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Downloads */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Descargas Recientes</CardTitle>
            <Link href="/descargas">
              <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground">
                Ver todas
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recentDescargas.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-3 rounded bg-muted flex items-center justify-center">
                <Download className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">Sin descargas recientes</p>
              <Link href="/descargas">
                <Button variant="outline" size="sm">
                  Crear descarga
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDescargas.map((descarga) => (
                <div
                  key={descarga.id}
                  className="flex items-center gap-4 p-3 rounded bg-card hover:bg-accent/50 transition-colors border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-foreground">{descarga.empresa_ruc}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {descarga.empresa_razon_social || 'Sin nombre'}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{descarga.periodo}</span>
                    <span className="text-muted-foreground">{descarga.total_comprobantes} docs</span>
                  </div>
                  {getEstadoBadge(descarga.estado)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Link href="/empresas">
          <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Gestionar Empresas</p>
                <p className="text-xs text-muted-foreground">Agregar o editar</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/descargas">
          <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded bg-emerald-500/10 flex items-center justify-center">
                <Download className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Nueva Descarga</p>
                <p className="text-xs text-muted-foreground">Descargar comprobantes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/programadas">
          <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Programadas</p>
                <p className="text-xs text-muted-foreground">Automatizar descargas</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
