'use client';

import React from 'react';
import { Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Invoice } from '@/lib/types/payment';
import { formatDate } from '@/lib/utils';

interface InvoiceListProps {
  invoices: Invoice[];
  onDownload?: (invoiceId: string) => void;
  loading?: boolean;
}

export function InvoiceList({ invoices, onDownload, loading = false }: InvoiceListProps) {
  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'open':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case 'void':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Void
          </Badge>
        );
      case 'uncollectible':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Uncollectible
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Invoices</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            You don't have any invoices yet. Invoices will appear here once you subscribe to a paid plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="font-medium">{invoice.number || invoice.id}</div>
                  {invoice.description && (
                    <div className="text-sm text-muted-foreground">{invoice.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(invoice.created)}
                  </div>
                  {invoice.dueDate && (
                    <div className="text-xs text-muted-foreground">
                      Due: {formatDate(invoice.dueDate)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatAmount(invoice.amountDue, invoice.currency)}
                  </div>
                  {invoice.amountPaid > 0 && invoice.amountPaid !== invoice.amountDue && (
                    <div className="text-xs text-muted-foreground">
                      Paid: {formatAmount(invoice.amountPaid, invoice.currency)}
                    </div>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  {invoice.invoicePdf && onDownload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(invoice.id)}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}