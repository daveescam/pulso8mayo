import { UnifiedShiftScheduler } from "@/components/labor/unified-shift-scheduler";

export default function ScheduleBuilderPage() {
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
