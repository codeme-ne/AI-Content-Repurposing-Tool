import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  onCopy?: () => void;
}

export function CopyButton({
  text,
  className,
  variant = 'ghost',
  size = 'icon',
  label = 'Kopieren',
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  // Clean up timer on unmount or when copied changes
  useEffect(() => {
    if (!copied) return;

    const timerId = setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => clearTimeout(timerId);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to copy text:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        onCopy?.();
        // Timer cleanup handled by useEffect
      } catch (err) {
        if (import.meta.env.DEV) console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'transition-all',
        copied && 'text-green-600',
        className
      )}
      title={copied ? 'Kopiert!' : label}
    >
      {copied ? (
        <>
          <Check className={cn('h-4 w-4', size !== 'icon' && 'mr-2')} />
          {size !== 'icon' && 'Kopiert!'}
        </>
      ) : (
        <>
          <Copy className={cn('h-4 w-4', size !== 'icon' && 'mr-2')} />
          {size !== 'icon' && label}
        </>
      )}
    </Button>
  );
}