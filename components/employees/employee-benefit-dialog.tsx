"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EmployeeBenefitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employeeId: string;
  companyId: string;
}

export function EmployeeBenefitDialog({
  open,
  onOpenChange,
  onSuccess,
  employeeId,
  companyId,
}: EmployeeBenefitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    benefitType: "",
    provider: "",
    policyNumber: "",
    coverageAmount: "",
    employeeContribution: "",
    employerContribution: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.benefitType) {
      toast.error("Benefit type is required");
      return;
    }

    setLoading(true);

    try {
      // Note: We need to convert currency values (pesos) to cents for the database
      // if your standard practice is to store in cents (`integer("cost")`).
      // Adjusting them logic accordingly: * 100 for storage.
      const payload = {
        ...formData,
        companyId,
        coverageAmount: formData.coverageAmount ? Number(formData.coverageAmount) * 100 : 0,
        employeeContribution: formData.employeeContribution ? Number(formData.employeeContribution) * 100 : 0,
        employerContribution: formData.employerContribution ? Number(formData.employerContribution) * 100 : 0,
      };

      const response = await fetch(`/api/employees/${employeeId}/benefits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create benefit");
      }

      toast.success("Benefit enrolled successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        benefitType: "",
        provider: "",
        policyNumber: "",
        coverageAmount: "",
        employeeContribution: "",
        employerContribution: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
    } catch (error: any) {
      console.error("Error creating benefit:", error);
      toast.error(error.message || "Failed to enroll benefit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enroll in Benefit</DialogTitle>
          <DialogDescription>
            Register a new company benefit or perk for this employee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 flex-1 overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="benefitType">Benefit Type *</Label>
              <Select
                value={formData.benefitType}
                onValueChange={(value) => handleChange("benefitType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEALTH_INSURANCE">Health Insurance (IMSS/SGMM)</SelectItem>
                  <SelectItem value="LIFE_INSURANCE">Life Insurance</SelectItem>
                  <SelectItem value="SAVINGS_FUND">Savings Fund</SelectItem>
                  <SelectItem value="FOOD_VOUCHERS">Food Vouchers</SelectItem>
                  <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider Name</Label>
              <Input
                id="provider"
                placeholder="e.g. GNP, Edenred"
                value={formData.provider}
                onChange={(e) => handleChange("provider", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy/Account Number</Label>
              <Input
                id="policyNumber"
                placeholder="Optional"
                value={formData.policyNumber}
                onChange={(e) => handleChange("policyNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="coverageAmount">Coverage Amount (MXN)</Label>
              <Input
                id="coverageAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.coverageAmount}
                onChange={(e) => handleChange("coverageAmount", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employerContribution">Employer Monthly (MXN)</Label>
              <Input
                id="employerContribution"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.employerContribution}
                onChange={(e) => handleChange("employerContribution", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeContribution">Employee Deduction (MXN)</Label>
              <Input
                id="employeeContribution"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.employeeContribution}
                onChange={(e) => handleChange("employeeContribution", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
