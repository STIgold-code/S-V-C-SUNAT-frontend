'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, FileSpreadsheet, FileArchive } from 'lucide-react';
import type { Empresa } from '@/types';
import { cn } from '@/lib/utils';

interface DescargaFormProps {
  empresas: Empresa[];
  onSubmit: (data: {
    empresa_id: string;
    periodo: string;
    modulos: string[];
    formatos: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

const MODULOS_FACTURAS = [
  { value: 'facturas_emitidas', label: 'Facturas Emitidas' },
  { value: 'facturas_recibidas', label: 'Facturas Recibidas' },
];

const MODULOS_BOLETAS = [
  { value: 'boletas_emitidas', label: 'Boletas Emitidas' },
  { value: 'boletas_recibidas', label: 'Boletas Recibidas' },
  { value: 'nc_boletas_emitidas', label: 'NC Boletas Emitidas' },
  { value: 'nd_boletas_emitidas', label: 'ND Boletas Emitidas' },
];

const MODULOS_GUIAS = [
  { value: 'guias_remision_emitidas', label: 'GR Remitente Emitidas' },
  { value: 'guias_remision_recibidas', label: 'GR Remitente Recibidas' },
  { value: 'guias_transportista_emitidas', label: 'GR Transportista Emitidas' },
  { value: 'guias_transportista_recibidas', label: 'GR Transportista Recibidas' },
];

const MODULOS_RET_PER = [
  { value: 'retenciones_emitidas', label: 'Retenciones Emitidas' },
  { value: 'retenciones_recibidas', label: 'Retenciones Recibidas' },
  { value: 'percepciones_emitidas', label: 'Percepciones Emitidas' },
  { value: 'percepciones_recibidas', label: 'Percepciones Recibidas' },
];

const MODULOS_CPE = [
  { value: 'cpe_emitidos', label: 'XMLs Emitidos (CPE)' },
];

const FORMATOS = [
  { value: 'xml', label: 'XML', icon: FileText },
  { value: 'pdf', label: 'PDF', icon: FileSpreadsheet },
  { value: 'cdr', label: 'CDR', icon: FileArchive },
];

const MESES = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = 2015; // SUNAT electrónica desde ~2014-2015
  const years = [];
  for (let y = currentYear; y >= startYear; y--) {
    years.push(y);
  }
  return years;
}

export function DescargaForm({ empresas, onSubmit, onCancel }: DescargaFormProps) {
  const [loading, setLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState('');
  const [anio, setAnio] = useState('');
  const [mes, setMes] = useState('');
  const [modulos, setModulos] = useState<string[]>([]);
  const [formatos, setFormatos] = useState<string[]>(['xml', 'pdf']);

  const years = getAvailableYears();
  const periodo = anio && mes ? `${anio}-${mes}` : '';

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
    if (!empresaId || !anio || !mes || modulos.length === 0 || formatos.length === 0) return;

    setLoading(true);
    try {
      await onSubmit({ empresa_id: empresaId, periodo, modulos, formatos });
    } finally {
      setLoading(false);
    }
  };

  const renderModuloGroup = (label: string, mods: { value: string; label: string }[], color: string) => (
    <div className="rounded border border-border p-3">
      <p className={cn('text-[10px] font-medium uppercase tracking-wider mb-2', color)}>{label}</p>
      <div className="space-y-2">
        {mods.map((mod) => (
          <div key={mod.value} className="flex items-center space-x-2">
            <Checkbox
              id={mod.value}
              checked={modulos.includes(mod.value)}
              onCheckedChange={() => toggleModulo(mod.value)}
            />
            <label htmlFor={mod.value} className="text-xs cursor-pointer">{mod.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Empresa */}
      <div className="space-y-1.5">
        <Label className="text-sm">Empresa</Label>
        <Select value={empresaId} onValueChange={setEmpresaId} required>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Selecciona empresa" />
          </SelectTrigger>
          <SelectContent>
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

      {/* Periodo */}
      <div className="space-y-1.5">
        <Label className="text-sm">Periodo</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select value={anio} onValueChange={setAnio} required>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={mes} onValueChange={setMes} required>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modulos */}
      <div className="space-y-2">
        <Label className="text-sm">Modulos</Label>
        <div className="grid grid-cols-2 gap-2">
          {renderModuloGroup('Facturas', MODULOS_FACTURAS, 'text-primary')}
          {renderModuloGroup('Boletas', MODULOS_BOLETAS, 'text-violet-500')}
          {renderModuloGroup('Guias', MODULOS_GUIAS, 'text-amber-500')}
          {renderModuloGroup('Ret/Per', MODULOS_RET_PER, 'text-rose-500')}
          {renderModuloGroup('CPE', MODULOS_CPE, 'text-emerald-500')}
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
        <Button type="submit" size="sm" disabled={loading || !empresaId || !anio || !mes || modulos.length === 0}>
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Iniciando...
            </>
          ) : (
            'Iniciar Descarga'
          )}
        </Button>
      </div>
    </form>
  );
}
