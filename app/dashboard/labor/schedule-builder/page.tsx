"use client";

import { UnifiedShiftScheduler } from "@/components/labor/unified-shift-scheduler";
import { useRequireRole } from "@/hooks/use-session";

export default function ScheduleBuilderPage() {
  const { loading } = useRequireRole(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR']);

  if (loading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Schedule Builder</h1>
        <p className="text-muted-foreground">
          Gestión unificada de turnos, horarios y descansos.
        </p>
      </div>
      <UnifiedShiftScheduler />
    </div>
  );
}
