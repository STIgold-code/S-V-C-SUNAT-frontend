'use client';

import { useState, useEffect } from 'react';
import { DescargaArchivo } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003';

export function useDescargaArchivos(descargaId: string | null) {
  const [archivos, setArchivos] = useState<DescargaArchivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!descargaId) {
      setArchivos([]);
      return;
    }

    const fetchArchivos = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/v1/descargas/${descargaId}/archivos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error al cargar archivos');
        const data = await res.json();
        setArchivos(data.archivos);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchArchivos();
  }, [descargaId]);

  const downloadArchivo = async (archivoId: string, nombre: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/v1/descargas/archivos/${archivoId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al descargar archivo');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return { archivos, loading, error, downloadArchivo };
}
