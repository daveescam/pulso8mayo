"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DocumentStatusBadge } from "./status-badge";

interface DocumentCardProps {
  document: {
    id: string;
    documentType: string;
    documentName?: string;
    status: string;
    createdAt: string;
    expirationDate?: string;
    fileKey?: string;
    documentUrl?: string;
  };
  onView: () => void;
  onDownload?: () => void;
  onValidate?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canValidate?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  CONTRACT: "Contrato Individual",
  ID: "Identificación Oficial (INE)",
  PROOF_OF_ADDRESS: "Comprobante de Domicilio",
  TAX_ID: "RFC",
  BANK_INFO: "Información Bancaria (CLABE)",
  CERTIFICATE: "Certificados de Capacitación",
  TRAINING: "Capacitación STPS",
  MEDICAL_EXAM: "Examen Médico",
  PERMIT: "Permisos Especiales",
  OTHER: "Otro",
};

const statusIcons = {
  VALIDATED: CheckCircle,
  PENDING: Clock,
  EXPIRED: AlertCircle,
  REJECTED: XCircle,
};

export function DocumentCard({
  document,
  onView,
  onDownload,
  onValidate,
  onReject,
  onDelete,
  canEdit = false,
  canValidate = false,
}: DocumentCardProps) {
  const StatusIcon = statusIcons[document.status as keyof typeof statusIcons] || Clock;
  const isExpired = document.expirationDate && new Date(document.expirationDate) < new Date();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">
                {document.documentName || documentTypeLabels[document.documentType] || "Documento"}
              </p>
              <p className="text-xs text-muted-foreground">
                {documentTypeLabels[document.documentType] || document.documentType}
              </p>
            </div>
          </div>
          <DocumentStatusBadge status={document.status} size="sm" />
        </div>

        {/* Dates */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uploaded:</span>
            <span>
              {document.createdAt
                ? format(new Date(document.createdAt), "d MMM, yyyy", { locale: es })
                : "N/A"}
            </span>
          </div>
          {document.expirationDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className={isExpired ? "text-destructive font-medium" : ""}>
                {format(new Date(document.expirationDate), "d MMM, yyyy", { locale: es })}
                {isExpired && " (Expired)"}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
            <Eye className="mr-1 h-3 w-3" />
            View
          </Button>
          {canEdit && onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Validation Actions */}
        {canValidate && document.status === "PENDING" && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onValidate}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Validate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={onReject}
            >
              <XCircle className="mr-1 h-3 w-3" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
