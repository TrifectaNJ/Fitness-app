import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShoppingCart } from 'lucide-react';

interface PurchaseButtonProps {
  programId: string;
  programTitle: string;
  amount: number;
  userId: string;
  onPurchaseSuccess?: () => void;
}

export const PurchaseButton: React.FC<PurchaseButtonProps> = ({
  programId,
  programTitle,
  amount,
  userId,
  onPurchaseSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://kixmtnmfaezatkrhhuhj.supabase.co/functions/v1/178a4f55-8b01-4c8d-b5b2-77bfd4a3b17d',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            programId,
            programTitle,
            amount,
            userId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={handlePurchase} 
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase for ${amount}
          </>
        )}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PurchaseButton;