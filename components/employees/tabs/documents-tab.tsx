"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface DocumentsTabProps {
  documents: any[];
  employeeId: string;
}

const documentTypeLabels: Record<string, string> = {
  CONTRACT: "Contract",
  ID: "ID",
  PROOF_OF_ADDRESS: "Proof of Address",
  TAX_ID: "Tax ID",
  BANK_INFO: "Bank Information",
  CERTIFICATE: "Certificate",
  TRAINING: "Training",
  MEDICAL_EXAM: "Medical Exam",
  PERMIT: "Permit",
  OTHER: "Other",
};

const statusLabels: Record<string, string> = {
  VALIDATED: "Validated",
  PENDING: "Pending",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  VALIDATED: "default",
  PENDING: "secondary",
  EXPIRED: "destructive",
  REJECTED: "destructive",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  VALIDATED: CheckCircle,
  PENDING: Clock,
  EXPIRED: AlertCircle,
  REJECTED: XCircle,
};

const requiredDocuments = ["CONTRACT", "ID", "TAX_ID", "BANK_INFO"];

export function DocumentsTab({ documents, employeeId }: DocumentsTabProps) {
  const uploadedRequired = requiredDocuments.filter((type) =>
    documents?.some((doc) => doc.documentType === type)
  ).length;
  const compliancePercentage = Math.round(
    (uploadedRequired / requiredDocuments.length) * 100
  );

  const handleValidate = async (documentId: string) => {
    try {
      const response = await fetch("/api/documents/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          action: "VALIDATE",
        }),
      });

      if (response.ok) {
        toast.success("Document validated successfully");
      } else {
        toast.error("Error validating document");
      }
    } catch (error) {
      console.error("Error validating document:", error);
      toast.error("Error validating document");
    }
  };

  const handleReject = async (documentId: string) => {
    try {
      const response = await fetch("/api/documents/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          action: "REJECT",
          rejectionReason: "Document rejected",
        }),
      });

      if (response.ok) {
        toast.success("Document rejected");
      } else {
        toast.error("Error rejecting document");
      }
    } catch (error) {
      console.error("Error rejecting document:", error);
      toast.error("Error rejecting document");
    }
  };

  return (
    <div className="space-y-6">
      {/* Required Documents Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents Checklist</CardTitle>
          <CardDescription>
            Documents required by Mexican Labor Law (LFT)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                {uploadedRequired} of {requiredDocuments.length} documents uploaded
              </Label>
              <Label className="text-sm font-semibold">
                {compliancePercentage}%
              </Label>
            </div>
            <Progress value={compliancePercentage} className="h-2" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {requiredDocuments.map((type) => {
                const doc = documents?.find((d) => d.documentType === type);
                return (
                  <div
                    key={type}
                    className={`p-3 border rounded-lg ${
                      doc ? "border-green-500 bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {doc ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {documentTypeLabels[type] || type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Document */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>Add new documents to employee record</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => toast.info("Document upload coming soon")}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Document</h3>
            <p className="text-muted-foreground text-sm">
              Drag and drop files here, or click to select files
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Document Gallery</CardTitle>
          <CardDescription>
            All documents for this employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: any, index: number) => {
                const StatusIcon = statusIcons[doc.status] || Clock;
                return (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-sm">
                            {doc.documentName || documentTypeLabels[doc.documentType] || "Document"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {doc.uploadedAt
                              ? format(new Date(doc.uploadedAt), "MMM d, yyyy", { locale: es })
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                      <Badge variant={statusColors[doc.status] || "outline"}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusLabels[doc.status] || doc.status}
                      </Badge>
                    </div>

                    {doc.expirationDate && (
                      <div className="text-xs text-muted-foreground">
                        Expires:{" "}
                        {format(new Date(doc.expirationDate), "MMM d, yyyy", { locale: es })}
                      </div>
                    )}

                    <Separator />

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>

                    {doc.status === "PENDING" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleValidate(doc.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Validate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleReject(doc.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
              <p className="text-muted-foreground text-sm">
                Upload documents to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
