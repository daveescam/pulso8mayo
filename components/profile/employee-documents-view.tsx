"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, Download, Eye, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmployeeDocumentsViewProps {
    userId: string;
    companyId?: string | null;
}

interface EmployeeDocument {
    id: string;
    documentType: string;
    documentName: string | null;
    status: string;
    expirationDate: string | null;
    createdAt: string;
    uploadedBy: string | null;
}

export function EmployeeDocumentsView({ userId, companyId }: EmployeeDocumentsViewProps) {
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!userId) return;

            try {
                const response = await fetch(`/api/employees/${userId}/documents`);
                if (response.ok) {
                    const data = await response.json();
                    setDocuments(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching documents:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [userId]);

    const getDocumentStatusBadge = (status: string, expirationDate: string | null) => {
        if (expirationDate && new Date(expirationDate) < new Date()) {
            return { variant: "destructive" as const, label: "Expirado" };
        }

        const statusConfig = {
            VALIDATED: { variant: "default" as const, label: "Validado" },
            PENDING: { variant: "secondary" as const, label: "Pendiente" },
            REJECTED: { variant: "destructive" as const, label: "Rechazado" }
        };
        return statusConfig[status as keyof typeof statusConfig] || { variant: "secondary" as const, label: status };
    };

    const getDocumentTypeLabel = (type: string) => {
        const typeLabels: Record<string, string> = {
            CONTRACT: "Contrato",
            ID: "Identificación",
            PROOF_OF_ADDRESS: "Comprobante domicilio",
            TAX_ID: "RFC",
            BANK_INFO: "Información bancaria",
            CERTIFICATE: "Certificado",
            TRAINING: "Capacitación",
            MEDICAL_EXAM: "Examen médico",
            PERMIT: "Permiso",
            OTHER: "Otro"
        };
        return typeLabels[type] || type;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        Mis Documentos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Mis Documentos
                </CardTitle>
                <CardDescription>
                    Documentos personales y laborales
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">
                        {documents.length} documento(s)
                    </p>
                    <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Subir documento
                    </Button>
                </div>

                {documents.length === 0 ? (
                    <p className="text-muted-foreground">No hay documentos disponibles</p>
                ) : (
                    <div className="space-y-3">
                        {documents.map((document) => {
                            const statusBadge = getDocumentStatusBadge(document.status, document.expirationDate);
                            return (
                                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">{document.documentName || getDocumentTypeLabel(document.documentType)}</h4>
                                            <Badge variant={statusBadge.variant} className="text-xs">
                                                {statusBadge.label}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {getDocumentTypeLabel(document.documentType)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Subido: {format(new Date(document.createdAt), "dd/MM/yyyy", { locale: es })}
                                            {document.expirationDate && (
                                                <> • Expira: {format(new Date(document.expirationDate), "dd/MM/yyyy", { locale: es })}</>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}