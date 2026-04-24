'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const documentUploadSchema = z.object({
    documentName: z.string().min(1, 'El nombre del documento es requerido'),
    issueDate: z.date().optional(),
    expirationDate: z.date().optional(),
    notes: z.string().optional(),
});

type DocumentUploadValues = z.infer<typeof documentUploadSchema>;

interface DocumentUploadProps {
    documentType: string;
    documentName: string;
    employeeId: string;
    companyId?: string;
    isRequired: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function DocumentUpload({
    documentType,
    documentName,
    employeeId,
    companyId,
    isRequired,
    onSuccess,
    onCancel,
}: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const form = useForm<DocumentUploadValues>({
        resolver: zodResolver(documentUploadSchema),
        defaultValues: {
            documentName: documentName,
            notes: '',
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file size (10MB max)
            if (selectedFile.size > 10 * 1024 * 1024) {
                toast.error('El archivo excede el tamaño máximo permitido (10MB)');
                return;
            }

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/jpg',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];

            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Tipo de archivo no permitido. Solo se aceptan PDF, imágenes y documentos Word.');
                return;
            }

            setFile(selectedFile);
        }
    };

    async function onSubmit(data: DocumentUploadValues) {
        if (!file) {
            toast.error('Por favor selecciona un archivo');
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', documentType);
            formData.append('documentName', data.documentName);
            formData.append('userId', employeeId);
            if (companyId) {
                formData.append('companyId', companyId);
            }
            formData.append('isRequired', isRequired.toString());

            if (data.issueDate) {
                formData.append('issueDate', data.issueDate.toISOString());
            }

            if (data.expirationDate) {
                formData.append('expirationDate', data.expirationDate.toISOString());
            }

            if (data.notes) {
                formData.append('notes', data.notes);
            }

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al subir documento');
            }

            toast.success('Documento subido exitosamente', {
                description: `${documentName} ha sido cargado al expediente`,
            });

            form.reset();
            setFile(null);
            onSuccess?.();
        } catch (error) {
            console.error('Error uploading document:', error);
            toast.error('Error al subir documento', {
                description: error instanceof Error ? error.message : 'Intenta de nuevo',
            });
        } finally {
            setUploading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                    {/* File Upload */}
                    <FormField
                        control={form.control}
                        name="documentName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Documento</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    {file ? file.name : 'Haz clic para seleccionar un archivo'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
                                </p>
                            </div>
                        </label>

                        {file && (
                            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                                <div className="text-sm">
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFile(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="issueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Emisión</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'PPP', { locale: es })
                                                    ) : (
                                                        <span>Seleccionar fecha</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="expirationDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Vencimiento</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'PPP', { locale: es })
                                                    ) : (
                                                        <span>Seleccionar fecha</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Deja vacío si no tiene vencimiento
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Notes */}
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notas (opcional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Agrega notas adicionales sobre este documento..."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={uploading || !file}
                    >
                        {uploading ? 'Subiendo...' : 'Subir Documento'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
