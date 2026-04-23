import { Metadata } from "next";
import { KpiForm } from "@/components/analytics/kpi-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "KPI Builder | Pulso",
    description: "Create custom Key Performance Indicators for your business",
};

export default function KpiBuilderPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/analytics">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">KPI Builder</h1>
                    <p className="text-muted-foreground">
                        Create custom Key Performance Indicators to track your business metrics
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl">
                <KpiForm />
            </div>

            {/* Help Section */}
            <div className="max-w-4xl space-y-4">
                <h2 className="text-xl font-semibold">About KPIs</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">What is a KPI?</h3>
                        <p className="text-sm text-muted-foreground">
                            A Key Performance Indicator (KPI) is a measurable value that demonstrates 
                            how effectively a company is achieving key business objectives. KPIs 
                            provide a focus for strategic and operational improvement.
                        </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Best Practices</h3>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>Keep KPIs simple and easy to understand</li>
                            <li>Ensure they align with business objectives</li>
                            <li>Set realistic targets and thresholds</li>
                            <li>Review and update regularly</li>
                            <li>Use visualizations to communicate effectively</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
