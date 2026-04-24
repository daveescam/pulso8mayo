"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";

interface ValidationResult {
  documentType: string;
  isValid: boolean;
  confidence: number;
  issues: string[];
  extractedData?: Record<string, any>;
}

export function AIDocumentValidator() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to validate");
      return;
    }

    setIsValidating(true);

    try {
      // Mock AI validation - in real implementation, this would call an AI service
      // like OpenAI Vision or a custom ML model
      const mockResult: ValidationResult = {
        documentType: selectedFile.name.includes('ID') ? 'ID' : 'OTHER',
        isValid: Math.random() > 0.3, // 70% success rate for demo
        confidence: Math.random() * 0.5 + 0.5, // 50-100% confidence
        issues: [],
        extractedData: {
          name: "Juan Pérez García",
          documentNumber: "XAXX010101000",
          expirationDate: "2030-01-01",
        },
      };

      // Add some mock issues if invalid
      if (!mockResult.isValid) {
        mockResult.issues = [
          "Document appears to have been modified",
          "Text clarity is insufficient for verification",
          "Expiration date cannot be confirmed",
        ];
      }

      setResult(mockResult);
      toast.success("Document validation completed");
    } catch (error) {
      toast.error("Failed to validate document");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          AI Document Validator
        </CardTitle>
        <CardDescription>
          Use AI to validate document authenticity and extract information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            AI validation helps detect forged documents and automatically extracts key information.
            Always verify critical documents manually for legal compliance.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {selectedFile ? selectedFile.name : "Select a document to validate"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, JPG, PNG (max 10MB)
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload">
                <Button variant="outline" className="mt-4" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                onClick={handleValidate}
                disabled={isValidating}
              >
                {isValidating ? "Validating..." : "Validate with AI"}
              </Button>
            </div>
          )}
        </div>

        {result && (
          <Card className={`border-2 ${result.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                {result.isValid ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h4 className="font-medium">
                    {result.isValid ? "Document Validated" : "Validation Issues Found"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <Badge variant={result.isValid ? "default" : "destructive"}>
                  {result.isValid ? "Valid" : "Invalid"}
                </Badge>
              </div>

              {result.extractedData && (
                <div className="mb-4">
                  <h5 className="font-medium mb-2">Extracted Information:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {Object.entries(result.extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.issues.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2 text-red-700">Issues Found:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {result.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline">
                  View Full Report
                </Button>
                <Button size="sm" variant="outline">
                  Download Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Supported Document Types:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              "INE (ID)",
              "Passport",
              "Proof of Address",
              "Tax ID (RFC)",
              "Bank Statement",
              "Certificates",
              "Contracts",
              "Permits"
            ].map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}