'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Loader2,
  Upload,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import type { Empresa, EmpresaCreate, EmpresaUpdate } from '@/types';
import { EmpresaForm } from '@/components/forms/empresa-form';
import { cn } from '@/lib/utils';

interface ImportResultItem {
  fila: number;
  ruc: string;
  status: 'creado' | 'duplicado' | 'error';
  mensaje?: string;
}

interface ImportResult {
  total_filas: number;
  creados: number;
  duplicados: number;
  errores: number;
  detalle: ImportResultItem[];
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEmpresas = useCallback(async () => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await api.get<Empresa[]>(`/empresas${params}`, token || undefined);
      setEmpresas(data);
    } catch (error) {
      console.error('Error fetching empresas:', error);
      toast.error('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchEmpresas();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchEmpresas]);

  const handleSubmit = async (data: EmpresaCreate | EmpresaUpdate) => {
    try {
      const token = localStorage.getItem('svc_sunat_token');
      if (editingEmpresa) {
        await api.put(`/empresas/${editingEmpresa.id}`, data, token || undefined);
        toast.success('Empresa actualizada correctamente');
        setEditingEmpresa(null);
      } else {
        await api.post('/empresas', data, token || undefined);
        toast.success('Empresa creada correctamente');
      }
      setDialogOpen(false);
      fetchEmpresas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar empresa');
    }
  };

  const handleDelete = async (empresa: Empresa) => {
    if (!confirm(`Eliminar empresa ${empresa.ruc}?`)) return;
    try {
      const token = localStorage.getItem('svc_sunat_token');
      await api.delete(`/empresas/${empresa.id}`, token || undefined);
      toast.success('Empresa eliminada');
      fetchEmpresas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar empresa');
    }
  };

  const handleValidate = async (empresa: Empresa) => {
    setValidatingId(empresa.id);
    try {
      const token = localStorage.getItem('svc_sunat_token');
      const result = await api.post<{ success: boolean; message: string }>(
        `/empresas/${empresa.id}/validate`,
        {},
        token || undefined
      );
      if (result.success) {
        toast.success(`${empresa.ruc}: Credenciales validadas`);
      } else {
        toast.error(`${empresa.ruc}: ${result.message}`);
      }
      fetchEmpresas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al validar');
    } finally {
      setValidatingId(null);
    }
  };

  const handleImportFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('El archivo debe ser Excel (.xlsx o .xls)');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const token = localStorage.getItem('svc_sunat_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/empresas/importar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al importar');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.creados > 0) {
        toast.success(`${result.creados} empresas importadas correctamente`);
        fetchEmpresas();
      }
      if (result.errores > 0) {
        toast.warning(`${result.errores} filas con errores`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImportFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  const openEditDialog = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingEmpresa(null);
    setDialogOpen(true);
  };

  const openImportDialog = () => {
    setImportResult(null);
    setImportDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona las credenciales SUNAT
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openImportDialog}>
            <Upload className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nueva Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle className="text-base">
                  {editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {editingEmpresa
                    ? 'Modifica los datos de la empresa'
                    : 'Ingresa los datos de la nueva empresa'}
                </DialogDescription>
              </DialogHeader>
              <EmpresaForm
                empresa={editingEmpresa}
                onSubmit={handleSubmit}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-base">Importar desde Excel</DialogTitle>
              <DialogDescription className="text-sm">
                Sube un archivo Excel con las credenciales
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div
                className={cn(
                  'border border-dashed rounded p-6 text-center transition-colors cursor-pointer',
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {importing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Importando...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-foreground">Arrastra o haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground">Columnas: RUC, Usuario SOL, Clave SOL</p>
                  </div>
                )}
              </div>

              {importResult && (
                <div className="space-y-2 p-3 rounded bg-muted/50">
                  <div className="flex gap-4 text-xs">
                    <span className="text-emerald-500">{importResult.creados} creados</span>
                    <span className="text-amber-500">{importResult.duplicados} duplicados</span>
                    <span className="text-destructive">{importResult.errores} errores</span>
                  </div>
                  {importResult.detalle.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-border rounded text-xs">
                      {importResult.detalle.map((item) => (
                        <div key={item.fila} className="flex items-center gap-2 px-2 py-1.5 border-b border-border last:border-b-0">
                          <span className="text-muted-foreground">#{item.fila}</span>
                          <span className="font-mono">{item.ruc}</span>
                          <span className={cn(
                            'ml-auto px-1.5 py-0.5 rounded text-[10px]',
                            item.status === 'creado' && 'bg-emerald-500/10 text-emerald-500',
                            item.status === 'duplicado' && 'bg-amber-500/10 text-amber-500',
                            item.status === 'error' && 'bg-destructive/10 text-destructive'
                          )}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por RUC o razon social..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {empresas.length} empresas
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : empresas.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No hay empresas registradas</p>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {empresas.map((empresa) => (
            <Card key={empresa.id} className="border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-foreground">{empresa.ruc}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {empresa.razon_social || 'Sin nombre'}
                    </p>
                  </div>
                  <div className={cn(
                    'w-7 h-7 rounded flex items-center justify-center flex-shrink-0',
                    empresa.validada ? 'bg-emerald-500/10' : 'bg-muted'
                  )}>
                    {empresa.validada ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {empresa.grupo && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                      {empresa.grupo}
                    </span>
                  )}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-medium',
                    empresa.activa ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                  )}>
                    {empresa.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleValidate(empresa)}
                    disabled={validatingId === empresa.id}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {validatingId === empresa.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    )}
                    Validar
                  </Button>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(empresa)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(empresa)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
