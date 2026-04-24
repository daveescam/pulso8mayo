"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, MessageSquare, Download, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface EmployeeHeaderProps {
  employee: {
    id: string;
    userName: string | null;
    userEmail: string | null;
    employeeNumber: string | null;
    employeeStatus: string | null;
    profilePhotoUrl: string | null;
    position: string | null;
    department: string | null;
  };
  onBack: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
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

export function EmployeeHeader({ employee, onBack, onEdit, canEdit }: EmployeeHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Back button & actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {canEdit && (
            <Button size="sm" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Documents</DropdownMenuItem>
              <DropdownMenuItem>View Contracts</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Archive Employee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={employee.profilePhotoUrl || undefined} />
          <AvatarFallback className="text-2xl">
            {employee.userName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{employee.userName || "N/A"}</h1>
            {employee.employeeStatus && (
              <Badge variant={statusColors[employee.employeeStatus] || "outline"}>
                {statusLabels[employee.employeeStatus] || employee.employeeStatus}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            {employee.position && (
              <span className="text-sm">{employee.position}</span>
            )}
            {employee.department && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm">{employee.department}</span>
              </>
            )}
            {employee.employeeNumber && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm font-mono">#{employee.employeeNumber}</span>
              </>
            )}
          </div>

          <div className="text-sm text-muted-foreground mt-1">
            {employee.userEmail}
          </div>
        </div>
      </div>

      <Separator />
    </div>
  );
}
