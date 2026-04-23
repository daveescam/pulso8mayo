'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaveRequestForm } from '@/components/labor/leave-request-form';
import { LeaveBalanceCard } from '@/components/labor/leave-balance-card';
import { LeaveCalendar } from '@/components/labor/leave-calendar';
import { Plus, Calendar, Wallet } from 'lucide-react';

interface LeaveDashboardProps {
  companyId: string;
  userId: string;
  userRole: string;
}

export function LeaveDashboard({ companyId, userId, userRole }: LeaveDashboardProps) {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const response = await fetch(`/api/leave/balances?userId=${userId}&companyId=${companyId}`);
        const data = await response.json();
        setBalances(data.balances || []);
      } catch (error) {
        console.error('Error fetching leave balances:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [companyId, userId]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">
            Manage your time off requests and balances
          </p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <div className="col-span-3 text-center py-8">Cargando...</div>
        ) : balances.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            No leave balances found
          </div>
        ) : (
          balances.map((balance) => (
            <LeaveBalanceCard
              key={balance.id}
              balance={balance}
            />
          ))
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="request" className="space-y-4">
        <TabsList>
          <TabsTrigger value="request">
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Team Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request">
          <Card>
            <CardHeader>
              <CardTitle>Request Time Off</CardTitle>
              <CardDescription>
                Submit a new leave request for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveRequestForm
                companyId={companyId}
                userId={userId}
                balances={balances}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Team Leave Calendar</CardTitle>
              <CardDescription>
                View upcoming leave requests for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveCalendar
                companyId={companyId}
                userId={userId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
