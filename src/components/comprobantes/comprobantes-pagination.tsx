'use client';

import { Button } from '@/components/ui/button';
import { useComprobantesFilters } from '@/hooks/use-comprobantes-filters';

interface ComprobantesPaginationProps {
  total: number;
  totalPages: number;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function ComprobantesPagination({ total, totalPages }: ComprobantesPaginationProps) {
  const { filters, setFilters } = useComprobantesFilters();
  const { page, limit } = filters;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium text-foreground">{start}-{end}</span> de{' '}
          <span className="font-medium text-foreground">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mostrar:</span>
          <select
            value={String(limit)}
            onChange={(e) => setFilters({ limit: Number(e.target.value), page: 1 })}
            className="h-8 w-[70px] rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={String(size)}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters({ page: 1 })}
          disabled={page === 1}
        >
          ← Primera
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters({ page: page - 1 })}
          disabled={page === 1}
        >
          Anterior
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((p, i) =>
            typeof p === 'number' ? (
              <Button
                key={i}
                variant={p === page ? 'default' : 'ghost'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setFilters({ page: p })}
              >
                {p}
              </Button>
            ) : (
              <span key={i} className="px-1 text-muted-foreground">...</span>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters({ page: page + 1 })}
          disabled={page >= totalPages}
        >
          Siguiente
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters({ page: totalPages })}
          disabled={page >= totalPages}
        >
          Última →
        </Button>
      </div>
    </div>
  );
}
