"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface EmployeeTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employeeId: string;
  companyId: string;
}

export function EmployeeTrainingDialog({
  open,
  onOpenChange,
  onSuccess,
  employeeId,
  companyId,
}: EmployeeTrainingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trainingName: "",
    trainingType: "",
    provider: "",
    status: "SCHEDULED",
    certificationNumber: "",
    cost: "",
    startDate: new Date().toISOString().split("T")[0],
    completionDate: "",
    expirationDate: "",
    notes: "",
    isMandatory: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.trainingName || !formData.trainingType) {
      toast.error("Training Name and Type are required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        companyId,
        cost: formData.cost ? Number(formData.cost) * 100 : 0, // Store in cents
      };

      const response = await fetch(`/api/employees/${employeeId}/training`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add training");
      }

      toast.success("Training added successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        trainingName: "",
        trainingType: "",
        provider: "",
        status: "SCHEDULED",
        certificationNumber: "",
        cost: "",
        startDate: new Date().toISOString().split("T")[0],
        completionDate: "",
        expirationDate: "",
        notes: "",
        isMandatory: false,
      });
    } catch (error: any) {
      console.error("Error creating training:", error);
      toast.error(error.message || "Failed to add training");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Training / Certification</DialogTitle>
          <DialogDescription>
            Record professional training, courses, or certifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 flex-1 overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 flex items-center justify-between">
              <Label htmlFor="isMandatory" className="font-semibold text-destructive">
                Mandatory Training?
              </Label>
              <Checkbox
                id="isMandatory"
                checked={formData.isMandatory}
                onCheckedChange={(c) => handleChange("isMandatory", !!c)}
              />
            </div>
          
            <div className="space-y-2 col-span-2">
              <Label htmlFor="trainingName">Training Name *</Label>
              <Input
                id="trainingName"
                placeholder="e.g. Forklift Operation Safety"
                value={formData.trainingName}
                onChange={(e) => handleChange("trainingName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingType">Type *</Label>
              <Select
                value={formData.trainingType}
                onValueChange={(value) => handleChange("trainingType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANDATORY">Mandatory</SelectItem>
                  <SelectItem value="SAFETY">Safety</SelectItem>
                  <SelectItem value="SKILL_DEVELOPMENT">Skill Development</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="CERTIFICATION">Certification</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="provider">Provider / Instructor</Label>
              <Input
                id="provider"
                placeholder="e.g. Coursera, Internal Team"
                value={formData.provider}
                onChange={(e) => handleChange("provider", e.target.value)}
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
              <Label htmlFor="completionDate">Completion Date</Label>
              <Input
                id="completionDate"
                type="date"
                value={formData.completionDate}
                onChange={(e) => handleChange("completionDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificationNumber">Cert. / License Number</Label>
              <Input
                id="certificationNumber"
                placeholder="Optional"
                value={formData.certificationNumber}
                onChange={(e) => handleChange("certificationNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => handleChange("expirationDate", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (MXN)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.cost}
                onChange={(e) => handleChange("cost", e.target.value)}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Training
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
