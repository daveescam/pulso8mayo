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

// Common formula tokens for Restaurant/HORECA KPIs
const formulaTokens = [
  // Operations - Workflows
  { label: "Workflows Completados", token: "completed_workflows", category: "Operaciones" },
  { label: "Total Workflows", token: "total_workflows", category: "Operaciones" },
  { label: "Workflows a Tiempo", token: "on_time_workflows", category: "Operaciones" },
  { label: "Workflows Vencidos", token: "overdue_workflows", category: "Operaciones" },
  { label: "Aperturas Tempranas", token: "early_openings", category: "Operaciones" },
  { label: "Total Aperturas", token: "total_openings", category: "Operaciones" },
  { label: "Cierres a Tiempo", token: "on_time_closings", category: "Operaciones" },
  { label: "Total Cierres", token: "total_closings", category: "Operaciones" },
  { label: "Inspecciones Calidad OK", token: "quality_passed", category: "Operaciones" },
  { label: "Total Inspecciones", token: "quality_total", category: "Operaciones" },
  { label: "Lecturas Temp OK", token: "temp_compliant_readings", category: "Operaciones" },
  { label: "Total Lecturas Temp", token: "total_temp_readings", category: "Operaciones" },
  
  // Inventory
  { label: "Ítems Precisos", token: "accurate_items", category: "Inventario" },
  { label: "Total Ítems", token: "total_items", category: "Inventario" },
  { label: "Productos Sin Stock", token: "out_of_stock_items", category: "Inventario" },
  { label: "Total SKUs", token: "total_sku_count", category: "Inventario" },
  { label: "Ítems Críticos Sin Stock", token: "critical_out_of_stock_items", category: "Inventario" },
  { label: "Ítems por Vencer (7d)", token: "expiring_items_7days", category: "Inventario" },
  { label: "Ítems Vencidos", token: "expired_items", category: "Inventario" },
  { label: "Valor Merma", token: "waste_value", category: "Inventario" },
  { label: "Valor Inventario", token: "inventory_value", category: "Inventario" },
  { label: "Recepciones Precisas", token: "accurate_receipts", category: "Inventario" },
  { label: "Total Recepciones", token: "total_receipts", category: "Inventario" },
  { label: "Stock Bajo", token: "low_stock_items", category: "Inventario" },
  { label: "Ítems Sobre Mínimo", token: "items_above_minimum", category: "Inventario" },
  
  // Labor
  { label: "Turnos Atendidos", token: "attended_shifts", category: "Personal" },
  { label: "Turnos Programados", token: "scheduled_shifts", category: "Personal" },
  { label: "Horas Extra", token: "overtime_hours", category: "Personal" },
  { label: "Horas Regulares", token: "regular_hours", category: "Personal" },
  { label: "Pausas Cumplidas", token: "compliant_breaks", category: "Personal" },
  { label: "Pausas Requeridas", token: "total_breaks_required", category: "Personal" },
  { label: "Pausas Tomadas", token: "breaks_taken", category: "Personal" },
  { label: "Empleados", token: "total_employees", category: "Personal" },
  { label: "Empleados con Expediente OK", token: "complete_employee_files", category: "Personal" },
  { label: "Llegadas a Tiempo", token: "on_time_arrivals", category: "Personal" },
  { label: "Total Llegadas", token: "total_arrivals", category: "Personal" },
  { label: "Turnos Cubiertos", token: "covered_shifts", category: "Personal" },
  
  // Compliance
  { label: "NOM-251 Completado", token: "nom251_completed", category: "Cumplimiento" },
  { label: "NOM-251 Total", token: "nom251_total", category: "Cumplimiento" },
  { label: "Ítems Críticos OK", token: "critical_items_passed", category: "Cumplimiento" },
  { label: "Total Ítems Críticos", token: "critical_items_total", category: "Cumplimiento" },
  { label: "NOM-035 Completado", token: "nom035_completed", category: "Cumplimiento" },
  { label: "NOM-035 Total", token: "nom035_total", category: "Cumplimiento" },
  { label: "Verificaciones IA", token: "ai_verified_photos", category: "Cumplimiento" },
  { label: "Total Fotos", token: "total_photos", category: "Cumplimiento" },
  { label: "Verif. IA Correctas", token: "correct_ai_verifications", category: "Cumplimiento" },
  { label: "Total Verif. IA", token: "total_ai_verifications", category: "Cumplimiento" },
  
  // Financial
  { label: "Costo de Ventas", token: "cost_of_goods_sold", category: "Financiero" },
  { label: "Costo Ventas Diario", token: "daily_cost_of_goods_sold", category: "Financiero" },
  { label: "Valor Inventario Prom", token: "avg_inventory_value", category: "Financiero" },
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
