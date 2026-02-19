'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ComprobantesToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDownloadXmls: () => void;
  onDownloadPdfs: () => void;
  onExportSelection: () => void;
  isDownloading: boolean;
}

export function ComprobantesToolbar({
  selectedCount,
  onClearSelection,
  onDownloadXmls,
  onDownloadPdfs,
  onExportSelection,
  isDownloading,
}: ComprobantesToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center justify-between animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3">
        <Checkbox checked onCheckedChange={onClearSelection} />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {selectedCount} comprobante{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadXmls}
          disabled={isDownloading}
          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
          Descargar XMLs
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadPdfs}
          disabled={isDownloading}
          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
        >
          <Download className="h-4 w-4 mr-1.5" />
          Descargar PDFs
        </Button>
        <Button size="sm" onClick={onExportSelection} disabled={isDownloading}>
          <FileSpreadsheet className="h-4 w-4 mr-1.5" />
          Exportar selección
        </Button>
      </div>
    </div>
  );
}
