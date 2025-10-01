'use client';

import React, { useState } from 'react';
import { CreditCard, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PaymentMethod } from '@/lib/types/payment';
import { cn } from '@/lib/utils';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  isDefault?: boolean;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function PaymentMethodCard({
  paymentMethod,
  isDefault = false,
  onSetDefault,
  onDelete,
  loading = false,
}: PaymentMethodCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(paymentMethod.id);
    }
    setShowDeleteDialog(false);
  };

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you'd use actual brand logos
    return <CreditCard className="h-8 w-8" />;
  };

  return (
    <>
      <Card className={cn('relative', isDefault && 'border-primary')}>
        {isDefault && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-primary text-primary-foreground">
              <Check className="h-3 w-3 mr-1" />
              Default
            </Badge>
          </div>
        )}

        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-muted-foreground">
                {getCardBrandIcon(paymentMethod.card.brand)}
              </div>
              <div>
                <div className="font-medium capitalize">
                  {paymentMethod.card.brand} •••• {paymentMethod.card.last4}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Expires {paymentMethod.card.expMonth}/{paymentMethod.card.expYear}
                </div>
                {paymentMethod.billingDetails.name && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {paymentMethod.billingDetails.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isDefault && onSetDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetDefault(paymentMethod.id)}
                  disabled={loading}
                >
                  Set as Default
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading || isDefault}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}