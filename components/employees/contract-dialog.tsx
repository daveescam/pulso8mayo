"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const contractSchema = z.object({
  contractNumber: z.string().min(1, "Contract number is required"),
  contractType: z.enum(['DETERMINATE', 'INDETERMINATE', 'PROBATION', 'TRAINING', 'SEASONAL', 'PART_TIME']),
  workRegime: z.enum(['DAILY', 'MIXED', 'NIGHT', 'SPLIT_SHIFT', 'ON_CALL']),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional(),
  probationPeriodDays: z.number().min(0).optional(),
  signatureDate: z.date().optional(),
  baseSalary: z.number().min(0, "Base salary must be positive"),
  monthlySalary: z.number().min(0).optional(),
  weeklySalary: z.number().min(0).optional(),
  currency: z.string().default('MXN'),
  hasHealthInsurance: z.boolean().default(false),
  hasLifeInsurance: z.boolean().default(false),
  hasSavingsFund: z.boolean().default(false),
  hasFoodVouchers: z.boolean().default(false),
  hasTransportationBonus: z.boolean().default(false),
  benefitsNotes: z.string().optional(),
  workStartTime: z.string().optional(),
  workEndTime: z.string().optional(),
  breakDurationMinutes: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).default('ACTIVE'),
  autoRenew: z.boolean().default(false),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contract?: any;
  employeeId: string;
  companyId: string;
  branchId?: string;
}

const contractTypeOptions = [
  { value: 'DETERMINATE', label: 'Determinate Duration' },
  { value: 'INDETERMINATE', label: 'Indeterminate Duration' },
  { value: 'PROBATION', label: 'Probation Period' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'SEASONAL', label: 'Seasonal' },
  { value: 'PART_TIME', label: 'Part Time' },
];

const workRegimeOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'MIXED', label: 'Mixed' },
  { value: 'NIGHT', label: 'Night' },
  { value: 'SPLIT_SHIFT', label: 'Split Shift' },
  { value: 'ON_CALL', label: 'On Call' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'RENEWED', label: 'Renewed' },
];

export function ContractDialog({
  open,
  onOpenChange,
  onSuccess,
  contract,
  employeeId,
  companyId,
  branchId,
}: ContractDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!contract;

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contractNumber: '',
      contractType: 'INDETERMINATE',
      workRegime: 'DAILY',
      baseSalary: 0,
      currency: 'MXN',
      hasHealthInsurance: false,
      hasLifeInsurance: false,
      hasSavingsFund: false,
      hasFoodVouchers: false,
      hasTransportationBonus: false,
      status: 'ACTIVE',
      autoRenew: false,
      benefitsNotes: '',
      workStartTime: '',
      workEndTime: '',
      terms: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (contract && open) {
      form.reset({
        contractNumber: contract.contractNumber || '',
        contractType: contract.contractType || 'INDETERMINATE',
        workRegime: contract.workRegime || 'DAILY',
        startDate: contract.startDate ? new Date(contract.startDate) : undefined,
        endDate: contract.endDate ? new Date(contract.endDate) : undefined,
        probationPeriodDays: contract.probationPeriodDays || undefined,
        signatureDate: contract.signatureDate ? new Date(contract.signatureDate) : undefined,
        baseSalary: contract.baseSalary / 100 || 0, // Convert from cents
        monthlySalary: contract.monthlySalary ? contract.monthlySalary / 100 : undefined,
        weeklySalary: contract.weeklySalary ? contract.weeklySalary / 100 : undefined,
        currency: contract.currency || 'MXN',
        hasHealthInsurance: contract.hasHealthInsurance || false,
        hasLifeInsurance: contract.hasLifeInsurance || false,
        hasSavingsFund: contract.hasSavingsFund || false,
        hasFoodVouchers: contract.hasFoodVouchers || false,
        hasTransportationBonus: contract.hasTransportationBonus || false,
        benefitsNotes: contract.benefitsNotes || '',
        workStartTime: contract.workStartTime || '',
        workEndTime: contract.workEndTime || '',
        breakDurationMinutes: contract.breakDurationMinutes || undefined,
        status: contract.status || 'ACTIVE',
        autoRenew: contract.autoRenew || false,
        terms: contract.terms || '',
        notes: contract.notes || '',
      });
    } else if (!contract && open) {
      form.reset({
        contractNumber: '',
        contractType: 'INDETERMINATE',
        workRegime: 'DAILY',
        baseSalary: 0,
        currency: 'MXN',
        hasHealthInsurance: false,
        hasLifeInsurance: false,
        hasSavingsFund: false,
        hasFoodVouchers: false,
        hasTransportationBonus: false,
        status: 'ACTIVE',
        autoRenew: false,
        benefitsNotes: '',
        workStartTime: '',
        workEndTime: '',
        terms: '',
        notes: '',
      });
    }
  }, [contract, open, form]);

  const onSubmit = async (data: ContractFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        userId: employeeId,
        companyId,
        branchId,
        baseSalary: Math.round(data.baseSalary * 100), // Convert to cents
        monthlySalary: data.monthlySalary ? Math.round(data.monthlySalary * 100) : undefined,
        weeklySalary: data.weeklySalary ? Math.round(data.weeklySalary * 100) : undefined,
        startDate: data.startDate.toISOString().split('T')[0],
        endDate: data.endDate?.toISOString().split('T')[0],
        signatureDate: data.signatureDate?.toISOString().split('T')[0],
      };

      const url = isEditing
        ? `/api/employees/contracts/${contract.id}`
        : '/api/employees/contracts';

      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Contract updated successfully' : 'Contract created successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save contract');
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Failed to save contract');
    } finally {
      setLoading(false);
    }
  };

  const watchedBaseSalary = form.watch('baseSalary');
  const suggestedMonthly = watchedBaseSalary * 30;
  const suggestedWeekly = watchedBaseSalary * 7;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Contract' : 'Create New Contract'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update contract details and salary information.' : 'Create a new employment contract with salary details.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contract Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contract Information</h3>

                <FormField
                  control={form.control}
                  name="contractNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CNT-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contract type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contractTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workRegime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Regime *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select work regime" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workRegimeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Salary Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Salary Information</h3>

                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Base Salary (MXN) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weeklySalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekly Salary (MXN)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={suggestedWeekly.toFixed(2)}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlySalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Salary (MXN)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={suggestedMonthly.toFixed(2)}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  Suggested: Weekly ${suggestedWeekly.toFixed(2)}, Monthly ${suggestedMonthly.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Benefits & Perks</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="hasHealthInsurance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Health Insurance</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasLifeInsurance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Life Insurance</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasSavingsFund"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Savings Fund</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasFoodVouchers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Food Vouchers</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasTransportationBonus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Transportation Bonus</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="benefitsNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional benefits or notes..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Work Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Work Schedule</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="workStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="breakDurationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="probationPeriodDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probation (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Terms</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Specific terms and conditions..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Internal notes about this contract..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="autoRenew"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Auto-renew contract when it expires</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
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
                {isEditing ? 'Update Contract' : 'Create Contract'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}