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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, User, Edit, MessageSquare, FileText } from "lucide-react";
import { Employee } from "./employee-directory";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  onViewEmployee: (employeeId: string) => void;
  onEditEmployee: (employeeId: string) => void;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ONBOARDING: "secondary",
  ACTIVE: "default",
  ON_LEAVE: "outline",
  SUSPENDED: "destructive",
  TERMINATED: "destructive",
  RESIGNED: "destructive",
};

const statusLabels: Record<string, string> = {
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
  RESIGNED: "Resigned",
};

export function EmployeeTable({ employees, loading, onViewEmployee, onEditEmployee }: EmployeeTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No employees found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filters, or add a new employee.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Employee #</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={employee.profilePhotoUrl || undefined} />
                  <AvatarFallback>
                    {employee.userName?.charAt(0) || employee.userEmail?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{employee.userName || "N/A"}</div>
                  <div className="text-xs text-muted-foreground">{employee.userEmail}</div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {employee.employeeNumber || "—"}
              </TableCell>
              <TableCell>{employee.position || "—"}</TableCell>
              <TableCell>{employee.department || "—"}</TableCell>
              <TableCell>
                {employee.employeeStatus && (
                  <Badge variant={statusColors[employee.employeeStatus] || "outline"}>
                    {statusLabels[employee.employeeStatus] || employee.employeeStatus}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {employee.hireDate
                  ? format(new Date(employee.hireDate), "MMM d, yyyy", { locale: es })
                  : "—"}
              </TableCell>
              <TableCell className="text-sm">
                {employee.personalEmail && (
                  <div className="text-xs">{employee.personalEmail}</div>
                )}
                {employee.personalPhone && (
                  <div className="text-xs text-muted-foreground">{employee.personalPhone}</div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewEmployee(employee.id)}>
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditEmployee(employee.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      View Documents
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
