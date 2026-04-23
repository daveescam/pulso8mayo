"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Employee } from "./employee-directory";

interface EmployeeExportDialogProps {
  employees: Employee[];
  total: number;
  onClose: () => void;
}

export function EmployeeExportDialog({ employees, total, onClose }: EmployeeExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "excel">("csv");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Convert employees to CSV/Excel format
      const csvHeaders = [
        "Employee Number",
        "Name",
        "Email",
        "Position",
        "Department",
        "Status",
        "Hire Date",
        "Phone",
        "City",
        "State",
      ];

      const rows = employees.map((emp) => [
        emp.employeeNumber || "",
        emp.userName || "",
        emp.userEmail || "",
        emp.position || "",
        emp.department || "",
        emp.employeeStatus || "",
        emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "",
        emp.personalPhone || "",
        emp.city || "",
        emp.state || "",
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `employees_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Employee list exported successfully");
      onClose();
    } catch (error) {
      console.error("Error exporting employees:", error);
      toast.error("Error exporting employees");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Employee List</DialogTitle>
          <DialogDescription>
            Export {total} employee(s) to your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "csv" | "excel")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fields to Include</Label>
            <div className="text-sm text-muted-foreground">
              All employee fields will be included: name, email, position, department, status, hire date, and contact information.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
