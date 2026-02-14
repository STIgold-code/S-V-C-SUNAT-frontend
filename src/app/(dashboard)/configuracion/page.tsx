'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  User,
  Lock,
  Palette,
  Info,
  Loader2,
  Check,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConfiguracionPage() {
  const { user, token } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile state
  const [nombre, setNombre] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync nombre when user loads
  useEffect(() => {
    if (user?.nombre) {
      setNombre(user.nombre);
    }
  }, [user?.nombre]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setSavingProfile(true);
    try {
      await api.put('/auth/profile', { nombre }, token || undefined);

      // Update local storage
      const savedUser = localStorage.getItem('svc_sunat_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.nombre = nombre;
        localStorage.setItem('svc_sunat_user', JSON.stringify(userData));
      }

      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      }, token || undefined);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Administra tu cuenta y preferencias
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="h-9 bg-muted/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-xs text-muted-foreground">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="h-9"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={savingProfile || nombre === user?.nombre}
            >
              {savingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">
              Contraseña actual
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs text-muted-foreground">
                Nueva contraseña
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
                Confirmar contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Lock className="h-4 w-4 mr-1.5" />
              )}
              Cambiar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tema</Label>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded border transition-colors',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Información de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">ID de usuario</span>
              <span className="font-mono text-xs text-foreground">{user?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Estado</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                user?.activo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
              )}>
                {user?.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Miembro desde</span>
              <span className="text-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Última actualización</span>
              <span className="text-foreground">
                {user?.updated_at
                  ? new Date(user.updated_at).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
        <p>SUNAT-VC v1.0.0</p>
        <p className="mt-1">Sistema de descarga masiva de comprobantes electrónicos</p>
      </div>
    </div>
  );
}
