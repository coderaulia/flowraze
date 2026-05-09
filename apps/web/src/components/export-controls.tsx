import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/api';

interface ExportControlsProps {
  entity: string;
  queryParams?: URLSearchParams;
}

export function ExportControls({ entity, queryParams }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async (format: 'csv' | 'pdf') => {
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
        disabled={isExporting}
        onClick={() => handleExport('csv')}
      >
        <Download className="mr-2 h-4 w-4" />
        CSV
      </Button>
      <Button
        size="sm"
        type="button"
        variant="secondary"
        disabled={isExporting}
        onClick={() => handleExport('pdf')}
      >
        <FileText className="mr-2 h-4 w-4" />
        PDF
      </Button>
      {error && <span className="text-sm font-medium text-error">{error}</span>}
    </div>
  );
}
