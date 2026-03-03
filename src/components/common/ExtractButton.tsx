// URL Extraction Button using Jina Reader
import { useState } from 'react';
import { Download } from 'lucide-react';
import { extractFromUrl } from '@/api/extract';
import { toast } from 'sonner';

interface ExtractButtonProps {
  url: string;
  onExtracted: (content: string, title?: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ExtractButton({
  url,
  onExtracted,
  disabled = false,
  className = ''
}: ExtractButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!url || disabled) return;

    setLoading(true);
    try {
      const result = await extractFromUrl(url);
      const content = result.content;
      const title = result.title;

      toast.success('Inhalt erfolgreich extrahiert');
      onExtracted(content, title);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Extraktionsfehler:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Extrahieren der Inhalte'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExtract}
      disabled={disabled || loading || !url}
      className={`
        flex items-center justify-center gap-2 px-4 py-2
        bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
        text-white font-medium rounded-lg transition-colors
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span>Extrahiere...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span>Inhalt extrahieren</span>
        </>
      )}
    </button>
  );
}
