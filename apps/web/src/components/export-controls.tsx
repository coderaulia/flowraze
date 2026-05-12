import { useState } from 'react';
import { Download, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuthStore';

interface ExportControlsProps {
  entity: string;
  queryParams?: URLSearchParams;
}

export function ExportControls({ entity, queryParams }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const { hasFeature } = useAuthStore();
  const canExport = hasFeature('exports');

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!canExport) return;
    setIsExporting(true);
    setError('');
    const params = new URLSearchParams(queryParams);
    params.delete('page');
    params.delete('limit');
    const query = params.toString();
    const response = await downloadFile(
      `/exports/${entity}.${format}${query ? `?${query}` : ''}`,
      `flowraze-${entity}.${format}`
    );
    if (!response.success) {
      setError(response.error || 'Export failed');
    }
    setIsExporting(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        type="button"
        variant="secondary"
        disabled={isExporting || !canExport}
        onClick={() => handleExport('csv')}
      >
        <Download className="mr-2 h-4 w-4" />
        CSV
      </Button>
      <Button
        size="sm"
        type="button"
        variant="secondary"
        disabled={isExporting || !canExport}
        onClick={() => handleExport('pdf')}
      >
        <FileText className="mr-2 h-4 w-4" />
        PDF
      </Button>
      {!canExport && (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 rounded-full">
          <Lock className="h-3 w-3" />
          Performance Plan
        </span>
      )}
      {error && <span className="text-sm font-medium text-error">{error}</span>}
    </div>
  );
}
