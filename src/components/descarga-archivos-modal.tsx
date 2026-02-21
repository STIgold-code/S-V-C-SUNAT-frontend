'use client';

import { useDescargaArchivos } from '@/hooks/use-descarga-archivos';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileArchive, Loader2 } from 'lucide-react';

interface Props {
  descargaId: string | null;
  open: boolean;
  onClose: () => void;
}

const MODULO_LABELS: Record<string, string> = {
  facturas_emitidas: 'Facturas Emitidas',
  facturas_recibidas: 'Facturas Recibidas',
  boletas_emitidas: 'Boletas Emitidas',
  boletas_recibidas: 'Boletas Recibidas',
  nc_boletas_emitidas: 'NC Boletas Emitidas',
  nd_boletas_emitidas: 'ND Boletas Emitidas',
  guias_emitidas: 'Guias Emitidas',
  guias_recibidas: 'Guias Recibidas',
  guias_remision_emitidas: 'Guias Remision Emitidas',
  guias_remision_recibidas: 'Guias Remision Recibidas',
  guias_transportista_emitidas: 'Guias Transportista Emitidas',
  guias_transportista_recibidas: 'Guias Transportista Recibidas',
  retenciones_emitidas: 'Retenciones Emitidas',
  retenciones_recibidas: 'Retenciones Recibidas',
  percepciones_emitidas: 'Percepciones Emitidas',
  percepciones_recibidas: 'Percepciones Recibidas',
  cpe_emitidos: 'CPE Emitidos',
  cpe_recibidos: 'CPE Recibidos',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DescargaArchivosModal({ descargaId, open, onClose }: Props) {
  const { archivos, loading, error, downloadArchivo } = useDescargaArchivos(
    open ? descargaId : null
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Archivos Disponibles</DialogTitle>
          <DialogDescription>
            Descarga los archivos generados por módulo
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {!loading && archivos.length === 0 && (
          <p className="text-muted-foreground text-sm py-4">
            No hay archivos disponibles.
          </p>
        )}

        {!loading && archivos.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {archivos.map((archivo) => (
              <div
                key={archivo.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {archivo.tipo_archivo === 'zip' ? (
                    <FileArchive className="h-5 w-5 text-amber-500" />
                  ) : (
                    <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {MODULO_LABELS[archivo.modulo] || archivo.modulo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {archivo.tipo_archivo.toUpperCase()} -{' '}
                      {formatBytes(archivo.tamano_bytes)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadArchivo(archivo.id, archivo.nombre)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
