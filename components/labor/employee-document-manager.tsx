"use client";

import * as React from "react";
import { format, isWithinInterval, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Upload, CheckCircle, XCircle, AlertCircle, Clock, Trash2, Eye, ChevronRight, User, AlertTriangle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DocumentUpload } from "@/components/labor/document-upload";

export interface EmployeeDocument {
    id: string;
    userId: string;
    companyId: string;
    branchId: string | null;
    documentType: string;
    documentName: string;
    documentUrl: string;
    fileKey?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    uploadedBy: string;
    issueDate?: Date | null;
    expirationDate?: Date | null;
    isValid: boolean;
    status: string;
    validatedBy?: string | null;
    validatedAt?: Date | null;
    rejectionReason?: string | null;
    notes?: string | null;
    isRequired: boolean;
    complianceNotes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface EmployeeComplianceStatus {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    branchId: string | null;
    branchName: string | null;
    totalDocuments: number;
    validDocuments: number;
    pendingDocuments: number;
    expiredDocuments: number;
    missingRequired: string[];
    compliancePercentage: number;
    documents: Array<{
        id: string;
        documentType: string;
        documentName: string;
        status: string;
        isValid: boolean;
        expirationDate?: Date | null;
    }>;
}

interface Branch {
    id: string;
    name: string;
}

const DOCUMENT_TYPES = [
    { value: 'CONTRACT', label: 'Contrato Individual' },
    { value: 'ID', label: 'Identificación Oficial (INE)' },
    { value: 'PROOF_OF_ADDRESS', label: 'Comprobante de Domicilio' },
    { value: 'TAX_ID', label: 'RFC' },
    { value: 'BANK_INFO', label: 'Información Bancaria (CLABE)' },
    { value: 'CERTIFICATE', label: 'Certificados de Capacitación' },
    { value: 'TRAINING', label: 'Capacitación STPS' },
    { value: 'MEDICAL_EXAM', label: 'Examen Médico' },
    { value: 'PERMIT', label: 'Permisos Especiales' },
    { value: 'OTHER', label: 'Otro' }
];

const REQUIRED_DOCUMENTS = ['CONTRACT', 'ID', 'TAX_ID', 'BANK_INFO'];

type UploadMode = 'url' | 'file';

export function EmployeeDocumentManager() {
    const [activeTab, setActiveTab] = React.useState("roster");
    const [employees, setEmployees] = React.useState<EmployeeComplianceStatus[]>([]);
    const [branches, setBranches] = React.useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = React.useState<string>("");
    const [selectedEmployee, setSelectedEmployee] = React.useState<EmployeeComplianceStatus | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
    const [uploadMode, setUploadMode] = React.useState<UploadMode>('file');

    // URL upload form state
    const [documentType, setDocumentType] = React.useState('');
    const [documentName, setDocumentName] = React.useState('');
    const [documentUrl, setDocumentUrl] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [issueDate, setIssueDate] = React.useState('');
    const [expirationDate, setExpirationDate] = React.useState('');
    const [uploadUserId, setUploadUserId] = React.useState('');

    // File upload state
    const [fileUploadEmployeeId, setFileUploadEmployeeId] = React.useState('');
    const [fileUploadDocType, setFileUploadDocType] = React.useState('');

    const fetchComplianceData = async (branchId?: string) => {
        setLoading(true);
        try {
            const url = new URL('/api/documents/compliance', window.location.origin);
            if (branchId) {
                url.searchParams.set('branchId', branchId);
            }
            const response = await fetch(url.toString());
            if (response.ok) {
                const result = await response.json();
                setEmployees(result.employees || []);
                setBranches(result.branches || []);
            }
        } catch (error) {
            console.error("Error fetching compliance data:", error);
            toast.error("Error al cargar datos de cumplimiento");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchComplianceData();
    }, []);

    const handleBranchChange = (branchId: string) => {
        setSelectedBranch(branchId);
        fetchComplianceData(branchId || undefined);
    };

    const handleUpload = async () => {
        if (!uploadUserId || !documentType || !documentName || !documentUrl) {
            toast.error("Completa los campos requeridos");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: uploadUserId,
                    documentType,
                    documentName,
                    documentUrl,
                    notes,
                    issueDate: issueDate || undefined,
                    expirationDate: expirationDate || undefined,
                    isRequired: REQUIRED_DOCUMENTS.includes(documentType)
                })
            });

            if (response.ok) {
                toast.success("Documento subido exitosamente");
                setIsUploadDialogOpen(false);
                resetForm();
                await fetchComplianceData(selectedBranch || undefined);
                if (selectedEmployee?.userId === uploadUserId) {
                    const empResponse = await fetch(`/api/documents/compliance?userId=${uploadUserId}`);
                    if (empResponse.ok) {
                        const empData = await empResponse.json();
                        setSelectedEmployee(empData.employee);
                    }
                }
            } else {
                const error = await response.json();
                toast.error(error.error || "Error al subir documento");
            }
        } catch (error) {
            console.error("Error uploading document:", error);
            toast.error("Error al subir documento");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (documentId: string) => {
        if (!confirm('¿Estás seguro de eliminar este documento?')) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/documents?documentId=${documentId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                toast.success("Documento eliminado");
                await fetchComplianceData(selectedBranch || undefined);
                if (selectedEmployee) {
                    const empResponse = await fetch(`/api/documents/compliance?userId=${selectedEmployee.userId}`);
                    if (empResponse.ok) {
                        const empData = await empResponse.json();
                        setSelectedEmployee(empData.employee);
                    }
                }
            } else {
                toast.error("Error al eliminar documento");
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            toast.error("Error al eliminar documento");
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (documentId: string, status: 'VALIDATED' | 'REJECTED') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/documents/validate?documentId=${documentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                toast.success(status === 'VALIDATED' ? 'Documento validado' : 'Documento rechazado');
                await fetchComplianceData(selectedBranch || undefined);
                if (selectedEmployee) {
                    const empResponse = await fetch(`/api/documents/compliance?userId=${selectedEmployee.userId}`);
                    if (empResponse.ok) {
                        const empData = await empResponse.json();
                        setSelectedEmployee(empData.employee);
                    }
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Error al validar documento");
            }
        } catch (error) {
            console.error("Error validating document:", error);
            toast.error("Error al validar documento");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDocument = async (doc: EmployeeDocument | { id: string; documentUrl: string; fileKey?: string | null }) => {
        if ('fileKey' in doc && doc.fileKey) {
            // Try to get presigned URL from R2
            try {
                const response = await fetch(`/api/documents/url?documentId=${doc.id}`);
                if (response.ok) {
                    const data = await response.json();
                    window.open(data.url, '_blank');
                    return;
                }
            } catch (error) {
                console.error("Error getting presigned URL:", error);
            }
        }
        // Fallback: open direct URL
        if (doc.documentUrl) {
            window.open(doc.documentUrl, '_blank');
        } else {
            toast.error("No hay URL disponible para este documento");
        }
    };

    const resetForm = () => {
        setUploadUserId('');
        setDocumentType('');
        setDocumentName('');
        setDocumentUrl('');
        setNotes('');
        setIssueDate('');
        setExpirationDate('');
    };

    const getStatusBadge = (status: string, isValid: boolean, expirationDate?: Date | null) => {
        if (status === 'EXPIRED' || !isValid) {
            return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Expirado</Badge>;
        } else if (status === 'REJECTED') {
            return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rechazado</Badge>;
        } else if (status === 'VALIDATED' && isValid) {
            if (expirationDate && isExpiringSoon(expirationDate)) {
                return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" /> Por expirar</Badge>;
            }
            return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Vigente</Badge>;
        } else {
            return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
        }
    };

    const getDocumentTypeLabel = (type: string) => {
        return DOCUMENT_TYPES.find(dt => dt.value === type)?.label || type;
    };

    const isExpiringSoon = (expirationDate?: Date | null) => {
        if (!expirationDate) return false;
        const thirtyDaysFromNow = addDays(new Date(), 30);
        return isWithinInterval(expirationDate, { start: new Date(), end: thirtyDaysFromNow });
    };

    const getComplianceColor = (percentage: number) => {
        if (percentage === 100) return "text-green-600";
        if (percentage >= 75) return "text-yellow-600";
        return "text-red-600";
    };

    const openEmployeeDetail = (employee: EmployeeComplianceStatus) => {
        setSelectedEmployee(employee);
        setActiveTab("detail");
    };

    const handleFileUploadSuccess = async () => {
        await fetchComplianceData(selectedBranch || undefined);
        if (selectedEmployee) {
            const empResponse = await fetch(`/api/documents/compliance?userId=${selectedEmployee.userId}`);
            if (empResponse.ok) {
                const empData = await empResponse.json();
                setSelectedEmployee(empData.employee);
            }
        }
        // Close the file upload dialog by resetting the state
        setFileUploadEmployeeId('');
        setFileUploadDocType('');
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <TabsList>
                        <TabsTrigger value="roster">Lista de Empleados</TabsTrigger>
                        <TabsTrigger value="detail" disabled={!selectedEmployee}>Expediente Individual</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        {branches.length > 0 && (
                            <Select value={selectedBranch} onValueChange={handleBranchChange}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Todas las sucursales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todas las sucursales</SelectItem>
                                    {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
                            setIsUploadDialogOpen(open);
                            if (open) {
                                if (selectedEmployee) {
                                    setUploadUserId(selectedEmployee.userId);
                                }
                                if (selectedEmployee && selectedEmployee.branchId) {
                                    // Default to selected employee's branch
                                }
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Subir Documento
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Subir Nuevo Documento</DialogTitle>
                                    <DialogDescription>
                                        Selecciona el método de subida
                                    </DialogDescription>
                                </DialogHeader>

                                <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as UploadMode)}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="file">
                                            <FolderOpen className="h-4 w-4 mr-2" />
                                            Subir Archivo
                                        </TabsTrigger>
                                        <TabsTrigger value="url">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Referencia URL
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="file" className="mt-4">
                                        {employees.length > 0 ? (
                                            <div className="space-y-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="file-employee">Empleado</Label>
                                                    <Select value={fileUploadEmployeeId} onValueChange={setFileUploadEmployeeId}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar empleado" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {employees.map(emp => (
                                                                <SelectItem key={emp.userId} value={emp.userId}>
                                                                    {emp.userName} ({emp.userEmail})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="file-doctype">Tipo de Documento</Label>
                                                    <Select value={fileUploadDocType} onValueChange={setFileUploadDocType}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar tipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {DOCUMENT_TYPES.map(type => (
                                                                <SelectItem key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {fileUploadEmployeeId && fileUploadDocType && (
                                                    <DocumentUpload
                                                        documentType={fileUploadDocType}
                                                        documentName={getDocumentTypeLabel(fileUploadDocType)}
                                                        employeeId={fileUploadEmployeeId}
                                                        companyId=""
                                                        isRequired={REQUIRED_DOCUMENTS.includes(fileUploadDocType)}
                                                        onSuccess={handleFileUploadSuccess}
                                                        onCancel={() => setIsUploadDialogOpen(false)}
                                                    />
                                                )}
                                                {(!fileUploadEmployeeId || !fileUploadDocType) && (
                                                    <Alert>
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertDescription>
                                                            Selecciona un empleado y tipo de documento para continuar
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        ) : (
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    No hay empleados registrados
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="url" className="mt-4">
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="employee">Empleado</Label>
                                                <Select value={uploadUserId} onValueChange={setUploadUserId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar empleado" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {employees.map(emp => (
                                                            <SelectItem key={emp.userId} value={emp.userId}>
                                                                {emp.userName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="type">Tipo de Documento</Label>
                                                <Select value={documentType} onValueChange={setDocumentType}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar tipo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DOCUMENT_TYPES.map(type => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Nombre</Label>
                                                <Input
                                                    id="name"
                                                    value={documentName}
                                                    onChange={(e) => setDocumentName(e.target.value)}
                                                    placeholder="Ej: Contrato 2024"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="url">URL del Documento</Label>
                                                <Input
                                                    id="url"
                                                    value={documentUrl}
                                                    onChange={(e) => setDocumentUrl(e.target.value)}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="issueDate">Fecha de Emisión</Label>
                                                    <Input
                                                        id="issueDate"
                                                        type="date"
                                                        value={issueDate}
                                                        onChange={(e) => setIssueDate(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="expDate">Fecha de Expiración</Label>
                                                    <Input
                                                        id="expDate"
                                                        type="date"
                                                        value={expirationDate}
                                                        onChange={(e) => setExpirationDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="notes">Notas</Label>
                                                <Textarea
                                                    id="notes"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleUpload} disabled={loading}>
                                                {loading ? 'Subiendo...' : 'Subir'}
                                            </Button>
                                        </DialogFooter>
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Employee Roster Tab */}
                <TabsContent value="roster">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expedientes Laborales por Empleado</CardTitle>
                            <CardDescription>
                                Estado de cumplimiento documental de todos los empleados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">Cargando...</span>
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No hay empleados registrados</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Empleado</TableHead>
                                            <TableHead>Sucursal</TableHead>
                                            <TableHead>Rol</TableHead>
                                            <TableHead className="text-center">Documentos</TableHead>
                                            <TableHead className="text-center">Válidos</TableHead>
                                            <TableHead className="text-center">Pendientes</TableHead>
                                            <TableHead className="text-center">Expirados</TableHead>
                                            <TableHead className="text-center">Cumplimiento</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employees.map((emp) => (
                                            <TableRow
                                                key={emp.userId}
                                                className={`cursor-pointer hover:bg-muted/50 ${emp.missingRequired.length > 0 ? 'border-l-2 border-l-red-500' : ''}`}
                                                onClick={() => openEmployeeDetail(emp)}
                                            >
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{emp.userName}</p>
                                                        <p className="text-xs text-muted-foreground">{emp.userEmail}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {emp.branchName ? (
                                                        <Badge variant="outline">{emp.branchName}</Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{emp.userRole}</Badge>
                                                </TableCell>
                                                <TableCell className="text-center">{emp.totalDocuments}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-green-600 font-medium">{emp.validDocuments}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-yellow-600 font-medium">{emp.pendingDocuments}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-red-600 font-medium">{emp.expiredDocuments}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`font-bold ${getComplianceColor(emp.compliancePercentage)}`}>
                                                            {emp.compliancePercentage}%
                                                        </span>
                                                        <Progress value={emp.compliancePercentage} className="h-1.5 w-20" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEmployeeDetail(emp)}
                                                    >
                                                        Ver Expediente
                                                        <ChevronRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Employee Detail Tab */}
                <TabsContent value="detail">
                    {selectedEmployee && (
                        <div className="space-y-6">
                            {/* Employee Header */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <User className="h-5 w-5" />
                                                {selectedEmployee.userName}
                                            </CardTitle>
                                            <CardDescription>
                                                {selectedEmployee.userEmail} • {selectedEmployee.userRole}
                                                {selectedEmployee.branchName && (
                                                    <span> • {selectedEmployee.branchName}</span>
                                                )}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Cumplimiento</p>
                                                <p className={`text-3xl font-bold ${getComplianceColor(selectedEmployee.compliancePercentage)}`}>
                                                    {selectedEmployee.compliancePercentage}%
                                                </p>
                                            </div>
                                            <Button onClick={() => {
                                                setUploadUserId(selectedEmployee.userId);
                                                setIsUploadDialogOpen(true);
                                            }}>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Subir Documento
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={selectedEmployee.compliancePercentage} className="h-2" />
                                </CardContent>
                            </Card>

                            {/* Missing Documents Alert */}
                            {selectedEmployee.missingRequired.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Documentos Obligatorios Faltantes</AlertTitle>
                                    <AlertDescription>
                                        Este empleado no cuenta con los siguientes documentos obligatorios: {selectedEmployee.missingRequired.map(type =>
                                            getDocumentTypeLabel(type)
                                        ).join(', ')}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Required Documents Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Documentos Obligatorios</CardTitle>
                                    <CardDescription>
                                        Estado de los documentos requeridos por ley (Art. 25 LFT)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                        {REQUIRED_DOCUMENTS.map(docType => {
                                            const doc = selectedEmployee.documents.find(d => d.documentType === docType && d.isValid && d.status === 'VALIDATED');
                                            return (
                                                <div key={docType} className={`p-4 border rounded-lg ${doc ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-medium text-sm">{getDocumentTypeLabel(docType)}</p>
                                                        {doc ? (
                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-red-600" />
                                                        )}
                                                    </div>
                                                    {doc ? (
                                                        <p className="text-xs text-green-700">
                                                            {doc.documentName}
                                                            {doc.expirationDate && (
                                                                <span className="block mt-1">
                                                                    Vence: {format(doc.expirationDate, 'dd/MM/yyyy', { locale: es })}
                                                                </span>
                                                            )}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-red-700">Faltante</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* All Documents Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Todos los Documentos</CardTitle>
                                    <CardDescription>
                                        Historial completo de documentos del empleado
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {selectedEmployee.documents.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No hay documentos registrados para este empleado</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Nombre</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead>Emisión</TableHead>
                                                    <TableHead>Vencimiento</TableHead>
                                                    <TableHead>Notas</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedEmployee.documents.map((doc) => (
                                                    <TableRow key={doc.id}>
                                                        <TableCell>{getDocumentTypeLabel(doc.documentType)}</TableCell>
                                                        <TableCell className="font-medium">{doc.documentName}</TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(doc.status, doc.isValid, doc.expirationDate)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {doc.issueDate ? format(new Date(doc.issueDate), 'dd/MM/yyyy', { locale: es }) : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {doc.expirationDate ? (
                                                                <div className="flex items-center gap-2">
                                                                    {format(new Date(doc.expirationDate), 'dd/MM/yyyy', { locale: es })}
                                                                    {isExpiringSoon(doc.expirationDate) && (
                                                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                                    )}
                                                                </div>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell className="max-w-[150px] truncate">
                                                            {doc.notes || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleViewDocument(doc as any)}
                                                                    title="Ver documento"
                                                                >
                                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                                </Button>
                                                                {doc.status === 'PENDING' && (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleValidate(doc.id, 'VALIDATED')}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleValidate(doc.id, 'REJECTED')}
                                                                        >
                                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(doc.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Back to roster */}
                            <Button variant="outline" onClick={() => setActiveTab("roster")}>
                                ← Volver a la lista de empleados
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
