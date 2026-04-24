"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ContractDialog } from "@/components/employees/contract-dialog";

interface ContractsTabProps {
  contracts: any[];
  salaryHistory: any[];
  canEdit?: boolean;
  employeeId?: string;
  companyId?: string;
  branchId?: string;
  onContractCreated?: () => void;
  onContractUpdated?: () => void;
}

const contractTypeLabels: Record<string, string> = {
  DETERMINATE: "Determinate Duration",
  INDETERMINATE: "Indeterminate Duration",
  PROBATION: "Probation Period",
  TRAINING: "Training",
  SEASONAL: "Seasonal",
  PART_TIME: "Part Time",
};

const contractTypeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DETERMINATE: "default",
  INDETERMINATE: "default",
  PROBATION: "secondary",
  TRAINING: "secondary",
  SEASONAL: "outline",
  PART_TIME: "outline",
};

const workRegimeLabels: Record<string, string> = {
  DAILY: "Daily",
  MIXED: "Mixed",
  NIGHT: "Night",
  SPLIT_SHIFT: "Split Shift",
  ON_CALL: "On Call",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  TERMINATED: "Terminated",
  RENEWED: "Renewed",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  EXPIRED: "outline",
  TERMINATED: "destructive",
  RENEWED: "secondary",
};

const salaryChangeTypeLabels: Record<string, string> = {
  INITIAL: "Initial",
  ADJUSTMENT: "Adjustment",
  PROMOTION: "Promotion",
  DEMOTION: "Demotion",
  COLA: "Cost of Living",
  MERIT: "Merit",
  OTHER: "Other",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

export function ContractsTab({
  contracts,
  salaryHistory,
  canEdit = false,
  employeeId,
  companyId,
  branchId,
  onContractCreated,
  onContractUpdated
}: ContractsTabProps) {
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const activeContract = contracts.find((c) => c.status === "ACTIVE");
  const latestSalaryChange = salaryHistory?.[0];

  const handleCreateContract = () => {
    setSelectedContract(null);
    setContractDialogOpen(true);
  };

  const handleEditContract = (contract: any) => {
    setSelectedContract(contract);
    setContractDialogOpen(true);
  };

  const handleContractSuccess = () => {
    setContractDialogOpen(false);
    setSelectedContract(null);
    if (onContractCreated) onContractCreated();
    if (onContractUpdated) onContractUpdated();
  };
  
  // Calcular salario actual: priorizar contrato activo, luego último registro de salario
  let dailySalary = 0;
  let weeklySalary = 0;
  let monthlySalary = 0;
  let salarySourceLabel = "Sin salario registrado";

  if (activeContract) {
    dailySalary = activeContract.baseSalary ?? 0;
    weeklySalary = activeContract.weeklySalary ?? (dailySalary * 7);
    monthlySalary = activeContract.monthlySalary ?? (dailySalary * 30);
    salarySourceLabel = "Basado en el contrato activo";
  } else if (latestSalaryChange) {
    dailySalary = latestSalaryChange.newSalary ?? 0;
    weeklySalary = dailySalary * 7;
    monthlySalary = dailySalary * 30;
    salarySourceLabel = "Basado en el último cambio salarial registrado";
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contracts</h2>
          <p className="text-muted-foreground">
            Manage employment contracts and salary information
          </p>
        </div>
        {canEdit && employeeId && companyId && (
          <Button onClick={handleCreateContract}>
            <Plus className="mr-2 h-4 w-4" />
            Create Contract
          </Button>
        )}
      </div>

      {/* Active Contract */}
      {activeContract && (
        <Card>
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
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditContract(activeContract)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contract
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Contract Type</Label>
                <Badge
                  variant={contractTypeColors[activeContract.contractType] || "outline"}
                >
                  {contractTypeLabels[activeContract.contractType] || activeContract.contractType}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge variant={statusColors[activeContract.status] || "outline"}>
                  {statusLabels[activeContract.status] || activeContract.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Work Regime</Label>
                <div className="text-sm font-medium">
                  {workRegimeLabels[activeContract.workRegime] || activeContract.workRegime}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <div className="text-sm font-medium">
                  {activeContract.startDate
                    ? format(new Date(activeContract.startDate), "MMM d, yyyy", { locale: es })
                    : "N/A"}
                </div>
              </div>
              {activeContract.endDate && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <div className="text-sm font-medium">
                    {format(new Date(activeContract.endDate), "MMM d, yyyy", { locale: es })}
                  </div>
                </div>
              )}
              {activeContract.probationPeriodDays && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Probation Period</Label>
                  <div className="text-sm font-medium">
                    {activeContract.probationPeriodDays} days
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <Separator className="my-4" />
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Benefits</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Health Insurance:</span>
                  <Badge
                    variant={activeContract.hasHealthInsurance ? "default" : "outline"}
                    className="ml-2"
                  >
                    {activeContract.hasHealthInsurance ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Life Insurance:</span>
                  <Badge
                    variant={activeContract.hasLifeInsurance ? "default" : "outline"}
                    className="ml-2"
                  >
                    {activeContract.hasLifeInsurance ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Savings Fund:</span>
                  <Badge
                    variant={activeContract.hasSavingsFund ? "default" : "outline"}
                    className="ml-2"
                  >
                    {activeContract.hasSavingsFund ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Food Vouchers:</span>
                  <Badge
                    variant={activeContract.hasFoodVouchers ? "default" : "outline"}
                    className="ml-2"
                  >
                    {activeContract.hasFoodVouchers ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Transport Bonus:</span>
                  <Badge
                    variant={activeContract.hasTransportationBonus ? "default" : "outline"}
                    className="ml-2"
                  >
                    {activeContract.hasTransportationBonus ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Work Schedule */}
            {(activeContract.workStartTime || activeContract.workEndTime) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Work Schedule</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Start Time:</span>
                      <span className="ml-2 font-medium">
                        {activeContract.workStartTime || "N/A"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">End Time:</span>
                      <span className="ml-2 font-medium">
                        {activeContract.workEndTime || "N/A"}
                      </span>
                    </div>
                    {activeContract.breakDurationMinutes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Break:</span>
                        <span className="ml-2 font-medium">
                          {activeContract.breakDurationMinutes} minutes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compensation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Compensation
              </CardTitle>
              <CardDescription>Current salary breakdown and history.</CardDescription>
            </div>
            {canEdit && (
              <Badge variant="outline">Ajuste salarial pendiente</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 border rounded-lg">
              <Label className="text-xs text-muted-foreground">Daily Salary</Label>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(dailySalary / 100)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">per day</div>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="text-xs text-muted-foreground">Weekly Salary</Label>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(weeklySalary / 100)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">per week</div>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="text-xs text-muted-foreground">Monthly Salary</Label>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(monthlySalary / 100)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">per month</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{salarySourceLabel}</p>

          {/* Salary History */}
          {salaryHistory && salaryHistory.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Salary History</Label>
                <div className="space-y-2">
                  {salaryHistory.map((change: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {salaryChangeTypeLabels[change.changeType] || change.changeType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {change.reason || "No reason provided"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {change.effectiveDate
                            ? format(new Date(change.effectiveDate), "MMM d, yyyy", {
                                locale: es,
                              })
                            : "N/A"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(change.newSalary / 100)}
                        </div>
                        {change.percentageChange && (
                          <div
                            className={`text-xs ${
                              change.percentageChange > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {change.percentageChange > 0 ? "+" : ""}
                            {change.percentageChange}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contract History */}
      {contracts && contracts.length > 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contract History</CardTitle>
                <CardDescription>All contracts for this employee.</CardDescription>
              </div>
              {canEdit && <Badge variant="outline">Alta de contrato pendiente</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contracts
                .filter((c: any) => c.status !== "ACTIVE")
                .map((contract: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Contract #{contract.contractNumber}
                        </span>
                        <Badge
                          variant={contractTypeColors[contract.contractType] || "outline"}
                        >
                          {contractTypeLabels[contract.contractType] || contract.contractType}
                        </Badge>
                        <Badge variant={statusColors[contract.status] || "outline"}>
                          {statusLabels[contract.status] || contract.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {contract.startDate
                          ? format(new Date(contract.startDate), "MMM d, yyyy", { locale: es })
                          : "N/A"}
                        {contract.endDate
                          ? ` - ${format(new Date(contract.endDate), "MMM d, yyyy", {
                              locale: es,
                            })}`
                          : " - Present"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency((contract.baseSalary || 0) / 100)}/day
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditContract(contract)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Dialog */}
      {employeeId && companyId && (
        <ContractDialog
          open={contractDialogOpen}
          onOpenChange={setContractDialogOpen}
          onSuccess={handleContractSuccess}
          contract={selectedContract}
          employeeId={employeeId}
          companyId={companyId}
          branchId={branchId}
        />
      )}
    </div>
  );
}
