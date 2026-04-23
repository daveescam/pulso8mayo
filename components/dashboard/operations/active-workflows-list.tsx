"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

export function ActiveWorkflowsList() {
    // Mock data for now
    const activeFlows = [
        {
            id: "1",
            title: "Morning Shift Opening",
            assignee: { name: "Maria Garcia", avatar: "" },
            status: "IN_PROGRESS",
            timeElapsed: "15m",
            dueIn: "45m",
        },
        {
            id: "2",
            title: "Temperature Check",
            assignee: { name: "Juan Perez", avatar: "" },
            status: "PENDING",
            timeElapsed: "0m",
            dueIn: "10m",
        },
        {
            id: "3",
            title: "Inventory Count",
            assignee: { name: "Ana Lopez", avatar: "" },
            status: "OVERDUE",
            timeElapsed: "-15m",
            dueIn: "Now",
        }
    ];

    return (
        <ScrollArea className="h-[300px]">
            <div className="space-y-4">
                {activeFlows.map((flow) => (
                    <div key={flow.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={flow.assignee.avatar} alt={flow.assignee.name} />
                                <AvatarFallback>{flow.assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{flow.title}</p>
                                <p className="text-xs text-muted-foreground">{flow.assignee.name}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {flow.status === 'OVERDUE' ? (
                                <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            ) : (
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Due in {flow.dueIn}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
