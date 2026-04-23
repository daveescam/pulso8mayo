"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const employees = [
    {
        name: "Maria Garcia",
        email: "m.garcia@example.com",
        completed: 12,
        score: 98,
        avatar: "/avatars/01.png",
    },
    {
        name: "Juan Perez",
        email: "j.perez@example.com",
        completed: 10,
        score: 95,
        avatar: "/avatars/02.png",
    },
    {
        name: "Ana Lopez",
        email: "a.lopez@example.com",
        completed: 8,
        score: 92,
        avatar: "/avatars/03.png",
    },
    {
        name: "Carlos Ruiz",
        email: "c.ruiz@example.com",
        completed: 8,
        score: 88,
        avatar: "/avatars/04.png",
    },
    {
        name: "Sofia Diaz",
        email: "s.diaz@example.com",
        completed: 6,
        score: 90,
        avatar: "/avatars/05.png",
    },
];

export function EmployeeLeaderboard() {
    return (
        <div className="space-y-8">
            {employees.map((employee, index) => (
                <div key={employee.email} className="flex items-center">
                    <div className="flex items-center w-8 font-bold text-muted-foreground">
                        #{index + 1}
                    </div>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={employee.avatar} alt="Avatar" />
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {employee.email}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium">{employee.completed} Flows</p>
                            <p className="text-xs text-muted-foreground">{employee.score}% Avg Score</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
