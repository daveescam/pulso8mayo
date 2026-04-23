"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Upload,
  X,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const documentTypes = [
  { value: "CONTRACT", label: "Contract" },
  { value: "ID", label: "ID" },
  { value: "PROOF_OF_ADDRESS", label: "Proof of Address" },
  { value: "BANK_INFO", label: "Bank Information" },
  { value: "MEDICAL_CERTIFICATE", label: "Medical Certificate" },
  { value: "TRAINING_CERTIFICATE", label: "Training Certificate" },
  { value: "OTHER", label: "Other" },
] as const;

const formSchema = z.object({
  documentType: z.enum(
    documentTypes.map((t) => t.value) as [string, ...string[]]
  ),
  documentName: z.string().min(1, "Document name is required"),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
  file: z.instanceof(File, { message: "File is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => Promise<void>;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSubmit,
}: DocumentUploadDialogProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: "CONTRACT",
      documentName: "",
      expirationDate: "",
      notes: "",
    },
  });

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("file", file, { shouldValidate: true });
      if (!form.getValues("documentName")) {
        form.setValue("documentName", file.name);
      }
    }
  }, [form]);

  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        form.setValue("file", file, { shouldValidate: true });
        if (!form.getValues("documentName")) {
          form.setValue("documentName", file.name);
        }
      }
    },
    [form]
  );

  const handleSubmit = React.useCallback(
    async (data: FormValues) => {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        await onSubmit(data);
        setUploadProgress(100);
        clearInterval(interval);

        // Reset form after successful upload
        setTimeout(() => {
          form.reset();
          setSelectedFile(null);
          setUploadProgress(0);
          setIsUploading(false);
          onOpenChange(false);
        }, 500);
      } catch (error) {
        clearInterval(interval);
        setUploadProgress(0);
        setIsUploading(false);
        console.error("Upload failed:", error);
      }
    },
    [form, onSubmit, onOpenChange]
  );

  const handleRemoveFile = React.useCallback(() => {
    setSelectedFile(null);
    form.setValue("file", undefined as any, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [form]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Employee Document</DialogTitle>
          <DialogDescription>
            Upload and categorize employee documents for compliance and
            record-keeping.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* File Upload Area */}
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel>Document File</FormLabel>
                  <FormControl>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                        ${
                          isDragging
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }
                        ${selectedFile ? "bg-muted/50" : ""}
                      `}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />

                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div className="text-left">
                            <p className="text-sm font-medium">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile();
                            }}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              Drag & drop your file here
                            </p>
                            <p className="text-xs text-muted-foreground">
                              or click to browse. Supports PDF, JPG, PNG, DOC,
                              DOCX
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Type */}
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Name */}
            <FormField
              control={form.control}
              name="documentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter document name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiration Date */}
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Expiration Date
                    <span className="text-xs text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="date" {...field} className="pl-10" />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Set if this document has an expiration date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Notes
                    <span className="text-xs text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this document..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {uploadProgress < 100 ? (
                      <>
                        <Upload className="h-4 w-4 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Upload complete!
                      </>
                    )}
                  </span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Error Alert */}
            {form.formState.errors.file && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {form.formState.errors.file.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
