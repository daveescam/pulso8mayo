'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeaveCalendarProps {
  companyId: string;
  userId: string;
}

export function LeaveCalendar({ companyId, userId }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        const response = await fetch(
          `/api/leave/requests?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`
        );
        const data = await response.json();
        setLeaveRequests(data.requests || []);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [companyId, currentDate]);

  const getLeaveRequestsForDay = (day: Date) => {
    return leaveRequests.filter((request) => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      return day >= start && day <= end;
    });
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-sm font-medium p-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-start-${i}`} className="h-24" />
        ))}

        {/* Days */}
        {days.map((day) => {
          const requests = getLeaveRequestsForDay(day);
          const isTodayDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`h-24 p-2 border rounded-lg ${
                isTodayDay ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {requests.slice(0, 2).map((request) => (
                  <Badge
                    key={request.id}
                    variant="secondary"
                    className="text-xs block truncate"
                  >
                    {request.userName?.split(' ')[0] || 'User'}
                  </Badge>
                ))}
                {requests.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{requests.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty cells for days after month ends */}
        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
          <div key={`empty-end-${i}`} className="h-24" />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded ring-2 ring-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">User</Badge>
          <span>On Leave</span>
        </div>
      </div>
    </div>
  );
}
