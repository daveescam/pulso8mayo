"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

// Definitions of what each role can do
const PERMISSIONS = [
    { name: "View Dashboard", admin: true, manager: true, employee: true },
    { name: "Execute Workflows", admin: true, manager: true, employee: true },
    { name: "Manage Inventory", admin: true, manager: true, employee: false },
    { name: "Manage Team", admin: true, manager: true, employee: false },
    { name: "View Compliance Reports", admin: true, manager: true, employee: false },
    { name: "Edit Workflows (Builder)", admin: true, manager: false, employee: false },
    { name: "Company Settings", admin: true, manager: false, employee: false },
    { name: "Manage Subscription", admin: true, manager: false, employee: false },
];

export function RolePermissionMatrix() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Permission</TableHead>
                        <TableHead className="text-center">Admin</TableHead>
                        <TableHead className="text-center">Gerente</TableHead>
                        <TableHead className="text-center">Empleado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {PERMISSIONS.map((perm) => (
                        <TableRow key={perm.name}>
                            <TableCell className="font-medium">{perm.name}</TableCell>
                            <TableCell className="text-center">
                                {perm.admin ? <Check className="mx-auto h-4 w-4 text-green-500" /> : <X className="mx-auto h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="text-center">
                                {perm.manager ? <Check className="mx-auto h-4 w-4 text-green-500" /> : <X className="mx-auto h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="text-center">
                                {perm.employee ? <Check className="mx-auto h-4 w-4 text-green-500" /> : <X className="mx-auto h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
