'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, FileText, FileSpreadsheet, FileArchive } from 'lucide-react';
import type { Empresa } from '@/types';
import { cn } from '@/lib/utils';

interface DescargaProgramadaFormProps {
  empresas: Empresa[];
  onSuccess: () => void;
  onCancel: () => void;
}

const FRECUENCIAS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
];

const DIAS_SEMANA = [
  { value: '0', label: 'Lunes' },
  { value: '1', label: 'Martes' },
  { value: '2', label: 'Miercoles' },
  { value: '3', label: 'Jueves' },
  { value: '4', label: 'Viernes' },
  { value: '5', label: 'Sabado' },
  { value: '6', label: 'Domingo' },
];

const MODULOS = [
  { value: 'facturas_emitidas', label: 'Ventas (SIRE)', group: 'SIRE' },
  { value: 'facturas_recibidas', label: 'Compras (SIRE)', group: 'SIRE' },
  { value: 'boletas_emitidas', label: 'Boletas Emitidas', group: 'Boletas' },
  { value: 'boletas_recibidas', label: 'Boletas Recibidas', group: 'Boletas' },
  { value: 'nc_boletas_emitidas', label: 'NC Boletas Emitidas', group: 'Boletas' },
  { value: 'nd_boletas_emitidas', label: 'ND Boletas Emitidas', group: 'Boletas' },
  { value: 'guias_remision_emitidas', label: 'GR Remitente Emitidas', group: 'Guias' },
  { value: 'guias_remision_recibidas', label: 'GR Remitente Recibidas', group: 'Guias' },
  { value: 'guias_transportista_emitidas', label: 'GR Transp. Emitidas', group: 'Guias' },
  { value: 'guias_transportista_recibidas', label: 'GR Transp. Recibidas', group: 'Guias' },
  { value: 'retenciones_emitidas', label: 'Retenciones Emitidas', group: 'Ret/Per' },
  { value: 'retenciones_recibidas', label: 'Retenciones Recibidas', group: 'Ret/Per' },
  { value: 'percepciones_emitidas', label: 'Percepciones Emitidas', group: 'Ret/Per' },
  { value: 'percepciones_recibidas', label: 'Percepciones Recibidas', group: 'Ret/Per' },
  { value: 'cpe_emitidos', label: 'CPE Emitidos (XMLs)', group: 'CPE' },
];

const FORMATOS = [
  { value: 'xml', label: 'XML', icon: FileText },
  { value: 'pdf', label: 'PDF', icon: FileSpreadsheet },
  { value: 'cdr', label: 'CDR', icon: FileArchive },
];

export function DescargaProgramadaForm({
  empresas,
  onSuccess,
  onCancel,
}: DescargaProgramadaFormProps) {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [empresaId, setEmpresaId] = useState('all');
  const [frecuencia, setFrecuencia] = useState('monthly');
  const [diaSemana, setDiaSemana] = useState('0');
  const [diaMes, setDiaMes] = useState('1');
  const [hora, setHora] = useState('08:00');
  const [modulos, setModulos] = useState<string[]>(['facturas_emitidas', 'facturas_recibidas']);
  const [formatos, setFormatos] = useState<string[]>(['xml', 'pdf']);
  const [periodoRelativo, setPeriodoRelativo] = useState('previous');

  const toggleModulo = (modulo: string) => {
    setModulos((prev) =>
      prev.includes(modulo) ? prev.filter((m) => m !== modulo) : [...prev, modulo]
    );
  };

  const toggleFormato = (formato: string) => {
    setFormatos((prev) =>
      prev.includes(formato) ? prev.filter((f) => f !== formato) : [...prev, formato]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || modulos.length === 0 || formatos.length === 0) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('svc_sunat_token');

      const data: Record<string, unknown> = {
        nombre,
        empresa_id: empresaId === 'all' ? null : empresaId,
        frecuencia,
        hora,
        modulos,
        formatos,
        periodo_relativo: periodoRelativo,
      };

      if (frecuencia === 'weekly') {
        data.dia_semana = parseInt(diaSemana);
      }
      if (frecuencia === 'monthly') {
        data.dia_mes = parseInt(diaMes);
      }

      await api.post('/descargas-programadas', data, token || undefined);
      toast.success('Programacion creada');
      onSuccess();
    } catch (error) {
      console.error('Error creating:', error);
      toast.error('Error al crear');
    } finally {
      setLoading(false);
    }
  };

  const groupedModules = MODULOS.reduce((acc, mod) => {
    if (!acc[mod.group]) acc[mod.group] = [];
    acc[mod.group].push(mod);
    return acc;
  }, {} as Record<string, typeof MODULOS>);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div className="space-y-1.5">
        <Label className="text-sm">Nombre</Label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Descarga mensual"
          required
          className="h-9"
        />
      </div>

      {/* Empresa */}
      <div className="space-y-1.5">
        <Label className="text-sm">Empresa</Label>
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Selecciona empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id}>
                <span className="font-mono text-xs">{empresa.ruc}</span>
                <span className="text-muted-foreground mx-1">-</span>
                <span className="text-xs">{empresa.razon_social || 'Sin nombre'}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Programacion */}
      <div className="rounded border border-border p-3 space-y-3">
        <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Programacion</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Frecuencia</Label>
            <Select value={frecuencia} onValueChange={setFrecuencia}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRECUENCIAS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Hora</Label>
            <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required className="h-9" />
          </div>
        </div>

        {frecuencia === 'weekly' && (
          <div className="space-y-1.5">
            <Label className="text-sm">Dia de la semana</Label>
            <Select value={diaSemana} onValueChange={setDiaSemana}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAS_SEMANA.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {frecuencia === 'monthly' && (
          <div className="space-y-1.5">
            <Label className="text-sm">Dia del mes</Label>
            <Select value={diaMes} onValueChange={setDiaMes}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={d.toString()}>Dia {d}</SelectItem>
                ))}
                <SelectItem value="-1">Ultimo dia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm">Periodo a descargar</Label>
          <Select value={periodoRelativo} onValueChange={setPeriodoRelativo}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Mes anterior</SelectItem>
              <SelectItem value="current">Mes actual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modulos */}
      <div className="space-y-2">
        <Label className="text-sm">Modulos</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(groupedModules).map(([group, mods]) => (
            <div key={group} className="rounded border border-border p-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1.5">{group}</p>
              <div className="space-y-1.5">
                {mods.map((modulo) => (
                  <div key={modulo.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mod-${modulo.value}`}
                      checked={modulos.includes(modulo.value)}
                      onCheckedChange={() => toggleModulo(modulo.value)}
                    />
                    <label htmlFor={`mod-${modulo.value}`} className="text-[11px] cursor-pointer">{modulo.label}</label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formatos */}
      <div className="space-y-2">
        <Label className="text-sm">Formatos</Label>
        <div className="flex gap-2">
          {FORMATOS.map((formato) => {
            const isSelected = formatos.includes(formato.value);
            return (
              <button
                key={formato.value}
                type="button"
                onClick={() => toggleFormato(formato.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                <formato.icon className="h-3.5 w-3.5" />
                {formato.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={loading || modulos.length === 0}>
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear'
          )}
        </Button>
      </div>
    </form>
  );
}
