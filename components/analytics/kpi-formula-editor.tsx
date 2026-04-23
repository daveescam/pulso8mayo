"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Plus, HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface KpiFormulaEditorProps {
    value: string;
    onChange: (value: string) => void;
}

// Common formula tokens for HORECA KPIs
const formulaTokens = [
    { label: "Completed Workflows", token: "completed_workflows", category: "Workflow" },
    { label: "Total Workflows", token: "total_workflows", category: "Workflow" },
    { label: "On-Time Workflows", token: "on_time_workflows", category: "Workflow" },
    { label: "Overdue Workflows", token: "overdue_workflows", category: "Workflow" },
    { label: "Total Items", token: "total_items", category: "Inventory" },
    { label: "Out of Stock Items", token: "out_of_stock_items", category: "Inventory" },
    { label: "Expired Items", token: "expired_items", category: "Inventory" },
    { label: "Accurate Items", token: "accurate_items", category: "Inventory" },
    { label: "Attended Shifts", token: "attended_shifts", category: "Labor" },
    { label: "Scheduled Shifts", token: "scheduled_shifts", category: "Labor" },
    { label: "Overtime Hours", token: "overtime_hours", category: "Labor" },
    { label: "Compliant Breaks", token: "compliant_breaks", category: "Labor" },
    { label: "Total Breaks", token: "total_breaks", category: "Labor" },
    { label: "NOM-251 Completed", token: "nom251_completed", category: "Compliance" },
    { label: "NOM-251 Total", token: "nom251_total", category: "Compliance" },
    { label: "NOM-035 Completed", token: "nom035_completed", category: "Compliance" },
    { label: "NOM-035 Total", token: "nom035_total", category: "Compliance" },
];

const operators = [
    { label: "+", description: "Add" },
    { label: "-", description: "Subtract" },
    { label: "*", description: "Multiply" },
    { label: "/", description: "Divide" },
    { label: "(", description: "Open parenthesis" },
    { label: ")", description: "Close parenthesis" },
];

const functions = [
    { label: "SUM()", description: "Sum of values" },
    { label: "AVG()", description: "Average of values" },
    { label: "COUNT()", description: "Count of items" },
    { label: "MIN()", description: "Minimum value" },
    { label: "MAX()", description: "Maximum value" },
];

export function KpiFormulaEditor({ value, onChange }: KpiFormulaEditorProps) {
    const [activeCategory, setActiveCategory] = React.useState<string>("All");

    const categories = ["All", ...Array.from(new Set(formulaTokens.map(t => t.category)))];

    const filteredTokens = activeCategory === "All"
        ? formulaTokens
        : formulaTokens.filter(t => t.category === activeCategory);

    const insertToken = (token: string) => {
        const newValue = value ? `${value} ${token}` : token;
        onChange(newValue);
    };

    const insertOperator = (operator: string) => {
        const newValue = `${value}${operator}`;
        onChange(newValue);
    };

    const clearFormula = () => {
        onChange("");
    };

    return (
        <div className="space-y-4">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter formula, e.g., (completed_workflows / total_workflows) * 100"
                className="font-mono text-sm min-h-[100px]"
            />

            <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                    <Badge
                        key={category}
                        variant={category === activeCategory ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setActiveCategory(category)}
                    >
                        {category}
                    </Badge>
                ))}
            </div>

            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        <span className="font-semibold text-sm">Formula Builder</span>
                    </div>

                    {/* Tokens */}
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Metrics</div>
                        <div className="flex flex-wrap gap-2">
                            {filteredTokens.map((item) => (
                                <TooltipProvider key={item.token}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => insertToken(item.token)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                {item.label}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">Inserts: {item.token}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>

                    {/* Operators */}
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Operators</div>
                        <div className="flex flex-wrap gap-2">
                            {operators.map((op) => (
                                <TooltipProvider key={op.label}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="font-mono"
                                                onClick={() => insertOperator(op.label)}
                                            >
                                                {op.label}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">{op.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>

                    {/* Functions */}
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Functions</div>
                        <div className="flex flex-wrap gap-2">
                            {functions.map((fn) => (
                                <TooltipProvider key={fn.label}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="font-mono"
                                                onClick={() => insertToken(fn.label)}
                                            >
                                                {fn.label}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">{fn.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>

                    {/* Clear button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFormula}
                        className="text-xs text-muted-foreground"
                    >
                        Clear Formula
                    </Button>
                </CardContent>
            </Card>

            {/* Formula help */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <HelpCircle className="h-4 w-4 mt-0.5" />
                <div>
                    <p>Use tokens to build your formula. Example: <code className="bg-muted px-1 py-0.5 rounded">(completed_workflows / total_workflows) * 100</code></p>
                    <p className="mt-1">The formula will be evaluated against your database to calculate the KPI value.</p>
                </div>
            </div>
        </div>
    );
}
