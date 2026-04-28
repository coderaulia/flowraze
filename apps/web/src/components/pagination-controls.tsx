import { Button } from '@/components/ui/button';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  pagination,
  onPageChange,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing {start}-{end} of {pagination.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Previous
        </Button>
        <span className="min-w-20 text-center">
          Page {pagination.page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pagination.page >= totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
