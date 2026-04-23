'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, CheckCircle2, Clock } from 'lucide-react';

interface LeaveBalanceCardProps {
  balance: {
    id: string;
    leaveTypeName: string;
    leaveTypeDescription: string | null;
    isPaid: boolean;
    year: number;
    totalEntitlement: number;
    used: number;
    pending: number;
    balance: number;
  };
}

export function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
  const usagePercentage = balance.totalEntitlement > 0 
    ? Math.round((balance.used / balance.totalEntitlement) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{balance.leaveTypeName}</CardTitle>
          {balance.isPaid ? (
            <Badge variant="default">Paid</Badge>
          ) : (
            <Badge variant="secondary">Unpaid</Badge>
          )}
        </div>
        {balance.leaveTypeDescription && (
          <p className="text-sm text-muted-foreground">
            {balance.leaveTypeDescription}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Overview */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold">{balance.totalEntitlement}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{balance.used}</div>
            <div className="text-xs text-muted-foreground">Used</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{balance.balance}</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Usage</span>
            <span className="font-medium">{usagePercentage}%</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Pending Approval</span>
            </div>
            <span className="font-medium">{balance.pending} days</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>Year</span>
            </div>
            <span className="font-medium">{balance.year}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
