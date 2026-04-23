"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AttendanceTabProps {
  attendanceRecords: any[];
  vacationBalance?: number;
}

const attendanceStatusLabels: Record<string, string> = {
  ON_TIME: "On Time",
  LATE: "Late",
  EARLY_DEPARTURE: "Early Departure",
  ABSENT: "Absent",
};

const attendanceStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ON_TIME: "default",
  LATE: "destructive",
  EARLY_DEPARTURE: "secondary",
  ABSENT: "destructive",
};

export function AttendanceTab({ attendanceRecords, vacationBalance }: AttendanceTabProps) {
  // Mock data for now - can be fetched from API later
  const currentWeekHours = 32.5;
  const monthToDateHours = 128;
  const overtimeHours = 4.5;
  const absencesThisMonth = 0;
  const tardinessThisMonth = 2;

  return (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
          <CardDescription>
            Overview of attendance statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Current Week</Label>
              <div className="text-2xl font-bold mt-1">{currentWeekHours}h</div>
              <div className="text-xs text-muted-foreground">hours worked</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Month to Date</Label>
              <div className="text-2xl font-bold mt-1">{monthToDateHours}h</div>
              <div className="text-xs text-muted-foreground">total hours</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Overtime</Label>
              <div className="text-2xl font-bold mt-1">{overtimeHours}h</div>
              <div className="text-xs text-muted-foreground">this month</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Absences</Label>
              <div className="text-2xl font-bold mt-1">{absencesThisMonth}</div>
              <div className="text-xs text-muted-foreground">this month</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Tardiness</Label>
              <div className="text-2xl font-bold mt-1">{tardinessThisMonth}</div>
              <div className="text-xs text-muted-foreground">this month</div>
            </div>
          </div>

          {vacationBalance !== undefined && (
            <>
              <Separator className="my-4" />
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold">Vacation Balance</Label>
                    <div className="text-3xl font-bold mt-1">{vacationBalance} days</div>
                    <div className="text-xs text-muted-foreground">available</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Last 10 clock-in/out records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords && attendanceRecords.length > 0 ? (
            <div className="space-y-2">
              {attendanceRecords.slice(0, 10).map((record: any, index: number) => (
                <div
                  key={record.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-sm">
                        {record.clockIn
                          ? format(new Date(record.clockIn), "MMM d, yyyy", { locale: es })
                          : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.clockIn
                          ? format(new Date(record.clockIn), "h:mm a", { locale: es })
                          : ""}
                        {record.clockOut &&
                          ` - ${format(new Date(record.clockOut), "h:mm a", { locale: es })}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.gpsLocation && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="hidden md:inline">{record.gpsLocation}</span>
                      </div>
                    )}
                    {record.status && (
                      <Badge
                        variant={attendanceStatusColors[record.status] || "outline"}
                      >
                        {attendanceStatusLabels[record.status] || record.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Attendance Records</h3>
              <p className="text-muted-foreground text-sm">
                Attendance records will appear here once the employee clocks in/out.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Calendar Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Calendar</CardTitle>
          <CardDescription>
            Upcoming scheduled shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">
              Schedule calendar view coming soon.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This will show scheduled shifts vs. actual attendance with discrepancies highlighted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
