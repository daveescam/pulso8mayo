"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Mail,
  MessageCircle,
  Download,
  Users,
  Building,
  ToggleRight,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

interface EmployeeBulkActionsProps {
  selectedEmployees: string[];
  onClearSelection: () => void;
  onBulkAction?: (action: string, employeeIds: string[]) => Promise<void>;
}

export function EmployeeBulkActions({
  selectedEmployees,
  onClearSelection,
  onBulkAction,
}: EmployeeBulkActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    if (selectedEmployees.length === 0) {
      toast.error("No employees selected");
      return;
    }

    setLoading(true);
    try {
      await onBulkAction?.(action, selectedEmployees);
      
      switch (action) {
        case "export":
          toast.success(`Exporting ${selectedEmployees.length} employee(s)`);
          break;
        case "email":
          toast.success(`Opening email composer for ${selectedEmployees.length} employee(s)`);
          break;
        case "whatsapp":
          toast.success(`Opening WhatsApp for ${selectedEmployees.length} employee(s)`);
          break;
        case "change-department":
          toast.success("Department change dialog opened");
          break;
        case "change-status":
          toast.success("Status change dialog opened");
          break;
        default:
          toast.success(`Action "${action}" completed for ${selectedEmployees.length} employee(s)`);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Error performing bulk action");
    } finally {
      setLoading(false);
    }
  };

  if (selectedEmployees.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
      <span className="text-sm text-muted-foreground px-2">
        {selectedEmployees.length} selected
      </span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Bulk Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleAction("export")}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Selected
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleAction("email")}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction("whatsapp")}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Send WhatsApp
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleAction("change-department")}>
            <Building className="mr-2 h-4 w-4" />
            Change Department
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction("change-status")}>
            <ToggleRight className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear
      </Button>
    </div>
  );
}
