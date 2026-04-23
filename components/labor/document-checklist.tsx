'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Upload, FileText } from 'lucide-react';
import { DocumentUpload } from './document-upload';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Document {
    id: string;
    documentType: string;
    documentName: string;
    documentUrl: string;
    status: 'PENDING' | 'VALIDATED' | 'EXPIRED' | 'REJECTED';
    expirationDate: Date | null;
    isRequired: boolean;
    createdAt: Date;
}

interface RequiredDocumentType {
    type: string;
    name: string;
    description: string;
    isRequired: boolean;
}

interface DocumentChecklistProps {
    employeeId: string;
    companyId: string;
}

const REQUIRED_DOCUMENT_TYPES: RequiredDocumentType[] = [
    {
        type: 'CONTRACT',
        name: 'Contrato Individual',
        description: 'Contrato individual de trabajo (Artículo 25 LFT)',
        isRequired: true,
    },
    {
        type: 'ID',
        name: 'Identificación Oficial',
        description: 'INE, pasaporte o cédula profesional',
        isRequired: true,
    },
    {
        type: 'TAX_ID',
        name: 'RFC',
        description: 'Registro Federal de Contribuyentes',
        isRequired: true,
    },
    {
        type: 'BANK_INFO',
        name: 'Información Bancaria',
        description: 'CLABE interbancaria para nómina',
        isRequired: true,
    },
    {
        type: 'PROOF_OF_ADDRESS',
        name: 'Comprobante de Domicilio',
        description: 'No mayor a 3 meses',
        isRequired: false,
    },
    {
        type: 'CERTIFICATE',
        name: 'Certificados de Capacitación',
        description: 'Constancias DC-3 o similares',
        isRequired: false,
    },
];

export function DocumentChecklist({ employeeId, companyId }: DocumentChecklistProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingType, setUploadingType] = useState<string | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, [employeeId]);

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`/api/documents?userId=${employeeId}`);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDocumentByType = (type: string) => {
        return documents.find(doc => doc.documentType === type);
    };

    const getDocumentStatus = (doc: Document | undefined) => {
        if (!doc) return 'missing';

        if (doc.status === 'EXPIRED') return 'expired';
        
        if (doc.expirationDate) {
            const now = new Date();
            const expDate = new Date(doc.expirationDate);
            const daysUntilExpiration = Math.ceil(
                (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiration < 0) return 'expired';
            if (daysUntilExpiration <= 30) return 'expiring_soon';
        }

        if (doc.status === 'VALIDATED') return 'valid';
        if (doc.status === 'PENDING') return 'pending';
        if (doc.status === 'REJECTED') return 'rejected';

        return 'missing';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valid':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'expiring_soon':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'expired':
            case 'rejected':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'pending':
                return <FileText className="h-5 w-5 text-blue-600" />;
            default:
                return <XCircle className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusBadge = (status: string, doc?: Document) => {
        switch (status) {
            case 'valid':
                return <Badge variant="default" className="bg-green-600">✅ Vigente</Badge>;
            case 'expiring_soon':
                const days = doc?.expirationDate
                    ? Math.ceil((new Date(doc.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : 0;
                return <Badge variant="warning">⚠️ Vence en {days} días</Badge>;
            case 'expired':
                return <Badge variant="destructive">❌ Vencido</Badge>;
            case 'pending':
                return <Badge variant="secondary">⏳ Pendiente de validación</Badge>;
            case 'rejected':
                return <Badge variant="destructive">❌ Rechazado</Badge>;
            default:
                return <Badge variant="outline">❌ Faltante</Badge>;
        }
    };

    const calculateCompletion = () => {
        const requiredDocs = REQUIRED_DOCUMENT_TYPES.filter(doc => doc.isRequired);
        const completedDocs = requiredDocs.filter(doc => {
            const document = getDocumentByType(doc.type);
            const status = getDocumentStatus(document);
            return status === 'valid' || status === 'expiring_soon';
        });

        return Math.round((completedDocs.length / requiredDocs.length) * 100);
    };

    const handleUploadSuccess = () => {
        fetchDocuments();
        setUploadingType(null);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">Cargando documentos...</p>
                </CardContent>
            </Card>
        );
    }

    const completion = calculateCompletion();

    return (
        <div className="space-y-6">
            {/* Completion Progress */}
            <Card>
                <CardHeader>
                    <CardTitle>Progreso del Expediente</CardTitle>
                    <CardDescription>
                        {REQUIRED_DOCUMENT_TYPES.filter(d => d.isRequired).length} documentos obligatorios requeridos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Completitud del expediente</span>
                            <span className="font-bold">{completion}%</span>
                        </div>
                        <Progress value={completion} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {REQUIRED_DOCUMENT_TYPES.filter(d => d.isRequired).filter(doc => {
                                const document = getDocumentByType(doc.type);
                                const status = getDocumentStatus(document);
                                return status === 'valid' || status === 'expiring_soon';
                            }).length} de {REQUIRED_DOCUMENT_TYPES.filter(d => d.isRequired).length} documentos completos
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Document Checklist */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Documentos</CardTitle>
                    <CardDescription>
                        Estado de cada documento requerido
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {REQUIRED_DOCUMENT_TYPES.map((docType) => {
                        const doc = getDocumentByType(docType.type);
                        const status = getDocumentStatus(doc);

                        return (
                            <div
                                key={docType.type}
                                className="flex items-start justify-between p-4 border rounded-lg"
                            >
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(status)}
                                        <div>
                                            <p className="font-medium">
                                                {docType.name}
                                                {docType.isRequired && (
                                                    <Badge variant="destructive" className="ml-2 text-xs">
                                                        Obligatorio
                                                    </Badge>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {docType.description}
                                            </p>
                                        </div>
                                    </div>

                                    {doc && (
                                        <div className="flex items-center gap-2 text-sm">
                                            {getStatusBadge(status, doc)}
                                            {doc.expirationDate && (
                                                <span className="text-muted-foreground">
                                                    Vence: {new Date(doc.expirationDate).toLocaleDateString('es-MX')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {status === 'missing' || status === 'expired' || status === 'rejected' ? (
                                        <Button
                                            size="sm"
                                            onClick={() => setUploadingType(docType.type)}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Subir
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setUploadingType(docType.type)}
                                        >
                                            Reemplazar
                                        </Button>
                                    )}
                                </div>

                                {/* Upload Form */}
                                {uploadingType === docType.type && (
                                    <div className="w-full mt-4 pt-4 border-t">
                                        <DocumentUpload
                                            documentType={docType.type}
                                            documentName={docType.name}
                                            employeeId={employeeId}
                                            companyId={companyId}
                                            isRequired={docType.isRequired}
                                            onSuccess={handleUploadSuccess}
                                            onCancel={() => setUploadingType(null)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
