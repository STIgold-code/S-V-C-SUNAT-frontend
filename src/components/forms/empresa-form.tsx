'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { Empresa, EmpresaCreate, EmpresaUpdate } from '@/types';

interface EmpresaFormProps {
  empresa?: Empresa | null;
  onSubmit: (data: EmpresaCreate | EmpresaUpdate) => Promise<void>;
  onCancel: () => void;
}

export function EmpresaForm({ empresa, onSubmit, onCancel }: EmpresaFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    ruc: empresa?.ruc || '',
    razon_social: empresa?.razon_social || '',
    usuario_sol: '',
    clave_sol: '',
    grupo: empresa?.grupo || '',
    activa: empresa?.activa ?? true,
  });

  const isEditing = !!empresa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        const updateData: EmpresaUpdate = {
          razon_social: formData.razon_social || undefined,
          grupo: formData.grupo || undefined,
          activa: formData.activa,
        };
        if (formData.usuario_sol) {
          updateData.usuario_sol = formData.usuario_sol;
        }
        if (formData.clave_sol) {
          updateData.clave_sol = formData.clave_sol;
        }
        await onSubmit(updateData);
      } else {
        const createData: EmpresaCreate = {
          ruc: formData.ruc,
          razon_social: formData.razon_social || undefined,
          usuario_sol: formData.usuario_sol,
          clave_sol: formData.clave_sol,
          grupo: formData.grupo || undefined,
        };
        await onSubmit(createData);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* RUC */}
      <div className="space-y-1.5">
        <Label htmlFor="ruc" className="text-sm">RUC</Label>
        <Input
          id="ruc"
          value={formData.ruc}
          onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
          placeholder="20123456789"
          maxLength={11}
          required={!isEditing}
          disabled={isEditing || loading}
          className="h-9 font-mono"
        />
        {!isEditing && <p className="text-[10px] text-muted-foreground">11 digitos</p>}
      </div>

      {/* Razon Social */}
      <div className="space-y-1.5">
        <Label htmlFor="razon_social" className="text-sm">Razon Social</Label>
        <Input
          id="razon_social"
          value={formData.razon_social}
          onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
          placeholder="Mi Empresa S.A.C."
          disabled={loading}
          className="h-9"
        />
      </div>

      {/* SOL Credentials */}
      <div className="rounded border border-border p-3 space-y-3">
        <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Credenciales SOL</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="usuario_sol" className="text-sm">Usuario</Label>
            <Input
              id="usuario_sol"
              value={formData.usuario_sol}
              onChange={(e) => setFormData({ ...formData, usuario_sol: e.target.value })}
              placeholder={isEditing ? '(sin cambios)' : 'USUARIO'}
              required={!isEditing}
              disabled={loading}
              autoComplete="off"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clave_sol" className="text-sm">Clave</Label>
            <div className="relative">
              <Input
                id="clave_sol"
                type={showPassword ? 'text' : 'password'}
                value={formData.clave_sol}
                onChange={(e) => setFormData({ ...formData, clave_sol: e.target.value })}
                placeholder={isEditing ? '(sin cambios)' : '********'}
                required={!isEditing}
                disabled={loading}
                autoComplete="new-password"
                className="h-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        {isEditing && (
          <p className="text-[10px] text-muted-foreground">
            Deja en blanco para mantener las credenciales actuales
          </p>
        )}
      </div>

      {/* Grupo */}
      <div className="space-y-1.5">
        <Label htmlFor="grupo" className="text-sm">Grupo (opcional)</Label>
        <Input
          id="grupo"
          value={formData.grupo}
          onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
          placeholder="Ej: Restaurantes"
          disabled={loading}
          className="h-9"
        />
      </div>

      {/* Activa Switch */}
      {isEditing && (
        <div className="flex items-center justify-between rounded border border-border p-3">
          <div>
            <Label htmlFor="activa" className="text-sm font-medium">Empresa activa</Label>
            <p className="text-[10px] text-muted-foreground">Las inactivas no aparecen en descargas</p>
          </div>
          <Switch
            id="activa"
            checked={formData.activa}
            onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
            disabled={loading}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            isEditing ? 'Actualizar' : 'Crear'
          )}
        </Button>
      </div>
    </form>
  );
}
