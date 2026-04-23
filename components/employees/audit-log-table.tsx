"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronRight, Download, Filter, Search } from "lucide-react";

export interface AuditLog {
  id: string;
  timestamp: Date;
  userName: string;
  userEmail: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "EXPORT" | "IMPORT";
  entityType: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  isSensitive: boolean;
}

interface AuditLogTableProps {
  auditLogs: AuditLog[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onExport: () => void;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  VIEW: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  EXPORT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  IMPORT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

const maskSensitiveData = (value: any, isSensitive: boolean, hasPermission: boolean = false) => {
  if (isSensitive && !hasPermission) {
    return "••••••••";
  }
  return value;
};

export function AuditLogTable({
  auditLogs,
  loading,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onExport,
}: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [filterEntityType, setFilterEntityType] = useState<string>("ALL");
  const [showSensitive, setShowSensitive] = useState(false);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.fieldName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    const matchesEntityType = filterEntityType === "ALL" || log.entityType === filterEntityType;
    const matchesSensitive = !showSensitive || log.isSensitive;

    return matchesSearch && matchesAction && matchesEntityType && matchesSensitive;
  });

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading audit logs...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Complete history of all changes made to employee data
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, entity, or field..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEntityType} onValueChange={setFilterEntityType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entities</SelectItem>
                <SelectItem value="PROFILE">Profile</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="SALARY">Salary</SelectItem>
                <SelectItem value="DOCUMENT">Document</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showSensitive ? "default" : "outline"}
              onClick={() => setShowSensitive(!showSensitive)}
            >
              Sensitive Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent border-b">
                <tr>
                  <th className="w-10"></th>
                  <th className="text-left p-3 text-sm font-medium">Date/Time</th>
                  <th className="text-left p-3 text-sm font-medium">User</th>
                  <th className="text-left p-3 text-sm font-medium">Action</th>
                  <th className="text-left p-3 text-sm font-medium">Entity</th>
                  <th className="text-left p-3 text-sm font-medium">Field</th>
                  <th className="text-left p-3 text-sm font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="border-b hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => toggleRow(log.id)}
                    >
                      <td className="p-3">
                        {expandedRows.has(log.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {format(new Date(log.timestamp), "MMM d, yyyy HH:mm", { locale: es })}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={ACTION_COLORS[log.action]} variant="secondary">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{log.entityType}</td>
                      <td className="p-3 text-sm">{log.fieldName || "—"}</td>
                      <td className="p-3 text-sm font-mono">{log.ipAddress || "—"}</td>
                    </tr>
                    {expandedRows.has(log.id) && (
                      <tr className="bg-accent/50 border-b">
                        <td colSpan={7} className="p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-2">Change Details</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground mb-1">Old Value</p>
                                  <div className="p-3 rounded bg-background font-mono text-sm">
                                    {log.oldValue !== undefined && log.oldValue !== null
                                      ? maskSensitiveData(
                                          JSON.stringify(log.oldValue),
                                          log.isSensitive,
                                          showSensitive
                                        )
                                      : "null"}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">New Value</p>
                                  <div className="p-3 rounded bg-background font-mono text-sm text-green-600">
                                    {log.newValue !== undefined && log.newValue !== null
                                      ? maskSensitiveData(
                                          JSON.stringify(log.newValue),
                                          log.isSensitive,
                                          showSensitive
                                        )
                                      : "null"}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {log.isSensitive && (
                              <Badge variant="outline" className="text-xs">
                                ⚠️ Sensitive Data
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No audit logs match your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} logs
        </p>
        <div className="flex items-center gap-2">
          <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
