"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ScheduledTab() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-7">
                <CardHeader>
                    <CardTitle>Upcoming Schedule</CardTitle>
                    <CardDescription>
                        Workflows scheduled for today and this week.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for Schedule Calendar/List */}
                    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
                        <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No scheduled workflows found</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2">
                            Assignments created in the builder will appear here.
                            Configure schedules in your workflow templates.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
