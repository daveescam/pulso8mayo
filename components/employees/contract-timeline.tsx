"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, DollarSign, FileText, Plus } from "lucide-react";

export interface Contract {
  id: string;
  contractNumber: string;
  contractType: string;
  workRegime: string;
  startDate: Date;
  endDate?: Date;
  baseSalary: number;
  monthlySalary?: number;
  weeklySalary?: number;
  status: string;
  workStartTime?: string;
  workEndTime?: string;
  workDays?: number[];
  hasHealthInsurance?: boolean;
  hasLifeInsurance?: boolean;
  hasSavingsFund?: boolean;
  hasFoodVouchers?: boolean;
}

interface ContractTimelineProps {
  contracts: Contract[];
  activeContractId?: string;
  onCreateContract?: () => void;
  onViewContract?: (contractId: string) => void;
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  DETERMINATE: "Determinate",
  INDETERMINATE: "Indeterminate",
  PROBATION: "Probation",
  TRAINING: "Training",
  SEASONAL: "Seasonal",
  PART_TIME: "Part Time",
};

const WORK_REGIME_LABELS: Record<string, string> = {
  DAILY: "Daily",
  MIXED: "Mixed",
  NIGHT: "Night",
  SPLIT_SHIFT: "Split Shift",
  ON_CALL: "On Call",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  TERMINATED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  RENEWED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

const formatSalary = (cents: number) => {
  const pesos = cents / 100;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(pesos);
};

const WORK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ContractTimeline({
  contracts,
  activeContractId,
  onCreateContract,
  onViewContract,
}: ContractTimelineProps) {
  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Contracts Yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Create the first employment contract for this employee
          </p>
          {onCreateContract && (
            <Button onClick={onCreateContract}>
              <Plus className="mr-2 h-4 w-4" />
              Create Contract
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const sortedContracts = [...contracts].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const activeContract = contracts.find((c) => c.id === activeContractId) || contracts.find((c) => c.status === "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Active Contract Summary */}
      {activeContract && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Active Contract
                </CardTitle>
                <CardDescription>
                  Contract #{activeContract.contractNumber}
                </CardDescription>
              </div>
              <Badge className={STATUS_COLORS[activeContract.status]}>
                {activeContract.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Contract Type</span>
                </div>
                <p className="font-medium">
                  {CONTRACT_TYPE_LABELS[activeContract.contractType] || activeContract.contractType}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Work Regime</span>
                </div>
                <p className="font-medium">
                  {WORK_REGIME_LABELS[activeContract.workRegime] || activeContract.workRegime}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Daily Salary</span>
                </div>
                <p className="font-medium">{formatSalary(activeContract.baseSalary)}</p>
              </div>
            </div>

            {activeContract.workStartTime && activeContract.workEndTime && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Work Schedule</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {activeContract.workStartTime} - {activeContract.workEndTime}
                  </span>
                  {activeContract.workDays && (
                    <div className="flex gap-1">
                      {WORK_DAYS.map((day, idx) => (
                        <Badge
                          key={day}
                          variant={activeContract.workDays.includes(idx) ? "default" : "outline"}
                          className="text-xs"
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(activeContract.hasHealthInsurance ||
              activeContract.hasLifeInsurance ||
              activeContract.hasSavingsFund ||
              activeContract.hasFoodVouchers) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Benefits</p>
                <div className="flex flex-wrap gap-2">
                  {activeContract.hasHealthInsurance && (
                    <Badge variant="secondary">Health Insurance</Badge>
                  )}
                  {activeContract.hasLifeInsurance && (
                    <Badge variant="secondary">Life Insurance</Badge>
                  )}
                  {activeContract.hasSavingsFund && (
                    <Badge variant="secondary">Savings Fund</Badge>
                  )}
                  {activeContract.hasFoodVouchers && (
                    <Badge variant="secondary">Food Vouchers</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contract History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract History</CardTitle>
              <CardDescription>
                All contracts for this employee ({contracts.length} total)
              </CardDescription>
            </div>
            {onCreateContract && (
              <Button variant="outline" size="sm" onClick={onCreateContract}>
                <Plus className="mr-2 h-4 w-4" />
                New Contract
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedContracts.map((contract, index) => (
              <div
                key={contract.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                  contract.id === activeContractId ? "border-primary bg-accent" : ""
                }`}
                onClick={() => onViewContract?.(contract.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {index < sortedContracts.length - 1 && (
                        <div className="w-0.5 h-8 bg-border mt-1" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          Contract #{contract.contractNumber}
                        </p>
                        <Badge className={STATUS_COLORS[contract.status]} variant="secondary">
                          {contract.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {CONTRACT_TYPE_LABELS[contract.contractType]} -{" "}
                        {WORK_REGIME_LABELS[contract.workRegime]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatSalary(contract.baseSalary)}</p>
                    <p className="text-xs text-muted-foreground">daily</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {format(new Date(contract.startDate), "MMM d, yyyy", { locale: es })}
                    </p>
                  </div>

                  {contract.endDate ? (
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="font-medium">
                        {format(new Date(contract.endDate), "MMM d, yyyy", { locale: es })}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="font-medium text-muted-foreground">Indeterminate</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="font-medium">
                      {contract.monthlySalary ? formatSalary(contract.monthlySalary) : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Weekly</p>
                    <p className="font-medium">
                      {contract.weeklySalary ? formatSalary(contract.weeklySalary) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Salary Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Summary</CardTitle>
          <CardDescription>Current compensation breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {activeContract && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-accent">
                <p className="text-sm text-muted-foreground mb-1">Daily Salary</p>
                <p className="text-2xl font-bold">{formatSalary(activeContract.baseSalary)}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent">
                <p className="text-sm text-muted-foreground mb-1">Weekly Salary</p>
                <p className="text-2xl font-bold">
                  {activeContract.weeklySalary ? formatSalary(activeContract.weeklySalary) : "—"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent">
                <p className="text-sm text-muted-foreground mb-1">Monthly Salary</p>
                <p className="text-2xl font-bold">
                  {activeContract.monthlySalary ? formatSalary(activeContract.monthlySalary) : "—"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
