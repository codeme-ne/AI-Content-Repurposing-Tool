import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Sparkles, Zap, Shield, Clock } from 'lucide-react';
import config, { formatPrice } from '@/config/app.config';
import { createCheckoutSession } from '@/libs/api-client';
import { toast } from 'sonner';
import { useState } from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingUsage?: number;
  trigger?: 'usage_limit' | 'feature_locked' | 'manual';
}

export function UpgradeModal({ isOpen, onClose, trigger = 'usage_limit' }: UpgradeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const yearlyPlan = config.stripe.plans.find(p => p.interval === 'yearly');
  const monthlyPlan = config.stripe.plans.find(p => p.interval === 'monthly');

  const handleUpgradeClick = async (priceId: string) => {
    setIsProcessing(true);
    try {
      const session = await createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl: `${window.location.origin}/app?upgraded=true`,
        cancelUrl: `${window.location.origin}/app`,
      });

      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Checkout error:', error);
      toast.error('Fehler beim Erstellen der Checkout-Session. Bitte versuche es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'usage_limit':
        return {
          title: 'Bereit für mehr?',
          description: 'Upgrade auf Pro für unbegrenzte Premium-Features!',
          icon: <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        };
      case 'feature_locked':
        return {
          title: 'Premium Feature',
          description: 'Diese Funktion ist nur für Pro-Mitglieder verfügbar. Upgrade jetzt und schalte alle Features frei!',
          icon: <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        };
      default:
        return {
          title: 'Bereit für mehr?',
          description: 'Upgrade auf Pro und nutze alle Premium-Funktionen ohne Einschränkungen!',
          icon: <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
        };
    }
  };

  const message = getTriggerMessage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="text-center">
            {message.icon}
            <DialogTitle className="text-2xl font-bold">{message.title}</DialogTitle>
            <DialogDescription className="mt-2 text-base">
              {message.description}
            </DialogDescription>
          </div>
        </DialogHeader>


        {/* Premium Features */}
        <div className="space-y-3 my-6">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Was du mit Pro bekommst:
          </h3>
          <div className="grid gap-2">
            {config.stripe.features.premium.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Monthly Plan */}
          {monthlyPlan && (
            <Card className="relative p-4 border-2 hover:border-primary transition-colors">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Monatlich</h4>
                  <div className="text-2xl font-bold mt-1">
                    {formatPrice(monthlyPlan.price, monthlyPlan.currency)}
                    <span className="text-sm font-normal text-muted-foreground">/Monat</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleUpgradeClick(monthlyPlan.priceId)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  {isProcessing ? 'Wird verarbeitet...' : 'Monatlich wählen'}
                </Button>
              </div>
            </Card>
          )}

          {/* Yearly Plan */}
          {yearlyPlan && (
            <Card className="relative p-4 border-2 border-primary bg-primary/5">
              <Badge className="absolute -top-3 right-4 bg-gradient-to-r from-yellow-500 to-yellow-600">
                BESTER WERT
              </Badge>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Jährlich</h4>
                  <div className="text-2xl font-bold mt-1">
                    {formatPrice(yearlyPlan.price, yearlyPlan.currency)}
                    <span className="text-sm font-normal text-muted-foreground">/Jahr</span>
                  </div>
                  <div className="text-xs text-green-600 font-medium mt-1">
                    Spare {formatPrice(monthlyPlan!.price * 12 - yearlyPlan.price, yearlyPlan.currency)} pro Jahr!
                  </div>
                </div>
                <Button
                  onClick={() => handleUpgradeClick(yearlyPlan.priceId)}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Wird verarbeitet...' : 'Jährlich wählen & sparen'}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mt-6">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Sofort freigeschaltet</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>Sicher mit Stripe</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Jederzeit kündbar</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Vielleicht später
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}