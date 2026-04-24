"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const employeeSchema = z.object({
  userName: z.string().min(2, "Name must be at least 2 characters"),
  userEmail: z.string().email("Invalid email address"),
  employeeNumber: z.string().min(1, "Employee number is required"),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  curp: z.string()
    .regex(/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/, "Invalid CURP format")
    .optional()
    .or(z.literal("")),
  rfc: z.string()
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "Invalid RFC format")
    .optional()
    .or(z.literal("")),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (employee: any) => void;
  companyId: string;
  employee?: any; // If provided, we are in EDIT mode
}

export function EmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
  companyId,
  employee,
}: EmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!employee?.id;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      userName: "",
      userEmail: "",
      employeeNumber: "",
      position: "",
      department: "",
      hireDate: new Date().toISOString().split("T")[0],
      curp: "",
      rfc: "",
    },
  });

  // Reset form when employee changes or dialog opens
  useEffect(() => {
    if (open) {
      if (employee) {
        form.reset({
          userName: employee.userName || "",
          userEmail: employee.userEmail || "",
          employeeNumber: employee.employeeNumber || "",
          position: employee.position || "",
          department: employee.department || "",
          hireDate: employee.hireDate 
            ? new Date(employee.hireDate).toISOString().split("T")[0] 
            : new Date().toISOString().split("T")[0],
          curp: employee.curp || "",
          rfc: employee.rfc || "",
        });
      } else {
        form.reset({
          userName: "",
          userEmail: "",
          employeeNumber: "",
          position: "",
          department: "",
          hireDate: new Date().toISOString().split("T")[0],
          curp: "",
          rfc: "",
        });
      }
    }
  }, [employee, open, form]);

  async function onSubmit(values: EmployeeFormValues) {
    setLoading(true);
    try {
      const url = isEdit ? `/api/employees/${employee.id}` : "/api/employees/create";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          companyId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(isEdit ? "Employee updated successfully" : "Employee created successfully");
        onOpenChange(false);
        if (!isEdit) form.reset();
        onSuccess?.(result.data);
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEdit ? "update" : "create"} employee`);
      }
    } catch (error) {
      console.error(`Error ${isEdit ? "updating" : "creating"} employee:`, error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee Profile" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update the employee's personal and professional information." 
              : "Create a new employee profile and user account."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Number</FormLabel>
                    <FormControl>
                      <Input placeholder="EMP-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Operations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="curp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CURP</FormLabel>
                    <FormControl>
                      <Input placeholder="18 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rfc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFC</FormLabel>
                    <FormControl>
                      <Input placeholder="12-13 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Employee"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
