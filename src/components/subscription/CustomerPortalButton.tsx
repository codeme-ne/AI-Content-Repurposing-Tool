import { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';

interface CustomerPortalButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function CustomerPortalButton({ className, children }: CustomerPortalButtonProps) {
  const { subscription, isActive, openCustomerPortal } = useSubscription();
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenPortal = async () => {
    if (!subscription || !isActive) return;
    
    setIsOpening(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      // Error is already handled by the hook
      if (import.meta.env.DEV) console.error('Portal error:', error);
    } finally {
      setIsOpening(false);
    }
  };

  // Don't render if no active subscription
  if (!subscription || !isActive) {
    return null;
  }

  return (
    <Button
      onClick={handleOpenPortal}
      disabled={isOpening}
      variant="outline"
      className={className}
    >
      {isOpening ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <ExternalLink className="w-4 h-4 mr-2" />
      )}
      {children || 'Abo verwalten'}
    </Button>
  );
}