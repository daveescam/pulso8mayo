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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const professionalSchema = z.object({
  // Employment Details
  employeeNumber: z.string().min(1, "Employee number is required"),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  seniorityDate: z.string().optional().or(z.literal("")),
  probationEndDate: z.string().optional().or(z.literal("")),
  
  // Employment Status
  employeeStatus: z.enum(["ONBOARDING", "ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED"]).optional(),
  isActive: z.boolean(),
  rehireEligible: z.boolean().optional(),
  terminationDate: z.string().optional().or(z.literal("")),
  terminationReason: z.enum(["VOLUNTARY_RESIGNATION", "TERMINATION_WITH_CAUSE", "TERMINATION_WITHOUT_CAUSE", "CONTRACT_EXPIRED", "RETIREMENT", "DEATH", "MUTUAL_AGREEMENT", "OTHER"]).optional(),
  
  // Work Schedule
  standardHoursPerWeek: z.number().min(1).max(168).optional(),
  
  // Skills & Languages
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  notes: z.string().optional().or(z.literal("")),
});

type ProfessionalFormValues = z.infer<typeof professionalSchema>;

interface ProfessionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  employeeId: string;
  profile: any;
}

export function ProfessionalDialog({
  open,
  onOpenChange,
  onSuccess,
  employeeId,
  profile,
}: ProfessionalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");

  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      employeeNumber: "",
      position: "",
      department: "",
      hireDate: "",
      seniorityDate: "",
      probationEndDate: "",
      employeeStatus: "ACTIVE",
      isActive: true,
      rehireEligible: true,
      terminationDate: "",
      terminationReason: undefined,
      standardHoursPerWeek: 40,
      skills: [],
      languages: [],
      notes: "",
    },
  });

  // Reset form when profile changes or dialog opens
  useEffect(() => {
    if (open && profile) {
      const skills = profile.skills || [];
      const languages = profile.languages || [];
      
      setSkillsInput(skills.join(", "));
      setLanguagesInput(languages.join(", "));
      
      form.reset({
        employeeNumber: profile.employeeNumber || "",
        position: profile.position || "",
        department: profile.department || "",
        hireDate: profile.hireDate ? new Date(profile.hireDate).toISOString().split("T")[0] : "",
        seniorityDate: profile.seniorityDate ? new Date(profile.seniorityDate).toISOString().split("T")[0] : "",
        probationEndDate: profile.probationEndDate ? new Date(profile.probationEndDate).toISOString().split("T")[0] : "",
        employeeStatus: profile.employeeStatus || "ACTIVE",
        isActive: profile.isActive !== false,
        rehireEligible: profile.rehireEligible !== false,
        terminationDate: profile.terminationDate ? new Date(profile.terminationDate).toISOString().split("T")[0] : "",
        terminationReason: profile.terminationReason || undefined,
        standardHoursPerWeek: profile.standardHoursPerWeek || 40,
        skills: skills,
        languages: languages,
        notes: profile.notes || "",
      });
    }
  }, [profile, open, form]);

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    const skills = value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    form.setValue("skills", skills);
  };

  const handleLanguagesChange = (value: string) => {
    setLanguagesInput(value);
    const languages = value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    form.setValue("languages", languages);
  };

  async function onSubmit(values: ProfessionalFormValues) {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success("Professional information updated successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update professional information");
      }
    } catch (error) {
      console.error("Error updating professional information:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Professional Information</DialogTitle>
          <DialogDescription>
            Update the employee's job details, status, and professional information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Engineering" {...field} />
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
                  name="seniorityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seniority Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="probationEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probation End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Employment Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Employment Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="employeeStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          <SelectItem value="TERMINATED">Terminated</SelectItem>
                          <SelectItem value="RESIGNED">Resigned</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rehireEligible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rehire Eligible</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terminationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termination Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terminationReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termination Reason</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VOLUNTARY_RESIGNATION">Voluntary Resignation</SelectItem>
                          <SelectItem value="TERMINATION_WITH_CAUSE">Termination with Cause</SelectItem>
                          <SelectItem value="TERMINATION_WITHOUT_CAUSE">Termination without Cause</SelectItem>
                          <SelectItem value="CONTRACT_EXPIRED">Contract Expired</SelectItem>
                          <SelectItem value="RETIREMENT">Retirement</SelectItem>
                          <SelectItem value="DEATH">Death</SelectItem>
                          <SelectItem value="MUTUAL_AGREEMENT">Mutual Agreement</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Work Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Work Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="standardHoursPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard Hours per Week</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="168" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 40)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Skills & Languages */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skills & Languages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="JavaScript, React, Node.js" 
                          value={skillsInput}
                          onChange={(e) => handleSkillsChange(e.target.value)}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Separate skills with commas
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Spanish, English, French" 
                          value={languagesInput}
                          onChange={(e) => handleLanguagesChange(e.target.value)}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Separate languages with commas
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HR Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about the employee..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}