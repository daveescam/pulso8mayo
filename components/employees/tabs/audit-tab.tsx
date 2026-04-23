"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  Filter,
  Download as DownloadIcon,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

interface AuditTabProps {
  userId: string;
}

const actionLabels: Record<string, string> = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  VIEW: "View",
  EXPORT: "Export",
  IMPORT: "Import",
};

const actionColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  VIEW: "outline",
  EXPORT: "outline",
  IMPORT: "outline",
};

const entityTypeLabels: Record<string, string> = {
  PROFILE: "Profile",
  CONTRACT: "Contract",
  SALARY: "Salary",
  DOCUMENT: "Document",
  ONBOARDING: "Onboarding",
  OFFBOARDING: "Offboarding",
  BENEFITS: "Benefits",
  TRAINING: "Training",
};

export function AuditTab({ userId }: AuditTabProps) {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entityType: "",
    action: "",
    dateFrom: "",
    dateTo: "",
    sensitiveOnly: false,
  });

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId,
        page: "1",
        limit: "50",
      });

      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.action) params.set("action", filters.action);
      if (filters.dateFrom) params.set("startDate", filters.dateFrom);
      if (filters.dateTo) params.set("endDate", filters.dateTo);
      if (filters.sensitiveOnly) params.set("isSensitive", "true");

      const response = await fetch(`/api/employees/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Error fetching audit logs");
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchAuditLogs();
  });

  const maskSensitiveData = (value: any): string => {
    if (!value) return "N/A";
    const str = typeof value === "string" ? value : JSON.stringify(value);
    if (str.length <= 4) return "••••";
    return str.slice(0, 2) + "••••" + str.slice(-2);
  };

  return (
    <div className="space-y-6">
      {/* Audit Log Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                Complete history of changes made to this employee's record
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Entity Type</Label>
              <Select
                value={filters.entityType || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, entityType: v === "all" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(entityTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Action</Label>
              <Select
                value={filters.action || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, action: v === "all" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ ...filters, sensitiveOnly: !filters.sensitiveOnly })}
              >
                {filters.sensitiveOnly ? "Showing Sensitive" : "Show Sensitive Only"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
          <CardDescription>
            {auditLogs.length} record(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : auditLogs.length > 0 ? (
            <div className="space-y-2">
              {auditLogs.map((log: any, index: number) => (
                <div key={log.id || index} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={actionColors[log.action] || "outline"}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      <Badge variant="outline">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </Badge>
                      {log.isSensitive && (
                        <Badge variant="destructive">Sensitive</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.performedAt
                        ? format(new Date(log.performedAt), "MMM d, yyyy h:mm a", {
                            locale: es,
                          })
                        : "N/A"}
                    </div>
                  </div>

                  {/* Field changes */}
                  {log.fieldName && (
                    <div className="pl-2 border-l-2 border-muted">
                      <div className="text-sm font-medium">{log.fieldName}</div>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                        <div>
                          <Label className="text-muted-foreground">Old Value</Label>
                          <div className="font-mono bg-muted p-2 rounded mt-1">
                            {log.isSensitive
                              ? maskSensitiveData(log.oldValue)
                              : log.oldValue
                                ? typeof log.oldValue === "object"
                                  ? JSON.stringify(log.oldValue)
                                  : log.oldValue
                                : "null"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">New Value</Label>
                          <div className="font-mono bg-muted p-2 rounded mt-1">
                            {log.isSensitive
                              ? maskSensitiveData(log.newValue)
                              : log.newValue
                                ? typeof log.newValue === "object"
                                  ? JSON.stringify(log.newValue)
                                  : log.newValue
                                : "null"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Performed by */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <div>
                      Performed by:{" "}
                      <span className="font-medium">
                        {log.performedByName || log.performedBy || "Unknown"}
                      </span>
                    </div>
                    {log.ipAddress && (
                      <div>IP: {log.ipAddress}</div>
                    )}
                    {log.reason && (
                      <div>Reason: {log.reason}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
              <p className="text-muted-foreground text-sm">
                No changes have been recorded for this employee yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
