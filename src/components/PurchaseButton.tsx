import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const IAP_PRODUCT_ID = '6_Week_Program';

interface PurchaseButtonProps {
  programId: string;
  programTitle: string;
  amount?: number;
  price?: number;
  userId?: string;
  onPurchaseSuccess?: () => void;
  onSuccess?: () => void;
}

export const PurchaseButton: React.FC<PurchaseButtonProps> = ({
  programId,
  programTitle,
  amount,
  price,
  userId,
  onPurchaseSuccess,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [iapReady, setIapReady] = useState(false);
  const displayPrice = price ?? amount ?? 29.99;
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const win = window as any;
    if (!win.CdvPurchase) return;

    const { store, ProductType, Platform } = win.CdvPurchase;

    store.register({
      id: IAP_PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.APPLE_APP_STORE,
    });

    store.when().approved((transaction: any) => {
      transaction.finish();
      setLoading(false);
      const cb = onPurchaseSuccess ?? onSuccess;
      if (cb) cb();
    });

    store.when().productUpdated(() => {
      setIapReady(true);
    });

    store.initialize([Platform.APPLE_APP_STORE]).then(() => {
      setIapReady(true);
    });
  }, [isNative]);

  const handleNativePurchase = async () => {
    const win = window as any;
    if (!win.CdvPurchase) {
      setError('In-app purchases not available on this device.');
      return;
    }

    const { store, Platform } = win.CdvPurchase;
    const product = store.get(IAP_PRODUCT_ID, Platform.APPLE_APP_STORE);

    if (!product) {
      setError('Product not found. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await store.order(product);
    } catch (err: any) {
      setLoading(false);
      setError(err.message ?? 'Purchase failed. Please try again.');
    }
  };

  const handleWebPurchase = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://kixmtnmfaezatkrhhuhj.supabase.co/functions/v1/178a4f55-8b01-4c8d-b5b2-77bfd4a3b17d',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId, programTitle, amount: displayPrice, userId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = isNative ? handleNativePurchase : handleWebPurchase;
  const isDisabled = loading || (isNative && !iapReady);

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePurchase}
        disabled={isDisabled}
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
            Purchase for ${displayPrice}
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
