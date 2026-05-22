"use client";

/**
 * Shifts Page - Updated with new Shift Scheduler System
 * Consolidates weekly-shift-planner and schedule-builder into unified view
 */

import { ShiftSchedulerContainer } from "@/components/labor/shifts";
import { useRequireRole } from "@/hooks/use-session";

export default function ShiftsPage() {
  const { loading } = useRequireRole(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR']);

  if (loading) {
    return null;
  }

  return <ShiftSchedulerContainer />;
}
