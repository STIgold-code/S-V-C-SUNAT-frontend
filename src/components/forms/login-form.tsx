'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      toast.success('Bienvenido!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm border-border">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">SV</span>
          </div>
        </div>
        <div className="space-y-1 text-center">
          <CardTitle className="text-lg font-semibold">SUNAT-VC</CardTitle>
          <CardDescription className="text-sm">
            Ingresa tus credenciales
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm">Contrasena</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-9"
            />
          </div>
          <Button type="submit" className="w-full h-9" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </form>

        <p className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          Sistema de Comprobantes Electronicos
        </p>
      </CardContent>
    </Card>
  );
}
