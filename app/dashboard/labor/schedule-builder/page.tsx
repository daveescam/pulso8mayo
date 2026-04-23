import { UnifiedShiftScheduler } from "@/components/labor/unified-shift-scheduler";

export default function ScheduleBuilderPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Constructor de Horarios</h1>
                <p className="text-muted-foreground">
                    Planifica y asigna turnos para tu personal de forma inteligente
                </p>
            </div>

            <UnifiedShiftScheduler />
        </div>
    );
}
