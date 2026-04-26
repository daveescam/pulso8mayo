"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { KpiFormulaEditor } from "./kpi-formula-editor";
import { KpiPreview } from "./kpi-preview";

const kpiFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  formula: z.string().min(1, "Formula is required"),
  metricType: z.enum(["PERCENTAGE", "COUNT", "AVERAGE", "SUM", "TIME", "RATIO"]),
  target: z.string().optional(),
  warningThreshold: z.string().optional(),
  criticalThreshold: z.string().optional(),
  thresholdType: z.enum(["MIN", "MAX", "TARGET", "RANGE"]),
  frequency: z.enum(["REALTIME", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"]),
  unit: z.string().optional(),
  decimalPlaces: z.string(),
  category: z.enum(["OPERATIONS", "COMPLIANCE", "LABOR", "INVENTORY"]),
});

type KpiFormValues = z.infer<typeof kpiFormSchema>;

interface KpiFormProps {
    onSuccess?: () => void;
}

export function KpiForm({ onSuccess }: KpiFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const form = useForm<KpiFormValues>({
        resolver: zodResolver(kpiFormSchema),
    defaultValues: {
      name: "",
      description: "",
      formula: "",
      metricType: "PERCENTAGE",
      target: "",
      warningThreshold: "",
      criticalThreshold: "",
      thresholdType: "TARGET",
      frequency: "DAILY",
      unit: "",
      decimalPlaces: "2",
      category: "OPERATIONS",
    },
    });

    const onSubmit = async (data: KpiFormValues) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch("/api/kpi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || "Failed to create KPI");
            }

            setSuccess(true);
            form.reset();
            onSuccess?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Custom KPI</CardTitle>
                <CardDescription>
                    Define a new Key Performance Indicator for your business
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>KPI created successfully!</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>
                            
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>KPI Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Compliance Rate" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            A clear, descriptive name for your KPI
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe what this KPI measures..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Formula Configuration */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Formula Configuration</h3>
                            
                            <FormField
                                control={form.control}
                                name="formula"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Formula</FormLabel>
                                        <FormControl>
                                            <KpiFormulaEditor
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Define how this KPI is calculated
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="metricType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Metric Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                                    <SelectItem value="COUNT">Count</SelectItem>
                                                    <SelectItem value="AVERAGE">Average</SelectItem>
                                                    <SelectItem value="SUM">Sum</SelectItem>
                                                    <SelectItem value="TIME">Time</SelectItem>
                                                    <SelectItem value="RATIO">Ratio</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="OPERATIONS">Operations</SelectItem>
                                                    <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                                                    <SelectItem value="LABOR">Labor</SelectItem>
                                                    <SelectItem value="INVENTORY">Inventory</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Targets and Thresholds */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Targets & Thresholds</h3>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="target"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Value</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="warningThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Warning Threshold</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormDescription>Yellow alert level</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="criticalThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Critical Threshold</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormDescription>Red alert level</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="thresholdType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Threshold Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select threshold type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="MIN">Minimum (value should be &gt;= target)</SelectItem>
                                                <SelectItem value="MAX">Maximum (value should be &lt;= target)</SelectItem>
                                                <SelectItem value="TARGET">Target (value should be = target)</SelectItem>
                                                <SelectItem value="RANGE">Range (value should be within range)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Display Settings */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Display Settings</h3>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="unit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., %, hrs, units" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="decimalPlaces"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Decimal Places</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} max={4} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Calculation Frequency</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select frequency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="REALTIME">Real-time</SelectItem>
                                                    <SelectItem value="HOURLY">Hourly</SelectItem>
                                                    <SelectItem value="DAILY">Daily</SelectItem>
                                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        <KpiPreview values={form.watch()} />

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating KPI...
                                </>
                            ) : (
                                "Create KPI"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
